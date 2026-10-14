---
title: "syslog-ng"
linkTitle: "syslog-ng"
weight: 40
date: 2026-10-14
tags:
description: >
  Using syslog-ng's http destination, which is in the open-source edition, plus the version differences that break the config.
pageKind: guide
verification: required
thirdParty: "syslog-ng"
---

syslog-ng's `http()` destination is in the **open-source edition**, so no commercial licence is needed.
If syslog-ng is already deployed this adds no infrastructure.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Minimal configuration

In `/etc/syslog-ng/conf.d/stroom.conf`:

```text
destination d_stroom {
    http(
        url("https://stroom.example.com/<base>/datafeed")
        method("POST")
        headers(
            "Feed: SYSLOG_EVENTS",
            "Type: Events",
            "Compression: NONE",
            "Authorization: Bearer `STROOM_TOKEN`"
        )
        body("${MESSAGE}\n")
        disk-buffer(
            mem-buf-size(10485760)
            capacity-bytes(536870912)
            reliable(yes)
            dir("/var/lib/syslog-ng")
        )
    );
};

log {
    source(s_src);
    destination(d_stroom);
};
```

`s_src` is whatever source your existing configuration defines: the default `system()` source, or a network listener.
Reload syslog-ng afterwards.


## Authentication

syslog-ng imports host environment variables as global configuration variables, substituted textually anywhere in the file including inside quoted strings, when the name is wrapped in **backticks**.
Export the token in the syslog-ng unit's environment rather than writing it into the file.
To emit a literal backtick, double it.

Two caveats:

* **Requires syslog-ng 3.24.1 or later**, which fixed a backtick-expansion bug in the main configuration file.
* Expansion happens at parse time, so rotating the token needs a reload.

There is no `token()` option on `http()`.
That belongs to the Splunk HEC destinations.
Use the `Authorization` header as shown, or `password()`.


## Disk buffering

The `disk-buffer()` block is not optional in any serious deployment: without it, a Stroom outage or a syslog-ng restart drops messages.
`reliable(yes)` flushes each message to disk before acknowledging, which is slower and appropriate for audit data.
It has been in the open-source edition since 3.8.

{{< trap severity="silent" >}}
**The sizing option was renamed between major versions.**

`capacity-bytes()`, with a minimum of 1048576, is syslog-ng **4.x**.
It replaced **`disk-buf-size()`** from 3.x.
If the configuration above fails to parse on that line, you are on 3.x and need the older name.

Note also that the block is hyphenated, `disk-buffer()`, not `disk_buffer()`.
{{< /trap >}}


## Compression

The `http()` destination exposes the underlying cURL transport's compression options.
If you enable request compression, leave the `Compression` header at `NONE`: syslog-ng sets `Content-Encoding: gzip`, which Stroom's web server decodes before Stroom reads the body.
Changing `Compression` to `GZIP` as well makes Stroom decompress the body a second time, and every post fails with `500` and `Stroom-Status` `400`.


## Batching

`batch-lines()`, which defaults to 1 and so is unbatched, and `batch-timeout()` combine several messages into one post.
With the `body()` template above ending in a newline, batching produces newline-delimited records, which a [pipeline]({{< relref "../../../concepts/translation.md" >}}) can split easily.

```text
        batch-lines(100)
        batch-timeout(5000)
```

{{< trap severity="silent" >}}
**`batch-timeout()` is in milliseconds, not seconds.**

An off-by-1000 here makes batching look broken: either it never batches, because the timeout fires immediately, or it appears to stall for an unreasonable time.
The value above is five seconds.
{{< /trap >}}


## Several feeds

One destination sends to one feed.
Split an estate with `filter()` rules and a separate destination per feed, keeping the set small and explicit.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

{{< timing mode="immediate" >}}
Posting is synchronous, subject to batching.
With a disk buffer, delivery during an outage is deferred until Stroom returns, which is the point of having one.
{{< /timing >}}

{{< verify >}}
Validate without restarting, then confirm delivery from syslog-ng's own counters and from Stroom:

```bash
syslog-ng --syntax-only
syslog-ng-ctl stats
```

`syslog-ng-ctl stats` reports `dropped`, `queued` and `written` for the destination, which is the fastest way to see whether messages are leaving at all.
Then find the stream on the feed in Stroom.

{{< golden >}}
**The stream is on the feed in Stroom, and its content is readable text.**

The `written` counter advancing is good evidence, but it counts what syslog-ng handed to the transport.
Only the destination confirms the rest.
{{< /golden >}}

{{< not-proof >}}
**`--syntax-only` passing proves the configuration parses**, not that the destination is reachable or the token correct.

**A rising `queued` counter is not progress.**
It means messages are accumulating because delivery is failing.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without syslog-ng.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Does the configuration parse?**
   If it fails on the disk buffer line, see the version trap above.
1. **What do the counters say?**
   `dropped` rising means loss; `queued` rising means delivery is failing and being retried.
1. **Run in the foreground.**
   `syslog-ng -Fevd` gives per-message debug output while testing, which is the quickest way to see what is actually being sent.
1. **Is the token empty?**
   Backtick expansion needs 3.24.1 or later, and the variable has to be in the service's environment, not your shell.
1. **Does batching look broken?**
   Check `batch-timeout()` is in milliseconds.
1. **Check option names against your version.**
   The `http()` destination's options have changed across major versions, and this page is written from the documentation rather than from a run.
{{< /diagnose >}}

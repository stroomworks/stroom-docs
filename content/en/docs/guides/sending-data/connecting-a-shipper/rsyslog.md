---
title: "rsyslog"
linkTitle: "rsyslog"
weight: 30
date: 2026-10-14
tags:
description: >
  Turning an existing syslog estate into a Stroom feed with the omhttp output module, no new binary required.
pageKind: guide
verification: required
thirdParty: "rsyslog"
---

If rsyslog is already deployed, its `omhttp` output module turns an existing syslog estate into a Stroom feed with no new binary on the host and nothing new on the Stroom side.
Where it applies, it is the cheapest integration available.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Prerequisites

`omhttp` is not always packaged with the base install:

```bash
apt-get install rsyslog-omhttp   # Debian, Ubuntu
yum install rsyslog-omhttp       # RHEL, CentOS
```

Confirm the module is present before writing configuration.
A missing module is a startup failure, not a silent no-op, so you will know.


## Minimal configuration

In `/etc/rsyslog.d/50-stroom.conf`:

```text
module(load="omhttp")

action(
    type="omhttp"
    server="stroom.example.com"
    serverport="443"
    usehttps="on"
    restpath="<base>/datafeed"
    httpheaders=[
        "Feed: SYSLOG_EVENTS",
        "Type: Events",
        "Compression: NONE"
    ]
    template="RSYSLOG_TraditionalFileFormat"
    action.resumeRetryCount="-1"
    queue.type="LinkedList"
    queue.filename="stroom_fwd"
    queue.saveOnShutdown="on"
)
```

Then restart rsyslog.

Two syntax points are easy to get wrong:

* **Multiple headers go in the `httpheaders` array**, as `"Key: Value"` strings.
  There is no numbered `httpheaderkey1` / `httpheadervalue1` form, only the array plus a single `httpheaderkey` / `httpheadervalue` pair for one extra header.
  Use the array: the single pair is documented as possibly being deprecated.
* **`restpath` takes no leading slash.**
  The module builds the URL as `https://<server>:<port>/<restpath>`, so a leading slash produces a double slash.

The `queue.*` and `action.resumeRetryCount` settings give a disk-assisted queue that survives restarts and retries indefinitely rather than discarding messages when Stroom is unreachable.
**Without them, an outage means data loss.**


## Authentication

The data feed key belongs in an `Authorization` header, but rsyslog configuration is commonly world-readable, so putting it in `50-stroom.conf` exposes it to anyone on the host.

Keep it in a separate restricted file, owned by root and mode 600, and include that file.

{{< trap severity="silent" >}}
**Move the whole `action()` block into the restricted file, not just the header value.**

`omhttp` does not support templated header *values*.
The `dynrestpath` option makes the path dynamic, but there is no equivalent for headers, so the token has to be a literal where the header is defined.

Trying to inject the value alone will not work, and the failure mode is a configuration that starts cleanly and authenticates with an empty token.
{{< /trap >}}


## Compression

{{< trap severity="silent" >}}
**`compress="on"` makes omhttp do the standards-compliant thing, which is wrong here.**

It adds `Content-Encoding: gzip`, which Stroom ignores entirely.
You must also change the `Compression` header in the `httpheaders` array to `GZIP`, or the data lands as unparseable bytes with a `200` response.

This is the clearest example of the mismatch anywhere in these guides: the module is behaving correctly, and it is still wrong for Stroom unless you say so twice.
{{< /trap >}}

`compress.level` takes `0` to `9`, defaulting to `-1`.


## Batching

`omhttp` can batch several messages per post, with `batch="on"`, `batch.maxsize` and `batch.format`.
That cuts request volume but makes delivery coarser, since a batch lands or fails as a unit.
`batch.format` also determines the body shape, which the receiving pipeline's [parser]({{< relref "../../../concepts/translation.md" >}}) has to match.

Start unbatched.
Add batching when volume demands it, and re-test the pipeline when you do.


## Several feeds

One `action()` block sends to one feed.
To split an estate, use rsyslog filters on facility, tag or hostname with a separate `action()` per feed, keeping the set small and explicit.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

{{< timing mode="immediate" >}}
Posting is synchronous.
With a disk-assisted queue, delivery during an outage is deferred until Stroom returns, which is the point of configuring one.
{{< /timing >}}

{{< verify >}}
Validate the configuration without restarting, then confirm the data landed:

```bash
rsyslogd -N1 -f /etc/rsyslog.conf
```

Then open the feed's **Data** tab in Stroom and find the stream.

{{< golden >}}
**The stream is on the feed in Stroom, and its content is readable text.**

Readable matters as much as present: that is what catches the compression trap, which produces a stream that exists and cannot be parsed.
{{< /golden >}}

{{< not-proof >}}
**`rsyslogd -N1` passing proves the configuration parses**, not that the module is installed, reachable or authorised.

**No errors in the journal does not prove delivery** if the queue is absorbing failures.
Check the destination.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without rsyslog.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Is the module actually installed?**
   Look for `omhttp.so` in your rsyslog module directory, commonly `/usr/lib/x86_64-linux-gnu/rsyslog/`.
1. **What does the journal say?**
   `journalctl -u rsyslog -f` logs connection failures and non-2xx responses from Stroom.
   That is where the `Stroom-Status` ends up.
1. **Is there a double slash in the URL?**
   A leading slash on `restpath` causes it.
1. **Is the stream present but unreadable?**
   Check `compress` against the `Compression` header.
1. **Is the queue growing?**
   That means delivery is failing and being retried, which is the configuration working as intended, masking a problem you still need to fix.
1. **Check parameter names against your installed version.**
   `omhttp` option names in particular vary, and this page is written from the documentation rather than from a run.
{{< /diagnose >}}

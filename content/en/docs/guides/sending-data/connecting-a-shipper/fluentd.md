---
title: "Fluentd"
linkTitle: "Fluentd"
weight: 60
date: 2026-10-14
tags:
description: >
  Using Fluentd's out_http plugin, and the headers syntax that catches almost everyone.
pageKind: guide
verification: required
thirdParty: "Fluentd"
---

Fluentd's `out_http` plugin has been built in since v1.7, so if Fluentd is already deployed this adds no infrastructure.
If you are choosing fresh, [Fluent Bit]({{< relref "fluent-bit.md" >}}) is much lighter for the same job.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Minimal configuration

```xml
<match app.**>
  @type http
  endpoint https://stroom.example.com/<base>/datafeed
  http_method post

  headers {"Feed":"FLUENTD_EVENTS","Type":"Events","Compression":"NONE"}

  <format>
    @type json
  </format>

  <buffer>
    @type file
    path /var/log/fluentd/buffer/stroom
    flush_interval 5s
    retry_forever true
  </buffer>
</match>
```

{{< trap severity="silent" >}}
**`headers` is a hash written inline as JSON on one line, not a `<headers>` section.**

This is the most common mistake in `out_http` configurations.
Writing it as a section does not produce the headers, and the request goes out without a feed name.
{{< /trap >}}


## Authentication

Add the `Authorization` header to the same hash.
Fluentd's parser evaluates embedded Ruby inside double-quoted strings, so the token can come from the environment:

```xml
  headers {"Feed":"FLUENTD_EVENTS","Compression":"NONE","Authorization":"Bearer #{ENV['STROOM_TOKEN']}"}
```

Confirm the interpolation actually resolved.
An unexpanded expression reaching Stroom shows up as an authentication failure, not a configuration error, which sends you looking in the wrong place.
`fluentd --dry-run` prints the parsed configuration and answers it in seconds.

**Do not reach for the `<auth>` section.**
It exists, but its `method` accepts only `basic` and `aws_sigv4`.
There is no bearer option, so a data feed key has to go through the `headers` hash, which is how Stroom expects to receive it anyway.

For header values derived from **record fields** rather than the environment, the separate `headers_from_placeholders` parameter is the correct one.
Read [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}) before deriving the feed name that way.


## Buffering

The `file` buffer matters: Fluentd's default in-memory buffer loses data on crash or restart.
`retry_forever true` keeps retrying rather than discarding a chunk after the retry limit, which is right for audit data provided you monitor buffer size.


## Batch shape

With `<format> @type json`, each buffered chunk becomes a post body.
Whether that is a JSON array or newline-delimited depends on the `json_array` parameter.
Set it explicitly, and make sure the receiving pipeline's [parser]({{< relref "../../../concepts/translation.md" >}}) matches.


## Compression

`out_http` gained a `compress` parameter in **v1.17.1**, taking `text` or `gzip`.
On anything older the option does not exist, so check your version before relying on it.

If you set `compress gzip`, add `"Compression":"GZIP"` to the headers hash.
Fluentd sets `Content-Encoding`, which Stroom ignores, and the failure is silent.


## Several feeds

One `<match>` block sends to one feed.
Split by tag with several `<match>` blocks, keeping the set small and explicit.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

{{< timing mode="immediate" >}}
Posting is synchronous, but buffered: `flush_interval` controls how often a chunk is sent, so allow at least one interval before concluding nothing arrived.
{{< /timing >}}

{{< verify >}}
Validate and print the parsed configuration, then confirm the data landed:

```bash
fluentd --dry-run -c <config-file>
```

Read the printed configuration to check both the `headers` hash and any environment interpolation.
Then find the stream on the feed in Stroom.

{{< golden >}}
**The stream is on the feed in Stroom, and its content is readable text.**

The dry run is unusually useful here because it shows the hash as parsed, which is where the two commonest mistakes on this page show up.
It still does not prove delivery.
{{< /golden >}}

{{< not-proof >}}
**A dry run passing proves the configuration parses**, not that the headers are the ones you meant.
Read what it printed.

**An unexpanded `#{ENV[...]}` is not a configuration error**, so nothing fails until Stroom rejects the request.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without Fluentd.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Read the parsed configuration.**
   `--dry-run` prints it.
   Check the `headers` hash is a hash, and that the token expanded.
1. **Are records reaching the match?**
   Temporarily add a `@type stdout` match with the same pattern to inspect them.
1. **Is the buffer growing?**
   The monitor agent exposes queue length and retry counts, which are the signals that matter once this is live.
1. **Is the stream present but unreadable?**
   Check `compress` against the `Compression` header, and check your version actually has `compress`.
1. **Does the pipeline expect the wrong shape?**
   Set `json_array` explicitly rather than relying on the default.
1. **Check parameter names against your installed version**, since this page is written from the plugin documentation rather than from a run.
{{< /diagnose >}}

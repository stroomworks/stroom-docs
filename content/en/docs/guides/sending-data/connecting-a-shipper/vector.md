---
title: "Vector"
linkTitle: "Vector"
weight: 10
date: 2026-10-14
tags:
description: >
  Pointing Vector at Stroom with its generic HTTP sink, including the batch-shape trap and how to compress without breaking every post.
pageKind: guide
verification: required
thirdParty: "Vector"
---

Vector is a single static binary with a large source catalogue and a generic `http` sink.
With [Fluent Bit]({{< relref "fluent-bit.md" >}}), it is the recommended default for anything greenfield: no cluster, no JVM, and good buffering.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Minimal configuration

```toml
[sources.syslog_in]
type    = "syslog"
address = "0.0.0.0:514"
mode    = "tcp"

[sinks.stroom]
type           = "http"
inputs         = ["syslog_in"]
uri            = "https://stroom.example.com/<base>/datafeed"
method         = "post"
encoding.codec = "json"

[sinks.stroom.request.headers]
Feed          = "SYSLOG_EVENTS"
Type          = "Events"
Compression   = "NONE"
Authorization = "Bearer ${STROOM_TOKEN}"
```

`encoding.codec` is required on the `http` sink: Vector will not start without it.

Set `STROOM_TOKEN` in the environment of the Vector process, which interpolates `${VAR}` from the environment at config load.
Do not put the key in the file.


## Batch shape

The `http` sink batches several events into one request, and **the default body shape surprises most people**.
With `encoding.codec = "json"` and no explicit framing, the sink uses comma-delimited framing and wraps the batch in `[ … ]`, so each post body is one JSON array.

For newline-delimited JSON, usually the easiest shape for a [pipeline]({{< relref "../../../concepts/translation.md" >}}) to split, ask for it:

```toml
framing.method = "newline_delimited"
```

`framing.method` accepts `bytes`, `character_delimited`, `length_delimited`, `newline_delimited` and `varint_length_delimited`.
There is no `json_array` value: the array shape comes from the default framing, not from an option you can name.

Whichever you choose, tell whoever builds the receiving pipeline.


## Compression

With `compression = "gzip"`, Vector sets `Content-Encoding: gzip`, which Stroom's web server decodes before Stroom reads the body.
**Leave the `Compression` header at `NONE`.**

```toml
compression = "gzip"          # in [sinks.stroom]
Compression = "NONE"          # in [sinks.stroom.request.headers]
```

Changing `Compression` to `GZIP` as well makes Stroom decompress the body a second time, and every post fails with `500` and `Stroom-Status` `400`.


## Buffering

For any production deployment, configure a disk buffer so that a Stroom outage does not become data loss:

```toml
[sinks.stroom.buffer]
type      = "disk"
max_size  = 268435488
when_full = "block"
```

Keep `when_full = "block"`.
It applies backpressure to the source rather than dropping events, which is the right choice for audit data.
`max_size` is a required byte count for disk buffers, with a documented minimum of about 256 MB; the value above is that minimum.


## Other sources

Swap the `[sources.*]` block; the sink is unchanged.
Vector's catalogue includes `file`, `socket`, `journald`, `kubernetes_logs`, `docker_logs`, `exec`, `http_client`, `http_server`, `kafka`, `aws_s3`, `aws_sqs`, `gcp_pubsub` and `nats`, plus metric scrapers.

To send several sources to **different** feeds, prefer one sink per feed, listing the relevant sources in each sink's `inputs`.
Header values do support templating, so a feed could be derived per event, but an explicit sink per feed keeps the set of feed names small and reviewable.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

{{< timing mode="immediate" >}}
Posting is synchronous, but Vector batches: an event is not sent the instant it is received.
With a disk buffer and a batch window, allow for both before deciding nothing arrived.
{{< /timing >}}

{{< verify >}}
Validate the configuration, then confirm the data landed in Stroom:

```bash
vector validate <config-file>
```

Then open the feed's **Data** tab in Stroom and find the stream.

{{< golden >}}
**The stream is on the feed in Stroom, and its content is readable text.**

Readable matters as much as present: a compressed body that reaches Stroom with neither a `Compression` nor a `Content-Encoding` header produces a stream that exists and cannot be parsed.
{{< /golden >}}

{{< not-proof >}}
**`vector validate` passing proves the configuration is well-formed**, not that it reaches Stroom or that the feed name is right.

**`vector tap` showing events proves the source is producing**, which is useful for ruling out the source, but says nothing about the sink.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without Vector.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
   If that fails, the problem is the endpoint, the authentication or the feed, and no Vector change will fix it.
1. **Does `vector validate` pass?**
   A missing `encoding.codec` stops Vector starting at all.
1. **Is the source producing?**
   `vector tap` on a running instance shows events moving through the topology.
   If nothing is flowing, stop blaming the sink.
1. **Does every post fail with `500` and `Stroom-Status` `400`?**
   `compression` is on and the `Compression` header says `GZIP`, so the body is decompressed twice.
   Set it back to `NONE`.
1. **Is the token reaching the process?**
   `${STROOM_TOKEN}` is interpolated from the environment at config load, so a token set in your shell but not in the service's environment resolves to nothing.
1. **Are there more feeds than you expected?**
   Something is templating the feed name per event.
   See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).
1. **Check option names against your installed version.**
   Vector's options move between releases, and this page is written from its documentation rather than from a run.
{{< /diagnose >}}

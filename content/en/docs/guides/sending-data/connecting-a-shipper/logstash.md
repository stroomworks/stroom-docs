---
title: "Logstash"
linkTitle: "Logstash"
weight: 50
date: 2026-10-14
tags:
description: >
  Using Logstash's http output, and the retry default that quietly loses data when posting.
pageKind: guide
verification: required
thirdParty: "Logstash"
---

Logstash's built-in `http` output can target the datafeed endpoint directly.
It is heavy, being a JVM process, but if it is already running this needs no new infrastructure.

If Logstash is only in the path because Beats need somewhere to send data, a protocol shim that accepts the Elasticsearch bulk API removes the JVM entirely and is worth considering instead.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Minimal configuration

```text
output {
  http {
    url         => "https://stroom.example.com/<base>/datafeed"
    http_method => "post"
    format      => "json"
    headers     => {
      "Feed"          => "LOGSTASH_EVENTS"
      "Type"          => "Events"
      "Compression"   => "NONE"
      "Authorization" => "Bearer ${STROOM_TOKEN}"
    }
    retry_failed         => true
    retry_non_idempotent => true
  }
}
```

`http_method` has **no default** and is required, which is why the example sets it explicitly.

Logstash interpolates `${VAR}` from its process environment at startup, so set `STROOM_TOKEN` there rather than in the file.
It also supports a keystore, referenced with the same syntax, which is preferable on a shared host.


## The retry default

{{< trap severity="silent" >}}
**`POST` is not retried by default, and that loses data quietly.**

`retry_failed` defaults to `true`, but **`retry_non_idempotent` defaults to `false`**, and with it false only `GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS` and `TRACE` are retried at the transport level.
`POST`, which is what the datafeed endpoint needs, is not.

So a transient failure drops the batch, and nothing in Logstash's normal output makes that obvious.
Set both:

```text
    retry_failed         => true
    retry_non_idempotent => true
```
{{< /trap >}}

The consequence is duplicates.
The datafeed endpoint is at-least-once, so a retry after an ambiguous failure, such as a timeout with no response, can deliver the same batch twice.

**That is the correct trade-off.**
Prefer duplicates over loss and let downstream tolerate them.
Do not turn retries off to avoid duplicates.

Enable persistent queues in `logstash.yml` so that a Logstash restart during a Stroom outage does not drop in-flight events.


## Batch shape

`format` decides the body:

* `"json"` sends one event per request.
* `"json_batch"` sends a JSON array of events per request, which is far fewer requests at volume.

`json_batch` is usually right above trivial volumes, but the receiving [pipeline]({{< relref "../../../concepts/translation.md" >}}) has to expect an array rather than a single object.
Decide this before the pipeline is built, not after.


## Compression

`http_compression => true` enables gzip.
If you set it, leave the `Compression` header at `"NONE"`: Logstash sets `Content-Encoding: gzip`, which Stroom's web server decodes before Stroom reads the body.
Changing `Compression` to `"GZIP"` as well makes Stroom decompress the body a second time, and every post fails with `500` and `Stroom-Status` `400`.


## Several feeds

One `http` output block sends to one feed.
Split with conditionals:

```text
output {
  if [type] == "auth" {
    http { url => "..." headers => { "Feed" => "AUTH_EVENTS" } }
  } else {
    http { url => "..." headers => { "Feed" => "APP_EVENTS" } }
  }
}
```

Keep the set small and explicit.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

{{< timing mode="immediate" >}}
Posting is synchronous, subject to the batch size.
A persistent queue defers delivery during an outage rather than dropping, which is why it is worth enabling.
{{< /timing >}}

{{< verify >}}
Validate without running, then confirm the data landed in Stroom:

```bash
bin/logstash --config.test_and_exit -f <pipeline-file>
```

Then open the feed's **Data** tab and find the stream.

{{< golden >}}
**The stream is on the feed in Stroom, and its content is readable text.**

The monitoring API reports per-output error and retry counts, which is good supporting evidence, but only the destination confirms delivery.
{{< /golden >}}

{{< not-proof >}}
**`--config.test_and_exit` passing proves the configuration is valid**, not that it reaches Stroom.

**No errors in Logstash's log does not prove delivery** when `retry_non_idempotent` is false: a dropped POST is not loudly reported.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without Logstash.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Are events reaching the output at all?**
   Add a temporary `stdout { codec => rubydebug }` to inspect them before they are sent.
1. **Is `retry_non_idempotent` set?**
   See the trap.
   This is the one to check when data is intermittently missing rather than entirely absent.
1. **What do the pipeline stats say?**
   `GET /_node/stats/pipelines` reports per-output error and retry counts.
1. **Does every post fail with `500` and `Stroom-Status` `400`?**
   `http_compression` is on and the `Compression` header says `GZIP`, so the body is decompressed twice.
   Set it back to `NONE`.
1. **Does the pipeline expect the wrong shape?**
   `json_batch` sends an array; `json` sends an object.
   The parser has to match.
1. **Check option names against your installed version**, since this page is written from the plugin documentation rather than from a run.
{{< /diagnose >}}

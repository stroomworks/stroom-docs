---
title: "Debezium Server"
linkTitle: "Debezium Server"
weight: 110
date: 2026-10-14
tags:
description: >
  Database change data capture into Stroom, which needs a header-injecting hop in front of it.
pageKind: guide
verification: required
thirdParty: "Debezium Server"
---

For database change data capture without requiring Kafka.
Neither [Vector]({{< relref "vector.md" >}}) nor [Fluent Bit]({{< relref "fluent-bit.md" >}}) does CDC, so this fills a genuine gap.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.

{{< trap severity="silent" >}}
**Debezium Server cannot post to Stroom directly.**
**It needs a hop in front.**

Its HTTP sink cannot set arbitrary static headers.
The only header-related properties control how the **change event's own** headers are rendered onto the request: a prefix, and whether to base64-encode.
There is no property for setting a header of your choosing, despite what several third-party posts show.

Stroom requires a `Feed` header, and data feed keys require an `Authorization` header.
Neither can be supplied.
So this is **two processes, not one**, and any plan that costs it as a single hop is wrong.
{{< /trap >}}


## The working shape

```text
[ database ] → [ Debezium Server ] → [ header-injecting hop ] → [ Stroom ]
```

The hop can be a reverse proxy you already run, or the same Vector binary used elsewhere in these guides.
Vector is tidier if you have no proxy in the path, because it also gives you disk buffering and retries.


### Vector as the hop

```toml
[sources.debezium_in]
type     = "http_server"
address  = "0.0.0.0:8080"
encoding = "json"

[sinks.stroom]
type           = "http"
inputs         = ["debezium_in"]
uri            = "https://stroom.example.com/<base>/datafeed"
method         = "post"
encoding.codec = "json"
framing.method = "newline_delimited"

[sinks.stroom.request.headers]
Feed          = "CDC_APPDB"
Type          = "Events"
Compression   = "NONE"
Authorization = "Bearer ${STROOM_TOKEN}"

[sinks.stroom.buffer]
type      = "disk"
max_size  = 268435488
when_full = "block"
```

Then point Debezium at `http://localhost:8080`.


### nginx as the hop

```text
location /cdc {
    proxy_pass https://stroom.example.com/<base>/datafeed;
    proxy_set_header Feed          CDC_APPDB;
    proxy_set_header Type          Events;
    proxy_set_header Compression   NONE;
    proxy_set_header Authorization "Bearer $stroom_token";
}
```

Lighter if nginx is already in the path, but it gives you **no buffering**: if Stroom is down, Debezium sees the failure and retries against its own configuration rather than a durable queue.


## Debezium server configuration

In `conf/application.properties`:

```text
debezium.sink.type=http
debezium.sink.http.url=http://localhost:8080
debezium.sink.http.timeout.ms=60000
debezium.sink.http.retries=5
debezium.sink.http.retry.interval.ms=1000

debezium.source.connector.class=io.debezium.connector.postgresql.PostgresConnector
debezium.source.database.hostname=db.example.com
debezium.source.database.user=debezium
debezium.source.database.password=${DB_PASSWORD}
debezium.source.database.dbname=appdb
debezium.source.topic.prefix=app_cdc
debezium.source.offset.storage.file.filename=/var/lib/debezium/offsets.dat
```

Later 3.x releases add `batch.enabled` and `batch.max-size`.
Check whether your version has them before relying on batching.


## Authentication

The HTTP sink's authentication types do not include a plain static bearer token, so a Stroom data feed key cannot be supplied from Debezium.

**Authenticate at the hop instead**, as both options above do, and restrict the hop's own listener to localhost or a private network.
The hop is now holding the credential, so treat it accordingly.


## Delivery semantics

**Not documented.**
Debezium Server makes no at-least-once or exactly-once statement for its HTTP sink.
Retries plus offset-based resume imply at-least-once in practice, but treat that as an inference rather than a guarantee, and do not cite it as documented behaviour in a design.

Since the datafeed endpoint is itself at-least-once, plan for duplicates downstream regardless.


## Deriving the feed

CDC events carry database, schema and table, which are naturally stable and low-cardinality.
But the header is set at the hop, not by Debezium, so the simple approach is **one hop listener per feed**: a Debezium Server instance, or a distinct hop port, per logical dataset, with the feed name hardcoded there.

For per-table feeds through a single hop, Vector can template the header from the event body, at the cost of the collision and cardinality risks in [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).
Never derive the feed from anything per-row.

{{< timing mode="async" >}}
The **initial snapshot** is the thing to plan for: the first run streams an entire table before switching to incremental changes.
On a large table that is a burst, and it is the moment the hop's buffering earns its place.

Steady-state CDC is near real time, subject to the hop's batching.
{{< /timing >}}

{{< verify >}}
Confirm the header problem for yourself on your target version before building anything around it: point Debezium at a local listener and inspect the raw request.

```bash
nc -l 8080
```

Then, once the hop is in place, find the stream on the feed in Stroom.

{{< golden >}}
**A row changed in the database appears as a stream on the feed in Stroom.**

End to end, through both processes.
Each half can look healthy while the join between them is wrong, and the hop is where the feed name and credential live.
{{< /golden >}}

{{< not-proof >}}
**Debezium reporting a successful post proves the hop accepted it**, not that Stroom did.

**If a future version adds static header support, this page is wrong.**
Check your version rather than assuming.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without any of this.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Prove the hop.**
   Post to it with `curl` and confirm the data reaches Stroom.
   That splits the problem in half.
1. **Is Debezium reaching the hop?**
   Point it at a local listener and read the raw request.
1. **Does the database user have what it needs?**
   CDC needs elevated privileges, replication slots on PostgreSQL and binlog access on MySQL.
   Test against a non-production replica first: those privileges warrant review before production.
1. **Is this the initial snapshot?**
   A first run that appears to flood or stall is usually the snapshot.
   Check the hop's buffer.
1. **Are offsets advancing?**
   If not, Debezium is retrying rather than progressing, which points at the hop or at Stroom.
1. **Check property names against your version**, since this page is written from the documentation rather than from a run.
{{< /diagnose >}}

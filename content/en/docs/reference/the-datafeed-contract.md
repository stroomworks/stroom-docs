---
title: "The Datafeed Contract"
linkTitle: "The Datafeed Contract"
weight: 10
date: 2026-10-14
tags:
description: >
  The headers, compression, authentication and responses that every sender has to satisfy.
pageKind: reference
aliases:
  - /docs/sending-data/
  - /docs/sending-data/data-formats/
  - /docs/sending-data/data-formats/character-encoding/
  - /docs/sending-data/data-formats/event-xml-fragments/
  - /docs/sending-data/header-arguments/
  - /docs/sending-data/java-keystores/
  - /docs/sending-data/payloads/
  - /docs/sending-data/response-codes/
  - /docs/sending-data/ssl/
  - /docs/sending-data/token-authentication/
---

One endpoint, and everything that goes into and comes out of it.
This is the interface every [connector]({{< relref "../guides/sending-data/connecting-a-shipper/_index.md" >}}) and adapter satisfies, whether it is a log shipper, a script, or something you wrote.


## The endpoint

```text
https://<stroom-host>/<base-path>/datafeed
```

The path part is `/datafeed`.
Legacy `noauth`- and `authenticated`-prefixed aliases are also registered.
The base path depends on how the instance is deployed, so confirm it with whoever operates it.

The endpoint exists on **both** Stroom and [Stroom Proxy]({{< relref "../concepts/data-receipt.md#stroom-proxy" >}}).


## Request headers

| Header | Required | Notes |
|---|---|---|
| `Feed` | **Yes**, unless feed name generation is enabled | The routing key, and a security boundary. See [Choosing a feed]({{< relref "../guides/sending-data/choosing-a-feed.md" >}}) |
| `Type` | No | [Stream type]({{< relref "../concepts/streams.md#stream-types" >}}), e.g. `Events`, `Raw Events` |
| `Compression` | No, but **set it explicitly** | `ZIP`, `GZIP` or `NONE`. See below |
| `EffectiveTime` | No | Event time, as distinct from receipt time |
| `GUID` | No | Client-supplied identifier, useful for tracing one post |

Other recognised keys a sender may usefully populate: `System`, `Environment`, `Component`, `AccountId`, `AccountName`, `Format`, `Schema`, `SchemaVersion`, `Encoding`, `Classification`, `Host`.


## Compression

Stroom selects its decompressor from the **`Compression`** header and nothing else.

Values are case-insensitive, and anything outside `ZIP`, `GZIP` and `NONE` is rejected outright, so a typo in the value is a hard failure rather than a silent one.

{{< trap severity="silent" >}}
**`Content-Encoding` does nothing.
Stroom does not read it.**

Most HTTP clients and log shippers set `Content-Encoding: gzip` when you enable compression, because that is the standards-compliant thing to do.
Stroom ignores it entirely.

The dangerous case is the **absent** `Compression` header.
If it is missing or empty the body is treated as uncompressed and stored as-is, so gzip bytes sent without it return `200`, land looking fine, and are unparseable when a pipeline eventually tries to read them.
Nothing complains until then.

**Set a `Compression` header matching whatever your sender does, in the same request.**
{{< /trap >}}


## Authentication

Which methods are accepted is configured server-side, so ask whoever operates the instance.
The available types are a data feed key, an OAuth token, a client certificate, or a certificate identity.

For third-party shippers, **data feed keys are the practical choice**: a single static header that every HTTP tool supports.

* The key travels in the standard **`Authorization`** header.
* The `Bearer ` prefix is optional.
  Both `Authorization: Bearer sdk_…` and `Authorization: sdk_…` work.
  Prefer the `Bearer` form, since more tools have a first-class field for it.
* Data feed keys are recognisable by their `sdk_` prefix.

Mutual TLS works, but is markedly harder to configure in most agents.
Choose it only if your tool already does mTLS elsewhere.

Never hardcode a key into a configuration file that ships in version control or is world-readable.


## Responses

On success the response carries a **`ReceiptId`**, formed as `<proxy ID>_<UUID>`, which identifies that one post.

On failure it carries **`Stroom-Status`** with a numeric code and **`Stroom-Error`** with the reason in words.
Stroom Proxy reads `Stroom-Error` off its own downstream responses to log forwarding failures, and it is the quickest way to find out why a post was rejected.

**A sender that records none of these cannot tell you why data is missing.**
Capture all three.
The full list is in [Datafeed response codes]({{< relref "response-codes.md" >}}).


## Testing before wiring up a real sender

Prove the endpoint, the authentication and the feed with `curl` first.
It isolates problems in your shipper's configuration from problems at the Stroom end:

```bash
curl -v -X POST "https://stroom.example.com/<base-path>/datafeed" \
  -H "Feed: MY_TEST_FEED" \
  -H "Type: Events" \
  -H "Compression: NONE" \
  -H "Authorization: Bearer ${STROOM_TOKEN}" \
  --data-binary @sample-event.txt
```

Expect `200` and a `ReceiptId`.
If it fails, read `Stroom-Status` and `Stroom-Error` before touching any agent configuration.

To prove the compression path specifically, gzip the file and send it with `Compression: GZIP`, then check in Stroom that the [stored stream]({{< relref "../concepts/streams.md#browsing-data" >}}) is readable text rather than binary.
Omitting the header there is exactly the silent failure described above, and it is worth reproducing once deliberately so that you recognise it.


## Formats

Stroom's [pipelines]({{< relref "../concepts/pipelines.md" >}}) already parse XML, XML fragments, JSON and arbitrary delimited or regex text.
**No sender needs to parse, normalise or reshape payloads**: send events as close to their native form as possible and let the pipeline do the work.
Keep every integration to transport and metadata.

One decision does have to be made per sender: whether a post body is **one event or a batch**, and if a batch, whether it is newline-delimited or a JSON array.
The receiving pipeline's [parser]({{< relref "../concepts/translation.md" >}}) has to match.

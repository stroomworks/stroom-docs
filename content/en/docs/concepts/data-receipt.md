---
title: "Stroom Proxy and Data Receipt"
linkTitle: "Stroom Proxy and Data Receipt"
weight: 15
date: 2026-10-14
tags:
description: >
  How data gets into Stroom, either directly or through Stroom Proxy, and how Stroom decides whether to accept it.
pageKind: concept
---

Client systems send data to Stroom with a plain HTTP POST to its `/datafeed` endpoint.
The body of the request is the data, and HTTP headers describe it.
Stroom stores each accepted request as a [stream]({{< relref "streams/_index.md" >}}) in the [feed]({{< relref "feed.md" >}}) the headers name, ready for [processing]({{< relref "processing/_index.md" >}}).

Clients can post straight to Stroom, or to Stroom Proxy, which sits at the edge of the network and passes data on.
Both present the same `/datafeed` API, so a client sends data the same way to either.
To set up a sender, see [How data gets in]({{< relref "../guides/sending-data/how-data-gets-in.md" >}}) and [Connecting a shipper]({{< relref "../guides/sending-data/connecting-a-shipper/_index.md" >}}).


## Sending data

A minimal post with `curl` looks like this:

```bash
curl --data-binary @events.log "https://<stroom-host>/stroom/datafeed" \
  -H "Feed:MY_SYSTEM-EVENTS" \
  -H "System:MY_SYSTEM" \
  -H "Environment:OPS"
```

The payload must be text once it is uncompressed.
It can be sent in one of three forms:

* **Uncompressed**: plain text, with no compression header.
* **GZIP**: gzip-compressed text, with `Compression:GZIP` or the standard `Content-Encoding: gzip`, but never both.
* **ZIP**: a ZIP archive, with `Compression:ZIP`.
  This is the only form that can carry more than one file, and the only one that can carry context data alongside the events.


### The ZIP format

Inside a ZIP, files are grouped by their base name (the name without its extension).
Each group is one item of data, with optional sidecar files:

| Extension | What it holds |
|---|---|
| `.dat` | The event data. A file with no reserved extension is also treated as event data. |
| `.ctx` | Context data for the matching event file, which pipelines can use for [lookups]({{< relref "pipeline-reference-data.md" >}}). |
| `.meta` | Key-value metadata for the matching event file. Clients rarely send these. |
| `.mf` | A manifest. Stroom writes these when you download data. Clients should not send them. |

A file and its sidecars must sit in the same directory inside the ZIP.
Stroom rejects a ZIP that has two event files with the same base name.

{{% warning %}}
A ZIP downloaded from Stroom contains `.mf` manifest files that name the feed the data came from.
If you upload that ZIP to a different feed, Stroom honours the manifest and puts the data back in its original feed.
Remove the `.mf` files first.
{{% /warning %}}


## Header arguments

Header names are case insensitive.
Stroom keeps the headers, along with attributes it adds itself such as the receipt time, as the stream's metadata, so you can filter on them later.

| Header | Meaning |
|---|---|
| `Feed` | The feed the data belongs to. Required, unless feed name generation is turned on (see below). |
| `Type` | Optional. The stream type to store the data as. If given, it must be one of the configured stream types. |
| `Compression` | `ZIP`, `GZIP` or `NONE`. Use this or the standard `Content-Encoding` header, never both. `Compression` is preferred. |
| `EffectiveTime` | Reference data only. The time from which the data applies, in ISO 8601 format. |
| `System` | The name the sending system is known by in your organisation. |
| `Environment` | Which deployment of the system sent the data, such as `DEV` or `LIVE`. |
| `Authorization` | A token, when token authentication is in use. |

By default Stroom requires every client to authenticate.
Out of the box it accepts client certificates and OAuth tokens.
It can also be set up to accept data feed keys, which work much like API keys and are issued for sending data only.


## Response codes

Stroom answers every post with an HTTP status, plus a `Stroom-Status` header holding a more precise code and a `Stroom-Error` header holding the reason in words.
The same message is in the response body.
A client should capture all three.

| HTTP | Stroom-Status | Meaning |
|---|---|---|
| 200 | 0 | The data was received. |
| 406 | 100 | No `Feed` header was supplied. |
| 406 | 101 | The feed does not exist. A direct post to Stroom for an unknown feed returns `110` instead. |
| 406 | 102 | The `Type` header is not a valid stream type. |
| 406 | 103 | A mandatory header is missing. |
| 406 | 110 | The feed is not set to receive data. |
| 406 | 113 | The data receipt rules rejected the data. |
| 406 | 200 | The `Compression` value is not `ZIP`, `GZIP` or `NONE`. |
| 401 | 300 to 315 | The client did not authenticate, or its credentials were not accepted. |
| 413 | 410 | The request was bigger than the configured maximum size. |
| 500 | 400 | The compressed data is not valid, for example a truncated ZIP. |
| 500 | 999 | An unexpected error. |

The common cases are above.
Every code, with the exact message Stroom returns, is in [Datafeed response codes]({{< relref "../reference/response-codes.md" >}}), which is generated from the source.
The headers, compression and authentication rules are in [The datafeed contract]({{< relref "../reference/the-datafeed-contract.md" >}}).

If the response is not 200, the client should keep the data and try again later.
It should only delete data once Stroom or Stroom Proxy has accepted it.


## Receipt IDs

Each successful post is given a unique receipt ID, which is written into the body of the 200 response and stored in the stream's `ReceiptId` attribute.
It looks like this:

```text
0000001738332835967_0000_P_node1
```

The parts are the receipt time in milliseconds since the epoch, a sequence number for posts received in the same millisecond, `P` or `S` for Stroom Proxy or Stroom, and the proxy ID or Stroom node name.
When data passes through a chain of proxies, each one appends its receipt ID to the `ReceiptIdPath` attribute, so you can trace where it has been.
Proxy IDs and node names must be unique across the estate for this to work.


## Stroom Proxy

Stroom Proxy is the front door for data.
It turns many small posts into fewer, larger streams, which Stroom processes more efficiently, and it keeps accepting data while Stroom is offline.

Proxy can:

* **Filter** incoming data on its headers, and receive, drop or reject it.
* **Split** ZIPs that hold data for more than one feed or stream type.
* **Aggregate** data by feed and stream type into larger batches.
* **Forward** data to one or more destinations: Stroom, another proxy over HTTP, or a directory on disk.
* **Instantly forward** data to a single HTTP destination as it arrives, with no aggregation.
* **Scan directories** for ZIP files in Stroom's ZIP format and send them on (see [ZIP drop folder]({{< relref "../guides/sending-data/connecting-a-shipper/zip-drop-folder.md" >}})).

Proxy is store-and-forward.
It writes each post to its local disk before it answers the client, and works through a series of directory queues from there.
Data that fails to forward is kept and retried.


### Aggregation

With aggregation on (the default), Proxy closes an aggregate and forwards it when it reaches any of these limits, set under `proxyConfig.aggregator`:

| Setting | Default |
|---|---|
| `maxItemsPerAggregate` | 1,000 items |
| `maxUncompressedByteSize` | 1 GiB |
| `aggregationFrequency` | 10 minutes |

An aggregated batch arrives in Stroom as a single multi-part stream.

{{% note %}}
Forwarding from Proxy to S3 is in the Stroom 7.14 betas only.
It is not in a stable release.
{{% /note %}}


## Deciding what to accept

Stroom and Stroom Proxy both check incoming data before they accept it.
The property `receive.receiptCheckMode` chooses how:

| Mode | What happens |
|---|---|
| `FEED_STATUS` | The default. Each feed's **Feed Status** decides. |
| `RECEIPT_POLICY` | The data receipt rules decide. |
| `FEED_EXISTENCE` | Data is accepted if its feed exists, whatever the feed's status. |
| `RECEIVE_ALL` | All data is accepted, with no feed check. |
| `DROP_ALL` | All data is silently dropped. |
| `REJECT_ALL` | All data is rejected. |

Use the same mode on Stroom and on every proxy in front of it.


### Feed status

Every feed has a **Feed Status** on its **Settings** tab:

* **Receive**: the data is accepted.
* **Reject**: the client gets a 406 with Stroom-Status 110.
* **Drop**: the data is thrown away, but the client gets a 200 as if it had been received.
  Use this when the sender should not know its data is being discarded.

Proxy has no access to feed settings, so it asks the Stroom (or proxy) downstream of it and caches the answer.


### Data receipt rules

Data receipt rules give finer control.
Open them from **Administration** > **Data Receipt Rules** (you need the **Manage Data Receipt Rules** permission).
Each rule is an expression over the stream's metadata, which means its headers, and an action: **Receive**, **Reject** or **Drop**.
Rules are tested in order and the first match wins.
If no rule matches, the data is rejected, so add a final rule with no terms and a **Receive** action if you want to accept everything else.
Data that passes the rules must still be for a feed that exists.

Proxies fetch the rules from Stroom periodically, so a change takes a short time to reach them.


## Creating feeds automatically

Two optional features save creating a feed by hand for every new source.
Both are off by default.

* **Feed name generation** (`receive.feedNameGenerationEnabled`) builds the feed name from other headers when `Feed` is not sent.
  The default template is `${accountid}-${component}-${format}-${schema}`, and those four headers then become mandatory.
  Configure it the same way on Stroom and on Proxy.
* **Content templates** (`autoContentCreation.enabled`) create the feed, and a pipeline or processor filter to process it, when the first data for a new feed arrives.
  Manage them from **Administration** > **Content Templates**.


## Related pages

* [Feeds]({{< relref "feed.md" >}}): the feed settings that receipt depends on.
* [Streams]({{< relref "streams/_index.md" >}}): what a post becomes once it is stored.
* [Processing]({{< relref "processing/_index.md" >}}): how received data is picked up by pipelines.
* [Volumes and storage]({{< relref "volumes.md" >}}): where received streams are written.
* [Is data arriving?]({{< relref "../operate/checking-it-works/is-data-arriving.md" >}}) and [Proxy problems]({{< relref "../operate/troubleshooting/proxy-problems.md" >}}): if data is not getting through.

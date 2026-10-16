---
title: "How Data Gets In"
linkTitle: "How Data Gets In"
weight: 10
date: 2026-10-14
tags:
description: >
  Stroom's four entry points, what each one needs of the sender, and how to choose.
pageKind: guide
verification: required
---

Stroom has four ways in.
Which you want is mostly decided by what the sending system can already do, rather than by preference.

| Entry point | Available on | What the sender must do |
|---|---|---|
| **The datafeed endpoint** | Stroom **and** Proxy | HTTP POST with custom headers |
| **The event endpoint** | Proxy only | HTTP POST of a single JSON event |
| **The drop folder** | Proxy only | Write a file to a directory |
| **S3** (from Stroom 7.14) | Proxy forwards, Stroom picks up | Send to a proxy that forwards to an S3 bucket |


## The datafeed endpoint

The general case, and what nearly everything uses.
Metadata in headers, opaque bytes in the body, no SDK.
See [The datafeed contract]({{< relref "../../reference/the-datafeed-contract.md" >}}).

Choose it unless you have a specific reason not to.


## The event endpoint

Takes a single JSON event per request and returns a receipt id.
Proxy only.

Useful where a sender naturally emits one event at a time and you want a receipt per event.
For volume, batching through the datafeed endpoint is far more efficient.


## The drop folder

**The cheapest integration Stroom has: anything that can write a file is a connector.**

[Stroom Proxy]({{< relref "../../concepts/data-receipt.md#stroom-proxy" >}}) polls a directory for [proxy-format ZIP files]({{< relref "connecting-a-shipper/zip-drop-folder.md" >}}), and moves anything it cannot handle to a parallel failure directory.
There is no HTTP, no authentication to configure in the sender, and no library: a batch job that writes a file is enough.

The trade-offs are granularity and latency.
It works at file level, and the scan is on an interval, so it is minutes rather than seconds.
For overnight exports from a system that has no other way out, that is usually fine.


## S3

From Stroom 7.14, a proxy can forward to an S3 bucket instead of posting to Stroom.
Stroom picks the data up by polling an AWS SQS queue for the bucket's S3 create events (the **S3 Event Notifications Poll** job), or from a notification posted to its `/s3event/v1/notify` endpoint, and reads it through an `S3 v1 (Read only)` volume.
The sender still sends to the proxy in one of the ways above: S3 replaces the hop from the proxy to Stroom.
See [Stroom Proxy and Data Receipt]({{< relref "../../concepts/data-receipt.md" >}}) and [Running a Proxy]({{< relref "../../operate/install/a-proxy.md" >}}).

{{< timing mode="async" >}}
The datafeed and event endpoints answer synchronously: by the time you get a `200` from **Stroom**, the data is stored.

Both are different through a **proxy**, which stores and forwards on its own schedule.
A `200` from a proxy means the proxy has it, not that Stroom does.

The drop folder is asynchronous by nature: the scan runs on an interval, so allow for it before concluding a file has been ignored.
{{< /timing >}}

{{< verify >}}
Find the stream on the feed in **Stroom**, with a create time consistent with when you sent it.

{{< golden >}}
**The stream is on the feed in Stroom.**

Whichever entry point you used, this is the only thing that confirms delivery.
A `200`, a receipt id, a file that has disappeared from the drop folder: each proves a stage, not the outcome.
{{< /golden >}}

{{< not-proof >}}
**A file vanishing from the drop folder does not mean it was accepted.**
Check it did not reappear in the failure directory.

**A receipt id is not confirmation of storage in Stroom** when it came from a proxy.
It confirms the proxy took responsibility for it.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Which entry point did the data use?**
   Through a proxy, the answer to "where is it" is usually "still in the proxy".
   See [Proxy problems]({{< relref "../../operate/troubleshooting/proxy-problems.md" >}}).
1. **What did the sender get back?**
   The HTTP status, `Stroom-Status` and `Stroom-Error`.
   See [Is data arriving?]({{< relref "../../operate/checking-it-works/is-data-arriving.md" >}}).
1. **For the drop folder, is the file in the failed directory?**
   That means the scanner rejected it, usually because it is not in the expected proxy ZIP format.
1. **Is the feed set to receive?**
   A feed set to drop accepts and discards, returning `200`, whichever entry point was used.
{{< /diagnose >}}

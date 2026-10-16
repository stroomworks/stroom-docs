---
title: "Proxy Problems"
linkTitle: "Proxy Problems"
weight: 40
date: 2026-10-14
tags:
description: >
  Data that reached a proxy and stopped there, and how to find out where on its way through it is stuck.
pageKind: operate
verification: required
---

[Stroom Proxy]({{< relref "../../concepts/data-receipt.md" >}}) accepts data, stores it, and forwards it on its own schedule.
That store-and-forward design is what makes it useful on an unreliable link, and it is also why "the sender got a `200`" and "Stroom has the data" can be weeks apart.

When data is missing from Stroom but the sender is happy, the proxy is the first place to look.


## Where data sits on its way through

The proxy's repository is a sequence of numbered directories, and data moves through them in order.
**Which directory a file is sitting in tells you what stage has stalled**, which makes this the fastest diagnostic the proxy offers.

| Stage | Directories |
|---|---|
| Receiving | `01_receiving_simple`, `01_receiving_zip` |
| Splitting | `02_split_zip_input_queue`, `03_split_zip_splits`, `22_splitting`, `23_split_output` |
| Aggregating | `20_pre_aggregate_input_queue`, `21_pre_aggregates`, `30_aggregate_input_queue`, `31_aggregates` |
| Forwarding | `40_forwarding_input_queue`, `50_forwarding`, `01_forward`, `02_retry` |
| Failed | `03_failure` |
| Cleaning up | `99_deleting` |

A growing `02_retry` means the proxy is trying and failing to forward.
A growing `03_failure` means it has given up.
Either way the data is still on disk, which is the point of the design.

Separately, the [drop-folder]({{< relref "../../guides/sending-data/connecting-a-shipper/zip-drop-folder.md" >}}) scanner polls `zip_file_ingest` for proxy-format ZIP files and moves anything it cannot handle to `zip_file_ingest_failed`.

{{< timing mode="async" >}}
Forwarding is scheduled, not immediate.
A `200` from a proxy means **the proxy has the data**, not that Stroom does.

The drop-folder scanner polls on an interval too, so a file written to `zip_file_ingest` is not picked up instantly.

Allow for both before concluding anything is wrong.
{{< /timing >}}

{{< verify >}}
Confirm the data reached its destination, not that it left the sender: find the stream on the feed in **Stroom**, not in the proxy.

{{< golden >}}
**The stream is on the feed in Stroom, with a create time consistent with the send.**

The proxy's own logs, repository contents, and `200` responses all describe the proxy's view.
Only the destination can confirm delivery.
{{< /golden >}}

{{< not-proof >}}
**A `200` from the proxy proves receipt by the proxy and nothing else.**

**An empty repository does not prove successful forwarding.**
It can equally mean the data was deleted after a failure, or that it never arrived.
Check the destination.

**The proxy's [health endpoint]({{< relref "../checking-it-works/health-endpoints.md" >}}) being green does not mean forwarding works.**
When the receipt check mode is `FEED_STATUS` or `RECEIPT_POLICY` it does call `downstreamHost`, so an unreachable downstream shows there.
It never checks the forwarding destinations themselves, so a forward that is failing, or being refused, can sit behind a green health check.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A proxy with a broken downstream looks healthy to everyone upstream of it.**

Senders keep getting `200`.
The proxy keeps accepting.
The repository fills, the retry directory grows, and nothing fails from the sender's point of view, because from the sender's point of view nothing has.

The first symptom is usually disk, days later.
Monitor the proxy's repository size, and alert on it: it is the only early warning this design gives you.
{{< /trap >}}

{{< diagnose >}}
1. **Is the data in Stroom?**
   Check the feed first.
   If it is there, the proxy did its job and the problem is elsewhere.
1. **Which directory is it in?**
   Look in the repository.
   The stage it is sitting at names the problem: retrying, failed, or still queued to forward.
1. **Is the forward destination reachable from the proxy?**
   Not from your laptop.
   Test from the proxy host, with the same name and certificate it uses.
1. **What does the send log say?**
   The proxy logs its forwarding attempts separately from its application log.
   Failures and their reasons are there.
   See [Reading the logs]({{< relref "reading-the-logs.md" >}}).
1. **Is the destination rejecting it?**
   A forward that is being refused rather than failing to connect gets a `Stroom-Status` and `Stroom-Error` from downstream (see [Datafeed response codes]({{< relref "../../reference/response-codes.md" >}})), and the proxy logs them.
   A feed that does not exist downstream is a common cause.
1. **Is the disk full?**
   A proxy that cannot write to its repository cannot accept data, and this is the failure mode the trap above leads to.
1. **For drop-folder ingest, is anything in `zip_file_ingest_failed`?**
   That is the scanner rejecting the file, usually because it is not in the expected proxy ZIP format.
{{< /diagnose >}}

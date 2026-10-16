---
title: "Is Data Arriving?"
linkTitle: "Is Data Arriving?"
weight: 20
date: 2026-10-14
tags:
description: >
  How to confirm that data a sender believes it sent has actually been received and stored.
pageKind: operate
verification: required
---

"The sender says it sent it" and "Stroom has it" are different claims, and most of the time people are arguing about the gap between them.
This page closes it.

Data arrives by HTTP POST to the [datafeed endpoint]({{< relref "../../reference/the-datafeed-contract.md" >}}), either directly or through Stroom Proxy.
The receiving end decides, from the headers and the [feed's configuration]({{< relref "../../concepts/feed.md" >}}), whether to accept it.
If it accepts, the data becomes a **[stream]({{< relref "../../concepts/streams/_index.md" >}})** on that feed.


## The sender's side of the story

Every post gets an HTTP status, and three more things worth capturing:

* **The receipt ID** on success, as the response body rather than a header, for example `1791981748008_0000_S_node1a`.
  It identifies that one post.
  Each hop records its own id in the stream's `ReceiptId` attribute and appends it to `ReceiptIdPath`, so searching `ReceiptIdPath` for the id the sender was given is what lets you trace a specific delivery through a proxy chain.
* **`Stroom-Status`** on failure: a numeric code more specific than the HTTP status.
* **`Stroom-Error`** on failure: the reason, in words.
  Stroom Proxy reads this off its own downstream responses to log forwarding failures, and it is the quickest way to find out why a post was rejected.

A sender that records none of them will cheerfully discard data Stroom refused.

| HTTP | `Stroom-Status` | What it means |
|---|---|---|
| `200` | `0` | Accepted. |
| `406` | `100` | No `Feed` header was supplied. |
| `406` | `101` | The feed does not exist. Only when `stroom.receive.receiptCheckMode` is `RECEIPT_POLICY` or `FEED_EXISTENCE`. |
| `406` | `110` | The feed is not set to receive data, **or does not exist at all**. With the default `receiptCheckMode`, `FEED_STATUS`, a direct post cannot tell the two apart. |
| `406` | `113` | Rejected by a data receipt policy rule. |
| `401` | `300` to `304` | No credential was supplied. `302`, *Client token or certificate required*, is the usual one. |
| `401` | `310` to `315` | A credential was supplied but was not accepted, for example an expired data feed key (`314`). |
| `413` | `410` | The content is larger than the configured limit. |
| `500` | `400` | The compressed stream is invalid, truncated or corrupt. |

There are [more than twenty codes]({{< relref "../../reference/response-codes.md" >}}) in total; this is the set you meet in practice.

{{< timing mode="immediate" >}}
Receipt is **synchronous**.
By the time the POST returns `200` the data is stored and a stream exists.
If you posted directly to Stroom you can look for it immediately.

Through Stroom Proxy it is different: the proxy stores the data and forwards it on its own schedule, so a `200` from a proxy means *the proxy has it*, not that Stroom does.
Allow for the forwarding interval before concluding anything.
{{< /timing >}}

{{< verify >}}
Open the feed in the explorer tree and go to its **Data** tab.
A stream should be listed with a **Create Time** matching when the sender posted, and a **Type** of `Raw Events` (or whatever the feed's received type is).

{{< golden >}}
**A stream on the feed's Data tab, with the right create time.**
Nothing else proves receipt.
The sender's logs, the proxy's logs and a `200` in a load balancer's access log can all be true while the data is sitting in a proxy repository or was dropped by a rule.
{{< /golden >}}

{{< not-proof >}}
**A `200` from a Stroom Proxy does not mean Stroom has the data.**
The proxy accepts into its own store and forwards later.
Check the destination.

**An empty Data tab does not always mean rejection**: check the filter on the tab first.
It defaults to a time range, and data with an older create time will not be listed.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A feed set to Drop returns `200` and discards the data.**

A feed's status has three values.
**Receive** stores the data.
**Reject** refuses it with `406` and `Stroom-Status` `110`, so the sender finds out.
**Drop accepts the post, answers `200`, and throws the data away**, with effect from the moment you save it: by design, for shedding traffic you do not want without making the sender retry.

Nothing about the sender's view distinguishes **Drop** from success.
If data is vanishing with no errors anywhere, check the feed's status first.
{{< /trap >}}

{{< diagnose >}}
1. **What did the sender actually get back?**
   Not "it worked": the HTTP status, plus `Stroom-Status` and `Stroom-Error`.
   If the sender does not record them, reproduce the post with `curl -v` and read them yourself.
   Most arrival problems are answered here, and `Stroom-Error` usually answers them in one line.
1. **Is the feed set to receive?**
   Open the feed, **Settings** tab, check **Feed Status** is **Receive**.
   **Drop** is the quiet one: see above.
1. **Did a receipt rule reject it?**
   A `Stroom-Status` of `113` means a data receipt policy rule matched.
   Check the rules under the receipt configuration, not the feed.
1. **Was the `Feed` header right?**
   Feed names are exact.
   With the default `FEED_STATUS` check mode, a typo in a direct post gives `110`, exactly as if the feed were set to **Reject**, not a helpful message about a near match; under `RECEIPT_POLICY` it gives `101`.
   If the status is **Receive** and you still get `110`, check the spelling of the `Feed` header against the feed's name.
1. **If you are posting through a proxy, is it forwarding?**
   Look at the proxy's repository: data that arrived but has not been forwarded is still on its disk.
   Check the proxy's own admin health endpoint and its logs for forwarding failures.
   See [Proxy problems]({{< relref "../troubleshooting/proxy-problems.md" >}}).
1. **Is the Data tab's filter hiding it?**
   Widen the time range before concluding the stream is absent.
1. **Is this an authentication problem that looks like something else?**
   A `401` with a `3xx` status code is about the certificate, token or data feed key, not about the feed's configuration.
{{< /diagnose >}}


## Next

Data arriving is not data processed.
A feed can be full of `Raw Events` streams that nothing has ever looked at: see [Is data processing?]({{< relref "is-data-processing.md" >}}).

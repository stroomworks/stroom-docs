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
If it accepts, the data becomes a **[stream]({{< relref "../../concepts/streams.md" >}})** on that feed.


## The sender's side of the story

Every post gets an HTTP status and three response headers worth capturing:

* **`ReceiptId`** on success, as `<proxy ID>_<UUID>`.
  It identifies that one post, and it is what lets you trace a specific delivery through a proxy chain.
* **`Stroom-Status`** on failure: a numeric code more specific than the HTTP status.
* **`Stroom-Error`** on failure: the reason, in words.
  Stroom Proxy reads this off its own downstream responses to log forwarding failures, and it is the quickest way to find out why a post was rejected.

A sender that records none of them will cheerfully discard data Stroom refused.

| HTTP | `Stroom-Status` | What it means |
|---|---|---|
| `200` | `0` | Accepted. |
| `406` | `100` | No `Feed` header was supplied. |
| `406` | `101` | The feed is not defined. |
| `406` | `110` | The feed exists but is not set to receive data. |
| `406` | `113` | Rejected by a data receipt policy rule. |
| `401` | `300`, `301` | A client certificate or token is required and was not supplied. |
| `403` | `3xx` | The credential was supplied but is not authorised for this feed. |
| `413` | `500` | The content is larger than the configured limit. |
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
**A feed set to `DROP` returns `200` and discards the data.**

A feed's status has three values.
`RECEIVE` stores the data.
`REJECT` refuses it with a `406`, so the sender finds out.
**`DROP` accepts the post, answers `200`, and throws the data away**: by design, for shedding traffic you do not want without making the sender retry.

Nothing about the sender's view distinguishes `DROP` from success.
If data is vanishing with no errors anywhere, check the feed's status first.
{{< /trap >}}

{{< diagnose >}}
1. **What did the sender actually get back?**
   Not "it worked": the HTTP status, plus `Stroom-Status` and `Stroom-Error`.
   If the sender does not record them, reproduce the post with `curl -v` and read them yourself.
   Most arrival problems are answered here, and `Stroom-Error` usually answers them in one line.
1. **Is the feed set to receive?**
   Open the feed, **Settings** tab, check **Feed Status** is `RECEIVE`.
   `DROP` is the quiet one: see above.
1. **Did a receipt rule reject it?**
   A `Stroom-Status` of `113` means a data receipt policy rule matched.
   Check the rules under the receipt configuration, not the feed.
1. **Was the `Feed` header right?**
   Feed names are exact.
   A typo gives `100` or `101`, not a helpful message about a near match.
1. **If you are posting through a proxy, is it forwarding?**
   Look at the proxy's repository: data that arrived but has not been forwarded is still on its disk.
   Check the proxy's own admin health endpoint and its logs for forwarding failures.
   See [Proxy problems]({{< relref "../troubleshooting/proxy-problems.md" >}}).
1. **Is the Data tab's filter hiding it?**
   Widen the time range before concluding the stream is absent.
1. **Is this an authentication problem that looks like something else?**
   A `401` or `403` with a `3xx` status code is about the certificate, token or data feed key, not about the feed's configuration.
{{< /diagnose >}}


## Next

Data arriving is not data processed.
A feed can be full of `Raw Events` streams that nothing has ever looked at: see [Is data processing?]({{< relref "is-data-processing.md" >}}).

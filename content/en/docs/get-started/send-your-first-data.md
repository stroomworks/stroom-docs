---
title: "Send Your First Data"
linkTitle: "Send Your First Data"
weight: 30
date: 2026-10-14
tags:
description: >
  Creating a feed and posting a file to it, then finding the stream that resulted.
pageKind: tutorial
verification: required
---

Everything in Stroom starts with data arriving on a **[feed]({{< relref "../concepts/feed.md" >}})**.
A feed is a named channel, and it is also a security boundary: permissions and retention are set on it.
For now, create one and send it a file.


## Create the feed

In the explorer tree, right-click a folder and create a new **Feed**.
Call it `TEST-EVENTS`.

Feed names are conventionally upper case with hyphens, because they normalise that way: Stroom upper-cases them and replaces characters it does not allow.
Two names that differ only in punctuation can end up as the same feed, so pick deliberately.
See [Choosing a feed]({{< relref "../guides/sending-data/choosing-a-feed.md" >}}).

On the feed's **Settings** tab, leave the defaults.
Check that **Feed Status** is `Receive`.


## Send it something

Make a small CSV file:

```bash
cat > sample.csv <<'EOF'
time,user,action,ip
2026-10-13T09:15:00.000Z,alice,login,192.168.1.10
2026-10-13T09:15:04.000Z,bob,login,192.168.1.11
2026-10-13T09:16:22.000Z,alice,download,192.168.1.10
EOF
```

Post it:

```bash
curl -k -v -X POST "https://localhost/stroom/datafeed" \
  -H "Feed: TEST-EVENTS" \
  -H "Type: Raw Events" \
  -H "Compression: NONE" \
  --data-binary @sample.csv
```

`-k` accepts the stack's self-signed certificate.
`-v` shows you the response headers, which is the point of this step as much as the data is.

{{< timing mode="immediate" >}}
Receipt is synchronous.
By the time `curl` returns `200`, the data is stored and a [stream]({{< relref "../concepts/streams.md" >}}) exists.
You can look for it straight away.
{{< /timing >}}

{{< verify >}}
Look at two things, in this order.

**The response.**
A `200`, and a `ReceiptId` header.
That is Stroom saying it has the data.

**The stream.**
Open the feed and go to its **Data** tab.
A stream should be listed, of type `Raw Events`, created just now.

{{< golden >}}
**A stream on the feed's Data tab.**

Nothing else proves receipt.
A `200` on its own does not, as the trap below explains.
{{< /golden >}}

{{< not-proof >}}
**A `200` is not proof the data was kept.**
A feed set to [`Drop`]({{< relref "../concepts/data-receipt.md#feed-status" >}}) returns `200` and discards what you sent.

**An empty Data tab may be the filter, not the data.**
The tab defaults to a time range; widen it before concluding the stream is absent.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**If you gzip the file, you must say so in the `Compression` header.**

Stroom chooses its decompressor from `Compression` and ignores `Content-Encoding` entirely.
Send gzipped bytes without the header and the post succeeds, the data is stored as-is, and nothing complains until something tries to parse it.

It is worth doing once deliberately, so you recognise it later.
See [The datafeed contract]({{< relref "../reference/the-datafeed-contract.md" >}}).
{{< /trap >}}

{{< diagnose >}}
1. **What did `curl -v` print?**
   The HTTP status, plus `Stroom-Status` and `Stroom-Error` (see [Datafeed response codes]({{< relref "../reference/response-codes.md" >}})) when something is wrong.
   Those two usually name the problem outright.
1. **Does the feed name match exactly?**
   `406` with a status of `100` or `101` means no feed header, or no such feed.
   Feed names are exact.
1. **Is the feed set to receive?**
   Check Feed Status on the Settings tab.
1. **Did you save the feed?**
   A newly created document is not saved until you save it, and an unsaved feed does not exist as far as the datafeed endpoint is concerned.
1. **Is the time filter hiding it?**
   Widen the range on the Data tab.
{{< /diagnose >}}


## Next

You have raw data.
It is still exactly the CSV you sent, which is not yet something you can search.
Next, [turn it into events]({{< relref "your-first-translation.md" >}}).

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

In the explorer tree, right-click a folder and choose **New > Data Processing > Feed**.
Call it `TEST-EVENTS`.

Feed names must be upper case letters, digits, hyphens and underscores, at least three characters long.
Stroom does not convert a name for you: the dialog rejects anything else, such as `test-events`, with an `Invalid name` message.
The `Feed` header on a post is matched exactly too, so a sender that writes `test-events` does not reach `TEST-EVENTS`.
See [Choosing a feed]({{< relref "../guides/sending-data/choosing-a-feed.md" >}}).

The feed exists as soon as the dialog closes, and can receive data straight away.
On the feed's **Settings** tab, leave the defaults.
Check that **Feed Status** is `Receive`.


## Get an API key

By default Stroom only accepts data from a sender it can identify, by an API key or a client certificate.
A post with neither is refused with `401`.

From the main menu choose **Security > Manage API Keys**, and create a key for your own user.
The new key is shown once, in the dialog that creates it.
Copy it then: you cannot view it again afterwards.
See [API keys]({{< relref "../guides/automation/api-keys.md" >}}).

If your stack has been configured with `receive.authenticationRequired` set to `false`, you do not need a key and can leave out the `Authorization` header below.


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
  -H "Authorization: Bearer <your API key>" \
  -H "Feed: TEST-EVENTS" \
  -H "Type: Raw Events" \
  -H "Compression: NONE" \
  --data-binary @sample.csv
```

`-k` accepts the stack's self-signed certificate.
`-v` shows you the response headers, which is the point of this step as much as the data is.
Replace `<your API key>` with the key you copied.

{{< timing mode="immediate" >}}
Receipt is synchronous.
By the time `curl` returns `200`, the data is stored and a [stream]({{< relref "../concepts/streams/_index.md" >}}) exists.
You can look for it straight away.
{{< /timing >}}

{{< verify >}}
Look at two things, in this order.

**The response.**
A `200`, with a receipt id as the response body, such as `1791979698715_0000_S_node1a`.
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
**If you gzip the file, you must say so in a header.**

Stroom chooses its decompressor from `Compression`.
Send gzipped bytes without it and the post succeeds, the data is stored as-is, and nothing complains, even when a pipeline reads it.
(`Content-Encoding: gzip` also works, because the web server decodes it before Stroom sees the data, but use one header or the other, never both.)

It is worth doing once deliberately, so you recognise it later.
See [The datafeed contract]({{< relref "../reference/the-datafeed-contract.md" >}}).
{{< /trap >}}

{{< diagnose >}}
1. **What did `curl -v` print?**
   The HTTP status, plus `Stroom-Status` and `Stroom-Error` (see [Datafeed response codes]({{< relref "../reference/response-codes.md" >}})) when something is wrong.
   Those two usually name the problem outright.
1. **Is it a `401`?**
   `Stroom-Status` `302`, `Client token or certificate required`, means the post carried no credentials.
   Check the `Authorization` header is present and the API key is the one you copied, and that the key is enabled and has not expired.
1. **Does the feed name match exactly?**
   `406` with a status of `100`, `Feed must be specified`, means there was no `Feed` header.
   `406` with a status of `110` means no feed of that name is set to receive, which is also what a misspelt or lower-case name gives you.
   Feed names are exact, including case.
1. **Is the feed set to receive?**
   Check Feed Status on the Settings tab.
   A feed set to `Reject` gives the same `406` and `110` as a feed that does not exist.
1. **Is the time filter hiding it?**
   Widen the range on the Data tab.
{{< /diagnose >}}


## Next

You have raw data.
It is still exactly the CSV you sent, which is not yet something you can search.
Next, [turn it into events]({{< relref "your-first-translation.md" >}}).

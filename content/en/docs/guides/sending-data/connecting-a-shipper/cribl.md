---
title: "Cribl Stream"
linkTitle: "Cribl Stream"
weight: 80
date: 2026-10-14
tags:
description: >
  Using the Webhook destination, and the two near-identical destination types that will not work.
pageKind: guide
verification: required
thirdParty: "Cribl Stream"
---

Cribl Stream can post to the datafeed endpoint through its generic HTTP destination.
It is common in large estates already running it as a routing layer, and where it is deployed this adds no infrastructure.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.


## Pick the right destination type

Use the **Webhook** destination.
It is Cribl's generic HTTP destination.

{{< trap severity="silent" >}}
**Two near-identical names in the catalogue are the wrong thing.**

* **`Cribl HTTP`** is not a generic HTTP destination.
  It sends to a Cribl HTTP **Source**, which is to say Cribl-to-Cribl only.
  It will not talk to Stroom.
* **`HTTP/S (Bulk API)`** is a **source**, not a destination.
  If you are browsing a combined list, it is the wrong half of it.

Picking either costs an afternoon, because both look right in a list.
{{< /trap >}}


## Configuring the webhook destination

Under **Manage → Destinations → Add Destination → Webhook**:

| Field | Value |
|---|---|
| Endpoint URL | `https://stroom.example.com/<base>/datafeed` |
| Method | `POST` |
| Format | Match how upstream data is shaped; NDJSON is usually easiest for a pipeline to parse |
| Extra HTTP headers | `Feed: CRIBL_EVENTS`, `Type: Events`, `Compression: NONE` |
| Auth | Bearer token, from Cribl's secret store |


## Authentication

Store the data feed key in Cribl's **secrets** store and reference it from the destination's auth configuration, rather than typing it into the extra-headers field.
Header fields are visible to anyone with configuration read access, and they are included in configuration exports.


## Batch shape

The destination's format setting controls the body: NDJSON, a JSON array, or raw.
Whichever you choose, the receiving pipeline's [parser]({{< relref "../../../concepts/translation.md" >}}) has to match.


## Compression

If you enable the destination's compression, set the `Compression` header to `GZIP` to match.
Cribl sets `Content-Encoding`, which Stroom ignores, and the failure is silent.


## Persistent queues

Enable **Persistent Queues** on the destination.
Without them, buffering is in memory only, and a worker restart during a Stroom outage loses events.


## Several feeds

One destination sends to one feed.
Split with Cribl **Routes**: match on source or event content and send each subset to its own Webhook destination.
That is the cleanest way to keep the feed set small and explicit.

A pipeline `eval` function can set a field that the destination's header references, if you must derive the feed dynamically.
Read [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}) first.

{{< timing mode="immediate" >}}
Posting is synchronous, subject to the destination's batching.
With persistent queues, delivery during an outage is deferred rather than lost.
{{< /timing >}}

{{< verify >}}
Use Cribl's **Live Data** capture on the destination to see the exact outbound request, headers included, before committing the route to production.
Then confirm the stream is on the feed in Stroom.

{{< golden >}}
**Live Data shows the headers you expect, and the stream appears on the feed.**

The capture is the fastest way to catch a header that is missing or misspelled, which is otherwise invisible until Stroom rejects it.
{{< /golden >}}

{{< not-proof >}}
**A destination reporting healthy is not proof of delivery.**
It reports Cribl's view of the connection.

**Live Data showing a request is not proof it was accepted.**
Check the response, then check Stroom.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove the endpoint without Cribl.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Is it actually a Webhook destination?**
   See the trap above before anything else.
1. **What does Live Data show?**
   The outbound request, with headers.
   Most problems on this page are visible there.
1. **What do the destination metrics say?**
   Delivery errors and queue depth are the two signals to alert on.
1. **Is the stream present but unreadable?**
   Check the destination's compression against the `Compression` header.
1. **Check field names against your installed version.**
   Cribl's UI and destination catalogue change across major releases, and this page is written from the documentation rather than from a run.
{{< /diagnose >}}

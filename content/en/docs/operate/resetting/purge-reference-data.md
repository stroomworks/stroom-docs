---
title: "Purge Reference Data"
linkTitle: "Purge Reference Data"
weight: 50
date: 2026-10-14
tags:
description: >
  How reference data is retained, when stale lookups need a purge, and what that costs.
pageKind: operate
verification: required
---

[Reference data]({{< relref "../../concepts/pipeline-reference-data.md" >}}) is loaded from reference streams into an off-heap store, and [lookups]({{< relref "../../reference/xslt-functions/reference-data.md" >}}) are served from there rather than from the streams.
The store is a cache in the sense that it can be rebuilt, but it is not cleared by clearing caches: it has its own retention and its own purge.

Stale lookups are the symptom.
A reference feed has been updated, or a bad load has been corrected, and lookups still return the old values.


## How retention works

Entries are purged by age.
The controlling setting is `purgeAge`, in ISO-8601 duration form, and it defaults to **30 days**.
The [job]({{< relref "../../reference/jobs.md" >}}) that applies it is **`Ref Data Off-heap Store Purge`**.

Two consequences worth holding on to:

* Data older than `purgeAge` goes whether or not anything still refers to it.
  If lookups need to reach back further than `purgeAge`, raise it rather than discovering the gap later.
* The purge is a scheduled job.
  If it is disabled, nothing is purged and the store grows until it hits its size limit.


## The procedure

1. **Fix the reference data itself.**
   Correct the reference feed and reload it.
   Purging a store that will be repopulated from the same bad source achieves nothing.
1. **Check the purge job is enabled**, and what `purgeAge` is set to.
1. **Run the purge**, or wait for the scheduled run if the timing suits.
1. **Re-run the lookup.**
   The next lookup reloads what it needs from the reference streams.


## Purging one stream

The scheduled job purges by age.
To remove one reference stream's entries now, call the API: `DELETE /refData/v1/purgeByStream/{refStreamId}`, which you can also reach from **Help** → **API Specification**.

Find the stream id on the feed's **Data** tab: select the stream, then read **Stream Id** from the **Info** tab in the lower pane.

The optional `nodeName` query parameter restricts the purge to one node.
**Leave it unset to purge every node**, which is almost always what you want, since the store is per node.


## When the loader's XSLT has changed

Changing a reference loader's XSLT does not change data already in the store, and purging alone is not enough either: Stroom caches the compiled stylesheet.

1. **Purge the stream**, as above.
1. **Clear the XSLT Pool cache** under **Monitoring** → **Caches**, or the reload will re-run the *old* compiled stylesheet and appear to change nothing.
   Clearing **Reference Data - Effective Stream Cache** as well makes Stroom re-evaluate which streams are available.
   See [Clear caches]({{< relref "clear-caches.md" >}}).
1. **Perform a lookup.**
   The reload is lazy, so nothing reloads until something asks.

If the reference data is loaded by a processor filter rather than on demand, delete the old processing tasks as well, or the filter will not re-run.

{{< timing mode="async" >}}
The purge is a background job over a potentially large store, and it commits in batches.
On a big store expect it to take a while, and expect lookups during that period to be slower than usual.

Reloading afterwards is lazy: the store repopulates when something asks for a value, not when the purge finishes.
{{< /timing >}}

{{< verify >}}
Run a lookup that was returning a stale value, with an event time in the range you care about, and confirm it returns the corrected value.

{{< golden >}}
**A lookup that was stale now returns the corrected value, for an event at the right time.**

Reference lookups are resolved against the effective time of the event being processed, not the time you run the test, so a lookup that is right "now" can still be wrong for the data you actually process.
Test at a time that matters.
{{< /golden >}}

{{< not-proof >}}
**A smaller store is not proof the stale entries went.**
It proves some entries went.

**A correct lookup in the [Stepper]({{< relref "../../concepts/pipeline-debugging.md" >}}) on one record is not proof across the feed**, if several reference streams overlap in their effective times.
The one that wins is the latest whose effective time is not after the event.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="destructive" >}}
**Purging deletes entries that may be the only loaded copy of data you still need.**

The store rebuilds from reference streams.
If the reference stream a purged entry came from has itself been deleted by [data retention]({{< relref "../../concepts/streams/_index.md#data-retention" >}}), the entry does not come back and lookups for that period fail quietly, returning nothing rather than an error.

Check that the reference streams still exist before purging aggressively, and treat reference feeds as data to retain for at least as long as the events that look them up.
{{< /trap >}}

{{< diagnose >}}
1. **Is the reference data itself correct now?**
   Read the reference stream.
   Most "stale lookup" reports are a reference feed that was never actually fixed.
1. **Does the effective time overlap the events?**
   Lookups select the reference stream whose effective time is the latest not after the event.
   A corrected stream with an effective time of today does not fix events from last week.
1. **Is the purge job enabled?**
   If it is off, nothing is being purged on any schedule.
1. **Is the store full?**
   A store at its size limit stops accepting new entries, so a corrected reference feed may have loaded nothing at all.
   Check the size against its limit.
1. **Is the `<map>` name right?**
   A reference load writes into a named map.
   If the name in the XSLT does not match what the lookup asks for, nothing is stale: nothing was ever there.
1. **Does the lookup report a loader state of `NEW`?**
   An error naming `Current loader state: NEW` means the reference pipeline failed to start, not that the lookup is wrong.
   Look for a syntax error in its XSLT, a missing parser or {{< pipe-elm "ReferenceDataFilter" >}}, or a user without **Use** permission on the pipeline or feed.
{{< /diagnose >}}

---
title: "Reset an Index"
linkTitle: "Reset an Index"
weight: 30
date: 2026-10-14
tags:
description: >
  How to rebuild a Lucene index from source, what it costs, and when you have no other option.
pageKind: operate
verification: required
---

An [index]({{< relref "../../concepts/lucene-index.md" >}}) is **derived data**.
Everything in it came from streams in the data store, which means it can be rebuilt as long as those streams are still there.
That is what makes resetting an index a recoverable operation rather than a loss.

It is also why [data retention]({{< relref "../../concepts/streams/_index.md#data-retention" >}}) policy and index resets are the same conversation.
If the source streams have been deleted, the index is the only copy, and this page does not apply: you are not resetting it, you are destroying it.


## When you have to

Some index changes cannot be applied to data already written:

* **A field's type changed.**
  Existing shards hold the old type.
  Searches on that field return wrong or empty results.
* **A field was added to a static index after the data went in.**
  The old documents do not have it, and no amount of waiting adds it.
* **A shard is `CORRUPT`.**
  It cannot be read and will not recover.
* **The index never had a [volume group]({{< relref "../../concepts/volumes.md" >}})**, so nothing was ever written.
  Strictly this is not a reset, since there is nothing to clear, but the recovery is the same: fix the index and reprocess.


## The procedure

1. **Confirm the source data still exists.**
   Find the streams that fed the index and check they are present and `UNLOCKED`, not deleted.
   Do this first.
   Everything below assumes it.
1. **Fix whatever made the reset necessary**: the field type, the missing field, the volume group.
   Resetting before fixing means doing it twice.
1. **Delete the index shards.**
   This marks them `DELETED`; the `Index Shard Delete` [job]({{< relref "../../reference/jobs.md" >}}) removes the files on its next run.
1. **Leave the old output streams alone.**
   If you reprocess from raw, Stroom replaces the output streams itself and the new ones are indexed once.
   Deleting shards in step 3 is what stops every event being indexed twice.
1. **Reprocess.**
   See [Reprocess data]({{< relref "reprocess-data.md" >}}).
   Until you do, the index is empty and searches return nothing.

{{< timing mode="async" >}}
Step 3 is quick to request and not immediate to take effect: the shard files go when the `Index Shard Delete` job next runs.

Step 5 is a full reprocess, so it takes as long as the original load did: **hours for a large index**, and it competes with live processing for the same task queue.
Plan it like a batch job, not a fix.
{{< /timing >}}

{{< verify >}}
After reprocessing, open the index, go to its **Shards** tab and select refresh.
The list is empty until you do.
Add up the **Doc Count** of the shards and compare it against what you expect.

The number should be close to the number of events in the source streams.
**Doc Count** only includes documents that have been committed, so a shard still being written to can lag behind.
Not exactly equal, necessarily, since a translation may drop or combine records, but of the right order.
Then run a real query that was wrong before and confirm it is now right.

{{< golden >}}
**A query that was broken before the reset now returns the correct rows.**

The count tells you documents exist.
The query that originally sent you here is the only thing that tells you the reset achieved what it was for.
{{< /golden >}}

{{< not-proof >}}
**An empty index immediately after deleting the shards is not success.**
It is the halfway point.
The reset is not finished until reprocessing has rebuilt it.

**Shards existing again is not proof the data is back.**
New shards are created before documents are written into them.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="destructive" >}}
**If the source streams are gone, resetting the index destroys the data.**

Stroom's data retention can delete the streams an index was built from.
Where that has happened, the index is not derived data any more: it is the only remaining copy, and deleting its shards is a permanent loss with no rebuild path.

Check retention before you delete anything.
"We can always reindex" is true right up to the point where it quietly stops being true.
{{< /trap >}}

{{< trap severity="silent" >}}
**Reprocessing without deleting the old index shards indexes everything twice.**

Nothing prevents it and nothing warns about it.
The index fills with duplicate documents, counts come out roughly double, and dashboards aggregate wrongly.
It is easy to miss because the system looks like it is working.

Stroom replaces old output streams when it reprocesses, but it does not remove documents already in the index.
Delete the shards first, as in step 3.
{{< /trap >}}

{{< diagnose >}}
1. **Is the shards' document count still zero well after reprocessing started?**
   Check for `Error` streams on the feed before anything else.
   A missing volume group fails here, and only here.
1. **Did reprocessing actually run?**
   Look at the processor filter's tracker and for new `Events` streams.
   A reprocess that was never picked up looks identical to one that produced nothing.
1. **Are the shards still `DELETED` rather than gone?**
   The `Index Shard Delete` job has to run.
   If it is disabled, old shards linger and can still be searched, which looks like the reset failing to take effect.
1. **Is the count roughly double what you expect?**
   The old shards were still there when you reprocessed.
   See the trap above.
1. **Are searches still wrong on one field?**
   See also [Index problems]({{< relref "../troubleshooting/index-problems.md" >}}).
   If the field type change did not take, the index document may have been changed after the shards were deleted but before reprocessing, or not saved at all.
   Check the index's field definitions, then reset again.
{{< /diagnose >}}


## Avoiding the next one

Index field types are effectively immutable once data is written, so they are worth deciding deliberately rather than discovering.
Two habits help:

**Load a representative sample first**, query it, and confirm the field types behave the way you need before loading history.

**Prefer a dynamic index** where the shape of the data is genuinely unknown.
It costs control over types and risks field sprawl, but it does not require a reset every time the source adds a field.

---
title: "Reset a Plan B Store"
linkTitle: "Reset a Plan B Store"
weight: 60
date: 2026-10-14
tags:
description: >
  What can safely be changed on a populated Plan B store, what cannot, and why the difference matters more here than anywhere else.
pageKind: operate
verification: required
---

[Plan B]({{< relref "../../concepts/planb.md" >}}) stores hold state, and unlike an index they are not always derived data you can rebuild.
Whether a reset is recoverable depends entirely on whether the data that populated the store still exists somewhere else.

Read this page before changing a Plan B store's settings, not after.
The distinction between the settings you can change and the ones you cannot is the single most important thing about operating these stores.

{{< trap severity="immutable" >}}
**The state type and the key and value schemas cannot be changed once a store holds data.**

Changing them on a populated store does not migrate anything.
It corrupts the store or raises a schema version mismatch, and the only route out is to delete and recreate the document, **which clears everything in it**.

These are create-time decisions.
Pin them deliberately, and treat a request to change one on a live store as a rebuild to be planned rather than a setting to be edited.

Safe to change on a live store: maximum store size (increase only), retention, overwrite behaviour, and snapshot settings.
{{< /trap >}}


## When a reset is actually needed

* **The schema or state type is wrong**, and the store is populated.
  There is no other option.
* **The store is full.**
  Often this is not a reset: raising the maximum store size may be enough, and it is safe.
  Reset only if the content is also wrong.
* **The content is wrong** because the ingest pipeline was wrong.
  If the source streams still exist, this is recoverable: clear and reload.


## The procedure

1. **Establish whether the source data still exists.**
   Plan B stores are populated by a pipeline from streams.
   If those streams are gone, the store is the only copy and deleting it is permanent.
1. **Fix the ingest pipeline**, if that is what put the wrong data there.
1. **Delete and recreate the document**, with the correct state type and schemas.
   The name matters: it is the store key, it must match the `<map>` element the ingest XSLT writes, and it must be lower case, digits and underscores only.
1. **Reload** by [reprocessing]({{< relref "reprocess-data.md" >}}) the source streams.

{{< timing mode="async" >}}
Reloading is ordinary processing: **minutes to hours** by volume.

There is a second stage after that.
Data written to a Plan B store moves through a merge and housekeeping cycle run by [background jobs]({{< relref "../../reference/jobs.md" >}}), so a value can be ingested and not yet queryable.
The jobs are **`Plan B Merge Processor`**, **`Plan B Maintenance Processor`**, **`Plan B Snapshot Creator`** and **`Plan B Snapshot Cleanup`**, with **`Plan B Shared FS Merge`** and **`Plan B Shared FS Housekeeping`** where shared storage is used.
If any of them are disabled, data arrives and never becomes visible.
{{< /timing >}}

{{< verify >}}
Query the store and retrieve a key you know should be there, at a time you know it should be effective.

{{< golden >}}
**A known key returns its expected value at a known effective time.**

Plan B stores are temporal: asking for the right key at the wrong time returns nothing, and looks identical to a store that is empty.
Always test with a time you have reasoned about.
{{< /golden >}}

{{< not-proof >}}
**The document existing and being configured proves nothing about its contents.**
A freshly recreated store is correct in every visible respect and completely empty.

**A successful ingest run is not proof the data is queryable yet.**
It is written, then merged.
Until the merge job runs it is not visible to queries.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Renaming the document makes the existing data unreachable.**

The store's name is its key.
An ingest XSLT addresses it by name through its `<map>` element, and queries resolve it by name.
Rename the document and ingest writes to a store that does not exist while queries read one that is empty, with no error on either side.

If you must rename, change the XSLT and every query in the same change.
{{< /trap >}}

{{< diagnose >}}
1. **Is the data arriving at the store at all?**
   See also [Plan B problems]({{< relref "../troubleshooting/plan-b-problems.md" >}}).
   Check for `Error` streams on the feed first, then confirm the ingest pipeline's `<map>` name exactly matches the document name.
1. **Are the Plan B jobs enabled?**
   If the merge job is off, data accumulates and never becomes queryable.
   This looks exactly like ingest not working.
1. **Is the store full?**
   A store at its maximum size stops accepting writes.
   The application log says so explicitly, naming the store and the percentage used.
1. **Are you querying at the right time?**
   A temporal store returns the version effective at the instant you ask about.
   Try a time you know is covered.
1. **Is it a schema mismatch?**
   If the store was changed after it held data, expect a schema version mismatch rather than silence.
   That is the one case with no fix but delete and recreate.
1. **Check the application log** for `Plan B` and `LMDB`.
   Disk full, permission denied on the store path, and failures uploading to storage nodes all surface there and nowhere else.
{{< /diagnose >}}

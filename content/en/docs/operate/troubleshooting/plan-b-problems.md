---
title: "Plan B Problems"
linkTitle: "Plan B Problems"
weight: 20
date: 2026-10-14
tags:
description: >
  Why a state store returns nothing, stops accepting writes, or refuses to open, and what each case needs.
pageKind: operate
verification: required
---

[Plan B]({{< relref "../../concepts/planb.md" >}}) stores fail in ways that look like nothing happening.
A lookup returns no value, which is indistinguishable from a key that was never written; ingest succeeds but the data is not queryable yet; a store quietly stops accepting writes when it fills.

This page covers the store itself.
For clearing one out, see [Reset a Plan B store]({{< relref "../resetting/reset-a-plan-b-store.md" >}}).


## How data actually gets into a store

Knowing the path matters, because data can be stalled at any point on it and the symptom is the same in every case: queries return nothing.

Data written by a [`PlanBFilter`]({{< relref "../../reference/pipeline-elements.md#planbfilter" >}}) lands in a **writer** directory, and is then moved along a sequence of directories under the configured Plan B path:

```text
writer/ → receive/ → staging/ → merging/ → shards/
```

`shards/` is the queryable form.
Clients hold `snapshots/`, which are copies taken from the shards.

The moves are done by [background jobs]({{< relref "../../reference/jobs.md" >}}), not by the pipeline.
**If those jobs are disabled, data never becomes visible**: it accumulates in the earlier directories, with no error anywhere.

| Job | What stops without it |
|---|---|
| `Plan B Merge Processor` | Staged data never reaches the shards, so nothing is queryable |
| `Plan B Maintenance Processor` | Retention and condensing never run, so the store grows |
| `Plan B Snapshot Creator` | Clients never get a current snapshot |
| `Plan B Snapshot Cleanup` | Old snapshots are never removed |
| `Plan B Shared FS Merge`, `Plan B Shared FS Housekeeping` | The equivalents where shared storage is used |

{{< timing mode="async" >}}
Ingest and visibility are separate events.
A value can be written by a pipeline and not be queryable for as long as it takes the merge job to run.

So a query returning nothing immediately after processing is **not evidence of failure**.
Give the merge cycle time before concluding anything.
{{< /timing >}}

{{< verify >}}
Query the store for a key you know was written, at an effective time you know it covers.

{{< golden >}}
**A known key returns its expected value at a known effective time.**

Both halves matter.
Plan B stores are temporal: the right key at the wrong time returns nothing and looks exactly like an empty store.
{{< /golden >}}

{{< not-proof >}}
**Data in the writer or staging directories is not queryable data.**
Seeing files on disk proves ingest worked, not that the merge did.

**An ingest run with no errors does not mean the store has the values.**
The `<map>` name could be wrong, in which case the data was written to a store that does not exist, which is not an error.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A full store stops accepting writes and keeps running.**

When a store reaches its maximum size it refuses further writes.
The application log says so explicitly, naming the store, the usage and the percentage, and recommending the max be raised.
Nothing on a screen tells you, and the pipeline writing to it does not fail.

The result is a store frozen at a moment in time, serving increasingly stale answers.
Raising `maxStoreSize` is safe on a live store and is usually the right fix.
{{< /trap >}}

{{< trap severity="immutable" >}}
**A schema version mismatch cannot be repaired in place.**

If a store's state type or key or value schema was changed after it held data, opening it raises a schema version mismatch.
There is no migration: the only route out is to delete and recreate the document, which clears it.

See [Reset a Plan B store]({{< relref "../resetting/reset-a-plan-b-store.md" >}}), and pin these at create time so it does not happen again.
{{< /trap >}}

{{< diagnose >}}
1. **Does the `<map>` name match the document name exactly?**
   The ingest XSLT writes to a named map, and the name is the store's key.
   A mismatch writes nowhere, silently, and is the single most common cause.
   Names are lower case, digits and underscores only.
1. **Are the Plan B jobs enabled?**
   Check `Plan B Merge Processor` first.
   Data that never merges is data that never appears.
1. **Are you querying at a time the data covers?**
   Try an effective time you know is within range before assuming the store is empty.
1. **Is the store full?**
   Search the application log for the store's name.
   The full message is explicit and names the percentage used.
1. **Are there `Error` streams on the feed?**
   Ingest failures appear there rather than in the store.
1. **Is there a schema version mismatch in the log?**
   If so, see the trap above: nothing else will fix it.
1. **Check the application log for `Plan B` and `LMDB`.**
   Disk full, permission denied on the store path, and failures uploading to storage nodes surface there and nowhere else.
   See [Reading the logs]({{< relref "reading-the-logs.md" >}}).
{{< /diagnose >}}

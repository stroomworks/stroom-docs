---
title: "Is Search Working?"
linkTitle: "Is Search Working?"
weight: 40
date: 2026-10-14
tags:
description: >
  How to tell whether an index actually holds your data, and why a search can return nothing when everything looks configured.
pageKind: operate
verification: required
---

A search that returns nothing is ambiguous.
It can mean there is no matching data, or that the data was never indexed, or that it was indexed but the search cannot read it back.
Those have different fixes, and the screens look much the same in all three cases.

This page is about telling them apart.
It assumes data is arriving and processing.
If you have not confirmed that, start at [Is data processing?]({{< relref "is-data-processing.md" >}}), because an empty index is the expected result of a pipeline that produced nothing.

{{< timing mode="async" >}}
Indexing happens as part of processing, so it inherits its latency: **minutes to hours** on real volumes.

There is a second delay after that.
Documents are written to an [index]({{< relref "../../concepts/lucene-index.md" >}}) **shard**, and a shard is not searchable until its writer flushes.
The `Index Writer Flush` [job]({{< relref "../../reference/jobs.md" >}}) does that on a schedule, so data can be indexed and still not findable for a short while.
{{< /timing >}}

{{< verify >}}
Query the index for a count with [StroomQL]({{< relref "../../reference/stroom-query-language.md" >}}).
Nothing else answers the question:

```text
from "MY_INDEX" select count()
```

A number greater than zero means documents are in there and the search path can read them.
That is the whole claim.

{{< golden >}}
**`select count()` returns a non-zero number, and the feed has no `Error` streams.**

The two together.
The count proves documents exist and are queryable; the absence of error streams proves the indexing filter did not fail on the way.
Either alone can mislead.
{{< /golden >}}

{{< not-proof >}}
**The index's field list does not prove anything was indexed.**
It is the registry of fields the index *can* hold, and it is populated from the index's configuration, not from its contents.
It shows a full, healthy-looking list of fields when zero documents have been written.
This is the single most common way people conclude indexing worked when it did not.

**A shard existing does not mean it holds your data.**
Shards are created ahead of the documents that go in them.

**A [dashboard]({{< relref "../../concepts/dashboards.md" >}}) showing rows does not prove the index is complete.**
It proves the rows it found exist.
Compare the count against the number of events you expect.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**An index with no volume group indexes nothing, and says so only in an error stream.**

A Lucene index needs a `volumeGroupName` telling it which [volumes]({{< relref "../../concepts/volumes.md" >}}) to write shards to.
Without one, the index document still looks correct, its fields are listed, the pipeline runs, and the indexing filter fails at processing time with `Index volume group name must be specified`.

The only visible sign is an **`Error`** stream on the feed.
The index reports zero documents and no explanation.
If an index has never held anything, check this first.
{{< /trap >}}

{{< trap severity="immutable" >}}
**Changing a field's type makes the existing shards incompatible.**

Field types are fixed at the point data is written.
Changing one, say from Text to Date, does not migrate what is already there: the old shards hold data in the old shape and the search gives wrong or empty results for that field.

The fix is to reset the index and re-index from source, which means the data has to still be in the stream store.
Decide field types before you load data, not after.
{{< /trap >}}

{{< diagnose >}}
1. **Does `select count()` return zero, or does the query fail?**
   A failure is a different problem: the data source cannot be resolved, or the query is invalid.
   Validate the query first and fix that before going further.
1. **Are there `Error` streams on the feed?**
   Read one.
   The volume group failure above appears only here, and so do most other indexing failures.
1. **Did the pipeline produce output at all?**
   If there are no `Events` streams, this is a processing problem, not a search one.
   Go to [Is data processing?]({{< relref "is-data-processing.md" >}}).
1. **Is the indexing filter actually in the pipeline, and pointed at this index?**
   An indexing filter whose index property is empty or points elsewhere runs without complaint.
1. **Does the XSLT output match what the filter expects?**
   A static index needs `records:2`; a dynamic one needs `index-documents:1`.
   The wrong namespace produces a valid, empty result and an empty index.
1. **Are fields present in the data but missing from the index?**
   A static index **silently ignores** any field it has not been told about.
   Either define the field or use dynamic indexing.
1. **Does the search find documents but show nothing useful?**
   That is extraction, not indexing.
   The index needs a **Default Extraction Pipeline** to fetch anything beyond its stored fields, and extraction needs `StreamId` and `EventId` in the index to find its way back to the source event.
   Those are normally added for you, by an [`IdEnrichmentFilter`]({{< relref "../../reference/pipeline-elements.md#idenrichmentfilter" >}}) running before the indexing filter.
1. **Is it just not flushed yet?**
   If the count is zero moments after processing finished, wait for `Index Writer Flush` and ask again.
{{< /diagnose >}}


## When the shards themselves are wrong

Each shard carries a status.
Most are unremarkable; one is not.

| Status | Meaning |
|---|---|
| `NEW` | Created, not yet opened. |
| `OPENING`, `OPEN` | In use, being written to. |
| `CLOSING`, `CLOSED` | Not being written to. Normal for a finished shard. |
| `DELETED` | Marked for deletion. The `Index Shard Delete` job removes it. |
| `CORRUPT` | **The shard cannot be read.** Its documents are unsearchable. |

A `CORRUPT` shard does not heal.
The data in it has to be re-indexed from the source streams, which is why keeping raw data matters.
See [Reset an index]({{< relref "../resetting/reset-an-index.md" >}}).

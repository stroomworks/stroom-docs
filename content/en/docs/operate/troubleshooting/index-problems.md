---
title: "Index Problems"
linkTitle: "Index Problems"
weight: 10
date: 2026-10-14
tags:
description: >
  Shard states, fields that are silently ignored, and the configuration mistake that indexes nothing at all.
pageKind: operate
verification: required
---

An [index]({{< relref "../../concepts/lucene-index.md" >}}) can be empty, incomplete, or wrong on one field, and all three look similar from a [dashboard]({{< relref "../../concepts/dashboards.md" >}}).
This page is about the index itself.
If the question is simply "is search working", start at [Is search working?]({{< relref "../checking-it-works/is-search-working.md" >}}).


## Shard states

Documents are written into **shards**.
Each has a status, and only one of them is a problem:

| Status | Meaning |
|---|---|
| `NEW` | Created, not yet opened. |
| `OPENING`, `OPEN` | In use, being written to. |
| `CLOSING`, `CLOSED` | Not being written to. Normal for a finished shard. |
| `DELETED` | Marked for deletion; the `Index Shard Delete` [job]({{< relref "../../reference/jobs.md" >}}) removes the files. |
| `CORRUPT` | **Unreadable. Its documents cannot be searched.** |

A `CORRUPT` shard does not recover.
The documents in it have to be rebuilt from the source streams, which is only possible while those streams still exist.
See [Reset an index]({{< relref "../resetting/reset-an-index.md" >}}).

{{< timing mode="async" >}}
Indexing follows processing, so it inherits its latency.

Then a shard is not searchable until its writer flushes, which the `Index Writer Flush` job does on a schedule.
Data can be indexed and not yet findable, briefly.
{{< /timing >}}

{{< verify >}}

```text
from "MY_INDEX" select count()
```

A non-zero count, and no `Error` streams on the feed.

{{< golden >}}
**A count greater than zero, with no `Error` streams.**

The count proves documents are readable; the absence of errors proves the indexing filter did not fail on the way.
Either alone can mislead.
{{< /golden >}}

{{< not-proof >}}
**The field list proves nothing about contents.**
It is the registry of fields the index can hold, populated from configuration, and it looks complete and healthy when zero documents have been written.
This is the most common way people conclude indexing worked when it did not.

**Shards existing proves nothing either.**
They are created before documents go into them.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**An index with no volume group indexes nothing.**

A Lucene index needs a [volume group]({{< relref "../../concepts/volumes.md" >}}) naming the volumes its shards are written to.
Without one the index document looks entirely correct, the field list is populated, the pipeline runs, and the indexing filter fails at processing time with `Index volume group name must be specified`.

The only sign is an `Error` stream on the feed.
The index reports zero documents and offers no explanation.
If an index has never held anything, check this before anything else.
{{< /trap >}}

{{< trap severity="silent" >}}
**A static index silently ignores fields it has not been told about.**

Send a field that is not defined in the index and it is dropped.
No error, no warning, no entry in a log.
The index is smaller than you expect and searches on that field return nothing, as though the data never had it.

Either define every field you intend to search, or use a dynamic index, which creates fields from the incoming data at the cost of control over their types.
{{< /trap >}}

{{< diagnose >}}
1. **Is the count zero, or does the query fail outright?**
   A failure means the data source cannot be resolved or the query is invalid: a different problem, and one to fix first.
1. **Are there `Error` streams?**
   Read one.
   The volume group failure appears only here.
1. **Did processing produce output at all?**
   No `Events` streams means this is a processing problem.
   See [Is data processing?]({{< relref "../checking-it-works/is-data-processing.md" >}}).
1. **Is the indexing filter in the pipeline and pointed at this index?**
   A filter whose index property is empty runs without complaint and indexes nothing.
1. **Does the XSLT output match what the filter consumes?**
   Static indexing needs `records:2`; dynamic needs `index-documents:1`.
   The wrong namespace produces valid, empty output.
1. **Is one field wrong rather than all of them?**
   That is usually a type change applied after data was written.
   Existing shards hold the old type and cannot be migrated; the index has to be reset.
1. **Does the search find documents but show nothing useful?**
   That is extraction.
   The index needs a Default Extraction Pipeline, and extraction needs `StreamId` and `EventId` in the index, normally added by an [`IdEnrichmentFilter`]({{< relref "../../reference/pipeline-elements.md#idenrichmentfilter" >}}) running before the indexing filter.
1. **Any `CORRUPT` shards?**
   They will not recover.
   Reset and rebuild.
{{< /diagnose >}}

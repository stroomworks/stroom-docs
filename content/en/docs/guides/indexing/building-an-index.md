---
title: "Building an Index"
linkTitle: "Building an Index"
weight: 10
date: 2026-10-14
tags:
description: >
  Creating an index, giving it somewhere to live, and filling it from a pipeline.
pageKind: guide
verification: required
aliases:
  - /docs/user-guide/indexing/lucene/
---

An index needs three things before anything is searchable: the index document and its fields, at least one volume to write to, and a pipeline that feeds it.


## The steps

1. **Create the Index document** in the explorer tree, in the folder where whoever will search it has permission to read.
1. **Give it a volume group.**
   An index with no volumes has nowhere to put its shards, and processing fails rather than quietly doing nothing.
   Index volumes are separate from data volumes.
1. **Set the partition and retention.**
   Shards are grouped into time partitions, usually daily or monthly.
   Retention is applied by partition, so the partition size sets how precisely old data can be dropped.
1. **Define the fields.**
   See [Choosing fields]({{< relref "choosing-fields.md" >}}).
   Get as close as you can now, because fields already written into shards keep the definition they were written with.
1. **Build the indexing pipeline.**
   It reads the translated output, so it begins with a parser reading `records:2` and ends with {{< pipe-elm "IndexingFilter" >}}, whose `index` property points at the Index document.
1. **Create a processor filter** on that pipeline for the feeds and stream types you want indexed, exactly as for any other processing.

{{< timing mode="async" >}}
Indexing is background processing, so nothing appears the moment you create the filter.
The data is indexed as tasks are picked up, which depends on how far behind processing is.

Once indexed, documents are searchable straight away: a search reads each shard through its open index writer.
Only the **Doc Count** on the index's **Shards** tab lags, until the **Index Writer Flush** job commits the shard, every 10 minutes by default.
{{< /timing >}}

{{< verify >}}
Search the index for something you know is in the data you just indexed, restricted to a time range you just processed.

{{< golden >}}
**A search for a known value in a known time range returns the expected number of results.**

Knowing the expected count in advance is what makes this a check.
A search that returns "some" results is consistent with most of the data being missing.
{{< /golden >}}

{{< not-proof >}}
**Streams marked processed is not proof they were indexed.**
A pipeline whose translation produced no `records:2` output processes to completion and indexes nothing.

**A search returning results is not proof the index is current.**
It shows what has been indexed so far, and indexing follows processing, so streams still waiting for tasks are missing without anything saying so.
Check the indexing pipeline's processor filter has caught up before trusting a count.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**An index with no volume group fails at processing time, not at creation time.**

The Index document saves happily without volumes.
The failure appears later as errors on the processing screens, which is a long way from the thing that caused it.
Set the volume group when you create the index.
{{< /trap >}}

{{< diagnose >}}
1. **Does the index have a volume group with space?**
   Both parts matter: a group whose volumes are full stops accepting writes.
   Check against [Index volume status]({{< relref "../../reference/jobs.md" >}}).
1. **Did the processor filter match anything?**
   Look at its task count.
   A filter whose criteria match no streams sits at zero and reports no error.
1. **Did the translation produce `records:2` output?**
   Step the indexing pipeline and look at the parser output.
   This is the usual cause of processed-but-not-indexed.
1. **Is the Doc Count zero while searches return results?**
   The shard has not been committed yet; searches see uncommitted documents, the **Doc Count** does not.
   If **Index Writer Flush** is disabled on the node doing the work, the count never catches up, and documents not yet committed are lost if the node stops without shutting down cleanly.
1. **Are you searching the time range you indexed?**
   Results are partitioned by event time, not by when you processed them.
   A backfill lands in old partitions.
1. **Can the searching user read the index?**
   An index they cannot see returns nothing rather than an error.
{{< /diagnose >}}

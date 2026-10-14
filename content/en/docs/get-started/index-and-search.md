---
title: "Index and Search It"
linkTitle: "Index and Search It"
weight: 50
date: 2026-10-14
tags:
description: >
  Running the pipeline over the whole stream, indexing the output, and searching it.
pageKind: tutorial
verification: required
---

The Stepper proved the translation on one record.
Now run it over everything and put the result somewhere you can search.


## Process the stream

A pipeline does nothing until a **[processor filter]({{< relref "../concepts/processing.md" >}})** selects data for it.

On the pipeline's **Processors** tab, create a filter matching your feed and the stream type `Raw Events`.
Then enable it.

{{< trap severity="silent" >}}
**Enable both the processor and the filter.**

A pipeline has a parent **Processor** and one or more **Filters** beneath it.
Both have their own enabled state, and data flows only when both are on.
A filter shown as enabled under a disabled processor processes nothing, and neither screen says so.

This is the most common cause of "nothing is happening" in all of Stroom.
{{< /trap >}}


## Index the output

Create a **[Lucene Index]({{< relref "../concepts/lucene-index.md" >}})** called `TEST-EVENTS-INDEX`.

{{< trap severity="silent" >}}
**Set its volume group, or it will index nothing.**

An index needs a [volume group]({{< relref "../concepts/volumes.md" >}}) naming where its shards are written.
Without one the index document looks complete, its field list is populated, the pipeline runs, and the indexing filter fails at processing time with `Index volume group name must be specified`.

The only visible sign is an `Error` stream on the feed.
This is the single most common Lucene gotcha in Stroom.
{{< /trap >}}

Then extend the pipeline to write to it.
After your `XSLTFilter`, add an {{< pipe-elm "IdEnrichmentFilter" >}} and an {{< pipe-elm "IndexingFilter" >}} pointed at the index.
The id enrichment must come first: it adds the `StreamId` and `EventId` that let a search result find its way back to the original event.

{{< timing mode="async" >}}
**Processing is asynchronous.**
The task creator polls on an interval, then the work queues.
For three rows this is seconds; for real volumes it is minutes to hours.

There is a second delay after that: documents are not searchable until the index writer flushes, which a [scheduled job]({{< relref "../reference/jobs.md" >}}) does.

So an empty result immediately after enabling the filter means **not yet**, not **failed**.
{{< /timing >}}

{{< verify >}}
First confirm processing produced output: on the feed's **Data** tab, look for a stream of type `Events`, and check there is no stream of type `Error`.

Then query the index.
Create a **[Query]({{< relref "../concepts/query-language.md" >}})** or use a dashboard's query component:

```text
from "TEST-EVENTS-INDEX" select count()
```

{{< golden >}}
**`select count()` returns a non-zero number, and there are no `Error` streams.**

Both halves.
The count proves documents exist and are searchable; the absence of errors proves the indexing filter did not fail on the way.
Either alone can mislead you.
{{< /golden >}}

{{< not-proof >}}
**The index's field list proves nothing.**
It is populated from the index's configuration, not its contents, and it looks complete and healthy when zero documents have been written.
This is how people conclude indexing worked when it did not.

**An `Events` stream existing is not proof it contains events.**
Open it.
A translation that matched nothing produces a valid, empty output stream.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Are both the processor and the filter enabled?**
   Check first, every time.
1. **Is there an `Error` stream on the feed?**
   Read it.
   The volume group failure appears only here, and so do most other indexing failures.
1. **Is there an `Events` stream at all?**
   If not, this is a [processing problem]({{< relref "../operate/checking-it-works/is-data-processing.md" >}}) rather than an indexing one: the filter's criteria may not match your data.
1. **Does the `Events` stream contain events?**
   Open it.
   Empty output is the namespace mismatch from the previous page.
1. **Is `IdEnrichmentFilter` before `IndexingFilter`?**
   Order matters.
1. **Is the count still zero moments after processing?**
   Wait for the index writer to flush, then ask again.
{{< /diagnose >}}


## Next

The data is searchable.
Now [put it on a dashboard]({{< relref "your-first-dashboard.md" >}}).

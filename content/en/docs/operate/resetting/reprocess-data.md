---
title: "Reprocess Data"
linkTitle: "Reprocess Data"
weight: 10
date: 2026-10-14
tags:
description: >
  How to re-run a pipeline over data it has already processed, and what it does and does not clean up after itself.
pageKind: operate
verification: required
---

Reprocessing re-runs a [pipeline]({{< relref "../../concepts/pipelines.md" >}}) over [streams]({{< relref "../../concepts/streams.md" >}}) that have already been through it.
You need it whenever the pipeline was wrong and the output it produced is wrong with it: a translation that dropped a field, an XSLT that matched nothing, a schema that has since changed.

The raw data is untouched by any of this.
Processing never consumes its input, it only produces new streams alongside it, which is why reprocessing is possible at all.


## The procedure

1. **Fix the pipeline, and prove it.**
   Use the [Stepper]({{< relref "../../concepts/pipeline-debugging.md" >}}) on one record before reprocessing a million.
   Reprocessing with a pipeline that is still wrong costs the same as reprocessing with one that is right.
1. **Find the streams to reprocess.**
   Filter the feed's data list down to the output streams (`Events` or `Error`) for exactly the period you mean.
   This selection is the blast radius.
   Stroom works back from them to the source streams they were made from.
1. **Plan for output that has left Stroom.**
   Old output streams are replaced for you, but index documents, statistics and anything sent to another system are not.
   See the trap below.
1. **Reprocess the selection.**
   Stroom builds a temporary [processor filter]({{< relref "../../concepts/processing.md" >}}) for those streams and queues them.

{{< timing mode="async" >}}
Reprocessing is ordinary processing and inherits its latency: the task creator polls, the tasks queue, and the work competes with live ingest for the same capacity.
**Minutes to hours**, in proportion to the volume selected.

Selecting a year of data and expecting it in ten minutes is the common mistake.
Check the selection summary before confirming: it tells you how many streams you are about to re-run.
{{< /timing >}}

{{< verify >}}
New output streams appear on the feed, with create times of now and the same parent streams as the old ones.
Open one and confirm the output is what the fix was meant to produce.

{{< golden >}}
**The output stream count matches the input count you selected, and one of them is right.**

Count answers "did it all run".
Content answers "did it run correctly".
Neither answers the other.
{{< /golden >}}

{{< not-proof >}}
**An `Events` stream appearing does not mean the fix worked.**
A pipeline that still matches nothing produces a valid, empty output stream, which looks the same in a list as a correct one.
Open it.

**The absence of `Error` streams does not mean the output is right.**
Most translation mistakes are not errors; they are silence.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Reprocessing cleans up old output streams, but not what was built from them.**

When a source stream is processed again, Stroom marks the output streams that the same pipeline made from it last time as deleted, once the new run finishes.
You do not need to delete them first.
What it cannot take back is output that has already left the stream store: documents in a [Lucene index]({{< relref "../../concepts/lucene-index.md" >}}) are added again rather than replaced, statistics are counted again, and files or messages sent to other systems are sent again.
Indexes double, statistics double, and dashboards are wrong in a way that is easy to misread as a data problem.

Before reprocessing a large selection that is indexed, [reset the index]({{< relref "reset-an-index.md" >}}).
For exports, pause or redirect the destination while the reprocessing runs.
{{< /trap >}}

{{< diagnose >}}
1. **Did anything queue at all?**
   Check the processor's tasks.
   If nothing queued, the selection matched no streams: check the filter criteria and the time range you selected.
1. **Are there new `Error` streams?**
   Read one.
   A fix that introduced a new fault shows up here, and it will have failed on every stream rather than one.
1. **Is the output still wrong in the same way?**
   The pipeline change may not have been saved, or the processor may be using an inherited parent pipeline that still holds the old version.
   Check what the element actually points at.
1. **Are search counts roughly double?**
   The index still holds the documents from the first run.
   See the trap.
1. **Is it simply still running?**
   Compare the processor filter's tracker against the size of the selection before concluding it has stalled.
{{< /diagnose >}}


## When reprocessing is not the answer

If **new** data is processing and only **old** data was missed, the pipeline is probably fine and the processor filter never looked at those streams.
That is a different fix: see [Reset a processor filter]({{< relref "reset-a-processor-filter.md" >}}).

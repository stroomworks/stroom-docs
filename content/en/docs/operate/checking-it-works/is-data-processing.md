---
title: "Is Data Processing?"
linkTitle: "Is Data Processing?"
weight: 30
date: 2026-10-14
tags:
description: >
  How to tell whether a pipeline is running over your data, producing what you expect, and failing where it isn't.
pageKind: operate
verification: required
---

Raw data sitting on a feed does nothing by itself.
A **[processor filter]({{< relref "../../concepts/processing/_index.md" >}})** has to select it, and a **[pipeline]({{< relref "../../concepts/pipelines.md" >}})** has to run over it, producing new streams: `Events` when it works and `Error` when it does not.

This is the part of Stroom where silent failure is most common, because every stage of it can look correct while producing nothing.

{{< timing mode="async" >}}
Processing is **asynchronous, and slow enough that patience is part of the method**.
A task creator polls on an interval, then tasks are queued and run in the background.
Real volumes routinely take **minutes to hours**.

So "no `Events` stream yet" usually means *not finished*, not *failed*.
Do not start changing configuration on the strength of an early look.
Treat it as failed only once an `Error` stream appears, or the filter's tracker shows it has processed the stream and produced nothing.
{{< /timing >}}

{{< verify >}}
Open the feed's **Data** tab and look for streams of type `Events` created after your raw data arrived.
Then look for streams of type `Error` (note the singular), and expect none.

{{< golden >}}
**Every dependency of the pipeline resolves.**
Before looking at anything else, check that the pipeline's referenced documents (its XSLT, [Text Converter]({{< relref "../../concepts/translation.md" >}}), index, schema) all exist and are reachable.

A broken reference is the single most common cause of a pipeline that runs and produces nothing, and it is invisible on the pipeline's own screen: the element is there, its property is filled in, and the document it names is gone.
{{< /golden >}}

{{< not-proof >}}
**A processor filter that exists is not a processor filter that runs.**
A pipeline has a top-level **Processor** and one or more **Filters** beneath it, and *both* must be enabled.
A filter shown as enabled under a disabled processor processes nothing, and neither screen says so.

**An `Events` stream is not proof the output is right.**
It proves the pipeline ran.
An XSLT whose namespace does not match its input matches nothing and emits a valid, empty result: which produces an `Events` stream containing no records.
Open it and look.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Editing a filter's criteria does not make it revisit streams it has already passed.**

A new filter scans the feed from the beginning, including streams that were there before it existed.
Its tracker then moves forward and never goes back.
Change the criteria afterwards and the older streams are never looked at again, with no error: you simply get fewer output streams than input streams and no explanation.

To process those streams, use **[Reprocess data]({{< relref "../resetting/reprocess-data.md" >}})**, or [delete and recreate the filter]({{< relref "../resetting/reset-a-processor-filter.md" >}}) to force a fresh scan from the beginning.
{{< /trap >}}

{{< diagnose >}}
1. **Is there raw data at all?**
   Check the feed's Data tab for `Raw Events` streams in the period you care about.
   If there are none, this is an arrival problem, not a processing one: go to [Is data arriving?]({{< relref "is-data-arriving.md" >}}) and stop here.
1. **Are both parts of the processor filter enabled?**
   Open the pipeline's **Processors** tab.
   Check the parent **Processor** and the **Filter** beneath it.
   Both.
   This is the most common cause by a wide margin.
1. **Do the filter's criteria match the data?**
   The filter selects on feed, stream type and status.
   A filter for `Events` will never match `Raw Events`; a filter on the wrong feed matches nothing.
   Compare the criteria against a stream you can see.
1. **Are there `Error` streams?**
   If so, stop guessing and read one.
   It names the element that failed and usually the reason.
   The error stream's parent is the raw stream that caused it, so you can read the input that broke it.
1. **Do all the pipeline's dependencies resolve?**
   A missing XSLT or Text Converter produces empty output, not an error, when the element is configured but its target is gone.
1. **Is the output empty rather than absent?**
   Open an `Events` stream.
   If it exists but contains no records, the pipeline ran and matched nothing: almost always an XSLT `xpath-default-namespace` that does not match what the parser emitted.
1. **Is it simply not finished?**
   Check the filter's tracker: it reports how far through the available data it has got.
   A tracker that is advancing is a system that is working, slowly.
{{< /diagnose >}}


## Getting ahead of it

Two habits remove most of this class of problem before it happens.

**Put a [Schema Filter]({{< relref "../../concepts/pipeline-schema-filter.md" >}}) after each transform while you are developing.**
It validates the output against its target schema and fails loudly on a format error, instead of passing silently wrong output downstream to something that will also fail silently.
Take it out later if you need the throughput.

**Use the Stepper.**
It shows each element's input and output one record at a time, with markers on errors and warnings, and it is the fastest way to find out which element stopped matching.
It is only available in the UI, because there is no API for it, so a pipeline built through the API still wants a pass through the Stepper before it is trusted.
See [Pipeline debugging]({{< relref "../../concepts/pipeline-debugging.md" >}}).

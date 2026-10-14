---
title: "Performance and Queues"
linkTitle: "Performance and Queues"
weight: 50
date: 2026-10-14
tags:
description: >
  What to look at when Stroom is working but falling behind, and how to tell a backlog from a stall.
pageKind: operate
verification: required
---

A backlog and a stall look the same for the first few minutes: output is not appearing.
They need opposite responses.
A backlog needs capacity or patience; a stall needs a fix.
Telling them apart is most of this page.

**A backlog is progressing, just not fast enough.
A stall is not progressing at all.**
Everything below is a way of establishing which you have.

{{< timing mode="async" >}}
Stroom's work is queued and asynchronous throughout.
Tasks are created by a poller, queued, picked up by nodes, and run.
Each of those steps has an interval, so there is always some lag between cause and visible effect, even on an idle system.

Measure over minutes, not seconds.
A single observation tells you almost nothing about whether something is moving.
{{< /timing >}}

{{< verify >}}
Take the same measurement twice, several minutes apart: the [processor filter's]({{< relref "../../concepts/processing.md" >}}) tracker position, or the count of unprocessed streams.

{{< golden >}}
**The tracker position has advanced between two readings.**

That single fact separates a backlog from a stall, and it is the first thing to establish.
Everything else is about how fast, or why not at all.
{{< /golden >}}

{{< not-proof >}}
**A high task count is not proof of a problem.**
A healthy busy system has a queue.
The question is whether it is draining.

**Low CPU is not proof the system is idle.**
Stroom processing is frequently I/O bound, and a node waiting on disk or database looks idle by CPU alone.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A disabled job produces a permanent backlog that looks like slowness.**

Jobs can be disabled individually, and nothing on the processing screens says a job is off.
The queue simply grows, forever, with no error and no completion.

It is an easy state to end up in after maintenance, and it is worth checking before any capacity investigation: a system waiting for a job that will never run cannot be made faster.
{{< /trap >}}

{{< diagnose >}}
1. **Is it moving?**
   Take two tracker readings minutes apart.
   If it is advancing, this is a capacity question.
   If it is not, it is a stall and the rest of this list applies.
1. **Are the jobs enabled?**
   Check the processing [jobs]({{< relref "../nodes-and-jobs.md" >}}) first.
   See the trap.
1. **Are tasks being created at all?**
   If no tasks exist for the filter, nothing will run however much capacity there is.
   That is a filter problem: see [Is data processing?]({{< relref "../checking-it-works/is-data-processing.md" >}}).
1. **Are tasks queued but not picked up?**
   That points at the nodes: one that is unhealthy, disabled, or cannot reach the database will not take work.
   Check each node individually.
1. **Is one filter starving the others?**
   Filters have priorities, and a large [reprocess]({{< relref "../resetting/reprocess-data.md" >}}) at a high priority will crowd out live processing.
   Check what else is running before assuming the system is undersized.
1. **Is it the database?**
   Stroom's metadata is relational, and a slow or contended database slows everything above it in a way that looks like general sluggishness.
1. **Is disk the limit?**
   Both the stream store and the index [volumes]({{< relref "../../concepts/volumes.md" >}}).
   Check free space and throughput: a volume approaching full behaves badly well before it is full.
1. **Is a reprocess running that you have forgotten about?**
   It is ordinary processing and competes for the same queue.
{{< /diagnose >}}


## Before adding capacity

Three things are worth ruling out first, because each is free and each is more often the cause than hardware:

**A disabled job.**
See above.

**A filter priority that is wrong**, so the urgent work is behind the bulk work.

**A translation doing more than it needs to.**
An XSLT performing a [reference lookup]({{< relref "../../concepts/pipeline-reference-data.md" >}}) per record where one per stream would do is a common and invisible multiplier.

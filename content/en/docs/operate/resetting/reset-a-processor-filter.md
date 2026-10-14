---
title: "Reset a Processor Filter"
linkTitle: "Reset a Processor Filter"
weight: 20
date: 2026-10-14
tags:
description: >
  What to do when new data processes but existing data was never picked up.
pageKind: operate
verification: required
---

A [processor filter]({{< relref "../../concepts/processing.md" >}}) scans for data matching its criteria and tracks how far it has got.
It is that tracker, not the filter itself, that usually needs resetting: a filter can be enabled, correct, and happily processing new arrivals while having never looked at the data that was already there when you created it.

The symptom is specific.
**New data processes.
Old data does not.
Nothing reports an error.**


## The procedure

There is no "rewind" control.
Resetting the tracker means replacing the filter:

1. **Confirm the criteria are right.**
   If the filter's feed or stream type is wrong, it is not a tracker problem and recreating it will change nothing.
1. **Note what the filter is**: its pipeline, criteria and priority.
   You are about to recreate it by hand.
1. **Delete the filter.**
1. **Create it again** with the same settings.
   The new filter starts with an empty tracker and scans the data store from the beginning.

For a bounded set of old streams, [reprocessing a selection]({{< relref "reprocess-data.md" >}}) is usually better: it is scoped to what you choose rather than to everything the criteria match.

{{< timing mode="async" >}}
A new filter does not start instantly.
The task creator polls on an interval, so expect a wait before the first task appears, then **minutes to hours** while it works through the backlog it has just discovered.
{{< /timing >}}

{{< verify >}}
Watch the filter's tracker.
After the recreate it should show a position early in the data and advance.
Then look for output streams whose parents are the old raw streams.

{{< golden >}}
**Output streams appear with parent streams that predate the filter.**

That is the whole point of the reset: processing data older than the filter.
New output from new data proves nothing, because that was already working.
{{< /golden >}}

{{< not-proof >}}
**The filter being enabled is not proof it is scanning.**
It was enabled before, and the old data still was not processed.

**A tracker showing 100% is not proof everything was processed.**
It means the filter has reached the end of what it considers its scope, which is exactly the thing in question when old data was skipped.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Both the Processor and the Filter must be enabled, and they are separate controls.**

A pipeline has a parent **Processor** and one or more **Filters** beneath it.
A filter shown as enabled under a disabled processor processes nothing.
Neither screen says so, and the filter looks correct in every respect.

Check both before concluding you have a tracker problem.
This is the most common cause of "nothing is processing" by a wide margin, and recreating the filter will not fix it.
{{< /trap >}}

{{< diagnose >}}
1. **Are both the processor and the filter enabled?**
   See above.
   Check this first every time.
1. **Do the criteria match the old streams?**
   Compare the filter's feed, stream type and status against a stream you can see that was skipped.
   A filter on `Events` will never match `Raw Events`.
1. **Is the old data within the filter's scope at all?**
   Some criteria include a time bound.
   Data outside it is not skipped so much as excluded.
1. **Did the recreate actually take?**
   Confirm the new filter exists, is enabled, and has a tracker at a different position from the one you deleted.
1. **Are there errors on the old data specifically?**
   Old data is often older *shapes* of data.
   A pipeline written for this month's format may fail on last year's, which is a [translation]({{< relref "../../concepts/translation.md" >}}) problem rather than a filter one.
{{< /diagnose >}}

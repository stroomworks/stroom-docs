---
title: "Processor Filters and Tasks"
linkTitle: "Processor Filters and Tasks"
weight: 35
date: 2026-10-14
tags:
description: >
  How stored streams are found, turned into tasks and run through a pipeline, and how to run them again.
pageKind: concept
aliases:
  - /docs/howtos/general/enablingprocessorshowto/
---

A [pipeline]({{< relref "../pipelines.md" >}}) does nothing on its own.
Data is sent through it by a **processor**, and the processor decides what to send using one or more **processor filters**.
Each filter is a query over the [stream store]({{< relref "../streams/_index.md" >}}): every stream that matches becomes a **task**, and each task runs one stream through the pipeline on one node.

Because the raw data stays in the stream store after it has been processed, you can run it through a pipeline again at any time.
That is how you fix a translation: correct it, then reprocess the stored data, with no need to collect it again.


## Processors and filters

Processors are managed on the **Processors** tab of a {{< stroom-icon "document/Pipeline.svg" "Pipeline" >}} Pipeline.
The table shows the processor as a parent row with its filters below it.
A pipeline can have as many filters as you need, for example one per feed.
A folder's **Processors** tab shows the same table for every pipeline in the folder.
[The Processors tab]({{< relref "processors-tab.md" >}}) describes the screen in detail, including why its buttons are greyed out when the processor row rather than a filter row is selected, and who can change it.

Both the processor and the filter have an **Enabled** tick box, and both must be ticked before any data is processed.
Disabling the processor pauses every filter on the pipeline; disabling one filter pauses only that filter.
A new filter is created disabled, unless you tick **Enable new filters** when creating it from a data browser (see below).

{{% note %}}
Processing also depends on two jobs: **Processor Task Creator**, which creates tasks, and **Data Processor**, which runs them on each node.
If both rows are enabled but nothing happens, check those jobs.
See [Nodes and jobs]({{< relref "../../operate/nodes-and-jobs.md" >}}).
{{% /note %}}


## The filter expression

To add a filter, click add on the **Processors** tab.
The dialog opens with an **Expression**: a tree of terms, combined with AND, OR and NOT, over the fields of the stream store.
A typical filter has two terms:

* **Feed** is `MY_FEED`.
* **Type** = `Raw Events`.

That selects every raw stream received on the feed, both those already stored and those still to arrive.
Any stream metadata field can be used, such as **Id**, **Create Time**, **Effective Time**, **Parent Id** or **Pipeline**.
**Status** is not offered, because Stroom adds that condition itself: a filter never selects a deleted stream.

The rest of the dialog holds the filter's settings:

| Setting | What it does |
|---|---|
| **Min Create Time**, **Max Create Time** | Limit the filter to streams created in this window. |
| **Max Processing Tasks** | The most tasks from this filter that may run at once across the whole cluster. The default, `0`, means no limit. |
| **Processing Profile** | Confine the filter to a group of nodes and a schedule. See below. |
| **Include in Export** | Whether the filter is included when its pipeline is exported, including by a Git Repo push. Importing never updates a filter that already exists; see [Processor filters]({{< relref "../../guides/content-management.md#processor-filters" >}}) on import and export. |
| **Run As User** | The user the tasks run as. It defaults to the user who created the filter. |
| **Set Feed Dependencies** | Hold processing back until data has arrived on other feeds, typically the reference data that the translation looks up. A minimum and a maximum delay can be set. |


## Priority

Each filter has a **Priority**, from 1 to 100.
Higher numbers go first, and the default is `10`.
You change it in the **Priority** column of the **Processors** table.

When Stroom fills its queue of work, it takes tasks from filters in priority order.
Filters with the same priority are served oldest data first.
Give a filter a higher priority when its data must be processed ahead of everything else.
A large reprocessing job can be given a lower one, so that it runs in the gaps and doesn't hold up live data.


## Tasks and the tracker

Every filter has a **tracker** that records how far through the stream store the filter has got.
Each time the **Processor Task Creator** job runs, it looks for streams beyond the tracker that match the expression, creates a task for each one, and moves the tracker on.
Tasks are then queued, and each node's **Data Processor** job takes tasks from the queue, up to the **Max Tasks** set for that job on that node.

A task moves through these states:

* **Created**: the task exists but is not yet queued.
* **Queued**: it is waiting for a node.
* **Processing**: a node is running it.
* **Complete** or **Failed**: it has finished.

The **Processors** table shows each filter's progress.
**Tasks** is the number of streams the filter has created tasks for, **Last Poll Age** is how long ago it last looked for new data, and **Status** reads `Up to date`, how far behind the filter is, or `Complete` or `Error`.
A filter with a **Max Create Time** becomes `Complete` once it has created tasks for everything up to that time.
A filter without one never completes: it keeps watching for new streams.

The **Active Tasks** tab of the pipeline, feed or folder lists the tasks themselves, finished ones included until they are cleared away; see [The Active Tasks tab]({{< relref "active-tasks-tab.md" >}}).
If a stream fails, its errors are written to an `Error` stream in the feed.
[Pipeline debugging]({{< relref "../pipeline-debugging.md" >}}) explains how to find them.

{{% warning %}}
The tracker only moves forward.
Editing a filter's expression does not send it back over streams it has already passed.
To process older data, create a new filter or use reprocessing.
{{% /warning %}}


## Processing profiles

By default any node can process any filter at any time.
A **processing profile** lets you be more selective: it names a **node group** and a set of periods (days of the week and a time of day) with optional thread limits for each node and for the whole cluster.
Node groups are managed from **Monitoring** > **Node Groups**, and profiles from **Monitoring** > **Processor Profiles**.

You attach a profile to a filter with its **Processing Profile** setting.
Use it to keep heavy processing off the nodes that serve users, or to hold a backlog until the quiet hours.

{{% warning %}}
A filter with a profile runs only during that profile's periods.
If no period matches the current day and time, if the profile has no periods, or if its node group is disabled, no tasks are created for the filter and nothing tells you so.
A filter with no profile is not restricted.
{{% /warning %}}


## Processing and reprocessing existing data

This section explains what reprocessing is.
For the procedure, and what it costs, see [Reprocess data]({{< relref "../../operate/resetting/reprocess-data.md" >}}) and [Reset a processor filter]({{< relref "../../operate/resetting/reset-a-processor-filter.md" >}}).
To find out whether processing is working at all, see [Is data processing?]({{< relref "../../operate/checking-it-works/is-data-processing.md" >}}).

You can also create filters from any data browser: the **Data** tab of a feed, a pipeline or a folder.
Select streams, then click **Process** {{< stroom-icon "process.svg" >}}.
You need the **Manage Processors** permission to see the button.

The dialog sets the new filter's priority (or **Attempt to automatically set priority**, which copies the priority of the pipeline's existing filter), **Enable new filters**, an optional **Min Create Time** and **Max Create Time**, and the **Reprocess data** tick box, which decides what happens next:

* **Reprocess data unticked**: you choose a pipeline, and Stroom creates a filter on it for the streams you selected.
  Use this to run raw data through a pipeline for the first time, such as a new pipeline over data received last month.
* **Reprocess data ticked**: select the *output* of earlier processing, such as `Events` or `Error` streams.
  Stroom finds the pipelines that produced them and adds a reprocess filter to each, which runs their input streams through again.

This is the usual way to recover from a translation fault.
Fix the XSLT or Text Converter, step through a failing stream to check the fix (see [Pipeline debugging]({{< relref "../pipeline-debugging.md" >}})), then reprocess the `Error` streams or the bad `Events` streams.
Filters created this way are marked in the **Reprocess** column of the **Processors** table.


## What happens to the old output

When a task finishes, Stroom looks for output streams that the same pipeline produced earlier from the same input stream.
Those earlier streams are logically deleted, so a feed holds only the latest result of processing each input, not one copy per run.

That clean-up covers streams in the stream store only.
Anything a pipeline sent elsewhere is not withdrawn.
Documents already written to an index stay there, so reprocessing adds a second copy (see [Reset an index]({{< relref "../../operate/resetting/reset-an-index.md" >}})), and files or HTTP posts sent to another system are sent again.
Plan for this before reprocessing a large amount of data through a pipeline that indexes or exports.


## Related pages

* [Pipelines]({{< relref "../pipelines.md" >}})
* [Streams]({{< relref "../streams/_index.md" >}})
* [Feeds]({{< relref "../feed.md" >}})
* [Parsers and translation]({{< relref "../translation.md" >}})
* [Pipeline debugging]({{< relref "../pipeline-debugging.md" >}})
* [Nodes and jobs]({{< relref "../../operate/nodes-and-jobs.md" >}})
* [The Processors tab]({{< relref "processors-tab.md" >}}): the screen where processors and filters are managed, and when its buttons are enabled.
* [The Active Tasks tab]({{< relref "active-tasks-tab.md" >}})

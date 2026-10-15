---
title: "Breaking Changes"
linkTitle: "Breaking Changes"
weight: 30
date: 2026-09-30
tags: 
description: >
  Changes in Stroom version 7.14 that may break existing processing or ways of working.
---

{{% warning %}}
Please read this section carefully in case any of the changes affect you.
{{% /warning %}}


## Stroom

### Upgrade the Whole Cluster at Once

v7.14 changes how Stroom tells a live processing task from one abandoned by a dead node.
Each node now renews a heartbeat on the tasks it is processing, and the new **Processor Task Reaper** job returns tasks whose heartbeat has stopped to the queue.

The reaper relies on every node sending heartbeats.
In a cluster where some nodes are still on an older version, their long-running tasks have no heartbeat and will be taken from them and processed again.
**Stop every node, upgrade them all, then start them**, rather than upgrading one node at a time.


### `disownDeadTasksAfter` Replaced

The **Processor Task Manager Disown Dead Tasks** job, which ran on the master node only, has been replaced by the cluster-locked **Processor Task Reaper**, which works with or without a master node.

The property `stroom.processor.disownDeadTasksAfter` has been replaced by `stroom.processor.taskLeaseTimeout`, default `PT10M`.
**If your configuration sets `disownDeadTasksAfter`, Stroom will fail to start.**
Rename it to `taskLeaseTimeout`.

Wherever processing tasks are listed, a task's **Status Time** now shows when its heartbeat was last renewed, not when its status last changed.


### Data Is Synced to Disk by Default

Stroom now forces stream data to durable storage before considering it written, controlled by `stroom.data.store.fsyncMode`.
It defaults to `ENABLED`.
On slow or network storage this can reduce throughput.
See [Upgrade Notes]({{< relref "upgrade-notes#data-durability-fsync" >}}) for the settings.


### Processing Latency for New Streams

Task creation is now bounded by the highest stream ID seen on the **previous** poll, so that a stream still being committed is not skipped.
This fixes streams that were occasionally never processed, at the cost of up to one poll interval of extra latency before a new stream gets a task.
Set `stroom.processor.useMaxMetaIdFromPreviousPoll: false` to restore the old behaviour.


### Restoring a Deleted Processor Filter

Restoring a logically deleted processor filter, for example by importing a filter over one that was deleted, now creates a new filter that takes over the old one's UUID, rather than resetting and reusing the old filter.
The restored filter therefore has a new ID, and the deleted one is recorded as its parent.
Anything that keeps processor filter IDs, such as a script or a saved query, will see the new ID.
Restoring a filter that still has active tasks no longer fails.


## Stroom-Proxy

### Data Is Synced to Disk by Default

Stroom-Proxy now forces data to durable storage at each stage of receipt, aggregation and forwarding, and after forwarding to a file destination.
All of the settings default to `ENABLED`, which can reduce throughput on slow or network storage.
See [Upgrade Notes]({{< relref "upgrade-notes#data-durability-fsync-1" >}}).


## Stroom & Stroom-Proxy

### fsync Settings Changed Between v7.14 Betas

This only affects you if you have run a v7.14 beta earlier than `v7.14-beta.5`.

The fsync settings added in earlier v7.14 betas were booleans.
They are now enums with the values `DISABLED`, `FILE_ONLY`, `DIR_ONLY` and `ENABLED`, and have been renamed:

| Was | Now |
|---|---|
| `appConfig.data.store.fsyncEnabled` | `appConfig.data.store.fsyncMode` |
| `proxyConfig.forwardFileDestinations[*].fsyncEnabled` | `proxyConfig.forwardFileDestinations[*].fsyncMode` |
| `proxyConfig.fsync.aggregateInputQueue` | `proxyConfig.fsync.aggregateInputQueueMode` |
| `proxyConfig.fsync.forwardingInputQueue` | `proxyConfig.fsync.forwardingInputQueueMode` |
| `proxyConfig.fsync.preAggregateInputQueue` | `proxyConfig.fsync.preAggregateInputQueueMode` |
| `proxyConfig.fsync.receiving` | `proxyConfig.fsync.receivingMode` |
| `proxyConfig.fsync.zipSplittingInputQueue` | `proxyConfig.fsync.zipSplittingInputQueueMode` |

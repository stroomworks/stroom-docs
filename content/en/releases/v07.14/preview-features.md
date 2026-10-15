---
title: "Preview Features (experimental)"
linkTitle: "Preview Features"
weight: 20
date: 2026-09-30
tags: 
description: >
  Preview features in Stroom version 7.14.
  Preview features are somewhat experimental in nature and are therefore subject to breaking changes in future releases.
---

## `S3 v2 (Experimental)` Volume Type

{{% warning %}}
This volume type is work in progress and is not suitable for production use.
{{% /warning %}}

A new data {{< glossary "Volume" >}} type, `S3 v2 (Experimental)`, has been added.
Like `S3 v1`, it stores data in an S3-compatible object storage service, but data is stored as one or more ZStandard compressed files rather than as a single ZIP file.

See [S3 storage]({{< relref "/docs/concepts/volumes.md#s3-storage" >}}).


## Worker Node Task Claiming

{{% warning %}}
This mode is **off by default** and is not yet proven in production.
Leave it off unless you have been asked to trial it.

The property must be set the same on every node and changing it is a hard cutover: stop the whole cluster, change the value on every node, then start it again.
Running a mixed cluster is not supported and will leave tasks unprocessed.
{{% /warning %}}

A new mode, enabled by the property `stroom.processor.claimTasksOnWorker`, in which each worker node finds and claims its own processor tasks directly from the database, rather than being fed by the task queue held in memory on the master node.
With it off (the default) Stroom behaves as before, using the master node's task queue.

A worker knows which filters its own processing profiles allow it to run, so this no longer has to be worked out on its behalf, and task assignment no longer depends on there being a master node.
Tasks are claimed so that nodes claiming at the same time get different tasks, oldest first.

A new `ProcessorTaskClaiming` system info entry gathers what every node is doing at the moment it is asked, replacing the master only view of the task queue.

Switching mode in either direction loses no work, as tasks left behind by either mode are returned to the created state and reprocessed.
However, tasks that were in flight when the cluster stopped will wait for `stroom.processor.taskLeaseTimeout` before another node picks them up.
Turning the mode back off is the supported way to recover if worker claiming does not keep the cluster supplied with work.

See [Configuration Properties]({{< relref "/docs/reference/configuration-properties.md" >}}).


### Processor task availability summary

As groundwork for worker node task claiming, each node can now work out for itself which processor filters it is allowed to process and which of them have tasks waiting, in a single query rather than one query per filter.

The new property `stroom.processor.taskAvailabilityInterval` (default `PT5S`) controls how long a node may reuse this summary before taking a fresh one.
Raising it lowers the cost of looking for work on an idle cluster, but delays a node noticing that an idle filter has gained work by up to this long.

---
title: "Nodes, Jobs and Properties"
linkTitle: "Nodes, Jobs and Properties"
weight: 70
date: 2026-10-14
tags:
description: >
  Manage the nodes in a Stroom cluster, the background jobs they run and when, and the properties that configure them.
pageKind: operate
verification: required
aliases:
  - /docs/user-guide/nodes/
  - /docs/user-guide/properties/
---

A Stroom cluster is a set of **nodes** that share one database.
Each node runs **jobs**: processing data, enforcing retention, cleaning up and checking its own health.
**Properties** configure all of it.
This page covers the three screens an administrator uses for them.


## Nodes

Open **Monitoring > Nodes** to see every node in the cluster.
You need the **Manage Nodes** application permission.

[Nodes and clusters]({{< relref "../concepts/nodes-and-clusters.md" >}}) explains what each node holds of its own and what they share, which is what decides whether a job needs to run on all of them.

| Column | What it shows |
|---|---|
| **Name** | The node's name, from its configuration file. |
| **Cluster Base Endpoint** | The URL other nodes use to reach this one. |
| **Build Version** | The version of Stroom the node is running. |
| **Ping (ms)** | How long the node took to answer. |
| **Up Date** | When the node last started. |
| **Master** | Whether this node is currently the master. |
| **Priority** | How likely the node is to be chosen as master. Higher wins. |
| **Enabled** | Whether the node takes part in processing and background jobs. |

**Priority** and **Enabled** can be changed directly in the table.
Everything else comes from the node itself.

A node's name is set by `stroom.node.name` in its configuration file.
It can't be set from the user interface and should not change once set.
The name is recorded in the `ReceiptId` of data the node receives, so if one Stroom cluster forwards to another, node names should be unique across both.

A node's endpoint URL is built from `stroom.nodeUri` when the node starts.
Nodes call each other on this URL to distribute searches and processing, so every node must be able to reach every other node's endpoint.
If a node shows no ping, it can't be reached.

One node is the **master**.
It holds the queue of processing tasks and hands tasks out to the other nodes.
Give each node a different **Priority** so that it is clear which node will take over as master.


### Node groups

A **node group** is a named set of nodes, managed from **Monitoring > Node Groups**.
Node groups are used by processing profiles to decide which nodes may process which data, and when.
See [Processing]({{< relref "../concepts/processing/_index.md" >}}).


## Jobs

Open **Monitoring > Jobs** to see Stroom's background jobs.
You need the **Manage Jobs** application permission.

The top half lists each job with its description and an **Enabled** tick box.
Select a job and the bottom half lists every node, each with its own **Enabled** tick box, schedule and task counts.
A job only runs on a node when it is enabled both for the job as a whole and for that node, so you can choose which nodes do which work.

{{% note %}}
On a new cluster, most jobs are created enabled.
The exceptions are the ones that do work you have to choose: pipeline processing (**Processor Task Creator** and **Data Processor**), diagnostics such as **Orphan File Finder**, and jobs for features you may not use, such as **S3 Event Notifications Poll**.
The **On by default** column in [Scheduled jobs]({{< relref "../reference/jobs.md" >}}) gives each one.
(Setting `stroom.job.enableJobsOnBootstrap` creates processing and most of the other exceptions enabled too.
It is meant for demonstration systems, not for production.)
{{% /note %}}


### Schedules

Each job runs in one of three ways:

* **Frequency**: every fixed interval, written as a number and a unit, such as `10s`, `10m`, `1h` or `1d`.
* **Cron**: at set times, written as a [cron expression]({{< relref "../reference/cron.md" >}}) with a seconds field first.
  For example, `0 0 0 * * ?` runs at midnight every day.
* **Distributed**: no schedule.
  The node takes tasks whenever it has capacity and work is waiting.
  Only processing jobs work this way.

Frequency and cron schedules are set per node, using **Edit Schedule** in the node list.
For a distributed job, **Max Tasks** sets how many tasks the job may run at once on that node, and **Current Tasks** shows how many it is running now.


### Key jobs

There are many jobs.
These are the ones you are most likely to adjust:

| Job | Type | What it does |
|---|---|---|
| **Data Processor** | Distributed | Runs pipeline processing tasks. **Max Tasks** sets how many the node runs at once. |
| **Processor Task Creator** | Frequency (`10s`) | Creates processing tasks from processor filters. |
| **Policy Based Data Retention** | Cron (daily, midnight) | Deletes streams that are older than the data retention rules allow. |
| **Data Delete** | Cron (daily, midnight) | Physically removes deleted streams and their files once they have been deleted for longer than `stroom.data.store.deletePurgeAge`. |
| **Index Shard Retention** | Frequency (`10m`) | Marks index shards as deleted once they pass their index's retention period. |
| **Index Shard Delete** | Cron (daily, midnight) | Removes deleted index shards from disk. |
| **Doc Store - Physical Delete** | Cron (daily, midnight) | Removes deleted documents. See [Content management]({{< relref "../guides/content-management.md" >}}). |
| **Git Repo Push** | Cron (every minute) | Pushes changes for Git Repos set to push automatically. |
| **Account Maintenance** | Frequency (`1d`) | Marks unused accounts as inactive. |
| **Property Cache Reload** | Frequency (`1m`) | Reloads property values across the cluster. |

[Data retention]({{< relref "../concepts/streams/_index.md#data-retention" >}}) rules themselves are set on **Administration > Data Retention**, which needs the **Manage Policies** permission.

The schedules above are the defaults Stroom creates jobs with.

Every job Stroom runs, generated from the source, is listed in [Scheduled jobs]({{< relref "../reference/jobs.md" >}}).


## Properties

Properties configure Stroom: database connections, paths, cache sizes, timeouts and the behaviour of every feature.
Open **Administration > Properties** to see them.
You need the **Manage Properties** application permission.

Each property has a dotted name, such as `stroom.export.enabled`, and a description.
Opening a property shows its **Default Value**, **Database Value**, **Node YAML Value** and **Node Effective Value**, its **Data Type**, and flags for **Read Only**, **Requires Restart** and **Requires UI Refresh**.


### Where a value comes from

A property can get its value from three places:

1. **Default**: built into Stroom.
1. **Database**: set in the Properties screen with **Set Database value**.
   It applies to every node in the cluster.
1. **YAML**: set in a node's configuration file.
   It applies to that node only.

Each source overrides the one above it.
A YAML value beats a database value, and a database value beats the default.
Setting a YAML value to null counts as setting it, so it overrides the database value too.

| Source | Node 1 | Node 2 |
|---|---|---|
| Default | `red` | `red` |
| Database | `green` | `green` |
| YAML | not set | `blue` |
| **Effective** | **`green`** | **`blue`** |

Use database values for settings that should be the same across the cluster, and keep YAML for settings that belong to one node or that Stroom needs before it can reach the database.
**Read Only** properties can only be set in YAML.


### The configuration file

Stroom's properties live under the `appConfig` key of each node's YAML file.
The `stroom` at the start of a property name becomes `appConfig`, and each further part becomes a nested key, so `stroom.contentPackImport.enabled` is set like this:

```yaml
appConfig:
  contentPackImport:
    enabled: true
```

The file supports environment variables, written as `${ENV_VAR_NAME:-default}`, which suits scripted deployments.
Its other sections (`server`, `logging` and `jerseyClients`) configure the web server, logging and HTTP clients.
They are not properties and can only be set in the file.


### When a change takes effect

Most database values are picked up by every node without a restart.
Properties marked **Requires Restart** only take effect once every node has been restarted.
Properties marked **Requires UI Refresh** need the nodes that serve the user interface to be restarted.


### Value formats

Durations accept ISO 8601 (`P30D`, `PT30S`) or the older short form (`30d`, `10m`, `30s`).
Byte sizes accept units such as `512KiB` or `32MiB`.
Lists are written in the Properties screen with their delimiter first, such as `|red|green|blue`.
Relative paths are resolved against `stroom.path.home`.

{{< timing mode="async" >}}
A property change does not always take effect at once: some apply immediately across the cluster, some when the node next reads its configuration, and some only on restart.
The page above says which.

Enabling a job does not run it.
It runs when its schedule is next due.
{{< /timing >}}

{{< verify >}}
After changing a property, check the value the node is actually using rather than the value you typed: the effective value is shown per node, and a cluster can disagree with itself.

After enabling a job, check it has run, by looking for its effect or at the job's last execution.

{{< golden >}}
**Every node reports the effective value you intended.**

One node reading an old value is the failure that produces intermittent behaviour, and it is invisible unless you look per node rather than at the cluster.
{{< /golden >}}

{{< not-proof >}}
**A saved property is not an applied property.**
Some need a restart, and the screen does not refuse the change meanwhile.

**An enabled job is not a job that has run.**
Check its last execution before concluding the work is happening.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A disabled job looks exactly like a healthy system doing nothing.**

Nothing reports it.
The queue grows, retention never runs, data never merges, and no screen says why.
It is an easy state to reach after maintenance, and it is worth checking the job list before investigating anything that looks like slowness.
{{< /trap >}}

{{< diagnose >}}
1. **Is the job enabled, on every node?**
   Some jobs run on one node, some on all.
   A job enabled centrally but disabled on the node that would run it does nothing.
1. **Has its schedule come round?**
   Check the last execution time before assuming failure.
1. **Does the effective property value match what you set?**
   Check per node.
   See above.
1. **Does the change need a restart?**
   The property's own description says so.
1. **Is the node healthy and enabled?**
   A node that is disabled, or that cannot reach the database, takes no work and reports nothing on the screens you are looking at.
1. **Check the application log on the node that would have done the work**, which on a cluster is usually not the node serving your UI session.
   See [Reading the logs]({{< relref "troubleshooting/reading-the-logs.md" >}}).
{{< /diagnose >}}


## Related pages

* [Processing]({{< relref "../concepts/processing/_index.md" >}}): processor filters, processing profiles and task limits.
* [Volumes]({{< relref "../concepts/volumes.md" >}}): where nodes store data and indexes.
* [Users, groups and permissions]({{< relref "users-and-permissions.md" >}}): the permissions these screens need.
* [Content management]({{< relref "../guides/content-management.md" >}}): Git Repos, import and export.

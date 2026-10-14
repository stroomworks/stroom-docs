---
title: "Nodes and Clusters"
linkTitle: "Nodes and Clusters"
weight: 112
date: 2026-10-14
tags:
description: >
  What every node has of its own, what they share, and the few things that have to be true across all of them.
pageKind: concept
aliases:
  - /docs/architecture/
---

A Stroom cluster is several nodes running **the same software**, pointed at **one database**.
There is no separate controller and no per-node build.
What makes one node different from another is its configuration file and which jobs are enabled on it.

{{< image src="concepts/nodes-and-clusters/cluster-shape.svg" alt="Two nodes side by side, each holding its own reference data store, Plan B shards, caches and index writers. Node A holds the task queue; node B asks it for work. Arrows run from both nodes down to one shared database holding metadata, processing state, users, jobs and locks, and to volumes which may be local or shared. A note says the same software runs on every node and only the enabled jobs differ." >}}Everything the nodes agree about passes through the database. Everything else is local, and two nodes can disagree without either of them being wrong.{{< /image >}}


## What each node has of its own

* **The reference data store.**
  Loaded on demand, per node.
  A lookup can succeed on one node and fail on another.
* **Plan B shards**, written locally and merged.
  See [Plan B]({{< relref "planb.md" >}}).
* **Caches**, including the property cache, which is why a change made on one node reaches the others only when they next reload.
* **Index writers**, and whichever index shards that node owns.
* **Its own temporary and home directories.**

This is why so many jobs have to run on **every** node: the work is local, and a job switched off on one node stops that node's share of it while the cluster carries on looking healthy.
See [Scheduled jobs]({{< relref "../reference/jobs.md" >}}).


## What they share

**The database**, and only the database.
It holds stream metadata, processing state, users and permissions, job definitions, configuration overrides, and the cluster locks that stop two nodes doing the same cluster-wide job at once.

**Volumes** may be local to a node or on shared storage, and that is a deployment choice rather than something Stroom decides.
The database always knows which volume a stream is on; whether another node can reach it is up to how you mounted it.


## The master node

One node is the master.
In the default configuration it holds the processor task queue in memory and hands work to the others, which is why the Nodes screen marks it and why losing it briefly pauses task distribution rather than processing already under way.

Its role is narrowing.
With `stroom.processor.claimTasksOnWorker` turned on, each worker finds and claims its own tasks straight from the database and the master leaves the processing path entirely.
That setting is experimental, off by default, and **must be identical on every node**: the two modes use different task states and cannot see each other's work in flight, so changing it means stopping the whole cluster, changing it everywhere, and starting again.
A mixed cluster leaves tasks unprocessed.


## What has to be true everywhere

* **One database.**
  Two nodes pointed at different databases both appear to work and never see each other's data.
* **Clocks in step.**
  Event times, task heartbeats and lock expiry all depend on time.
  A node a few minutes out writes data that searches for "the last hour" will miss, and takes tasks other nodes consider expired.
* **The same Stroom version.**
  Nodes share a schema, so a cluster part-way through an upgrade is a cluster running two versions against one database.
* **The same receipt check mode**, if proxies are involved, along the whole chain.
  See [Data receipt]({{< relref "data-receipt.md" >}}).


## Adding a node

A new node writes its own job rows when it first starts, taking each job's default, which is why one added later comes up running everything the others do.
What it does **not** inherit is anything you changed by hand on the existing nodes, so a job you disabled everywhere is enabled again on the newcomer.

[Nodes, jobs and properties]({{< relref "../operate/nodes-and-jobs.md" >}}) covers managing them, and [Requirements]({{< relref "../operate/install/requirements.md" >}}) covers sizing before you build one.

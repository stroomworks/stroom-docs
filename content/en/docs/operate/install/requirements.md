---
title: "Requirements"
linkTitle: "Requirements"
weight: 10
date: 2026-10-14
tags:
description: >
  Java, the database, and how to size a cluster before you build one.
pageKind: operate
verification: required
---

## Java

Stroom and Stroom Proxy are Java applications.
This release is built and tested against **Java 25**, using the Adoptium (Eclipse Temurin) distribution.

Temurin is the distribution to prefer unless your organisation standardises on another: it is free, open source, and its long-term support releases are supported for years rather than months.

A JRE is enough to run Stroom.
A full JDK is worth having anyway, because the tools that come with it are what you will want when you need to look at a heap or a thread dump, and installing a JDK during an incident is a poor use of the time.


## The database

Stroom needs **MySQL 8**.
One database serves the whole cluster: you do not need one per node, and running one per node would not work, since the database is how nodes agree with each other about streams, tasks and locks.

Two settings matter more than the rest:

* **Connection limits.**
  Every Stroom module opens its own connection pool, and every node runs every module, so the total the database must allow is the per-module pool size multiplied by the number of modules and then by the number of nodes.
  Running out of connections looks like unrelated failures all over Stroom.
  See the database block in [Configuration properties]({{< relref "../../reference/configuration-properties.md" >}}).
* **Durability.**
  Whether a committed transaction survives a power failure is the database's business, not Stroom's.
  Stroom does not set `innodb_flush_log_at_trx_commit`, so if that guarantee matters to you, set it deliberately.


## Storage

Three kinds of storage, with different characteristics:

| What | Grows with | Notes |
|---|---|---|
| The database | Number of streams, tasks and documents | Small relative to the rest, but latency-sensitive |
| Data volumes | Volume of data received, and retention | The bulk of it. Append-mostly, so incremental backup works well |
| Index volumes | What you index and how much you store | Rebuildable by reprocessing, at the cost of time |

Plan B state stores and the reference data store are local to each node and use memory mapped files, so they want fast local storage rather than anything networked.


## Sizing a cluster

Nodes are not all alike in what they do, even though they run the same software.
A node can be serving the user interface, processing pipeline tasks, holding index shards and answering searches, and those compete.

The practical starting point is to separate the work people wait for from the work they do not: keep user interface and search responsive by not having those nodes also carry the heaviest processing.
Which jobs run where is part of that decision, and [Scheduled jobs]({{< relref "../../reference/jobs.md" >}}) says which jobs must run everywhere and which need only one node.

{{< timing mode="async" >}}
A first start on an empty database runs every migration before the application becomes available, which on a large database is minutes rather than seconds.

Running the migration as its own step first turns that into something you can watch and time, rather than a long silence at startup.
See [Command line tools]({{< relref "../../guides/automation/command-line.md" >}}).
{{< /timing >}}

{{< verify >}}
With one node running, open the user interface and the admin port's health endpoints, and confirm the node reports itself healthy and appears on the Nodes screen.

{{< golden >}}
**The node appears on the Nodes screen and its health endpoints report healthy.**

Both, because they test different things.
The health endpoints say the process came up; the Nodes screen says it reached the database and registered itself, which is the half that proves the configuration is right.
{{< /golden >}}

{{< not-proof >}}
**A node that starts is not proof the database is correctly sized.**
Connection limits produce failures under load, not at startup.

**One node working is not proof the cluster will.**
Nodes must share one database and agree on time; the second node is where mistakes about both become visible.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Nodes whose clocks disagree produce data that is hard to find.**

Event times, task heartbeats and lock expiry all depend on time.
A node a few minutes off writes data that searches for "the last hour" will miss, and takes tasks that other nodes consider expired.
Nothing reports it as a clock problem.

Run time synchronisation on every node, and treat a node with an odd clock as a fault rather than a curiosity.
{{< /trap >}}

{{< diagnose >}}
1. **Can the node reach the database?**
   The commonest first-start failure, and the message is in that node's logs rather than in the user interface.
1. **Is it the right Java?**
   A version older than the one Stroom is built against fails at class load, with an error that does not obviously say so.
1. **Are the volumes present and writable by the user running Stroom?**
   A volume that is mounted read-only produces errors that read like corruption.
1. **Do all nodes share one database?**
   Two nodes pointed at different databases appear to work and never see each other's data.
1. **Are the clocks in step?**
   Compare them directly rather than assuming.
1. **Did the migration finish?**
   A long first start is usually migration, not a hang.
   The logs say which migration is running.
{{< /diagnose >}}

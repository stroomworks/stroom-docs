---
title: "SQL Temporal Store"
linkTitle: "SQL Temporal Store"
weight: 122
date: 2026-10-14
tags:
description: >
  A temporal key-value store held in the database, which unlike the other two can be corrected in place.
pageKind: concept
---

A **SQL Temporal Store** holds values keyed by a map name, a key and an effective time, in Stroom's database.
A pipeline loads it, and translations and queries look values up from it by the time of the event being processed.

That description also fits [reference data]({{< relref "pipeline-reference-data.md" >}}) and [Plan B]({{< relref "planb.md" >}}), and the three really are alternatives for the same job.
What separates this one is that **its contents can be edited in place**.


## Why that matters

Reference data and Plan B are both derived: reference data is rebuilt from the streams that loaded it, and a Plan B shard is merged from what was written to it.
Correcting either means fixing the source and reloading.

A SQL Temporal Store holds the data itself.
Entries can be added, changed and removed directly, and the change is the record rather than a step towards one.
That suits facts that are maintained by people rather than produced by a feed: a list of sites, who owns an asset, what a room is called.

It is also why floor maps use one for their facts.
See [Floor mapping]({{< relref "floor-mapping.md" >}}).


## Choosing between the three

| Use | When |
|---|---|
| **Reference data** | The facts arrive as a feed and the volume is modest. Loads lazily, so you pay only for what is looked up |
| **Plan B** | Very high lookup rates, or large state written by many nodes. Node-local and built for speed |
| **SQL Temporal Store** | The facts are maintained rather than fed, and being able to correct a single entry matters more than throughput |

The last row is the deciding one.
If nobody will ever hand-correct an entry, one of the other two is usually a better fit.

{{< image src="concepts/sql-temporal-store/three-stores.svg" alt="Three panels comparing the stores. Reference data is loaded by a reference feed, lives in an off-heap store on each node, and is corrected by fixing the feed and reloading. Plan B is loaded by a pipeline per node, lives in local shards read as snapshots, and is corrected by rewriting the source and re-merging. The SQL Temporal Store is loaded by a pipeline or by hand, lives in the shared database, and is corrected by editing the entry in place." >}}The first two are derived and have to be rebuilt from their source. The third holds the data itself, which is why an entry can be corrected on its own.{{< /image >}}

Because it lives in the database, it does not scale the way Plan B does.
It is sized for the sort of data a person could plausibly maintain, not for millions of entries changing constantly.


## How data gets in and out

**In**, from a pipeline: an {{< pipe-elm "XSLTFilter" >}} produces the same `reference-data:2` format a reference loader produces, and {{< pipe-elm "SqlStoreFilter" >}} writes it to the store.

**In**, by hand: the store's own screens let entries be added, changed and removed, including from the API.

**Out**: `stroom:lookup()` from XSLT, exactly as for reference data and Plan B, resolving against the event's effective time.
The store's **Data** tab also queries it directly, and has a **Create Dashboard** button that turns the query you are looking at into a dashboard.
See [Building a dashboard]({{< relref "../guides/searching/building-a-dashboard.md" >}}).


## The temporal part

Entries are keyed by effective time, so a lookup returns what was true when the event happened rather than what is true now.
That is the same rule as reference data, and the same trap: correcting a value today does not change how events from last week are enriched.

[Effective times]({{< relref "../guides/reference-data/effective-times.md" >}}) explains the rule and how to test it.
It applies here unchanged.

---
title: "Troubleshooting"
linkTitle: "Troubleshooting"
weight: 60
date: 2026-10-14
tags:
description: >
  Start from the symptom. This page routes you to the component that is actually failing.
pageKind: concept
---

Stroom moves data through several components, so a symptom often shows up a long way from its cause: a [dashboard]({{< relref "../../concepts/dashboards.md" >}}) with no rows can be an [index]({{< relref "../../concepts/lucene-index.md" >}}) question, a [translation]({{< relref "../../concepts/translation.md" >}}) question, a [processor]({{< relref "../../concepts/processing/_index.md" >}}) question, or simply a [feed]({{< relref "../../concepts/feed.md" >}}) not yet set to receive.
Once you know which component to look at, the answer is usually quick.

So start here and follow the symptom.


## Is it working at all?

If the question is "is this working?" rather than "why is this broken?", the ordered checks in [Checking it works]({{< relref "../checking-it-works/_index.md" >}}) are the faster route.
Each one ends with a diagnostic sequence for when the answer is no, and between them they cover the main data path: arriving, processing, searching.

This section is for the problems that do not fit in that path: a component misbehaving in its own particular way.


## Symptom index

| Symptom | Where to look |
|---|---|
| The sender gets an error, or data never appears on the feed | [Is data arriving?]({{< relref "../checking-it-works/is-data-arriving.md" >}}) |
| Data is on the feed, no output is produced | [Is data processing?]({{< relref "../checking-it-works/is-data-processing.md" >}}) |
| A search returns nothing, or a dashboard is empty | [Is search working?]({{< relref "../checking-it-works/is-search-working.md" >}}) |
| Searches are wrong on one field, or a shard says `CORRUPT` | [Index problems]({{< relref "index-problems.md" >}}) |
| Lookups return nothing, a store is full, or a schema mismatch is reported | [Plan B problems]({{< relref "plan-b-problems.md" >}}) |
| A floor map is blank, or draws the layout but no entities | [Floor map problems]({{< relref "floor-map-problems.md" >}}) |
| Data reached a proxy and stopped there | [Proxy problems]({{< relref "proxy-problems.md" >}}) |
| Everything works but slowly, or a backlog is growing | [Performance and queues]({{< relref "performance-and-queues.md" >}}) |
| You need the detail that is not on any screen | [Reading the logs]({{< relref "reading-the-logs.md" >}}) |


## Two rules that save time

**Find the error stream before forming a theory.**
Most processing failures write one, and it names the element that failed and usually why.
[Pipeline debugging]({{< relref "../../concepts/pipeline-debugging.md" >}}) shows how to read one and step through the input that caused it.
Reading it takes a minute; guessing takes an afternoon.

**Change one thing.**
Stroom has enough asynchronous moving parts that two simultaneous changes make the result uninterpretable: you will not know which one worked, and if the problem comes back you will not know what to undo.

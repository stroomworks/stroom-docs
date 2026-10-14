---
title: "Reference Data"
linkTitle: "Reference Data"
weight: 40
date: 2026-10-14
tags:
description: >
  Enriching events with data that lives somewhere else, and getting the right value for the time the event happened.
pageKind: concept
aliases:
  - /docs/user-guide/pipelines/reference-data/
---

Reference data answers questions an event cannot answer about itself.
The event says a login came from host `10.1.4.7`; reference data says that host was a build server in Cardiff, owned by a team that no longer exists.
Joining the two is what turns a log line into something worth searching.

In Stroom this is a lookup during translation.
A reference feed is loaded into a store, and an XSLT translating event data calls {{< stroom-icon "function.svg" >}} `stroom:lookup()` to pull values out of it.


## The three parts

* **A reference feed**, sent to Stroom like any other data, holding the facts: host to location, user to department, asset to owner.
* **A reference loader pipeline**, which translates that feed into the `reference-data:2` format and loads it with {{< pipe-elm "ReferenceDataFilter" >}}.
* **An event pipeline**, whose {{< pipe-elm "XSLTFilter" >}} names the loader as a reference source and calls `stroom:lookup()` while translating.

[Building a reference feed]({{< relref "building-a-reference-feed.md" >}}) covers the first two, and [Looking up values]({{< relref "looking-up-values.md" >}}) the third.


## The part that catches people

Reference data is not a single current value.
Every reference stream has an **effective time**, and a lookup is resolved against a lookup time.
Unless the XSLT passes the event's own time, that lookup time is when the stream being processed was received, not when the event happened.

Passing the event's time is usually what you want: an event from March should be enriched with what was true in March, not with what was true when its stream arrived.
The default is also the source of most reference data confusion, because a lookup that is plainly correct for data sent today can be plainly wrong for late or back-filled data.

[Effective times]({{< relref "effective-times.md" >}}) is the page to read before debugging a lookup that "returns the wrong value".

Reference data is not the only option.
[Plan B]({{< relref "../../concepts/planb.md" >}}) suits very high lookup rates, and a [SQL Temporal Store]({{< relref "../../concepts/sql-temporal-store.md" >}}) suits facts that people maintain by hand, because its entries can be corrected one at a time.


## Where the data lives

Loaded reference data lives in an off-heap store on each node, not in the database and not in the streams.
It is rebuildable, which means it can be purged and reloaded, but it is **not** cleared by clearing caches: it has its own retention and its own purge job.
See [Purge reference data]({{< relref "../../operate/resetting/purge-reference-data.md" >}}).

The store being per node matters: each node loads what it needs, on demand, so a lookup can behave differently on two nodes if one of them failed to load a stream.

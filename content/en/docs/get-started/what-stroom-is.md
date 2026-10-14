---
title: "What Stroom Is"
linkTitle: "What Stroom Is"
weight: 10
date: 2026-10-14
tags:
description: >
  What the product does, what it is for, and what it is not.
pageKind: concept
---

Stroom collects machine data, turns it into a consistent shape, stores it, and lets you search and alert on it.
Most of its users are doing security monitoring, audit or investigation, where the questions are asked months after the data arrived.


## The shape of it

Data arrives on a **[feed]({{< relref "../concepts/feed.md" >}})**, which is a named channel and a security boundary.
It is stored exactly as it was sent, as a **[stream]({{< relref "../concepts/streams/_index.md" >}})**, and that original is never altered.

A **[pipeline]({{< relref "../concepts/pipelines.md" >}})** reads a stream and turns it into something structured: a [parser]({{< relref "../concepts/translation.md" >}}) makes XML events out of whatever the source sent, an XSLT reshapes those events into a common schema, and the result is written to a new stream.
Nothing is overwritten, so a translation can be fixed and the data re-run.

From there the structured events can be **[indexed]({{< relref "../concepts/lucene-index.md" >}})** for fast search, written to a **[state store]({{< relref "../concepts/planb.md" >}})** for enrichment lookups, or sent somewhere else entirely.

You then ask questions of it, through a **[dashboard]({{< relref "../concepts/dashboards.md" >}})**, a **[query]({{< relref "../concepts/query-language.md" >}})**, or an **[analytic rule]({{< relref "../guides/detection/analytic-rules.md" >}})** that watches for a pattern and raises an alert.


## What makes it different

**It keeps the original.**
Stroom stores what the sender actually sent, alongside whatever it was turned into.
If a translation turns out to be wrong, the raw data is still there and can be reprocessed.
A system that normalises on ingest and discards the original cannot do that.

**It runs where you put it.**
Your own data centre, your own cloud, or an air-gapped network with no route out.
There is no requirement to send anything to anyone.

**It is free and open source**, under the Apache 2.0 licence.


## What it is not

It is not a hosted service you point an agent at and forget.
Somebody has to run it, and somebody has to write the translation that turns your particular log format into events.
That work is real, and most of this documentation exists because of it.

It is also not a dashboarding tool with a database behind it.
The pipeline model is the product: if you only want charts over data that is already clean, Stroom is more machinery than you need.


## What you will do next

[Install it for evaluation]({{< relref "install-for-evaluation.md" >}}), and then send it some data.

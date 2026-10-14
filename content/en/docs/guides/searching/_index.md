---
title: "Searching"
linkTitle: "Searching"
weight: 70
date: 2026-10-14
tags:
description: >
  Asking questions of indexed data, and getting back values the index does not hold.
pageKind: concept
aliases:
  - /docs/user-guide/search/
  - /docs/user-guide/search/data-sources/
  - /docs/user-guide/search/data-sources/internal-data-sources/
  - /docs/user-guide/search/data-sources/stat-data-source/
  - /docs/user-guide/search/queries/
  - /docs/user-guide/search/search-extraction/
---

Searching in Stroom starts from an index and ends, often, back at the original data.
A query finds the events that match; an extraction pipeline fetches the fields the index did not store; a table or visualisation shows the result.

There are two ways to ask:

* **A dashboard**, built from a query expression and one or more tables and visualisations.
  Interactive, and the usual starting point.
* **A query**, written in [Stroom Query Language]({{< relref "../../reference/stroom-query-language.md" >}}), which expresses the same thing as text and can be saved, scheduled and shared.

They reach the same data.
A dashboard is easier to explore with; StroomQL is easier to review, version and reuse.


## What to read

* [Building a dashboard]({{< relref "building-a-dashboard.md" >}}) covers the first useful result: source, query, table, time range.
* [Finding the original event]({{< relref "finding-the-original-event.md" >}}) covers extraction, which is how a search result becomes the raw event it came from.

[Dashboards]({{< relref "../../concepts/dashboards.md" >}}) in Concepts explains why a table is required before a visualisation, and how data flows through a dashboard.


## Time is the first filter

Every search is bounded by time, and the bound is on the **event time** recorded during translation, not on when the data arrived or was processed.

That distinction is the source of most "my data is missing" reports.
Data received today but describing last week is found by searching last week.
If translation did not set an event time, the value used is whatever the pipeline defaulted to, which is worth knowing before concluding the data is absent.

---
title: "Building a Dashboard"
linkTitle: "Building a Dashboard"
weight: 10
date: 2026-10-14
tags:
description: >
  From an empty dashboard to a table of real results, and knowing the results are complete.
pageKind: guide
verification: required
aliases:
  - /docs/user-guide/search/dashboards/
  - /docs/user-guide/search/dashboards/direct-urls/
  - /docs/user-guide/search/dashboards/internal-links/
  - /docs/user-guide/search/dashboards/queries/
---

A dashboard is a document like any other.
It holds a query, and components that display what the query returns.


## The quickest route

If you already have a query that returns what you want, you do not have to build the dashboard by hand.
The **Data** tab of an Index, a Plan B store, a SQL Temporal Store and a FloorMap Event Store each has a **Create Dashboard** button, which makes a dashboard from the query currently in the tab.

It carries over both the query and the table's column setup, so the dashboard opens showing what you were already looking at.
From there you add visualisations and the rest as normal.

This is worth knowing before building one from scratch, because exploring in a Data tab and then promoting the result is usually faster than configuring a dashboard and then working out the query inside it.

For what a particular store can and cannot answer, and what has to be in place before it will return anything, see [A dashboard from a store]({{< relref "../dashboard-from-a-store.md" >}}).


## Building one from scratch

1. **Create the Dashboard document** where the people who need it can read it.
1. **Set the data source** on the query component: the index or view you are searching.
1. **Build the expression.**
   Terms combine with `AND`, `OR` and `NOT`.
   Start with one term you are confident matches, rather than the full expression you eventually want.
1. **Set the time range.**
   Searches are bounded by event time, and a range of "last hour" over a backfill finds nothing.
1. **Add a table** and choose its columns.
   A table is required before a visualisation, because visualisations draw what a table produces.
1. **Run it**, then narrow.

Building up from one term is worth the discipline.
An expression assembled all at once that returns nothing gives you no information about which part is wrong.

{{< image src="guides/searching/building-a-dashboard/StroomDashboardMidConstruction.png" alt="A Stroom dashboard of sign-ins, being built. On the left, the query expression that feeds everything else. On the right, a bar chart of failed sign-ins by day, and below it a table of accounts with failures, successes, sources and countries. Every account and event shown is synthetic." >}}A dashboard part-built: the query feeds the table, and the table feeds the chart. Nothing draws until the table returns rows.{{< /image >}}

{{< timing mode="immediate" >}}
Results begin arriving while the search is still running, and the table fills progressively.
A result count that is still climbing is a search in progress, not a finished answer, which matters when you are comparing counts.

Searches over long ranges or many shards take proportionally longer.
The query component shows when the search is complete.
{{< /timing >}}

{{< verify >}}
Compare one result in the dashboard against the original data: open the underlying stream and confirm the event is there and its field values match the row.

{{< golden >}}
**One row in the table matches the event in the source stream, field for field.**

This checks the whole path at once: the index holds what you think, the extraction is returning the right record, and the columns are mapped to the fields you meant.
{{< /golden >}}

{{< not-proof >}}
**Results appearing is not proof the search is complete.**
A search still running shows a partial table that looks exactly like a finished small one.

**A count matching your expectation is not proof the expression is right**, if the time range happens to exclude the cases that would disagree.
Widen the range and see whether the count moves as you predict.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**An empty result is the same shape whether nothing matched or you cannot see it.**

Permissions are applied per feed.
A dashboard run by someone without access to a feed returns no rows from it and says nothing about why, so two people running the same dashboard can legitimately get different answers.

When a result looks short, compare it with someone who has broader access before investigating the query.
{{< /trap >}}

{{< diagnose >}}
1. **Is the time range right?**
   On event time, not receipt time.
   The single most common cause.
1. **Does one term on its own return anything?**
   Strip the expression back until it does, then add terms until it stops.
1. **Is the term an exact match on an analysed field, or the reverse?**
   See [Choosing fields]({{< relref "../indexing/choosing-fields.md" >}}).
1. **Is the data indexed at all?**
   Search without any term over a wide range.
   Nothing there means the problem is indexing, not the query.
1. **Can you read the feeds?**
   Ask someone with wider permission to run the same search.
1. **Has the index been flushed?**
   Recent data not yet flushed is invisible to search.
{{< /diagnose >}}

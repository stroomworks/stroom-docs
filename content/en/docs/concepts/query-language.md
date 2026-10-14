---
title: "StroomQL and Data Sources"
linkTitle: "StroomQL and Data Sources"
weight: 125
date: 2026-10-14
tags:
description: >
  Write searches as text with the Stroom Query Language, and choose what they run against, from indexes and views to Stroom's own internal data.
pageKind: concept
---

The Stroom Query Language (StroomQL) describes a search as plain text: which data source to read, which events to keep, what to calculate, and how to group, sort and show the result.
It is the language of the **Query** document, and of [analytic rules]({{< relref "../guides/detection/analytic-rules.md" >}}), which are StroomQL queries that Stroom keeps running for you.

The full syntax, with every keyword and its options, is in [Stroom Query Language]({{< relref "../reference/stroom-query-language.md" >}}).
This page is about what the pieces are for.


## A first query

```text
from "Authentication Events"
where Outcome = "Failure"
and EventTime > now() - 1d
select EventTime, UserId, SourceHost
```

This reads the data source called `Authentication Events`, keeps the failed log-ons from the last day, and returns three columns.

A query that counts and groups:

```text
// Accounts with the most failed log-ons today
from "Authentication Events"
where Outcome = "Failure"
and EventTime > day()
eval failures = count()
eval hosts = countUnique(SourceHost)
group by UserId
sort by failures desc
having failures > 10
limit 20
select UserId, failures, hosts
```


## Keywords

Every query starts with `from`.
Keywords are not case-sensitive.
Field names are.

| Keyword | What it does |
|---|---|
| `from` | The one data source to query. Required, and always first. |
| `where` | Conditions applied by the data source itself, such as an index. This is the fast way to narrow a search. |
| `eval` | Assigns the result of an expression to a named variable, for example `eval failures = count()`. |
| `window` | Groups rows by a time field and a window size, for example `window EventTime by 1d`. Add `advance` to slide the window by a different step. |
| `filter` | Conditions applied after the data has been retrieved. It works on fields the index doesn't hold, but it is slower than `where`. |
| `group by` | Collapses rows by one or more columns. A second `group by` line makes a nested group. |
| `sort by` | Sorts by one or more columns, `asc` (the default) or `desc`. |
| `having` | Conditions applied after grouping, on aggregated values. |
| `limit` | The maximum number of rows to return. |
| `select` | The columns to return. `as` gives a column a display name: `select UserId as "User"`. |
| `show` | Draws the result with a [visualisation]({{< relref "visualisations.md" >}}), passing columns to its controls. |

Stroom checks the order of the keywords.
Write them in this order: `from`, `where`, `eval`, `window`, `filter`, `group by`, `sort by`, `having`, `limit`, `select`, `show`.
You can repeat `eval` and `group by`.
Put `select` after `limit`, and `show` after `select`.


### Conditions

`where`, `filter` and `having` take conditions joined with `and`, `or` and `not`, with brackets to group them:

```text
where UserId = "jbloggs"
and (Feed = "VPN-EVENTS" or Feed = "PROXY-EVENTS")
```

The conditions are `=`, `!=`, `>`, `>=`, `<`, `<=`, `is null`, `is not null`, `between ... and ...`, `in (...)` with a comma-separated list, and `in dictionary`, which matches the values held in a [Dictionary]({{< relref "dictionary.md" >}}):

```text
where UserId in dictionary "Privileged Accounts"
```


### Fields, quoting and comments

* A field name with spaces goes inside `${...}`, for example `${Event Time}`.
  Without spaces, the braces are optional.
* A data source name with spaces is quoted: `from "Authentication Events"`.
* `//` starts a comment that runs to the end of the line, and `/* ... */` comments out a block.
  Commenting out a line is a quick way to try a query with and without it.


## Expressions and functions

`eval` and `select` take expressions built from Stroom's [expression functions]({{< relref "../reference/expression-functions.md" >}}), the same functions dashboard table columns use.
They are grouped as aggregate, cast, date, link, logic, lookup, mathematics, parameter, selection, string, type checking, URI and value functions.
A few examples:

| Expression | Result |
|---|---|
| `count()` | The number of rows in the group. |
| `countUnique(SourceHost)` | The number of distinct values in the group. |
| `floorDay(EventTime)` | The time rounded down to the start of its day. |
| `upperCase(UserId)` | The value in upper case. |
| `substringBefore(UserId, '.')` | The part of the value before the first `.`. |
| `concat(FirstName, ' ', LastName)` | The values joined together. |

Functions nest, and a variable can be reused in a later `eval`.
Every field in the data source is available as a variable without declaring it.


## Data sources

A query reads from one data source.
What it can return depends on the kind of source:

* **Index**: a [Lucene index]({{< relref "lucene-index.md" >}}) built by an indexing pipeline.
  This is where most event searches run.
  Elasticsearch and Solr indexes are queried the same way.
* **View**: a document that pairs a data source with an extraction pipeline (see below).
* **Plan B**: a [Plan B]({{< relref "planb.md" >}}) state store.
* **Statistics**: a statistics store.
* **Internal data sources**: Stroom's own records, which appear at the root of the data source picker rather than in the explorer tree.

The internal data sources are:

| Data source | Each row is |
|---|---|
| **Stream Store** | A [stream]({{< relref "streams.md" >}}), with its feed, type, status, sizes and processing counts. |
| **Processor Tasks** | A [processing task]({{< relref "processing.md" >}}), with its status, node and timings. |
| **Annotations** | An [annotation]({{< relref "../guides/detection/annotations.md" >}}). |
| **Index Shards** | A Lucene index shard, with its size, document count and status. |
| **Plan B Shards** | A Plan B shard. |
| **Task Manager** | A background task running somewhere in the cluster. |
| **Reference Data Store (This Node Only)** | [Reference data]({{< relref "pipeline-reference-data.md" >}}) loaded on the node you are connected to. |
| **Dual** | A single row with one field, `Dummy`. Useful for trying out functions. |

Some of these appear only if you have the matching application permission, for example **Annotations** for the Annotations data source.


## Stored and extracted fields

An index can hold a field in two ways.
A **stored** field keeps its value in the index, so a query returns it straight away.
A field that is indexed but not stored can be searched with `where`, but its value has to be fetched from the original event.

Fetching it is called **search extraction**.
For each matching event, Stroom uses the `StreamId` and `EventId` held in the index to read the event from the stream store, runs it through an extraction pipeline, and takes the field values from the output.
The pipeline usually ends in a {{< pipe-elm "SearchResultOutputFilter" >}}, or a {{< pipe-elm "DynamicSearchResultOutputFilter" >}} for dynamic indexes.

Extraction is slower than reading stored fields, but it keeps the index small and means the data is not held twice.
A field that isn't indexed at all can still be returned by extraction and narrowed with `filter`.
See [Lucene Index]({{< relref "lucene-index.md" >}}) for how to choose which fields to store, and the index's default extraction pipeline.


## Views

A **View** document gives a data source a name of its own and fixes the extraction pipeline that goes with it.
It has three settings:

* **Data source**: the index or other source it reads from.
* **Pipeline**: the extraction pipeline used for search extraction.
* **Meta filter**: an expression on stream properties, such as feed and stream type.

Querying a view is the same as querying its data source, with its pipeline used for extraction.
Views matter most for analytic rules: streaming and table builder rules must read from a view, and the view's meta filter becomes the rule's default processing filter.
See [Analytic rules]({{< relref "../guides/detection/analytic-rules.md" >}}).


## The query document

A **Query** document holds one StroomQL query.
Its **Query** tab has:

* the editor, with code completion: press Ctrl+Space for a list of fields, functions, keywords, dictionaries and data sources that fit where the cursor is;
* a help pane listing **Data Sources**, **Structure** (the keywords), **Fields**, **Annotation Fields**, **Functions**, **Visualisations** and **Dictionaries**.
  Click an item to read about it, and double-click to insert it;
* a time range, and buttons to run and stop the query;
* the results, on a **Table** tab and, when the query uses `show`, a **Visualisation** tab.

From the results table you can annotate events, as on a dashboard.
From the toolbar, **Create Rule** turns the query into an analytic rule.

A [Dashboard]({{< relref "dashboards.md" >}}) runs the same kind of search, built from components rather than written as text.
Use a Query document to explore and to write rules, and a dashboard to put several linked views of the data in front of people.


## Related pages

* [Dashboards]({{< relref "dashboards.md" >}}): tables, visualisations and parameters.
* [Lucene Index]({{< relref "lucene-index.md" >}}): stored fields and extraction pipelines.
* [A dashboard from a store]({{< relref "../guides/dashboard-from-a-store.md" >}}): querying an index or a Plan B store from a dashboard.
* [Dictionary]({{< relref "dictionary.md" >}}): lists of values for `in dictionary`.
* [Analytic rules]({{< relref "../guides/detection/analytic-rules.md" >}}): running a query as a standing rule.
* [Annotations]({{< relref "../guides/detection/annotations.md" >}}): annotating search results.
* [Is search working?]({{< relref "../operate/checking-it-works/is-search-working.md" >}}): when a query returns nothing.

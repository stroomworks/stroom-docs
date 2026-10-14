---
title: "Dashboards"
linkTitle: "Dashboards"
weight: 140
date: 2026-10-14
tags:
description: >
  An overview of how dashboards query, aggregate, and visualise data in Stroom.
pageKind: concept
---

Stroom Dashboards provide an interactive, web-based interface for querying, aggregating, and visualising data stored within Stroom.
They are composed of various components such as queries, tables, and visualisations that work together to provide insights into your data.


## Data sources

Dashboards can query several types of data sources:

* **Index**: The primary data source, containing searchable data sharded across the cluster.
  See [Lucene index]({{< relref "lucene-index.md" >}}).
* **View**: A named stand-in for one other data source, such as an index, together with an optional extraction pipeline.
  Users query the View without needing to know where the data lives or how it is extracted.
  A View can also hold a stream filter, but that filter is only used by [analytic rules]({{< relref "../guides/detection/analytic-rules.md" >}}) to choose which streams to process; it does not restrict what a dashboard search returns.
* **Statistic**: Specialised for time-series data, often used for performance monitoring.
* **Plan B**: A high-speed data store used for specific types of analytic data.
  See [Plan B]({{< relref "planb.md" >}}).

For the steps from a populated index or Plan B store to a working dashboard, see [A dashboard from a store]({{< relref "../guides/dashboard-from-a-store.md" >}}).


## Data flow and processing

The flow of data through a dashboard follows a specific lifecycle:

1. **Search request**: When a dashboard is opened or refreshed, it sends a `SearchRequest` to the server.
   This request contains the [query]({{< relref "query-language.md" >}}) expression (e.g., `where feed = "MY_FEED"`) and the configuration for all tables and visualisations.
1. **Data retrieval**: The Stroom search engine retrieves matching records from the underlying data source.
1. **Aggregation & transformation**:
   * Data is passed through an **Extraction Pipeline** (if configured) to parse and format fields (see [Pipelines]({{< relref "pipelines.md" >}})).
   * The **Table Component** aggregates this data based on its field definitions.
   * Fields can use **Expressions** (Stroom's built-in [function language]({{< relref "../reference/expression-functions.md" >}})) to transform data (e.g., `floorDay(${timestamp})` or `count()`).
   * **Grouping** determines how data is collapsed into rows.
     Nested groups create a hierarchical data structure.
1. **Result generation**: The server generates a `Result` object (often a `FlatResult` or a hierarchical `Row` structure) which is sent back to the browser.
1. **UI rendering**:
   * The **Table Component** renders the aggregated data in a grid.
   * The **Visualisation Component** receives the same aggregated data but interprets it according to its specific mappings.


## Relationship between tables and visualisations

A key architectural detail of Stroom dashboards is that **Visualisations cannot exist independently**.
Every visualisation must be linked to a specific **Table** component.


### Why a table is required

The Table component is responsible for defining how data is aggregated and grouped.
When a search is performed, the server calculates the results specifically for that table's structure.
The visualisation then "consumes" the data produced by its parent table.


### Hiding the table

If you want to display only a visualisation without the corresponding data grid, you can hide the table:

1. Add both a **Table** and a **Visualisation** to your dashboard.
1. Configure the visualisation to use the table as its data source.
1. In the table's settings, uncheck the **Visible** property (found in the tab or layout settings).

This configuration allows the table to continue acting as the data aggregator in the background while the UI only displays the resulting chart.


## Visualisation integration

[Visualisations]({{< relref "visualisations.md" >}}) in Stroom are hosted in an isolated `iframe` for security and stability.

1. **Bridge initiation**: The dashboard UI initiates a communication bridge with the iframe via the HTML5 `postMessage` API.
1. **Script injection**: Stroom injects the required JavaScript libraries (e.g., D3.js) and the specific visualisation script into the iframe.
1. **Data delivery**: The dashboard calls the `setData(context, settings, data)` method on the visualisation object within the iframe.
   * **Context**: Contains information about the current environment (e.g., theme, time zone).
   * **Settings**: Contains the user-defined mappings from table columns to visualisation parameters (e.g., mapping `timestamp` to the `x` axis).
   * **Data**: The actual aggregated result set from the server.


## Interactivity

Dashboards are highly interactive:

* **Selections**: Clicking a row in a table or an element in a visualisation can trigger "selection" events.
  These events can be used to filter other components in the same dashboard.
  For example, clicking a feed name in a chart filters a table to show only that feed's data.
* **Parameters**: Dashboards can define parameters (e.g., `${userId}`) that are substituted into queries and expressions at runtime, allowing for reusable dashboard templates.

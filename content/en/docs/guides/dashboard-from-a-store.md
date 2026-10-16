---
title: "A Dashboard from a Store"
linkTitle: "A Dashboard from a Store"
weight: 50
date: 2026-10-14
tags:
description: >
  Put data you already hold in a Lucene index or a Plan B store onto a dashboard, with a query, a table and a visualisation, and know what each store can and cannot answer.
pageKind: guide
verification: required
---

You have data sitting in a store and you want it on a dashboard.
This guide covers the two stores most dashboards read: a **Lucene index**, which holds events, and a **Plan B** store, which holds state.
The dashboard side is the same for both: a **Query** component reads the store, a **Table** shows and aggregates what it returns, and a **Visualisation** draws the table.
What differs is what has to be in place first, and what each store can answer.

If you have not built a dashboard before, [Your first dashboard]({{< relref "../get-started/your-first-dashboard.md" >}}) walks through the components once.
For how the parts fit together, see [Dashboards]({{< relref "../concepts/dashboards.md" >}}), and for the text form of the same search, see [StroomQL and data sources]({{< relref "../concepts/query-language.md" >}}).

{{% note %}}
If the query you want is already running on the store's **Data** tab, the **Create Dashboard** button there builds a dashboard from it, carrying over the query and the table's columns.
See [Building a dashboard]({{< relref "searching/building-a-dashboard.md#the-quickest-route" >}}).
{{% /note %}}


## Before you start

Whichever store you use:

* **You need Use permission** on the index or Plan B document.
  The dashboard's data source picker only offers documents you can use.
* **The store must already hold data.**
  A dashboard reads what is there; it does not trigger processing.
  Getting data in is covered by [Index and search it]({{< relref "../get-started/index-and-search.md" >}}) for an index, and by [Plan B]({{< relref "../concepts/planb.md" >}}) for a state store.


## From a Lucene index

### What must be in place

Open the {{< stroom-icon "document/Index.svg" "Lucene Index" >}} Lucene Index document and check three things.

**The fields you want to search on are Indexed.**
On the **Fields** tab, each field has an **Indexed** and a **Stored** setting.
Indexed means a query can match on it.
Stored means its value is kept in the index and can be shown without going back to the original event.
They are independent, and the difference decides most of what follows.

**The Main Time Field Name is a real, indexed date field.**
On the **Settings** tab, **Main Time Field Name** (default `EventTime`) names the field the dashboard's time range is applied to.
Every search with a time range adds a condition on that field.

**There is a Default Extraction Pipeline, if you need fields that are not stored.**
Also on the **Settings** tab.
For each matching event, Stroom uses this pipeline to go back to the original event and read the fields the index did not keep.
See [Stored and extracted fields]({{< relref "../concepts/query-language.md#stored-and-extracted-fields" >}}).

| You want to | The field must be |
|---|---|
| Match on it in the query | Indexed |
| Show it in the table, quickly | Stored |
| Show it in the table, without storing it | Produced by the extraction pipeline |


### Query it

On a new dashboard, which opens in design mode with a Query and a Table already linked:

1. Open the Query component's **Settings** from its tab menu, and set **Data Source** to the index.
1. Use **Add Term** to add conditions, and **Add Operator** to combine them.
   The field list offers only the fields that are indexed.
1. Set the dashboard's time range to cover the event times you expect.
   It is applied to the index's main time field, not to when the data arrived.

The same search written in StroomQL, in a **Query** document:

```text
from "Authentication Events"
where Outcome = "Failure"
select EventTime, UserId, SourceHost
```


### The table

Click **Add Column** on the table.
Under **Data Source** are the index's fields; under **Counts** are ready-made `count()` and `countGroups()` columns; **Custom** gives you an empty column to write an expression in.

Whether a column fills depends on its field:

* **Stored fields** come straight from the index.
* **Fields that are not stored** come from extraction.
  In the table's **Settings**, **Extract Values** must be on.
  If you do not choose an **Extraction Pipeline** there, the index's default extraction pipeline is used.
  With **Extract Values** off, only stored fields have values.

To aggregate, use a column's menu: **Group** sets a grouping level, and **Expression** sets the expression, for example `floorDay(${EventTime})` to bucket by day, or `count()` in another column.
A visualisation draws the table's rows as they are, so shape the table first.

{{< trap severity="silent" >}}
**A condition on a field that is not indexed matches nothing.**

The dashboard's field list keeps you from doing this, but StroomQL does not check: a `where` on a field that is stored but not indexed, or on a name the index does not have, returns no rows and no error.
To narrow on a field that is not indexed, use `filter`, which runs after the values have been retrieved or extracted.

The same applies to the time range.
If **Main Time Field Name** names a field that is missing or not indexed, every search with a time range returns nothing.
{{< /trap >}}


## From a Plan B store

### What must be in place

* **A {{< stroom-icon "document/PlanB.svg" "Plan B" >}} Plan B document**, with the **State Type** you need.
  Its name is the map name your pipeline writes to, and may only contain lower-case letters, digits and underscores.
* **A pipeline that writes to it**, ending in a {{< pipe-elm "PlanBFilter" >}}, with a processor filter that has run over your data.
  See [Plan B]({{< relref "../concepts/planb.md#data-ingestion" >}}).
* **The `Plan B Merge Processor` job running** on the Plan B storage nodes.
  Pipelines write fragments; the merge job folds them into the store that queries read.
  Until it has run, the store is empty to a query.


### What a Plan B data source returns

A Plan B document is a data source in its own right: choose it as the Query component's **Data Source**, or name it in `from`.
There is no extraction step.
Every column comes from the store, and which columns exist depends on the state type:

| State type | Fields | Time range applies to |
|---|---|---|
| State | `Key`, `ValueType`, `Value` | Nothing |
| Temporal State | `Key`, `EffectiveTime`, `ValueType`, `Value` | `EffectiveTime` |
| Range State | `KeyStart`, `KeyEnd`, `ValueType`, `Value` | Nothing |
| Temporal Range State | `KeyStart`, `KeyEnd`, `EffectiveTime`, `ValueType`, `Value` | `EffectiveTime` |
| Session | `Key`, `Start`, `End` | `Start` |
| Histogram | `Key`, `Time`, `Resolution`, `Value` | `Time` |
| Metric | `Key`, `Time`, `Resolution`, then `Value`, `Min`, `Max`, `Count`, `Sum` and `Average` as the value schema stores them | `Time` |

For a Metric store, each value column exists only if the **Value Schema** stores it (**Store Latest Value**, **Store Min Value** and so on); `Average` needs both count and sum.
Trace data is not a Plan B state type in 7.14: it is held in a separate **Traces** document, which is not a dashboard data source (see [Plan B]({{< relref "../concepts/planb.md#state-type" >}})).

The dashboard's query pane offers the key and time fields as terms.
`Value` and `ValueType` are returned but not offered as terms; to narrow on a value, filter the table column or use `filter` in StroomQL.


### Query it

Set the Query component's **Data Source** to the Plan B document and add terms as for an index.
In StroomQL, using the `user_locations` Temporal State store from the [Plan B example]({{< relref "../concepts/planb.md#example-setup-user-location-tracking" >}}):

```text
from user_locations
where Key = "jbloggs"
select Key, EffectiveTime, Value
```

This returns every location recorded for that user, one row per change.


### What it can and cannot answer

**A query returns stored entries, not answers at a point in time.**
For a Temporal State store, each row is one key at one effective time.
Searching it lists the history: when each value took effect.
It does not work out which value applied at a given moment, and the time range only selects entries whose effective time falls inside it.
A user whose location was last set a month ago has no row in a query over the last week, though that location still applies.

**For a point-in-time value, use `getState()`.**
It is an expression function, so it goes in a table column or a StroomQL `eval`, against any data source:

* `getState('user_locations', ${UserId}, ${EventTime})` gives the value that applied at each event's time.
  On a table over an index of events, this labels every event with where the user was when it happened.
* `getState('user_locations', ${Key})`, with no time, gives the value that applies now.
  On a table over the Plan B store itself, grouped by `Key`, this shows the current value per key.

`getState()` works on State, Temporal State, Range State, Temporal Range State and Session stores.
For a Range State, the key must be a number.
For a Session store it returns true or false: whether the key was in a session at that time.
If the map name does not match a Plan B document, the column is empty rather than an error.
Each lookup is done per row, so on large results it is slower than enriching events as they are processed.
See [Plan B lookups]({{< relref "../concepts/planb.md#dashboard-and-stroomql-lookups-analysis" >}}).

**A query reads the whole store.**
Conditions are tested against every entry, so a query on one key in a large store takes as long as a query on all of them.
Keep Plan B dashboards for stores of a size you are content to scan.

**On a cluster, a query may read a snapshot.**
A query runs on the node you are using.
If that node is not a Plan B storage node, it reads a local snapshot of the store, which is refreshed periodically, so very recent merges may not show yet.


## Add a visualisation

1. Shape the table first: group and aggregate it so that each row is one point to draw, for example one row per day with a count.
1. Click **Add Component** (in design mode) and add a **Visualisation**.
1. In its **Settings**, set **Table** to your table and **Visualisation** to the chart you want.
   Visualisations come from content packs such as `stroom-visualisations`; see [Visualisations]({{< relref "../concepts/visualisations.md" >}}).
1. Map the table's columns onto the visualisation's settings, such as `x` and `y` for a line chart.

To show only the chart, keep the table and hide it; a visualisation always draws from a table.
See [Dashboards]({{< relref "../concepts/dashboards.md#hiding-the-table" >}}).

In StroomQL, `show` draws the result directly:

```text
from "Authentication Events"
where Outcome = "Failure"
eval day = floorDay(EventTime)
eval failures = count()
group by day
select day, failures
show LineChart(x = day, y = failures)
```

The same works on a Plan B store, for example charting how often locations change:

```text
from user_locations
eval day = floorDay(EffectiveTime)
eval changes = count()
group by day
select day, changes
show LineChart(x = day, y = changes)
```

{{< timing mode="async" >}}
The dashboard query itself returns in seconds for most stores.
The delay is before that: data sent to Stroom reaches a store only after processing.

For an index, documents are searchable as soon as the indexing pipeline has written them; the `Index Writer Flush` job only affects the **Doc Count** on the **Shards** tab and when they are committed to disk.
For a Plan B store, after the `Plan B Merge Processor` job, which runs every minute by default, has merged the pipeline's output.
On a cluster, a query on a node that is not a Plan B storage node may wait longer, for its snapshot to refresh.

An empty table straight after processing usually means not yet, not failed.
{{< /timing >}}

{{< verify >}}
Count what the store holds, with no conditions and no time range:

```text
from "Authentication Events"
eval n = count()
select n
```

or `from user_locations` for a Plan B store.
Then run the dashboard and compare.

{{< golden >}}
**A row on the dashboard that you can match to a record you know is in the store.**

A count above zero proves the store holds data and the data source is readable.
A known record, with its values in the right columns, proves the query, the time range and the table columns are all doing what you meant.
{{< /golden >}}

{{< not-proof >}}
**A field list is not proof of data.**
The fields offered for an index come from its settings, and for a Plan B store from its state type.
Both look complete when the store is empty.

**A table with rows is not proof every column is right.**
A column over a field that is neither stored nor extracted comes back empty without an error, as does a `getState()` column with a mistyped map name.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Does the unfiltered count return rows?**
   If not, the problem is getting data into the store, not the dashboard.
   For an index see [Index and search it]({{< relref "../get-started/index-and-search.md" >}}); for Plan B, check the pipeline's output and the merge job.
1. **Does it still return nothing with the time range removed?**
   Then the time range is the cause.
   For an index, check the event times and the **Main Time Field Name**.
   For a Temporal State store, remember the range selects effective times, not the time you are asking about.
1. **Does every condition use a field that is indexed?**
   A `where` on anything else matches nothing.
   For Plan B, conditions on `Value` belong in a filter.
1. **Are some columns empty while others fill?**
   For an index, the field is not stored, and either **Extract Values** is off or the extraction pipeline does not produce it.
   For `getState()`, check the map name.
1. **Does the table fill but the chart stay blank?**
   Check the visualisation's **Table** setting and that each of its settings is mapped to a column.
{{< /diagnose >}}


## Related pages

* [Dashboards]({{< relref "../concepts/dashboards.md" >}}): components, tables and visualisations.
* [StroomQL and data sources]({{< relref "../concepts/query-language.md" >}}): the query language and the data sources it reads.
* [Lucene Index]({{< relref "../concepts/lucene-index.md" >}}): fields, storage and extraction pipelines.
* [Plan B]({{< relref "../concepts/planb.md" >}}): state types, ingestion and lookups.
* [Expression functions]({{< relref "../reference/expression-functions.md" >}}): the functions available in table columns and `eval`.

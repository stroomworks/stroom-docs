---
title: "Index and Search It"
linkTitle: "Index and Search It"
weight: 50
date: 2026-10-14
tags:
description: >
  Running the pipeline over the whole stream, indexing the output, and searching it.
pageKind: tutorial
verification: required
---

The Stepper proved the translation on one record.
Now run it over everything and put the result somewhere you can search.


## Process the stream

A pipeline does nothing until a **[processor filter]({{< relref "../concepts/processing/_index.md" >}})** selects data for it.

On the `TEST-EVENTS` pipeline's **Processors** tab, add a filter.
Its expression builder takes terms on stream fields: make it `Feed = TEST-EVENTS` AND `Type = Raw Events`.
Then enable both the processor row and the filter row beneath it, by ticking **Enabled** on each.

{{< trap severity="silent" >}}
**Enable both the processor and the filter.**

A pipeline has a parent **Processor** and one or more **Filters** beneath it.
Both have their own enabled state, and data flows only when both are on.
A filter shown as enabled under a disabled processor processes nothing, and neither screen says so.

This is the most common cause of "nothing is happening" in all of Stroom.
{{< /trap >}}

{{< image src="get-started/index-and-search/processor-disabled-filter-enabled.png" alt="A pipeline's Processors tab with two rows. The parent processor row has its Enabled box unticked; the filter row beneath it is ticked. Below, the filter's details show its expression, Feed equals the feed name AND Type equals Raw Events, while Last Poll Age, Last Poll Task Count, Total Tasks Created and Status are all blank." >}}A filter enabled under a disabled processor. Nothing has been polled or created, and nothing on the screen says why.{{< /image >}}

When processing has run, the feed's **Data** tab has an `Events` stream for each `Raw Events` stream.


## Index the output

Indexing is a second pipeline, run over the `Events` streams that the first one wrote.


### The index

Create a **[Lucene Index]({{< relref "../concepts/lucene-index.md" >}})** called `TEST-EVENTS-INDEX`, from **New > Indexing > Lucene Index**.

A new index has no fields.
On its **Fields** tab, add these, ticking **Stored** on each so that a table can show them later:

| Name        | Type   |
|-------------|--------|
| `StreamId`  | `Id`   |
| `EventId`   | `Id`   |
| `EventTime` | `Date` |
| `User`      | `Text` |
| `Action`    | `Text` |
| `IP`        | `Text` |

`StreamId` and `EventId` let a search result find its way back to the original event.
`EventTime` is the name the index's **Settings** tab expects in **Main Time Field Name** by default; if you call the time field something else, change that setting to match.

On the **Settings** tab, set **Volume Group**, for example to `Default Volume Group`, and save the index.

{{< trap severity="silent" >}}
**Set its volume group, or it will index nothing.**

An index needs a [volume group]({{< relref "../concepts/volumes.md" >}}) naming where its shards are written.
Without one the index document looks complete, its field list is populated, the pipeline runs, and the indexing filter fails at processing time with `Index volume group name must be specified`.

The only visible sign is an `Error` stream on the feed.
This is the single most common Lucene gotcha in Stroom.
{{< /trap >}}

{{< image src="get-started/index-and-search/volume-group-error.png" alt="A feed's Data tab listing Error, Events and Raw Events streams. An Error stream is selected and its lineage shows Raw Events, then Events, then Error. The Error tab below lists three fatal errors, from the indexingFilter and the xsltFilter, each saying Index volume group name must be specified." >}}An index with no volume group. The indexing pipeline runs and its only output is an `Error` stream.{{< /image >}}


### The indexing XSLT

The {{< pipe-elm "IndexingFilter" >}} does not read your events directly.
It reads `records:2` XML, one `<record>` per document, with one `<data>` element per field, so an XSLT has to reshape the events first.

Create an XSLT called `TEST-EVENTS-INDEX-XSLT`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
    xmlns="records:2"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    version="2.0">

  <xsl:template match="/Events">
    <records
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="records:2 file://records-v2.0.xsd"
        version="2.0">
      <xsl:apply-templates select="Event" />
    </records>
  </xsl:template>

  <xsl:template match="Event">
    <record>
      <!-- Added to each Event by the idEnrichmentFilter -->
      <data name="StreamId" value="{@StreamId}" />
      <data name="EventId" value="{@EventId}" />
      <data name="EventTime" value="{Time}" />
      <data name="User" value="{User}" />
      <data name="Action" value="{Action}" />
      <data name="IP" value="{IP}" />
    </record>
  </xsl:template>
</xsl:stylesheet>
```

The `data` names must match the index's field names exactly.


### The indexing pipeline

Create a second pipeline called `TEST-EVENTS-INDEXING`.
On its **Structure** tab, set **Inherit From** to `Template Pipelines/Indexing`.
It brings the whole chain with it:

```text
Source → xmlParser → readRecordCountFilter → splitFilter → idEnrichmentFilter → xsltFilter → indexingFilter → writeRecordCountFilter
```

The {{< pipe-elm "IdEnrichmentFilter" >}} comes before the XSLT on purpose: it adds `StreamId` and `EventId` attributes to each event, and the XSLT copies them into fields.

Set only two properties:

* On `xsltFilter`, set `xslt` to `TEST-EVENTS-INDEX-XSLT`.
* On `indexingFilter`, set `index` to `TEST-EVENTS-INDEX`.

Save the pipeline.
On its **Processors** tab, add a filter for `Feed = TEST-EVENTS` AND `Type = Events`, and enable both the processor and the filter, as before.

{{< timing mode="async" >}}
**Processing is asynchronous.**
The task creator polls on an interval, then the work queues.
For three rows this is seconds; for real volumes it is minutes to hours.

There is a second delay after that: documents are not searchable until the index writer flushes, which a [scheduled job]({{< relref "../reference/jobs.md" >}}) does.

So an empty result immediately after enabling the filter means **not yet**, not **failed**.
{{< /timing >}}

{{< verify >}}
First confirm processing produced output: on the feed's **Data** tab, look for a stream of type `Events`, and check there is no stream of type `Error`.

Then check the index.
Open `TEST-EVENTS-INDEX`, go to its **Shards** tab and click refresh: the list is empty until you do.
**Doc Count** is the number of documents committed to each shard, and **Last Commit** says when.

Then search it.
Create a **[Query]({{< relref "../concepts/query-language.md" >}})** and run:

```text
from "TEST-EVENTS-INDEX"
eval events = count()
group by StreamId
select StreamId, events
```

There is one row per stream you indexed, with `events` at `3` for each post of the sample file.

{{< golden >}}
**The Shards tab shows a non-zero Doc Count, the query returns your events, and there are no `Error` streams.**

All of them.
The count proves documents exist; the query proves they are searchable; the absence of errors proves the indexing filter did not fail on the way.
Any one alone can mislead you.
{{< /golden >}}

{{< not-proof >}}
**The index's field list proves nothing.**
It is populated from the index's configuration, not its contents, and it looks complete and healthy when zero documents have been written.
This is how people conclude indexing worked when it did not.

**An `Events` stream existing is not proof it contains events.**
Open it.
A translation that matched nothing produces a valid, empty output stream.

**`select count()` without a `group by` is not a total.**
It returns one row per document, each with a count of `1`.
Group by a field, as above, or read the Doc Count on the **Shards** tab.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Are both the processor and the filter enabled?**
   Check first, every time.
1. **Is there an `Error` stream on the feed?**
   Read it.
   The volume group failure appears only here, and so do most other indexing failures.
1. **Is there an `Events` stream at all?**
   If not, the first pipeline did not run, and this is a [processing problem]({{< relref "../operate/checking-it-works/is-data-processing.md" >}}) rather than an indexing one: the filter's criteria may not match your data.
1. **Does the `Events` stream contain events?**
   Open it.
   Empty output is the namespace mismatch from the previous page.
1. **Did the indexing pipeline run?**
   Its filter must select `Type = Events`, not `Raw Events`, and both its processor and filter must be enabled.
1. **Does the indexing XSLT write `<record>` elements whose `data` names match the index's fields?**
   Step the indexing pipeline over an `Events` stream and look at the `xsltFilter` output.
   The `IndexingFilter` ignores anything that is not a `records:2` record, and ignores a `data` name that is not a field.
1. **Is the Doc Count still zero moments after processing?**
   Wait for the index writer to flush, refresh the **Shards** tab, then ask again.
{{< /diagnose >}}


## Next

The data is searchable.
Now [put it on a dashboard]({{< relref "your-first-dashboard.md" >}}).

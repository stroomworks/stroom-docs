---
title: "Finding the Original Event"
linkTitle: "Finding the Original Event"
weight: 20
date: 2026-10-14
tags:
description: >
  Extraction pipelines, and why some columns are populated and others are empty.
pageKind: guide
verification: required
---

An index does not have to hold every value it can find.
Fields can be indexed so they are searchable without being stored, which keeps indexes small.
When a search needs one of those values, it reads it back from the original data through an **extraction pipeline**.

This is why a results table can have some columns full and others empty: the full ones are stored in the index, and the empty ones needed an extraction that is not configured.


## How extraction works

A search returns the identity of each matching event: which stream, and where in it.
The extraction pipeline re-reads those events from the data store, runs them through a translation, and emits them through {{< pipe-elm "SearchResultOutputFilter" >}}, which turns them into the fields the dashboard asked for.

The pipeline is a normal one: a parser, usually an {{< pipe-elm "XSLTFilter" >}}, then the output filter.
It reads the translated events, the XSLT converts them to `records:2` for the output filter, and it is given the events the search matched rather than a whole stream.

{{< image src="guides/searching/finding-the-original-event/indexed-and-stored.svg" alt="A search reaches the index, which matches on indexed fields. From there a stored field returns at once because its value is in the index, while a field that is not stored goes through an extraction pipeline that reads the source stream back. A note records that if retention has removed that stream, the column comes back empty." >}}A stored field costs index size and returns immediately. An unstored one keeps the index small and makes the result depend on the source stream still being there.{{< /image >}}


## Setting it up

1. **Create the extraction pipeline**, ending in {{< pipe-elm "SearchResultOutputFilter" >}}.
1. **Point the table at it.**
   In the table component's settings, leave **Extract Values** ticked, then either name the pipeline in **Extraction Pipeline** or tick **Use Default Extraction Pipeline** to use the one set on the index.
1. **Add the columns** for the fields you want extracted.
   They must be fields the index defines, because the field definitions are what the output filter maps onto.

{{< timing mode="async" >}}
Extraction costs more than reading stored fields, because it reads the original streams.
A table extracting several fields over many results is noticeably slower than one reading stored values, and the difference grows with the result count rather than staying fixed.

If a dashboard is used constantly and feels slow, that is the trade-off to revisit: store the fields it always shows, and extract the rest.
{{< /timing >}}

{{< verify >}}
Add one extracted column to a table that already returns rows, and confirm it populates for a row whose value you can check in the source stream.

{{< golden >}}
**An extracted column shows the value that is in the original event, for a row you checked by opening the stream.**

Checking against the stream rather than against another column is the point: it proves extraction read the right record, not merely that it produced something.
{{< /golden >}}

{{< not-proof >}}
**A populated column is not proof extraction is working for every row.**
Rows whose source stream has since been deleted by retention extract nothing, and show as empty beside rows that worked.

**An empty column is not proof extraction failed.**
A field the translation never produced is correctly empty.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Extraction depends on the source data still existing.**

Search results come from the index, and the index outlives nothing by itself, but the streams it points at are subject to data retention.
When the data has been deleted, the search still matches and the extracted columns are simply blank.

So a dashboard can degrade gradually as the data behind it ages out, with no error and no change to the query.
If extracted values matter for a period, the retention on the source data has to cover it.
{{< /trap >}}

{{< diagnose >}}
1. **Is an extraction pipeline set on the table?**
   Without one, only stored fields populate, and the rest are silently blank.
1. **Is Extract Values ticked on the table?**
   Unticked, extracted columns stay blank even with a pipeline set.
1. **Is the column a field the index defines?**
   The output filter maps onto index fields; a column naming something else gets nothing.
1. **Does the extraction pipeline produce that field?**
   Step it over one of the matched streams and look at the output.
1. **Does the source stream still exist?**
   Open it from the result.
   If it has been deleted by retention, extraction cannot return anything.
1. **Can the user read the source feed?**
   Extraction re-reads the data, so it is subject to permission on the feed as well as on the index.
1. **Is it slow rather than broken?**
   Compare with the same table showing only stored fields.
{{< /diagnose >}}

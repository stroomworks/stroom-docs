---
title: "Indexing"
linkTitle: "Indexing"
weight: 60
date: 2026-10-14
tags:
description: >
  Making processed data searchable, and deciding what to put in the index rather than leave in the store.
pageKind: concept
aliases:
  - /docs/user-guide/indexing/
---

Translating data makes it consistent.
Indexing makes it findable.
Until a stream is indexed, it can be read and reprocessed but not searched, so indexing is the step between having data and being able to answer questions with it.

An index is a document you create, with a set of fields, filled by a pipeline whose last element is {{< pipe-elm "IndexingFilter" >}}.
Searches run against the index and, where they need values the index does not hold, reach back into the stored data through an extraction pipeline.


## What to read

* [Building an index]({{< relref "building-an-index.md" >}}) sets one up end to end: the index document, its volumes, the indexing pipeline, and how to tell it worked.
* [Choosing fields]({{< relref "choosing-fields.md" >}}) is the decision that is expensive to change later, because changing a field's definition does not change shards already written.

Stroom's own Lucene indexing is the default and needs nothing outside Stroom.
Where you already run search infrastructure, it can index into that instead: [Elasticsearch]({{< relref "elasticsearch.md" >}}) or [Solr]({{< relref "solr.md" >}}).
Both move the search workload onto something you scale separately from processing.

[Lucene indexes]({{< relref "../../concepts/lucene-index.md" >}}) in Concepts explains the model underneath: shards, partitions, and the trade-off between storing values in the index and extracting them at search time.


## The choice worth making deliberately

Every field can be **indexed**, so it can be searched on, and separately **stored**, so its value comes back with the result without reading the original data.

Storing everything makes searches fast and indexes large.
Storing nothing keeps indexes small and makes every result depend on an extraction pipeline reading the source stream.
Most systems want a small number of stored fields covering what a person needs to see in a results table, with everything else extracted on demand.

[Choosing fields]({{< relref "choosing-fields.md" >}}) goes through it.

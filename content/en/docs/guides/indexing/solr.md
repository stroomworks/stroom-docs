---
title: "Solr"
linkTitle: "Solr"
weight: 40
date: 2026-10-14
tags:
description: >
  Indexing into an external Solr cluster, and the two jobs that keep it tidy.
pageKind: guide
verification: required
aliases:
  - /docs/howtos/search/solr/
  - /docs/user-guide/indexing/solr/
---

Stroom can index into an external Apache Solr cluster as an alternative to its built-in Lucene indexes.
Like [Elasticsearch]({{< relref "elasticsearch.md" >}}), it moves the search workload onto infrastructure you scale separately from processing.

Choose it when Solr is already what your organisation runs.
For a new deployment with no existing preference, built-in Lucene indexing is the path with the least to set up and the most of Stroom's own tooling behind it.


## The pieces

* A **Solr Index** document represents an index on a Solr cluster and holds the connection to it.
* A pipeline ending in {{< pipe-elm "SolrIndexingFilter" >}} writes to it.

The pipeline is shaped exactly as for any other index: a parser reading the translated events, an {{< pipe-elm "XSLTFilter" >}} that converts them to `records:2` fields, then the indexing filter.


## The two jobs

Solr indexing depends on two scheduled jobs, and both are enabled by default:

* **Solr Index Optimise** compacts the indexes, on a daily schedule.
* **Solr Index Retention** applies each index's deletion query, removing documents that have aged out.

Both take a cluster lock, so leave them enabled on every node and let the lock pick one runner.
See [Scheduled jobs]({{< relref "../../reference/jobs.md" >}}).

If you do not use Solr, both do nothing and can be left alone.

{{< timing mode="async" >}}
Documents are not searchable the moment they are indexed: Solr makes them visible on its own commit and soft-commit settings, which are configured on the Solr side rather than in Stroom.

Optimisation runs daily and on a large index takes a while and is I/O heavy, so it is worth knowing when it is scheduled before investigating a nightly slowdown.
{{< /timing >}}

{{< verify >}}
Process one stream, then search for a value you know is in it through a Stroom dashboard built on the Solr Index document.

{{< golden >}}
**A value you chose in advance comes back through a Stroom dashboard.**

Going through Stroom rather than querying Solr directly is what proves the Solr Index document, its field definitions and the searching user's permissions are all right, which is where the remaining problems are once documents exist.
{{< /golden >}}

{{< not-proof >}}
**Documents in Solr are not proof the dashboard will show them.**
The Solr Index document and Stroom permissions sit between the two.

**An empty result is not proof nothing was indexed.**
It is also what an uncommitted batch, a field type mismatch and a missing permission all look like.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Disabling Solr Index Retention stops deletion without stopping indexing.**

The index keeps growing, searches keep returning data that should have aged out, and nothing reports it.
The symptom appears much later as an index that is larger and slower than expected, which is easy to read as a capacity problem.
{{< /trap >}}

{{< diagnose >}}
1. **Can Stroom reach the Solr cluster?**
   Connection problems appear in the stream's errors rather than as a pipeline failure.
1. **Did the pipeline produce `records:2` output?**
   Step it.
   A translation producing nothing indexes nothing and reports no error.
1. **Has Solr committed?**
   Recently indexed documents are briefly invisible, and the commit settings are Solr's rather than Stroom's.
1. **Do the field types match the Solr schema?**
   A value Solr rejects is rejected per document, so most of a stream can index while some of it silently does not.
1. **Are the two Solr jobs enabled?**
   See [Scheduled jobs]({{< relref "../../reference/jobs.md" >}}).
1. **Can the searching user read the Solr Index document?**
   No permission returns nothing rather than an error.
{{< /diagnose >}}

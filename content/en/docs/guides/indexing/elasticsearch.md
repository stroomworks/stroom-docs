---
title: "Elasticsearch"
linkTitle: "Elasticsearch"
weight: 30
date: 2026-10-14
tags:
description: >
  Indexing into an external Elasticsearch cluster, and the permission on the cluster document that matters more than it looks.
pageKind: guide
verification: required
aliases:
  - /docs/howtos/search/elasticsearch/
  - /docs/user-guide/indexing/elasticsearch/
  - /docs/user-guide/indexing/elasticsearch/getting-started/
  - /docs/user-guide/indexing/elasticsearch/indexing/
  - /docs/user-guide/indexing/elasticsearch/introduction/
  - /docs/user-guide/indexing/elasticsearch/kibana/
  - /docs/user-guide/search/data-sources/elastic-data-source/
---

Stroom can index into an external Elasticsearch cluster instead of, or alongside, its built-in Lucene indexes.
The attraction is that search infrastructure then scales independently of the processing cluster, and the data is reachable by everything else in that ecosystem: visualisation tools, monitoring systems reading stream metadata and error streams, and distributed processing frameworks for enrichment.

Stroom talks to Elasticsearch over its REST API.


## The three pieces

* An **Elastic Cluster** document holds the connection to a cluster.
  You can have several, for instance one for production and one for development.
* An **Elastic Index** document describes an index within one of those clusters.
* A pipeline ending in {{< pipe-elm "ElasticIndexingFilter" >}} does the indexing.


## Connecting a cluster

1. Create an **Elastic Cluster** document where the right people can reach it.
1. Enter the connection URLs, including protocol, host and port.
   HTTP and HTTPS both work.
   For an `https` URL, paste the cluster's CA certificate into **CA certificate (PEM format)**; it is not used for `http` URLs.
1. Tick **Use authentication** and enter the **API key ID** and **API key secret**.
1. Use **Test Connection** before saving.
   It is the only step that tells you the details are right while you still have them in front of you.
1. Save.

{{% warning %}}
**Set the permissions on this document deliberately.**
The **View** permission allows the holder to retrieve the Elasticsearch API key and secret, which gives them the same access to that cluster as Stroom itself.

People who only need to search Elasticsearch indexes through Stroom dashboards should be given **Use**, not **View**.
{{% /warning %}}


## Indexing into it

Build the pipeline as for any other index: a parser reading the translated events, an {{< pipe-elm "XSLTFilter" >}} that converts them to `records:2`, then {{< pipe-elm "ElasticIndexingFilter" >}} with its `cluster` property pointing at the Elastic Cluster document.

Properties worth setting deliberately:

| Property | Default | Why it matters |
|---|---|---|
| `indexName` | - | Supports variables such as `{year}`, which is how you roll indexes by time |
| `batchSize` | `10000` | Documents per bulk request. Lower it if Elasticsearch rejects large requests |
| `purgeOnReprocess` | `true` | On reprocessing, deletes the stream's existing documents first, so you do not get duplicates |
| `refreshAfterEachBatch` | `false` | Makes documents visible immediately, at a real cost to indexing throughput |

{{< timing mode="async" >}}
Indexed documents are not searchable the instant they are sent.
Elasticsearch makes them visible on its own refresh interval, so a short delay between processing and finding something is normal rather than a fault.

`refreshAfterEachBatch` removes that delay and slows indexing down.
It is worth it for a low-volume index you are actively testing, and rarely worth it in production.
{{< /timing >}}

{{< verify >}}
Process one stream, then search the Elasticsearch index for a value you know is in it, through a Stroom dashboard.

{{< golden >}}
**A value you chose in advance comes back through a Stroom dashboard, not only through Elasticsearch directly.**

Querying Elasticsearch directly proves the indexing worked.
Going through a dashboard also proves the Elastic Index document and the searching user's permissions are right, which is where the remaining problems are.
{{< /golden >}}

{{< not-proof >}}
**Test Connection succeeding is not proof indexing will work.**
It proves Stroom can reach the cluster and authenticate; it says nothing about whether the index exists, the mapping suits your fields, or the key has permission to write.

**Documents in Elasticsearch are not proof the dashboard will show them.**
The Elastic Index document and Stroom permissions sit between the two.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="destructive" >}}
**View on the Elastic Cluster document hands over the cluster.**

It is an ordinary-looking permission on an ordinary-looking document, and granting it broadly is an easy mistake.
Anyone with it can read the API key and secret and then use that cluster with Stroom's own level of access, outside Stroom and outside its auditing.

Grant **Use** for searching, and keep **View** to the people who administer the connection.
{{< /trap >}}

{{< trap severity="silent" >}}
**Reprocessing without `purgeOnReprocess` leaves duplicates.**

It defaults to true, which is what you want.
Turned off, reprocessing a stream adds a second copy of every document rather than replacing the first, and the symptom is counts that are quietly wrong rather than an error.
{{< /trap >}}

{{< diagnose >}}
1. **Does Test Connection succeed?**
   Settles reachability, protocol and credentials in one click.
1. **For an `https` URL, is the CA certificate right?**
   It must be the certificate that signed the cluster's, in PEM format.
1. **Did the pipeline produce `records:2` output?**
   Step it.
   A translation producing nothing indexes nothing and reports no error.
1. **Does the index exist, and does its mapping fit?**
   A field whose type conflicts with the mapping is rejected by Elasticsearch per document, which shows in the stream's errors rather than as a pipeline failure.
1. **Has it refreshed?**
   Recently indexed documents are briefly invisible to search.
1. **Can the searching user see the Elastic Index document?**
   No permission means no results, rather than an error.
{{< /diagnose >}}

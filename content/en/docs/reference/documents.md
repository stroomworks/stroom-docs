---
title: "Document Types"
linkTitle: "Document Types"
weight: 30
date: 2026-10-14
tags:
description: >
  Every kind of document Stroom holds in its explorer tree, by group.
pageKind: reference
aliases:
  - /docs/reference-section/documents/
---

Stroom stores everything you create as a **document** in the explorer tree.
There are 35 types, in 5 groups.

The **Type** column is the identifier used in exports, in the API, and anywhere a document is referred to by type rather than by name.


## Configuration

| Document | Type | What it is |
|---|---|---|
| Dictionary | `Dictionary` | A Dictionary is essentially a list of 'words', where each 'word' is separated by a new line. |
| Documentation | `Documentation` | A Document type for simply storing user created documentation, e.g. adding a Documentation document into a folder to describe the contents of that folder. |
| Elastic Cluster | `ElasticCluster` | Defines the connection details for a single Elasticsearch cluster. |
| Git Repo | `GitRepo` | Contains the configuration for a connection to a Git repository. |
| Kafka Configuration | `KafkaConfig` | Defines the connection details for a single Kafka cluster. |
| OpenAI Model | `OpenAIModel` | Defines the settings required to connect to an OpenAI-compatible API and interact with a model. |
| Rule Set | `ReceiveDataRuleSet` | The rules that decide whether arriving data is received, rejected or silently dropped. One per system rather than one per feed. |
| S3 Configuration | `S3Config` | Defines the config for S3 |
| Script | `Script` | Contains a Javascript script that is used as the source for a visualisation Document. |
| Visualisation | `Visualisation` | Defines a data visualisation that can be used in a Dashboard Document. |


## Data processing

| Document | Type | What it is |
|---|---|---|
| Feed | `Feed` | The  is Stroom's way of compartmentalising data that has been ingested or created by a Pipeline. |
| Pipeline | `Pipeline` | A Pipeline defines a chain of Pipeline elements that consumes from a source of data (a Stream of raw data or cooked events) then processes it according to the elements used in the chain. |
| Processor | `Processor` | A pipeline's processing configuration. Created for you when you add a processor filter, rather than something you make directly. |
| Processor Filter | `ProcessorFilter` | Selects which streams a pipeline processes. This is the document behind a row on a pipeline's Processors tab. |


## Indexing

| Document | Type | What it is |
|---|---|---|
| Elastic Index | `ElasticIndex` | Defines an index that exists within an Elasticsearch cluster. |
| FloorMap Event Store | `FloorMapEventStore` | Holds the events a floor map draws, keyed by the entity they are about. Part of the floor map feature rather than a general-purpose store. |
| Lucene Index | `Index` | Lucene Index is the standard built-in index within Stroom and is one of many data sources. |
| Pathways | `Pathways` | Analyses trace logs held in a Plan B store to learn the paths that traces take between services, e.g. A -> B -> C. |
| Plan B | `PlanB` | Defines a place to store state |
| Solr Index | `SolrIndex` | Solr Index represents an index on a Solr cluster. |
| SQL Temporal Store | `SqlTemporalStore` | A temporal key-value store held in the database, loaded from pipelines and editable in place. Used for facts that change over time and need correcting, including the facts behind a floor map. |
| Statistic Store | `StatisticStore` | Defines a logical statistic store used to hold statistical data of a particular type and aggregation window. |
| Traces | `Traces` | Holds trace data for the pathways feature, which turns traces into the routes entities take. Specialised rather than general-purpose. |
| View | `View` | A view is an abstraction over a data source (such as a Lucene Index) and optionally an extraction pipeline. |


## Search

| Document | Type | What it is |
|---|---|---|
| Analytic Rule | `AnalyticRule` | Defines an analytic rule which can be run to alert on events meeting a criteria. |
| Annotation | `Annotation` | An annotation records notes and workflow state against one or more events, typically while investigating them. |
| Annotation Group | `AnnotationGroup` | Groups related annotations so an investigation spanning several events is worked as one thing. |
| Dashboard | `Dashboard` | The Dashboard Document defines a data querying and visualisation dashboard. |
| Data Generator | `DataGen` | Defines a data generator which can be used to send data into a Stroom Feed. |
| Floor Map | `FloorMap` | A plan of a physical space with live events drawn on it. Reads one store for the shape of the site and another for what is happening on it. |
| Query | `Query` | A Query Document defines a  query and is used to execute that query and view its results. |
| Report | `Report` | Defines a report that can be run at scheduled intervals and sent to individuals via email. |


## Transformation

| Document | Type | What it is |
|---|---|---|
| Text Converter | `TextConverter` | A Text Converter Document defines the specification for splitting text data into records/fields using Data Splitter or for wrapping fragment XML with a  pipeline element. |
| XML Schema | `XMLSchema` | This Document defines an  that can be used within Stroom for validation of XML documents. |
| XSL Translation | `XSLT` | The content of this Document is an  document for transforming data in a pipeline. |


## Built-in data sources

These are not documents and you do not create them.
Stroom registers them as types so that a dashboard or query can select them as a data source, alongside the indexes and stores you build yourself.

| Data source | Type |
|---|---|
| Analytics | `Analytics` |
| Annotations | `Annotations` |
| Dual | `Dual` |
| Index Shards | `IndexShards` |
| Plan B Shards | `PlanBShards` |
| Processor Tasks | `ProcessorTasks` |
| Reference Data Store (This Node Only) | `ReferenceDataStore` |
| Stream Store | `StreamStore` |
| Task Manager | `TaskManager` |

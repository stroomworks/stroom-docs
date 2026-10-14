---
title: "Pipeline Data Sources"
linkTitle: "Pipeline Data Sources"
weight: 50
date: 2026-10-14
tags:
description: >
  Understanding how data enters a pipeline from the Stroom data store.
pageKind: concept
---

In Stroom, data doesn't just "arrive" at a pipeline.
Instead, pipelines are attached to [streams]({{< relref "streams.md" >}}) of data that have already been stored in the system.
This document explains the relationship between the Stroom Data Store, Processors, and the Pipeline Source.


## The entry point: the `Source` element

Every pipeline begins with a {{< pipe-elm "Source" >}} element.
This is a special, non-removable element that acts as the gateway.
It handles the low-level details of:

1. Opening the data stream from the underlying storage.
1. Decompressing the data if necessary (e.g., ZIP or GZIP).
1. Providing the raw byte stream to the first "Reader" or "Parser" in your pipeline.


## How pipelines are triggered

Data is fed into a pipeline via a **Processor Filter** (see [Processor filters and tasks]({{< relref "processing.md" >}})).
This is the "engine" that drives the work:

1. **Definition**: You create a Processor Filter on a Pipeline and define a set of criteria (e.g., "All streams for Feed 'MY_FEED' with type 'Raw Events'").
1. **Task creation**: The system constantly scans the data store for new streams matching those criteria.
   When it finds one, it creates a **Processor Task**.
1. **Execution**: A worker thread picks up the task, initialises the pipeline, and points the `Source` element to that specific stream.


## Types of input data

When configuring your pipeline source via a Processor Filter, you typically deal with three main categories of data:


### Raw events

This is the "virgin" data as it was received from the source system (e.g., via [Stroom Proxy]({{< relref "data-receipt.md" >}})).
It is usually unstructured text, CSV, or raw JSON.
Pipelines processing this data typically use a {{< pipe-elm "DSParser" >}} to convert it into XML.


### Events (processed data)

This is data that has already passed through an initial normalisation pipeline.
It is already in XML format (usually conforming to the Event-Logging schema).
Pipelines processing this data often skip the Parser and use an {{< pipe-elm "XMLParser" >}}.


### Context data

Context data is "supplementary" data sent alongside a main event stream.
It often contains information about the environment (e.g., hostname, IP mapping).
A pipeline can be configured to read this context data to enrich the main event stream using XSLT lookups (see [Pipeline reference data]({{< relref "pipeline-reference-data.md" >}})).


## The meta store connection

Every stream in Stroom consists of two parts:

* **The data**: The actual content (bytes).
* **The meta data**: Attributes about the data (Feed Name, Stream Type, Creation Time, Received Host, etc.).

The **Processor Filter** uses the Meta Data to decide which streams should be processed.
When the pipeline runs, the {{< pipe-elm "Source" >}} element provides both the raw data and access to these Meta Data attributes.
These can be used as "Header" variables in your XSLT transformations.


## Key properties of input streams

When troubleshooting why data isn't being fed into your pipeline, check these meta attributes:

* **Status**: Only streams with a status of `Locked` (while being written) or `Unlocked` (ready for use) can be processed.
  `Deleted` or `Hidden` streams are ignored.
* **Stream type**: Ensure your Processor Filter is looking for the correct type (e.g., `Raw Events` vs `Raw Reference`).
* **Feed**: The pipeline will only process data associated with the specific Feed(s) defined in the filter.


## Seeing what a source actually produced

The **Stepper** runs one stream through a pipeline and shows the input and output of every element, which is how you find out what a source really contains rather than what it was supposed to.
You can start it from a Feed or the Stream Store, with the stream already selected.

[Pipeline debugging]({{< relref "pipeline-debugging.md" >}}) covers how to drive it and what it does not tell you.


## Checking a source is being read

Whether a pipeline is actually processing, and what to do when it is not, are operational questions rather than questions about how sources work:

* [Is data processing?]({{< relref "../operate/checking-it-works/is-data-processing.md" >}}) covers the processor and filter switches, the task counts, and where errors surface.
* [Is data arriving?]({{< relref "../operate/checking-it-works/is-data-arriving.md" >}}) covers the step before it, when nothing has reached the store to be read.

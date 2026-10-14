---
title: "Lucene Index"
linkTitle: "Lucene Index"
weight: 110
date: 2026-10-14
tags:
description: >
  Standard high-performance search index used in Stroom for structured data retrieval.
pageKind: concept
aliases:
  - /docs/user-guide/search/data-sources/lucene-data-source/
---

A **Lucene Index** is the standard built-in index within Stroom and serves as a primary data source for searching and [dashboards]({{< relref "dashboards.md" >}}).
An index is analogous to a library catalogue, providing a very fast way to locate specific records or events without scanning through every stream.

The index stores field values and maintains pointers (Stream ID and Event ID) to the original source documents in the [stream store]({{< relref "streams/_index.md" >}}).
This allows Stroom to provide instant search results while still being able to "drill down" into the raw data.


## Static vs. dynamic indexing

Stroom supports two ways of defining the index schema:


### Static indexing

In a static index, you explicitly define all fields in the **Fields** tab of the Lucene Index document.

* **Pros**: Precise control over data types and storage settings; better performance for known schemas.
* **Cons**: Any fields present in the XML but not defined in the index will be ignored.


### Dynamic indexing

A dynamic index automatically creates fields based on the incoming XML.
To use dynamic indexing, you must use the **DynamicIndexingFilter** in your pipeline instead of the standard `IndexingFilter`.

* **Pros**: Highly flexible; handles evolving schemas or varied data sources without manual configuration.
  The data is self-describing, which makes diverse sources easier to handle.
* **Cons**: Less control over data types; can lead to "field explosion" if names are not sanitised.
  Repeating the schema definitions on every record makes the XML stream considerably larger, and producing that structure takes more complex XSLT.


#### Example XML

The `DynamicIndexingFilter` consumes XML using a `<document>` structure rather than the standard `records:2` format, with each field carrying its own properties:

```xml
<document>
  <field>
    <name>client_ip</name>
    <type>IP Address</type>
    <value>192.168.1.50</value>
    <indexed>true</indexed>
    <stored>true</stored>
  </field>
  <field>
    <name>user_name</name>
    <type>Text</type>
    <value>jdoe</value>
    <indexed>true</indexed>
    <stored>true</stored>
  </field>
</document>
```


## Shards and partitions

Lucene indexes are physically divided into smaller units called **Shards**.
Shards are further grouped into **Partitions**.


### What is a shard?

A shard is a single Lucene index directory on disk.
Dividing a large index into shards allows Stroom to:

1. **Scale out**: Multiple shards can be searched in parallel across different threads or nodes.
1. **Manage size**: Lucene performance degrades as an individual shard becomes massive.
1. **Implement retention**: Stroom deletes data by simply deleting old shard directories, which is much faster than deleting individual records from a single database.


### What is a partition?

A partition is a logical grouping of shards, usually based on time (e.g., one partition per Month).
This grouping makes it easier for the system to manage storage and apply retention policies.


### Choosing values

* **Max docs per shard**: Usually kept between 10 million and 100 million.
  Smaller shards are faster to search and merge but increase overhead.
* **Partition by**: Choose a unit that matches your data volume.
  If you ingest 1GB/day, `Month` is sensible.
  If you ingest 100GB/day, `Day` is better.
* **Shards per partition**: Increase this (e.g., to 2 or 4) if a single shard cannot keep up with the write speed of your incoming data stream.


## Storage trade-offs: index vs. data store

When defining fields, you must decide whether to make them **Stored**.


### Storing data in the index

* **Behaviour**: The actual value (e.g., the full message text) is saved inside the Lucene shard.
* **Pros**: Dashboards can display the value instantly without needing an extraction pipeline.
* **Cons**: Significantly increases disk usage; slows down index merging and searching.


### Retrieving from the data store (extraction)

* **Behaviour**: The index only stores a pointer.
  Stroom uses an **Extraction Pipeline** to fetch the raw data from the stream store when needed.
* **Pros**: Keeps the index small and fast; raw data is already stored once, so no duplication.
* **Cons**: Displaying results in a dashboard is slightly slower as it requires an extra processing step.


### Necessary fields for extraction

To successfully drill down from a search result to the raw data, the index **must** contain these two fields (usually automatically added):

1. **StreamId**: The unique ID of the stream in the data store.
1. **EventId**: The position of the specific record within that stream.

Without these, Stroom cannot link the index entry back to its source.


## Resetting an index

There are times when you may need to clear the contents of an index and start fresh.
The full procedure is in [Reset an index]({{< relref "../operate/resetting/reset-an-index.md" >}}).


### When to reset

1. **Schema changes**: If you change the data type of an existing field (e.g., from `Text` to `Date`), the existing data in the shards will be incompatible.
1. **Logic changes**: If you update your pipeline XSLT to extract different data or fix a bug in how fields were being populated.
1. **Corruption**: In the rare event of a hardware failure or disk issue leading to Lucene index corruption.
1. **Re-indexing**: When you want to re-process historical data into a new schema.


### How to reset

Resetting an index is performed by deleting its physical shards:

1. **Disable processing**: First, disable the [Processor Filter]({{< relref "processing/_index.md" >}}) associated with the index to prevent new data from being written during the reset.
1. **Delete shards**:
   * Open the Lucene Index document.
   * Navigate to the **Shards** tab.
   * Select all shards (use `Ctrl+A`).
   * Click the **Delete** button.
   * The shards will be marked for deletion and eventually removed from disk by the system.
1. **Clear processor filter**: If you intend to re-index the same data that was already processed, you must **Delete and Recreate** the Processor Filter on your pipeline.
   This forces Stroom to scan the source data from the beginning again.
   See [Reset a processor filter]({{< relref "../operate/resetting/reset-a-processor-filter.md" >}}).
1. **Enable processing**: Re-enable the filter to begin the re-indexing process.


## Pipeline integration

Data is typically added to a Lucene Index via a [pipeline]({{< relref "pipelines.md" >}}).
The specialised element used for this is the **IndexingFilter** (for static indexes) or **DynamicIndexingFilter** (for dynamic indexes).


### The IndexingFilter

The `IndexingFilter` consumes XML events in the `records:2` namespace.
It reads the `name` and `value` pairs from the incoming XML and maps them to the fields defined in your Lucene Index document.

* **Role**: Target / Destination.
* **Visibility**: Simple.
* **Input**: XML in the `records:2` namespace.


### XML format (records:2)

For data to be indexed using the standard `IndexingFilter`, your pipeline's XSLT must produce XML conforming to the following structure:

```xml
<?xml version="1.1" encoding="UTF-8"?>
<records xmlns="records:2" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
         xsi:schemaLocation="records:2 file://records-v2.0.xsd" 
         version="2.0">
  <record>
    <data name="EventTime" value="2026-05-12T10:30:00.000Z"/>
    <data name="User" value="jdoe"/>
    <data name="Action" value="LOGIN"/>
    <data name="IPAddress" value="192.168.1.50"/>
  </record>
</records>
```

* **name**: Must match a field name defined in the Lucene Index document.
* **value**: The value to be indexed or stored for that field.


## Dashboard integration

Lucene Indexes are the most common **Data Source** for Dashboards.
The full walk-through is in [A dashboard from a store]({{< relref "../guides/dashboard-from-a-store.md" >}}).

1. **Selection**: In the Dashboard's Query settings, you select the Lucene Index document as the data source.
1. **Querying**: You can then perform searches using [Stroom Query Language (StroomQL)]({{< relref "query-language.md" >}}) or the visual query builder.
1. **Field availability**: Only the fields defined as "Indexed" in the Lucene Index document will be searchable.
   The dashboard's time range is applied to the field named in **Main Time Field Name** on the Settings tab.
1. **Extraction**: When you view results in a table, Stroom uses the **Default Extraction Pipeline** (defined in the Index) to fetch the full record from the stream store and format it for display.


## UI reference

The Lucene Index document in the Stroom UI contains several tabs for configuration:


### Settings tab

Controls the physical storage and maintenance of the index.

* **Max docs per shard**: The maximum number of documents to store in a single Lucene shard before starting a new one (Default: 1,000,000,000).
* **Partition by**: How to group shards on disk (Day, Week, Month, or Year).
* **Partition size**: The number of units (e.g., 1 Month) per partition.
* **Shards per partition**: Allows multiple shards to be written to simultaneously for higher ingest throughput.
* **Main Time Field Name**: The date field that a dashboard's time range, or a StroomQL time condition, is applied to (Default: `EventTime`).
  It must name a field that exists and is **Indexed**; if it does not, every search with a time range returns nothing.
* **Retention day age**: How long (in days) to keep data in this index.
  Shards older than this will be automatically deleted.
* **Volume group name**: The group of disk [volumes]({{< relref "volumes.md" >}}) where the index shards will be stored.


### Fields tab

Defines the schema of the index.

* **Name**: The name of the field (must match the `name` attribute in your XML).
* **Type**: The data type (e.g., ID, Text, Long, Date, IP Address).
* **Indexed**: If true, this field can be used in query criteria.
* **Stored**: If true, the value is stored in the index itself and can be displayed in a dashboard without needing an extraction pipeline.
* **Term Vector**: Stores term positions for advanced Lucene features like highlighting or phrase matching.


### Shards tab

Provides a monitoring view of the physical Lucene shards on disk.
You can see the status (Open, Closed, Deleted), doc counts, and file sizes for every shard in the index.


## Default extraction pipeline

This setting is crucial for dashboards.
It points to a pipeline (usually one containing an `XMLParser` and an `XSLTFilter`) that "extracts" the desired fields from the raw stream data when a search result is clicked.
Without this, the dashboard can only show "Stored" fields.

For a worked example, see [Index and search it]({{< relref "../get-started/index-and-search.md" >}}).
If searches return nothing or shards misbehave, see [Is search working?]({{< relref "../operate/checking-it-works/is-search-working.md" >}}) and [Index problems]({{< relref "../operate/troubleshooting/index-problems.md" >}}).

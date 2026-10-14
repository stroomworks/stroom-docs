---
title: "Pipeline Reference Data"
linkTitle: "Pipeline Reference Data"
weight: 90
date: 2026-10-14
tags:
description: >
  How to use Reference Data for enrichment in Stroom pipelines using the stroom:lookup function.
pageKind: concept
---

**Reference Data** in Stroom is used to enrich event data during [pipeline]({{< relref "pipelines.md" >}}) processing.
It allows you to perform high-speed lookups against key-value pairs or numerical ranges (like IP address blocks) stored in an internal database (LMDB).


## Overview

Enrichment is the process of adding additional context to an event.
For example, if an event contains a `userId`, you might use reference data to look up the user's `Full Name` or `Department` and add those fields to the resulting event.


### Characteristics

Reference data is:
* **Time-sensitive**: Lookups (for Off-Heap data) use the event's timestamp to find the "effective" version of the reference data at that point in time.
* **Reusable**: A single reference [stream]({{< relref "streams.md" >}}) can be used by many different pipelines.


## The reference data pipeline

A reference data pipeline is a specialised pipeline that loads data into the Reference Data Store.
Unlike event pipelines, its goal is not to produce a new stream of files, but to populate an internal index.


### Mandatory components

A reference pipeline must contain the following elements:

1. **Parser**: Converts raw reference source (CSV, XML, etc.) into XML events.
   For example, use the {{< pipe-elm "DSParser" >}} for CSV data.
1. {{< pipe-elm "XSLTFilter" >}}: Transforms the parsed XML into the specific **Reference Data Schema** (see below).
   The {{< pipe-elm "XSLTFilter" >}} must use the `reference-data:2` namespace in its output.
1. {{< pipe-elm "ReferenceDataFilter" >}}: The final element in the chain.
   It "listens" for the XML produced by the XSLT and writes the keys, maps, and values into the Store.

{{% note %}}
The **ReferenceDataFilter** is a **terminal element**.
It writes data directly to the internal store and does not produce output for further elements.
Consequently, reference pipelines do not require (and typically do not have) a **StreamAppender**.
{{% /note %}}


### Processor filters and lazy loading

You typically **do not** need to create a [Processor Filter]({{< relref "processing.md" >}}) for a reference data pipeline.
Stroom uses **Lazy Loading**.
When a pipeline performs a lookup, Stroom automatically identifies the required reference stream and triggers a background task to load it if it is not already in the store.

You should only add a Processor Filter if you want to proactively index the data as soon as it is received.
This is useful for very large reference sets that take a long time to load.


### ReferenceDataFilter properties

The {{< pipe-elm "ReferenceDataFilter" >}} has specific properties that control how data is indexed:

| Property | Default | Description |
| :--- | :--- | :--- |
| **Override Existing Values** | `true` | If `true`, a duplicate key within the same stream will overwrite the previous value. If `false`, the first value is kept. |
| **Warn On Duplicate Keys** | `false` | If `true`, a warning is logged to the pipeline output whenever a duplicate key is encountered in the source. |

Use **Warn On Duplicate Keys** during development or for high-integrity feeds to identify data quality issues in your reference source.


### Reference data schema

The XSLT in a reference pipeline must produce XML conforming to the `reference-data:2` schema.

{{% warning %}}
The `<map>` element is **crucial** as it defines the "bucket" or "set" of reference data (the map name) that the record belongs to.
This is **not** set in the Stroom user interface (e.g., it is not a property of the **ReferenceDataFilter**).
It is purely defined in the XML produced by the XSLT of your reference pipeline.
{{% /warning %}}


### Naming convention

The convention is to name the map in UPPER_SNAKE_CASE using INPUT_TO_OUTPUT_MAP.
For example:
* FILENO_TO_LOCATION_MAP
* HOSTNAME_TO_IP_MAP

This is only suggested as a convention; it is not enforced.


#### Key-value pair

Used for simple mappings like ID to Name.

```xml
<referenceData xmlns="reference-data:2">
  <reference>
    <map>USER_TO_DEPARTMENT_MAP</map>
    <key>jbloggs</key>
    <value>Engineering</value>
  </reference>
</referenceData>
```


#### Range-value pair

Used for mappings where a value applies to a range of numerical keys, such as CIDR blocks.
The `from` and `to` values must be long integers.

```xml
<referenceData xmlns="reference-data:2">
  <reference>
    <map>IP_TO_LOCATION_MAP</map>
    <from>3232235521</from> <!-- 192.168.0.1 -->
    <to>3232235775</to>   <!-- 192.168.0.255 -->
    <value>UK_OFFICE</value>
  </reference>
</referenceData>
```

{{% note %}}
The `<value>` element can contain a simple string or a complex XML fragment (e.g., an entire `<evt:User>` object).
[TBC]
{{% /note %}}


## Performing lookups

To use reference data in an event pipeline, you use the `stroom:lookup()` extension function within an XSLT.
Its full signature and the other reference data functions are in the [reference data functions reference]({{< relref "../reference/xslt-functions/reference-data.md" >}}).


### The stroom:lookup function

```xml
stroom:lookup(mapName, key, [time], [ignoreWarnings], [trace])
```

* **mapName**: The name of the map defined in the reference pipeline (e.g., 'UserToDepartment').
* **key**: The key to look up.
* **time** (Optional): The ISO 8601 string or epoch ms.
  Defaults to the event time.
* **ignoreWarnings** (Optional): Boolean.
  If true, suppresses warnings if the key is not found.
* **trace** (Optional): Boolean.
  If true, outputs detailed lookup trace information to the pipeline logs.


### Pipeline references

For `stroom:lookup` to find data, you must link the event pipeline to the reference data:

1. Open the **Event Pipeline**.
1. Select the {{< pipe-elm "XSLTFilter" >}} that performs the lookup.
1. Go to the **Pipeline References** tab.
1. Add a reference to the **Reference Feed** and specify the **Reference Pipeline**.


## Configuration

Reference data behaviour is controlled via the `stroom.pipeline.referenceData` configuration path.


### Storage strategies

Stroom automatically selects the storage strategy based on the **Stream Type** defined in the Pipeline Reference.
Users do not need to set this manually.


#### Off-heap (LMDB)

This is used for **External Reference Data** (any Stream Type except `Context`).
It is the most common storage type, used for data that is shared across many event streams and is effective-time sensitive.

* **Trigger**: Added as a Pipeline Reference with Stream Type `Reference`.
* **Persistence**: Data persists across service restarts.
* **Scale**: Can exceed the size of the JVM heap as it is stored on disk (LMDB).


#### On-heap (memory)

This is used for **Context Data** (specifically Stream Type `Context`).
Context data is transient reference data that is attached specifically to a single event stream.

* **Trigger**: Added as a Pipeline Reference with Stream Type `Context`.
* **Persistence**: Data is transient and is discarded once the stream has been processed.
* **Scale**: Limited by the available JVM heap space.


### Key parameters

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `lmdb.maxStoreSize` | `50GiB` | The maximum size of the LMDB database on disk. |
| `purgeAge` | `30 days` | How long to keep reference data after it was last accessed. |
| `lmdb.maxReaders` | `150` | Max concurrent threads that can read from the store. |
| `lmdb.readerBlockedByWriter` | `true` | If true, a write operation blocks all readers (saves disk space). |
| `maxPutsBeforeCommit` | `200,000` | Records to batch before committing during a load. |


### Configuration guidance

#### Store size and location

The `maxStoreSize` must be smaller than the available space on the local disk.
Estimate your total reference data size (keys + values) and set this to at least **2x** that estimate to allow for overhead and internal processing.

{{% warning %}}
The `localDir` for reference data **MUST** be on a local disk (ideally SSD/NVMe).
Never use network storage (NFS/SMB) for the reference data store.
LMDB's memory-mapping will cause severe performance issues or system instability over a network.
{{% /warning %}}


#### Retention (purge age)

Reference data is "lazy loaded" into the store when first requested by a pipeline.
The `purgeAge` determines how long data stays in the store after its last use.
If you have stable data and plenty of disk, the default `30 days` is recommended.
Reduce this if you have very limited disk space and many transient reference streams.


#### Performance vs. disk space

The `readerBlockedByWriter` setting is a critical trade-off:
* **`true` (default)**: Lookups will pause briefly while data is being loaded.
  This allows Stroom to reclaim disk space from old/updated records immediately.
* **`false`**: Lookups never block, even during loads.
  However, the database file will grow significantly over time because LMDB cannot reuse "dead" pages while readers are active.
  Only use this if you have extreme performance requirements and ample disk space.


#### Batch commits

`maxPutsBeforeCommit` controls how often data is committed during a load:
* For **high throughput** of large single loads, increase this value or set it to `0` (commit at end).
* If many different reference streams are being loaded **simultaneously**, decrease this (e.g., to `5,000`) to allow the loads to interleave their write operations.


## Example: site enrichment

This example demonstrates how to use reference data to map a `siteId` in a log file to a `Site Name` and `Location`.
For a fuller worked example, see [Pipeline reference data example]({{< relref "pipeline-reference-data-example.md" >}}).


### 1. The reference data

#### Source data (CSV)

This is the raw data provided to the **Reference Feed**.

```csv
siteId,siteName,location
S01,London HQ,London
S02,New York Branch,New York
```


#### Reference pipeline configuration

1. **DSParser**: Uses a Data Splitter to convert the CSV into XML.
1. **XSLTFilter**: Transforms the CSV-XML into the `reference-data:2` format.
1. **ReferenceDataFilter**: Indexes the result into the store.

**Reference XSLT Output:**

```xml
<referenceData xmlns="reference-data:2">
  <reference>
    <map>SITEID_TO_LOCATION_MAP</map>
    <key>S01</key>
    <value>
      <site>
        <name>London HQ</name>
        <location>London</location>
      </site>
    </value>
  </reference>
</referenceData>
```


### 2. The event data

#### Input XML (raw event)

This is the XML produced by the parser in your **Event Pipeline**.

```xml
<event>
  <time>2026-05-20T10:00:00.000Z</time>
  <user>jbloggs</user>
  <siteId>S01</siteId>
</event>
```


### 3. The enrichment

#### Event pipeline configuration

1. **XSLTFilter**: Performs the lookup.
1. **Pipeline reference**: Added to the **XSLTFilter**, pointing to the **Reference Feed** containing the site data.

**Enrichment XSLT:**

```xml
<xsl:template match="event">
  <xsl:copy>
    <!-- Copy existing fields -->
    <xsl:apply-templates select="@*|node()"/>

    <!-- Perform the lookup -->
    <xsl:variable name="siteData" select="stroom:lookup('SITEID_TO_LOCATION', siteId)"/>

    <!-- Add enriched fields from the XML fragment in the reference value -->
    <siteName><xsl:value-of select="$siteData/site/name"/></siteName>
    <location><xsl:value-of select="$siteData/site/location"/></location>
  </xsl:copy>
</xsl:template>
```


#### Final output

The enriched event now contains the data looked up from the reference store.

```xml
<event>
  <time>2026-05-20T10:00:00.000Z</time>
  <user>jbloggs</user>
  <siteId>S01</siteId>
  <siteName>London HQ</siteName>
  <location>London</location>
</event>
```


## Why a change does not show up

The store is deliberately not a cache that refreshes itself.
Entries stay until something removes them, which is what makes a lookup for a March event return March's answer however long ago it was loaded.

The consequence is that **correcting a reference loader does not correct what it already loaded**.
Changing the XSLT, or fixing a bad reference feed, leaves the old entries in place and lookups keep returning them.
Making the change visible means purging the entries and letting them reload, and because the compiled stylesheet is cached too, clearing that as well.

[Purge reference data]({{< relref "../operate/resetting/purge-reference-data.md" >}}) has the procedure, what each step costs, and what to check when a lookup still looks wrong afterwards.

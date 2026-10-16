---
title: "Plan B / LMDB Data Store"
linkTitle: "Plan B / LMDB Data Store"
weight: 120
date: 2026-10-14
tags:
description: >
  A high-performance distributed state store for Stroom using LMDB.
pageKind: concept
---

Plan B is a high-performance, distributed state store in Stroom that uses LMDB (Lightning Memory-Mapped Database) as its underlying storage engine.
It is designed to replace or supplement existing [reference data]({{< relref "pipeline-reference-data.md" >}}) and statistics features where high throughput and low-latency lookups are required.


## When to use Plan B

### Use Plan B when

* **High performance lookups**: You need to perform millions of ultra-fast lookups during event enrichment (e.g., in XSLT or StroomQL).
* **Distributed state**: You need to maintain state that is updated by many processing nodes but needs to be available for querying globally.
* **Large reference sets**: You have reference data sets that are too large to hold efficiently in heap-based caches.
* **Complex state types**: You need specific state behaviours like temporal state, ranged state, or session tracking.


### Use something else when

* **Lazy loading**: If you only need small fragments of a huge dataset occasionally and don't want to store it all in advance, traditional **Reference Data** (which loads lazily) might be better.
* **Ad-hoc queries**: For simple, non-recurring queries on indexed data, a standard [**Lucene Index**]({{< relref "lucene-index.md" >}}) and [**Dashboard**]({{< relref "dashboards.md" >}}) are more appropriate.
* **Relational data**: If you need complex relational joins or ACID transactions across multiple tables, a traditional RDBMS is still the correct choice.
* **Facts somebody maintains**: If the values are curated rather than fed, and being able to correct a single entry matters more than lookup speed, a [**SQL Temporal Store**]({{< relref "sql-temporal-store.md" >}}) holds the data itself and can be edited in place.


## Architecture

Plan B uses a "Local Write, Central Merge, Snapshot Read" architecture:

1. **Writing**: Individual processing nodes write data to local LMDB instances (`writer` directory) via the `PlanBFilter` in a pipeline.
1. **Uploading**: These local instances are zipped and uploaded to one or more configured **Storage Nodes**.
1. **Merging**: Storage nodes run a background job (`Plan B Merge Processor`) to merge the uploaded fragments into master **Shards**.
1. **Querying/snapshots**: Non-storage nodes fetch **Snapshots** of these shards from storage nodes to perform local, high-speed lookups.


## Data ingestion

To load data into Plan B, you create a [pipeline]({{< relref "pipelines.md" >}}) that uses the **PlanBFilter** as its final destination element.
This filter consumes XML in the `reference-data:2` namespace.
The data includes a `<map>name</map>` element which corresponds to the name of the {{< stroom-icon "document/PlanB.svg" "Plan B" >}} Plan B document you want to store the data in.

Note that, although PlanB uses the `reference-data:2` schema, it supports extensions to this schema.
Therefore, the [Schema Filter]({{< relref "pipeline-schema-filter.md" >}}) isn't useful when checking reference data that is being sent to Plan B.

If using the `reference-data:2` schema, you can add a `<time>` element to set the effective time for that element.
The effective time, in a Plan B Temporal Store, is the time that the element becomes valid unless superseded by a new value with the same key.
If the `<time>` element is not present, Plan B will fall back to the effective time of the stream, as specified by the metadata for that stream.

You can also use a `<temporal-state>` element structure instead of the `<reference>` structure:

```xml
<plan-b xmlns="plan-b:2" version="2.0">
  <temporal-state>
    <map>KEY_TO_VALUE_MAP</map>
    <key>myKey</key>
    <time>2026-05-28T12:00:00.000Z</time>
    <value>MyValue</value>
  </temporal-state>
</plan-b>
```

Other elements supported include `<range-state>` and `<session>`.


### Example setup: user location tracking

In this scenario, we want to track which building a user is in based on their badge scans.
We need a **Temporal State** store so we can find where a user was at any specific point in time.


#### 1. Plan B document configuration

Create a new **Plan B** document in the Explorer called `user_locations` with these settings:

* **State type**: `Temporal State` (Allows us to store a history of locations per user).
* **Max store size**: `2 GiB` (Sufficient for several million history records).
* **Retention**: `Enabled`, `90 Days` (We only care about the last 3 months of movement).


#### 2. Pipeline XML output

Your pipeline's XSLT must produce XML following this structure:

```xml
<plan-b xmlns="plan-b:2" version="2.0">
  <temporal-state>
    <map>KEY_TO_VALUE_MAP</map>
    <key>myKey</key>
    <time>2026-05-28T12:00:00.000Z</time>
    <value>MyValue</value>
  </temporal-state>
</plan-b>
```


### Data structure explanation

* **`<map>`**: Links the data to a specific Plan B document.
  This allows a single ingestion pipeline to update multiple state maps simultaneously.
* **`<key>`**: The unique identifier for the entity.
  In a `Temporal State` store, multiple values can exist for the same key, distinguished by their `effectiveTime`.
* **`<value>`**: The data associated with the key.
  This can be a simple string or a nested XML fragment.
* **`<time>`**: The "Start" time for this specific state.
  When performing a lookup, Stroom will return the value whose `time` is closest to, but not after, the requested lookup time.


## Looking up data

Data stored in Plan B can be retrieved during pipeline processing or within dashboard queries.


### XSLT lookups (enrichment)

In a processing pipeline, you use the [`stroom:lookup()`]({{< relref "../reference/xslt-functions/reference-data.md" >}}) extension function within your XSLT to enrich event data.


#### Implementation example

This example shows how to add a `Location` field to an event by looking up the user's location in the `user_locations` Plan B store.

```xml
<xsl:template match="Event">
  <xsl:copy>
    <xsl:variable name="userId" select="EventSource/User/Id"/>
    <xsl:variable name="eventTime" select="EventTime/TimeCreated"/>

    <!-- Perform the lookup -->
    <xsl:variable name="location" select="stroom:lookup('user_locations', $userId, $eventTime)"/>

    <EventDetail>
      <data name="User" value="{$userId}"/>

      <!-- Only add the field if a location was found -->
      <xsl:if test="$location">
        <data name="LastKnownLocation" value="{$location}"/>
      </xsl:if>

      <xsl:apply-templates select="EventDetail/*"/>
    </EventDetail>
  </xsl:copy>
</xsl:template>
```


#### Advanced: handling XML fragment values

If your Plan B store contains nested XML in the `<value>` field (e.g., `<value><building>North</building><floor>3</floor></value>`), you can access those elements directly:

```xml
<xsl:variable name="locData" select="stroom:lookup('user_locations', $userId, $eventTime)"/>
<data name="Floor" value="{$locData/floor}"/>
```


### Dashboard and StroomQL lookups (analysis)

Dashboards can perform lookups on-the-fly when displaying data, which is useful for showing the "current" state of an entity.
A Plan B store can also be queried directly as a dashboard data source; [A dashboard from a store]({{< relref "../guides/dashboard-from-a-store.md" >}}) covers both uses.


#### In a dashboard table

You can use the [`getState()`]({{< relref "../reference/expression-functions.md" >}}) function in the **Expression** field of a table column.

1. Add a new column to your table.
1. Set the **Expression** to: `getState('user_locations', ${User})`
1. This will display the most recent location for the user identified in the `User` column.


#### In a StroomQL query

In a [StroomQL]({{< relref "query-language.md" >}}) query, compute the lookup with `eval`, then use the result in `select` to label rows or in `filter` to keep only some of them.
A lookup cannot go in `where`: `where` conditions are run by the data source, such as the index, and only accept a field name on the left.

```sql
// Show all events that occurred while users were in the 'North Wing'
from "My_Event_Index"
eval Location = getState('user_locations', User, EventTime)
filter Location = "North Wing"
select EventTime, User, Action, Location
```

`filter` is applied after the events are retrieved, so narrow the search with `where` on indexed fields first where you can.

{{% note %}}
Performing lookups in a dashboard or StroomQL query is convenient but can be slower than using an enriched index if you are processing millions of rows, as the lookup is performed for every row displayed or filtered.
{{% /note %}}


## Configuration parameters

### Global properties

These properties sit under `appConfig.planb` in `config.yml`, or can be changed on the **Properties** screen.
See [Configuration]({{< relref "../operate/configuration.md" >}}) for which of the two to use, and [Configuration properties]({{< relref "../reference/configuration-properties.md" >}}) for the full list with its defaults.
They control the underlying infrastructure and resource management for Plan B across the cluster.

* **`stroom.planb.path`**: The root directory on the local filesystem for all Plan B data (writer fragments, shards, and snapshots).
  * **Considerations**: LMDB performs best on fast storage (SSDs/NVMe).
    Ensure the disk has sufficient space for the master shards on storage nodes and snapshots on client nodes.
  * **Starting value**: `${stroom.home}/planb`.
* **`stroom.planb.nodeList`**: A comma-separated list of node names designated as central **Storage Nodes**.
  These nodes are responsible for merging data fragments and served snapshots.
  * **Considerations**: In a cluster, select 2 or 3 stable nodes with high I/O throughput.
    This provides high availability for the state data.
  * **Starting value**: Leave empty for a single-node setup.
    In a cluster, specify the names of your dedicated storage nodes.
* **`stroom.planb.minTimeToKeepSnapshots`**: The minimum duration a node will keep a cached snapshot before checking the storage nodes for a newer version.
  * **Considerations**: Balance data consistency against network and CPU overhead.
    If your state data updates frequently and lookups must be near-real-time, lower this value.
    For static reference data, a higher value is better.
  * **Starting value**: `10m` (10 minutes).
* **`stroom.planb.minTimeToKeepSnapshotEnv`**: How long an LMDB environment (the memory-mapped file handle) for a snapshot remains open after its last use.
  * **Considerations**: Opening and closing LMDB environments is relatively expensive.
    Keeping them open uses system file handles and address space.
    This should typically be at least twice the value of `minTimeToKeepSnapshots`.
  * **Starting value**: `20m` (20 minutes).
* **`stroom.planb.snapshotRetryFetchInterval`**: How long to wait before retrying a failed attempt to fetch a snapshot from a storage node.
  * **Considerations**: If the network is unstable or a storage node is temporarily busy, this prevents constant retries while ensuring eventual recovery.
  * **Starting value**: `1m` (1 minute).
* **`stroom.planb.stateDocCache`**: Configuration for the internal cache that stores Plan B document definitions.
  * **Considerations**: Usually only needs adjustment in very large environments with thousands of Plan B documents.
  * **Starting value**: `maximumSize: 1000`, `expireAfterWrite: 10m`.


### Plan B document settings

These settings are configured per Plan B document in the Stroom UI.


#### State type

* **State**: The simplest form, a direct Key-Value mapping.
  Ideal for static or slowly changing reference data.
* **Temporal state**: Key-Value mapping with an associated `effectiveTime`.
  This allows for historical lookups, returning the value that was valid at a specific point in time.
* **Range state**: Maps numeric ranges (e.g., Long or Integer ranges) to a value.
  Frequently used for CIDR blocks or numeric ID ranges.
* **Temporal range state**: Combines numeric ranges with temporal sensitivity.
  Useful for ranges that change over time (e.g., dynamic IP assignments).
* **Session**: Specialised for tracking the lifecycle of an entity.
  It stores start and end times, allowing for duration analysis and state tracking (e.g., user sessions or process execution).
* **Histogram**: Stores aggregated distribution data for numeric values.
  It counts occurrences within specified buckets, facilitating statistical analysis of data spread.
* **Metric**: Designed for high-speed statistical counters and gauges.
  It maintains running aggregates such as `min`, `max`, `sum`, `count`, and `average` over time for a given key.

From Stroom 7.14, trace data is no longer a Plan B state type.
It is held in a separate **Traces** document (see [Documents]({{< relref "../reference/documents.md" >}})), which lives on a shared file store and is served by the Plan B Shared FS jobs.


#### Max store size

The maximum size the LMDB environment can grow to for this specific store.

* **Considerations**: LMDB uses memory-mapped files.
  The `Max Store Size` sets the virtual address space limit.
  On many operating systems, this doesn't immediately consume physical disk space, but the filesystem must be able to accommodate the file if it fills up.
* **Choosing a value**:
  * **Development/small maps**: 1 GiB - 5 GiB.
  * **Production state**: 10 GiB (Default) - 100 GiB.
  * **High-volume metrics**: 500 GiB+.
* **Environment example**: For a `user_locations` map in a large enterprise, where you expect 10 million entries, a value of 10 GiB is a safe starting point.


#### Overwrite

Determines whether incoming data should replace existing records with the same key (and the same `effectiveTime` for temporal types).

* **Considerations**: Set this to `True` if you only care about the *latest* update for a specific point in time (e.g., correcting an erroneous badge scan).
  Set this to `False` if you want to prevent existing data from being accidentally changed by re-processing old streams.
* **Application example**:
  * **Inventory tracking**: `Overwrite = True` (The latest scan is the most accurate).
  * **Audit evidence**: `Overwrite = False` (Preserve the original entry recorded at that time).


#### Retention

Controls the automatic deletion of old data to manage disk space.

* **Considerations**: By default, retention is based on when the data was inserted.
  Tick **Use State Time** to base it on the record's own time (e.g., the `effectiveTime`) instead.
  Ensure your retention period is longer than any lookups you intend to perform.
* **Choosing a value**:
  * **Session tracking**: 30 to 90 Days.
  * **System status**: 7 Days.
  * **Long-term asset mapping**: Disabled (Keep indefinitely).


#### Snapshot settings

These toggle whether different types of retrieval operations should use local **Snapshots** (high performance, slightly delayed) or query the **Storage Nodes** directly (near real-time, higher network load).

* **Use snapshots for lookup**: Enables snapshots for `stroom:lookup()` in pipelines.
  Recommended for high-throughput enrichment.
* **Use snapshots for get**: Enables snapshots for `getState()` in dashboards.
* **Use snapshots for query**: Enables snapshots for broad StroomQL `from "PlanB_Doc"` queries.

* **Decision matrix**:
  * **Maximum speed**: Enable all snapshots.
    This is best for SOC environments where thousands of events per second need enrichment.
  * **Maximum freshness**: Disable snapshots.
    Best for real-time monitoring dashboards where you need to see badge scans the moment they are merged.


### Modifying settings on existing stores

{{% warning %}}
Changing settings on a Plan B store that already contains data can have significant consequences.
{{% /warning %}}

* **Safe to change**:
  * **Max store size**: Increasing this value is safe and takes effect the next time the store is opened (e.g., during the next merge or lookup).
  * **Retention**: Changing retention periods will affect the next run of the `Plan B Maintenance Processor`.
    Reducing the period may result in immediate deletion of older records.
  * **Overwrite**: Can be toggled at any time; it will only affect future data writes.
  * **Snapshot settings**: Can be toggled at any time to balance performance and data freshness.
* **Requires reset**:
  * **State type**: You cannot change the `State Type` of an existing store.
    If you need to change the type (e.g., from `State` to `Temporal State`), you must delete the Plan B document and recreate it, which will clear all existing data.
  * **Schema configuration**: For any type with key or value schema settings, changing the store's key or value schema will cause a "Key schema mismatch" or "Value schema mismatch" error when Stroom attempts to open the existing LMDB file.
    In these cases, you must reset the store contents.


## Debugging issues

For symptoms and fixes, see [Plan B problems]({{< relref "../operate/troubleshooting/plan-b-problems.md" >}}).


### Check directory structure

Navigate to the Plan B path (e.g., `/stroom/planb`) to see where data is stuck:

* **`writer/`**: Data currently being written by a pipeline.
* **`receive/`**: Data uploaded to a storage node but not yet staged.
* **`staging/`**: Data waiting for the `Plan B Merge Processor` job.
* **`shards/`**: The final merged master data.
* **`snapshots/`**: Local copies of shards on non-storage nodes.


### Check background jobs

Ensure the following jobs are enabled and running.
These are the names as they appear on the Jobs screen (see [Nodes, jobs and properties]({{< relref "../operate/nodes-and-jobs.md" >}})), and [Scheduled jobs]({{< relref "../reference/jobs.md" >}}) says which nodes each should run on.

* **Plan B Merge Processor**: moves data from staging into shards.
  Without it, state stores stop advancing and lookups return increasingly stale answers.
* **Plan B Maintenance Processor**: applies condense and retention rules.
  Without it, shards keep growing.
* **Plan B Snapshot Creator** and **Plan B Snapshot Cleanup**: publish the snapshots other nodes read, and remove those nothing is reading.

For **Traces** documents, which live on a shared file store, **Plan B Shared FS Merge** and **Plan B Shared FS Housekeeping** do the equivalent work.


### Log analysis

Stroom logs provide valuable information when troubleshooting Plan B operations (see [Reading the logs]({{< relref "../operate/troubleshooting/reading-the-logs.md" >}})).


#### Finding the logs

Logs are typically found in the `logs/` directory of your Stroom installation.
Common file paths include:

* **`logs/app/app.log`**: The primary application log containing information about merging, maintenance, and lookup errors.
* **Containerised environments**: If running in Docker, logs are often streamed to `stdout` / `stderr` and can be viewed using `docker logs <container_name>`.
* **Linux service**: If installed as a systemd service, logs may also be available via `journalctl -u stroom`.


#### What to look for

Search for "Plan B" or "LMDB" in the logs.
Common issues include:

* **Disk full**: LMDB cannot expand the store if the disk is full.
* **Network failures**: Processing nodes cannot upload to storage nodes.
* **Permission denied**: Stroom user does not have write access to the Plan B path.
* **Key schema mismatch** or **Value schema mismatch**: Occurs if you change the key or value schema of a store without resetting it.


## Resetting contents

To completely reset the contents of a Plan B store, follow [Reset a Plan B store]({{< relref "../operate/resetting/reset-a-plan-b-store.md" >}}).
In outline:

1. **Delete via UI**: Delete the Plan B document in the Explorer.
   The `Plan B Maintenance Processor` will eventually clean up the associated LMDB files on the storage nodes.
1. **Manual reset (advanced)**:
   1. Stop the `Plan B Merge Processor` job.
   1. Delete the specific subdirectory for the store's UUID in the `shards/` directory on all storage nodes.
   1. Delete the associated subdirectories in `snapshots/` on all client nodes.
   1. Clear out `staging/` and `receive/` if they contain pending updates for that store.
   1. Restart the jobs.

{{% note %}}
Manual reset should be used with caution and only when the UI deletion is not sufficient or possible.
{{% /note %}}

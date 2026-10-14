---
title: "Streams"
linkTitle: "Streams"
weight: 25
date: 2026-10-14
tags:
description: >
  The stream is the unit of data Stroom stores and processes, with a type, a status, metadata and optional child parts.
pageKind: concept
aliases:
  - /docs/user-guide/concepts/streams/
  - /docs/user-guide/viewing-data/
---

A **stream** is the unit of data in Stroom.
Each post of data that Stroom accepts becomes a stream, and so does each output a pipeline writes.
Every stream belongs to one [feed]({{< relref "feed.md" >}}), has a stream type, a status and a set of metadata, and has a numeric ID that is unique across the system.

Streams are never edited in place.
Processing a stream reads it and writes new streams, so the raw data you received is always kept alongside what was made from it, until a retention rule removes it.


## Where streams come from

* **Data receipt.**
  When data is posted straight to Stroom, the content of the post is stored as one stream.
  When it comes through Stroom Proxy, many posts are usually aggregated into one stream.
  See [Stroom Proxy and data receipt]({{< relref "data-receipt.md" >}}).
* **Processing.**
  A pipeline reads a stream and writes its results, such as cooked events or errors, as new streams.
  Each output stream records the stream it came from as its parent.
  See [Processing]({{< relref "processing.md" >}}).
* **Uploading.**
  You can upload a file into a feed from the **Data** tab.


## Stream types

The stream type says what kind of data a stream holds.
These types are built in:

| Type | What it holds |
|---|---|
| **Raw Events** | Event data as it was received, before any processing. |
| **Raw Reference** | Reference data as it was received. |
| **Events** | Events that a pipeline has translated, normally into XML. |
| **Reference** | Reference data that a pipeline has translated. |
| **Error** | The errors, warnings and information messages from processing a stream. |
| **Detections** | Detections written by [analytic rules]({{< relref "../guides/detection/analytic-rules.md" >}}). |
| **Records**, **Test Events**, **Test Reference** | Further built-in types for processed data. |

**Context** and **Meta Data** are also stream types, but they only appear as child parts of another stream (see below).

An administrator can add stream types through the `data.meta.metaTypes` [property]({{< relref "../operate/nodes-and-jobs.md" >}}).
A new type used for raw data must also be added to `data.meta.rawMetaTypes`, so Stroom reads it with the feed's encoding.
A type that clients will send in the `Type` header must also be in `receive.metaTypes`, on Stroom and on any Stroom Proxy in front of it.


## Inside a stream

A stream holds its main data and, depending on its type, some child streams.


### Raw streams

Raw Events and Raw Reference streams are **non-segmented**.
Stroom does not yet know where one event ends and the next begins.
The data can be in any format, and can even be malformed, because nothing has parsed it yet.

A raw stream can have several **parts**.
A stream posted directly to Stroom usually has one part.
A stream aggregated by Stroom Proxy has one part for each file it was built from.
Each part can carry its own child streams:

* **Context**: supplementary data sent with the events, such as a mapping from a local machine ID to a host name and IP address.
  Pipelines can use it for reference data lookups.
  It comes from the `.ctx` files in a posted ZIP.
* **Meta data**: key-value metadata, from the HTTP headers of the post and from attributes Stroom and Stroom Proxy add on receipt, such as `ReceivedTime` and `ReceiptId`.


### Processed streams

Events and Reference streams are **segmented**.
A pipeline has split the data into records, and Stroom stores where each record starts and ends, so it can jump straight to any one of them.
These streams have a single part.

Error streams are segmented too: each message is a record.
They have no Context or Meta Data child streams.


## Stream status

Every stream has one of three statuses:

| Status | Meaning |
|---|---|
| **Locked** | The stream is still being written. It can't be read or processed yet. |
| **Unlocked** | The stream is complete and available for reading. |
| **Deleted** | The stream has been logically deleted. Its files are still on disk for now. |

A deleted stream can be restored until it is physically removed.
The **Data Delete** [job]({{< relref "../reference/jobs.md" >}}) removes the files and records of streams that have been deleted for longer than `data.store.deletePurgeAge`, which defaults to seven days.


## Metadata and attributes

Stroom records a set of attributes for every stream.
You can filter on them in the data browser, in processor filters and in data retention rules.
They include:

* **Id**, **Feed**, **Type** and **Status**.
* **Create time**: when the stream was created.
  **Status Time**: when its status last changed.
* **Effective time**: for reference data, the time from which the data applies.
  It is taken from the `EffectiveTime` header if one was sent.
* **Parent Id** and **Pipeline**: for a processed stream, the stream and pipeline that produced it.
* Record counts from processing: **Read Count**, **Write Count**, **Info Count**, **Warning Count**, **Error Count** and **Fatal Error Count**.
* **File Size** and **Raw Size**: the stored, compressed size and the uncompressed size.


## Browsing data

Open a feed or a folder from the explorer tree and select its **Data** tab to browse its streams.
You only see streams for feeds you have permission to read.
The screen has three panes:

* **The stream list**, newest first.
  By default it hides Locked and Deleted streams.
  Use **Filter** to change which streams are shown.
* **The related streams list**, which shows the streams related to the one you select: its parent (for example the Raw Events an Events stream came from), and its children (for example the Error stream from processing it).
* **The content pane**, which shows the selected stream on these tabs:
  * **Info**: the stream's attributes, including where its files are stored.
  * **Data preview**: the data, formatted where possible.
    For a multi-part stream you can step through the parts.
    For a segmented stream you step through the records.
  * **Error**: for an Error stream, a table of the messages and where in the source stream each one occurred.
  * **Context** and **Meta**: the child streams of a raw stream, when it has them.

The preview only loads part of a large stream.
A bar above the data shows how much of the stream is in view and where.
**View Source** opens the data in its original, unformatted form, where you can page through it or jump to a given line or character range.

The stream lists also have buttons to **Process** (run the selected streams through a pipeline again, see [Reprocess data]({{< relref "../operate/resetting/reprocess-data.md" >}})), **Delete**, **Restore**, **Download** (as a ZIP in Stroom's ZIP format) and **Upload**.
The buttons you see depend on your permissions.


## Data retention

By default Stroom keeps all data forever.
Data retention rules let you delete data after a set time, and keep some data longer than other data.

Open the rules from **Administration** > **Data Retention** (you need the **Manage Policies** permission).
Each rule has a name, an expression over stream attributes (for example a feed name, or a stream type) and a retention period: **Forever**, or an age.
Rules are checked in order, lowest number first, and the first rule that matches a stream decides how long it is kept.
Below all your rules is a fixed **Default Retain All Forever Rule**, which keeps anything no other rule matches.
Changes only take effect when you save.

The **Impact Summary** tab is a dry run.
It counts the streams the current rules would delete, broken down by rule, stream type and feed, and it uses the rules as they are on screen, saved or not.
On a large system it can take a while.

The **Policy Based Data Retention** job applies the rules.
By default it runs daily at midnight.
It marks matching streams as Deleted, and the **Data Delete** job later removes them from disk.

{{% note %}}
Retention is based on when a stream was created in Stroom, not on the times of the events inside it.
{{% /note %}}


## Related pages

* [Feeds]({{< relref "feed.md" >}}): every stream belongs to a feed.
* [Stroom Proxy and data receipt]({{< relref "data-receipt.md" >}}): how raw streams are created.
* [Processing]({{< relref "processing.md" >}}): how processor filters pick streams to process.
* [Volumes and storage]({{< relref "volumes.md" >}}): where stream files are kept on disk.
* [Reference data]({{< relref "pipeline-reference-data.md" >}}): how Reference and Context streams are used.

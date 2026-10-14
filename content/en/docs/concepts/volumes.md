---
title: "Volumes and Storage"
linkTitle: "Volumes and Storage"
weight: 115
date: 2026-10-14
tags:
description: >
  Where Stroom keeps stream data and Lucene index shards, how volumes are grouped and chosen, and how the stream store is laid out on disk.
pageKind: concept
aliases:
  - /docs/user-guide/volumes/
---

A **volume** is a place Stroom writes data to.
Most volumes are a directory on a file system, either local to a node or on shared storage.
Stroom has two kinds:

* **Data volumes** hold the stream store: every [stream]({{< relref "streams.md" >}}) Stroom receives or creates, with its child streams.
* **Index volumes** hold the shards of [Lucene indexes]({{< relref "lucene-index.md" >}}).

The database holds the metadata about streams and shards.
The volumes hold the data itself.

You manage them from **Administration** > **Data Volumes** and **Administration** > **Index Volumes**.
Both need the **Manage Volumes** permission.


## Volume groups

Volumes of each kind are organised into **volume groups**.
Stroom writes to a group, and picks a volume within it.
Groups let you keep different data on different storage, for example a sensitive feed on its own disks, or a busy index on faster ones.

* **For data**, the group comes from the **Volume Group** on the [feed's]({{< relref "feed.md" >}}) **Settings** tab.
  A {{< pipe-elm "StreamAppender" >}} can override it with its own `volumeGroup` property.
  If neither is set, Stroom uses the default group, named by `data.filesystemVolume.defaultStreamVolumeGroupName`.
* **For indexes**, the group comes from the **Volume Group** setting on the Lucene index.
  The default is named by `volumes.defaultIndexVolumeGroupName`.

Both default group names are `Default Volume Group`, but data and index groups are separate lists, so the two defaults are different groups.


## Data volumes and index volumes

The two kinds differ in one important way.
An **index volume** belongs to a node: each one names the node that owns it, and a node only writes index shards to its own volumes.
So each index volume group needs volumes for every node that will write to that index.

A **data volume** does not belong to a node.
In a cluster, any node may write a stream to any active data volume in the group, and any node may need to read it back, so data volume paths must be reachable from every node.


## Volume status and limits

Each volume has a status:

| Status | Meaning |
|---|---|
| **Active** | Stroom writes new data to it. |
| **Inactive** | Stroom no longer writes to it, but still reads the data on it. |
| **Closed** | The data has been removed and the volume is no longer used. |

Each volume can also have an optional **Limit**.
Once the space used on the volume's file system reaches the limit, the volume is treated as **Full** and Stroom stops writing to it.
The used space counts everything on that file system, not just Stroom's data.
Without a limit, Stroom treats a volume as full when its file system is nearly full, leaving some headroom.
If you create a data volume on a file system without setting a limit, Stroom gives it one: 90% of the file system's size, set by `data.filesystemVolume.defaultStreamVolumeFilesystemUtilisation`.

The volume screens show each volume's total, used and free space, its **Use%** and whether it is full.
With a limit set, free space and Use% are measured against the limit.

Stroom only writes to volumes that are **Active** and not full.
If every volume in a group is full or inactive, writes to that group fail, so watch the free space and add volumes before you run out.
[Post-install checks]({{< relref "../operate/checking-it-works/post-install-checks.md" >}}) and [Performance and queues]({{< relref "../operate/troubleshooting/performance-and-queues.md" >}}) cover what to look for.

Two jobs keep these figures up to date: **File System Volume Status** for data volumes and **Index Volume Status** for index volumes.
See [Nodes and jobs]({{< relref "../operate/nodes-and-jobs.md" >}}).


## How a volume is chosen

When a group has more than one eligible volume, a **volume selector** picks one.
The default is `RoundRobin`.
Set it with `data.filesystemVolume.volumeSelector` for data and `volumes.volumeSelector` for indexes.
The choices are:

* `RoundRobin`
* `RoundRobinIgnoreLeastFree`, `RoundRobinIgnoreLeastFreePercent`
* `MostFree`, `MostFreePercent`
* `Random`
* `WeightedFreeRandom`, `WeightedFreePercentRandom`


## Default volumes

If there are no volumes when Stroom starts, it creates a default data volume and a default index volume, each in its default group.
The paths are `volumes/default_stream_volume` and `volumes/default_index_volume`.
A relative path is resolved against Stroom's home directory.
Each default volume is given a limit of 90% of its file system, set by `defaultStreamVolumeFilesystemUtilisation` and `defaultIndexVolumeFilesystemUtilisation`.

This is convenient for a first look at Stroom.
For a real deployment, create volumes on the storage you intend to use.
To stop the defaults being created, set `data.filesystemVolume.createDefaultStreamVolumesOnStart` and `volumes.createDefaultIndexVolumesOnStart` to `false`.


## How the stream store is laid out

On a standard data volume, streams are stored under a `store` directory, by stream type and by the date the stream was created, then by its ID.
For example:

```text
<volume>/store/RAW_EVENTS/2023/10/24/004/TEST_FEED=004099.revt.bgz
<volume>/store/RAW_EVENTS/2023/10/24/004/TEST_FEED=004099.revt.meta.bgz
<volume>/store/RAW_EVENTS/2023/10/24/004/TEST_FEED=004099.revt.mf.dat
```

* The **type directory** is the stream type in upper case, such as `RAW_EVENTS` or `EVENTS`.
* The **date** is the stream's creation date in UTC.
* The stream ID is zero padded and split into groups of three digits.
  All but the last group become directories, which keeps the number of files in any one directory small.
* The **file name** is the feed name, `=`, the padded stream ID, then an extension for the stream type (`revt` for Raw Events, `evt` for Events, `err` for Error and so on).

The main data and its Context and Meta Data child streams are compressed with block gzip (`.bgz`), which lets Stroom read from the middle of a large stream without decompressing all of it.
Small uncompressed `.dat` files sit beside them: a manifest (`.mf.dat`), and for segmented or multi-part streams, indexes of where each record or part begins.

You shouldn't need to work with these files directly.
Use the **Data** tab to view streams and **Download** to get a copy.
Never delete files from a volume by hand: the database would still list the streams.
Use [data retention]({{< relref "streams.md" >}}) instead, which marks streams as deleted and lets the **Data Delete** job remove the files.


## S3 storage

A data volume can also be an S3 bucket instead of a file system.
Choose the volume type when you create the volume.
An S3 volume stores each stream as a single object (a ZIP of the stream's files), and Stroom downloads and unpacks it to read it.
Capacity figures (total, used, free, limit and full) are not supported for S3 volumes.

Index volumes are always on a file system.

{{% warning %}}
The Stroom 7.14 betas extend S3 storage.
The existing type is renamed **S3 v1**, and two types are added: **S3 v1 (Read only)**, for reading data that Stroom Proxy has forwarded to S3, and **S3 v2 (Experimental)**, which uses a different compression format.
These are not in a stable release, and S3 v2 is not for production use.
{{% /warning %}}


## Related pages

* [Streams]({{< relref "streams.md" >}}): what the stream store holds, and data retention.
* [Lucene indexes]({{< relref "lucene-index.md" >}}): what is written to index volumes.
* [Feeds]({{< relref "feed.md" >}}): where a feed's volume group is set.
* [Nodes and jobs]({{< relref "../operate/nodes-and-jobs.md" >}}): the volume status jobs.
* [Index problems]({{< relref "../operate/troubleshooting/index-problems.md" >}}): an index with no volume group indexes nothing.

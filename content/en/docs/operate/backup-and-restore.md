---
title: "Backup and Restore"
linkTitle: "Backup and Restore"
weight: 80
date: 2026-10-14
tags:
description: >
  What Stroom keeps where, which parts are rebuildable, and why the pieces have to be backed up together.
pageKind: operate
verification: required
---

Stroom keeps its state in more than one place, and the places refer to each other.
The database holds the metadata; the volumes hold the data that metadata describes.
A backup of one without the other restores a system that believes things about itself that are not true.


## What there is to back up

| What | Where | Rebuildable? |
|---|---|---|
| Stream metadata, processing state, users, permissions, jobs | The database | No |
| Content: pipelines, XSLTs, indexes, dashboards, feeds | The database | No |
| Stream data | Data volumes | No |
| Index shards | Index volumes | Yes, by reprocessing |
| Reference data store | Each node's off-heap store | Yes, loaded on demand from reference streams |
| Plan B shards | The store on each node listed in `stroom.planb.nodeList`; other nodes hold snapshots | Snapshots yes, fetched again from a storing node. The stored shards only by reprocessing the data that wrote them |
| Configuration | The configuration file on each node | No, but small and worth keeping in version control |

The first four rows are the ones that matter.
The rebuildable ones are worth backing up only if rebuilding them would take longer than you can afford to be without them, which for a large index is a real consideration.


## The thing to get right

**The database and the data volumes have to be consistent with each other.**

A stream is a row in the database and files on a volume.
Back them up at different times and you get one of two outcomes:

* **Metadata newer than the files** : rows describing streams whose files are not there.
  Searches find them, reads fail.
* **Files newer than the metadata** : files on disk that nothing refers to.
  They are invisible, and they are never cleaned up, because the job that removes orphans works from the metadata.

Neither announces itself at restore time.
Both appear later as individual failures that look like corruption.

{{< image src="operate/backup-and-restore/backup-consistency.svg" alt="Three rows. Taken together, the database and volumes restore to a system that is true. With the database newer than the files, it names streams whose files are not there: searches find them and reading one fails. With the files newer than the database, the volumes hold files no row names: they are invisible and never reclaimed, because deletion is driven by metadata too." >}}The two halves have to come from the same moment. Either way round, the result looks like corruption rather than like a bad backup.{{< /image >}}

So: take the database dump and the volume snapshot at the same point, or take them with the system stopped.


## A workable approach

1. **Stop processing**, or accept a point-in-time snapshot from storage that covers the database and the volumes together.
1. **Dump the database** with a tool that gives a consistent dump.
1. **Snapshot the data volumes.**
   They are append-mostly, so incremental backup works well.
1. **Capture the configuration** of every node.
1. **Record the versions**: the Stroom version and the database version.
   A restore into a different Stroom version is a migration, not a restore.

Index volumes can be included or left out.
Leaving them out makes backups much smaller and makes recovery slower, because the index has to be rebuilt by reprocessing.

{{< timing mode="async" >}}
Restoring is not finished when the files are back.
Stroom does not reconcile what it finds on disk with what the database says: data volumes and the database have to be restored to the same point by you.
What it does rebuild is the per-node working state: the reference data store fills on demand, and nodes that do not store a Plan B shard fetch a fresh snapshot from one that does.
A Plan B shard lost from a storing node, or index shards you chose not to back up, come back only by reprocessing.

Expect the first searches after a restore to be slower, and the first reference lookups to pause while the store loads.
{{< /timing >}}

{{< verify >}}
On the restored system, pick a stream from before the backup and read it end to end: find it by searching, open it, and confirm the content is there.

{{< golden >}}
**A stream you chose in advance is findable, openable and readable on the restored system.**

All three steps matter, because they test different pieces.
Finding it proves the index and the database.
Opening it proves the metadata points at a real file.
Reading it proves the volume content survived.
{{< /golden >}}

{{< not-proof >}}
**Stroom starting is not proof the restore worked.**
It starts happily with volumes that are missing data, and reports nothing until something asks for a file that is not there.

**A correct stream count is not proof the data is there.**
The count comes from the database, which is exactly the half that can be right while the other half is wrong.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="destructive" >}}
**Restoring the database alone loses data that is still on disk.**

The metadata is what makes a file reachable.
Roll the database back to last week and the streams received since then are still on the volumes, but nothing refers to them: they cannot be searched, read or recovered through the UI, and they will not be deleted either, because deletion is also driven by metadata.

Restore both halves from the same point, and if you have to roll the database back on its own, treat the orphaned files as something to recover deliberately rather than as something that will sort itself out.
{{< /trap >}}

{{< trap severity="silent" >}}
**A backup that has never been restored is an assumption.**

The failure modes above are all invisible until something reads the affected data, which in a restore test means actually reading it rather than confirming the system starts.
Restore into a separate environment and run the check in this page's verify block.
{{< /trap >}}

{{< diagnose >}}
1. **Are the database and volumes from the same point in time?**
   Nearly every restore problem is this.
1. **Does a failing stream exist on disk?**
   Find its path from the metadata and look.
   Present means a permissions or mount problem; absent means the backup pair was inconsistent.
1. **Are all the volumes mounted and writable?**
   A volume that is mounted read-only or not at all gives errors that read like corruption.
1. **Does the Stroom version match the backup?**
   A mismatch means migrations have run, and the result is not the system you backed up.
1. **Are there orphaned files?**
   Enable **Orphan File Finder** and **Orphan Meta Finder** temporarily.
   They report the two inconsistencies above directly.
   See [Scheduled jobs]({{< relref "../reference/jobs.md" >}}).
1. **Did the index come back?**
   If index volumes were excluded, searches are empty until reprocessing rebuilds them, and that is expected rather than a fault.
{{< /diagnose >}}

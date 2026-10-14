---
title: "User Interface"
linkTitle: "User Interface"
weight: 10
date: 2026-10-14
tags:
description: >
  An overview of the Stroom web interface, its layout, and core navigation components.
pageKind: concept
---

The Stroom web interface is designed for high-volume data management and complex pipeline development.
It uses a tabbed environment that allows you to work on multiple documents ([Pipelines]({{< relref "../pipelines.md" >}}), [Indexes]({{< relref "../lucene-index.md" >}}), [Dashboards]({{< relref "../dashboards.md" >}})) simultaneously.


## Overall layout

The interface is divided into three primary regions:

1. **Main menu (top)**: Provides access to global tools, monitoring views, and security settings.
1. **Explorer tree (left sidebar)**: The primary navigation component used to manage all documents and their hierarchical structure.
1. **Main content area (centre)**: The space where document editors, data views, and monitoring screens are displayed in tabs.


## The explorer tree

The Explorer Tree is a hierarchical view of all documents stored in Stroom.
It functions similarly to a file system, allowing you to group related documents into folders.


### Custom structure

The structure of the Explorer Tree is entirely up to you.
Stroom does not enforce a specific layout for where documents must be placed.
You might choose to group documents by project, by data source, or by environment (e.g., Dev, Test, Prod).


### Security and visibility

The primary implication of the Explorer structure is **Security**.
Stroom uses the tree hierarchy to manage document visibility and permissions.

* **Copied at creation**: When you create a document or sub-folder, Stroom copies the permissions of the folder you create it in onto the new item.
  They are not inherited live: changing a folder's permissions later does not change the documents already inside it.
  To push a change down, use **Apply To Descendants** in the folder's permissions.
  When you copy or move a document, you choose whether it keeps its own permissions, takes the destination folder's, combines both, or has none.
* **Access control**: By organising documents into restricted folders, you can easily control which users or groups can see or modify specific parts of the system.
  See [Users, groups and permissions]({{< relref "../../operate/users-and-permissions.md" >}}).


## Folders as aggregated views

While folders are used for organisation, they also provide a powerful **aggregated view** of the documents they contain.
When you open a folder in the main content area, it displays several tabs:

* **Data**: Shows a combined stream list for every [feed]({{< relref "../feed.md" >}}) and pipeline in that folder and its sub-folders.
* **Processors**: Lists all **[Processor Filters]({{< relref "../processing/_index.md" >}})** defined for any pipeline in that folder tree.
  This allows you to enable or disable processing for an entire project from one screen.
* **Active Tasks**: Shows the processor tasks for the pipelines and feeds in that folder, including recently finished ones.
* **Permissions**: Allows you to manage the access control list (ACL) for the folder.

Each tab is described with the concept it belongs to: [the Data tab]({{< relref "../streams/data-tab.md" >}}) under Streams, [the Processors tab]({{< relref "../processing/processors-tab.md" >}}) and [the Active Tasks tab]({{< relref "../processing/active-tasks-tab.md" >}}) under Processor Filters and Tasks, and [the feed Settings tab]({{< relref "../feed.md#settings-tab" >}}) under Feeds.


## Which tabs each document has

| Document | Tabs |
|---|---|
| Folder, and **System** at the root of the tree | **Data**, **Processors**, **Active Tasks**, **Permissions** |
| Feed | **Data**, **Active Tasks**, **Settings**, **Documentation**, **Permissions** |
| Pipeline | **Data**, **Structure**, **Processors**, **Active Tasks**, **Documentation**, **Permissions** |

A tab that is missing is almost always a missing [application permission]({{< relref "../../operate/users-and-permissions.md#application-permissions" >}}), not a fault:

| Tab | Shown only to users with |
|---|---|
| **Data** | `Data - View` |
| **Processors**, **Active Tasks** | `Manage Processors` |

The other tabs are shown to anyone who can open the document.


## Why a button is greyed out

Stroom shows a button greyed out, rather than hiding it, when you are allowed to use it but it would not do anything with what is currently selected.
It hides a button entirely when you do not have the permission it needs.
So a greyed-out button is usually about the selection, and a missing one is about permissions.

The common cases, each explained on its own page:

| You see | Because |
|---|---|
| **Process**, **Delete**, **Download** greyed out on a **Data** tab, with a row highlighted | Those buttons act on the **ticked** streams, and a highlighted row is not ticked. See [The Data tab]({{< relref "../streams/data-tab.md#clicking-a-row-and-ticking-it-are-different" >}}). |
| **Restore** always greyed out | The list's default filter only shows `Unlocked` streams, so it never contains a deleted stream to restore. See [Restore]({{< relref "../streams/data-tab.md#restore" >}}). |
| **Upload** missing on a folder or pipeline | Upload is only offered on a feed's **Data** tab, because a stream has to belong to one feed. |
| **Edit**, **Delete** and **Show Tasks** greyed out on a **Processors** tab | The **processor** row is selected; they act on **filter** rows. See [The Processors tab]({{< relref "../processing/processors-tab.md#processor-rows-and-filter-rows" >}}). |
| **Add** missing on a folder's **Processors** tab | Filters are added from the pipeline that will run them, never from a folder. |
| No buttons at all on a folder's **Processors** tab | That tab is editable only by users with `Administrator`. |
| **Feed Status** greyed out on a feed's **Settings** tab | Feed status only applies when `receiptCheckMode` is `FEED_STATUS`. See [Feed settings]({{< relref "../feed.md#why-feed-status-is-greyed-out" >}}). |
| **Save** greyed out | There are no unsaved changes. An unsaved document has `*` before its name on its tab. |


## Main menu overview

The main menu provides access to system-wide functionality, grouped into eight menus: **Administration**, **Annotations**, **Tools**, **Monitoring**, **Navigation**, **Security**, **User** and **Help**.
Which items you see depends on your [application permissions]({{< relref "../../operate/users-and-permissions.md" >}}).

Stream data is not on any of these menus.
It is on the **Data** tab of a feed, a pipeline or a folder.


### Administration

System-wide configuration.

* **Data Volumes** and **Index Volumes**: Where the stream store and index shards are written; see [Volumes]({{< relref "../volumes.md" >}}).
* **Data Retention**: The rules that decide how long streams are kept; see [Streams]({{< relref "../streams/_index.md#data-retention" >}}).
* **Data Receipt Rules**: The rules that decide whether received data is accepted; see [Data receipt]({{< relref "../data-receipt.md" >}}).
* **Content Templates**: Templates for creating content automatically when data arrives for a new feed.
* **Properties**: The configuration properties of the cluster; see [Nodes, jobs and properties]({{< relref "../../operate/nodes-and-jobs.md" >}}).


### Annotations

Browse and create annotations, and manage the collections, labels and statuses they use.


### Tools

Contains utilities for managing content and configurations.

* **Content Store**: Allows you to install and upgrade content packs (schemas, standard [visualisations]({{< relref "../visualisations.md" >}}), etc.).
* **Import** and **Export**: Used to move Stroom configurations between different environments; see [Content management]({{< relref "../../guides/content-management.md" >}}).
* **Dependencies**: Visualises the relationships and dependencies between different Stroom documents.


### Monitoring

This menu is essential for administrators and developers to track system health and processing progress.

* **Jobs**: Allows management of scheduled system jobs (e.g., cleanup, merging); see [Nodes, jobs and properties]({{< relref "../../operate/nodes-and-jobs.md" >}}).
* **Nodes**: Lists every node in the Stroom cluster, with its build version, ping time and up time, and the jobs on each node.
* **Node Groups** and **Processor Profiles**: Control which nodes do processing, and when; see [Processing]({{< relref "../processing/_index.md" >}}).
* **Server Tasks**: Shows the tasks running on each node across the cluster, and lets you stop them.
* **Caches**: Lists the in-memory caches, with their size and hit rate on each node, and lets you clear them.
* **Database Tables**: The row count and size of each database table.
* **Execution Schedule Manager**: The schedules that run analytic rules and reports.
* **Search Results**: The search results held on the server.


### Navigation

Finding your way round the explorer tree: **Find**, **Find in Content**, **Recent Items**, **Locate Current Item** and **Add Current Item to Favourites**.
It also opens, saves and deletes tab sessions, which are named sets of open tabs.


### Security

Used for managing access to the system; see [Users, groups and permissions]({{< relref "../../operate/users-and-permissions.md" >}}).

* **Users** and **User Groups**: Manage users and their group memberships.
  **Manage Accounts** manages the accounts of Stroom's own identity provider.
* **Application Permissions**: Define high-level system permissions (e.g., `Manage Users` or `Data - View`).
* **Document Permissions**: The permissions users and groups hold on documents.
* **User Access**: Each user's sessions and tokens across the cluster.
* **Manage API Keys**: Manage tokens for external systems to interact with Stroom APIs; see [API keys]({{< relref "../../guides/automation/api-keys.md" >}}).
* **Signing Keys**: The keys Stroom's own identity provider signs its tokens with.
* **Credentials Manager**: Stored credentials, such as the password for a Git server, used by name so that documents never hold them.


### User and Help

**User** holds your own settings: **Preferences**, **User Profile**, **Change Password**, **Sign Out** and **Sign Out Other Sessions**.

**Help** opens this documentation, the **API Specification**, and the **About** box with the version of Stroom you are running.

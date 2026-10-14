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
It uses a tabbed environment that allows you to work on multiple documents ([Pipelines]({{< relref "pipelines.md" >}}), [Indexes]({{< relref "lucene-index.md" >}}), [Dashboards]({{< relref "dashboards.md" >}})) simultaneously.


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
  See [Users, groups and permissions]({{< relref "../operate/users-and-permissions.md" >}}).


## Folders as aggregated views

While folders are used for organisation, they also provide a powerful **aggregated view** of the documents they contain.
When you open a folder in the main content area, it displays several tabs:

* **Data**: Shows a combined **Stream List** for all [Feeds]({{< relref "feed.md" >}}) located within that folder (including its sub-folders).
* **Processors**: Lists all **[Processor Filters]({{< relref "processing.md" >}})** defined for any pipeline in that folder tree.
  This allows you to enable or disable processing for an entire project from one screen.
* **Active tasks**: Shows all currently running or pending **Processor Tasks** for the pipelines and feeds within that folder.
* **Permissions**: Allows you to manage the access control list (ACL) for the folder.


## Main menu overview

The main menu provides access to system-wide functionality, grouped into several categories:


### Monitoring

This menu is essential for administrators and developers to track system health and processing progress.

* **Data (streams)**: The primary view for searching and inspecting all data stored in Stroom.
* **Task manager**: Shows real-time execution of all background tasks across the cluster.
* **Jobs**: Allows management of scheduled system jobs (e.g., cleanup, merging); see [Nodes, jobs and properties]({{< relref "../operate/nodes-and-jobs.md" >}}).
* **Nodes**: Provides health and performance statistics for every node in the Stroom cluster.


### Tools

Contains utilities for managing content and configurations.

* **Content store**: Allows you to install and upgrade content packs (schemas, standard [visualisations]({{< relref "visualisations.md" >}}), etc.).
* **Import/export config**: Used to move Stroom configurations between different environments; see [Content management]({{< relref "../guides/content-management.md" >}}).
* **Dependencies**: Visualises the relationships and dependencies between different Stroom documents.


### Security

Used for managing access to the system.

* **Users / groups**: Manage user accounts and their memberships.
* **App permissions**: Define high-level system permissions (e.g., "Manage Users" or "View Data").
* **API keys**: Manage tokens for external systems to interact with Stroom APIs.

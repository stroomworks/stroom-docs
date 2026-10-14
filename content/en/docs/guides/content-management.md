---
title: "Content Management"
linkTitle: "Content Management"
weight: 110
date: 2026-10-14
tags:
description: >
  Organise, version, move and share Stroom content, from the explorer tree to zip exports, Git repositories and content packs.
pageKind: concept
aliases:
  - /docs/user-guide/content/
  - /docs/user-guide/content/content-naming/
  - /docs/user-guide/content/documentation/
  - /docs/user-guide/content/editing-text/
  - /docs/user-guide/content/finding-things/
  - /docs/user-guide/content/import-export/
---

Everything you build in Stroom is **content**: feeds, pipelines, translations, indexes, dashboards, rules and the folders that hold them.
Each item is a **document** with a type, a name and a UUID that never changes.
This page covers how content is organised, how its history is kept, and how it moves between Stroom instances.


## The explorer tree

The explorer tree on the left of the screen holds every document you can see.
Its layout is up to you: group content by data source, by team or by project.
See [User interface]({{< relref "../concepts/user-interface/_index.md" >}}) for a tour of the tree and the folder views.

Create a document by right-clicking a folder and choosing **New**.
The new-document menu groups [document types]({{< relref "../reference/documents.md" >}}) like this:

| Group | Examples |
|---|---|
| **Data Processing** | Feed, Pipeline |
| **Transformation** | Text Converter, XSL Translation, XML Schema |
| **Search** | Dashboard, Query, Analytic Rule |
| **Indexing** | Lucene Index, Plan B, View |
| **Configuration** | Dictionary, Visualisation, Script, Documentation, Git Repo |

Which types you see depends on your permissions.
A folder can be given **create permissions** for particular document types, so a user may be able to create dashboards in one folder and nothing else.
See [Users, groups and permissions]({{< relref "../operate/users-and-permissions.md" >}}).

The tree only shows what you have permission to see.
A user with no permissions sees an empty tree.
A folder is shown if you can see anything inside it, even when you can't open the folder itself.


## Document history

Stroom keeps an audit trail for every document.
To see it, right-click a document and choose **Info**.
The dialog shows the document's UUID, type and name, then an **Audit Info** table with one row per recorded action: the time, the user and the action.

The recorded actions are **Created**, **Updated**, **Deleted**, **Imported**, **Exported**, **Copied**, **Moved** and **Renamed**.

Stroom also stores a snapshot of the document's data each time it changes, so earlier content is not lost when a document is edited.
Snapshots are deduplicated, so saving an unchanged document doesn't store another copy.

{{% note %}}
Document history arrived in Stroom 7.13.
Documents that existed before the upgrade start with a **Created** entry and, if they had been changed, one **Updated** entry.
Earlier changes were never recorded.
{{% /note %}}


## Deleting content

Content in Stroom is heavily linked.
A pipeline uses translations and schemas, a [processor filter]({{< relref "../concepts/processing/_index.md" >}}) uses a feed, and a dashboard queries an index.
Stroom records these links in both directions, and you can see them from a document's context menu:

* **Dependencies** lists the documents this one needs.
* **Dependants** lists the documents that need this one.

**Tools > Dependencies** lists every link in the system, each with a status of `OK` or `Missing`.
Filtering for `Missing` is a quick way to find content that is already broken.

When you delete a document that has dependants, the confirmation warns you and lists them.
Deleting a folder deletes everything in it, and the confirmation counts the contained items by type.
In both cases the list only names documents you have permission to see, but tells you when others exist.

A deleted document is first marked as deleted.
The **Doc Store - Physical Delete** [job]({{< relref "../reference/jobs.md" >}}) removes it from the database once it has been deleted for longer than `stroom.docstore.physicalDeleteAge` (30 days by default).


## Import and export

Any content can be exported to a zip file and imported into another Stroom.

To export, either choose **Tools > Export**, or select items in the explorer tree and choose **Export** from the context menu.
Pick the items to include, and Stroom confirms how many documents of each type will be exported before writing `StroomConfig.zip`.

To import, choose **Tools > Import**, or **Import** from the explorer tree's context menu, and select the zip file.
Stroom shows each item in the file and what will happen to it before anything changes.
Documents are matched by UUID, so importing a newer version of a document updates it rather than creating a copy.
By default an existing document keeps its current name and folder.
Tick **Use Import Names** or **Use Import Folders** to take them from the file instead.

Export needs the **Export Configuration** application permission and import needs **Import Configuration**.
You can only export documents you can see.

{{% warning %}}
The zip format has changed between Stroom versions.
Stroom can import older formats, but an older Stroom may not be able to import a file exported by a newer one.
{{% /warning %}}


### Import and export through the API

Content can be moved without the user interface.
Calls authenticate with an API key in an `Authorization: Bearer` header.

* **Export everything:** a `GET` to `/api/export/v1` returns a zip of all content the caller can read.
  The caller needs **Export Configuration**, and the property `stroom.export.enabled` must be `true`.
  It is `false` by default.
* **Import:** first upload the zip with a multipart `POST` to `/importfile.rpc`, which returns a resource key.
  Then `POST` that key to `/api/content/v1/import` with an import mode.
  `IGNORE_CONFIRMATION` imports everything without asking.

Stroom can also import every content pack it finds in a directory when it starts.
Set `stroom.contentPackImport.enabled` to `true` (it is `false` by default).
The directory is `stroom.contentPackImport.importDirectory`.


## Git-backed content

A **Git Repo** document links part of the explorer tree to a folder in a Git repository.
Everything you put below the Git Repo in the tree is managed by it, and can be pulled from Git or pushed back to it.
This is a way to keep content under version control, or to share it between Stroom clusters.

Create one from **New > Configuration > Git Repo**.
Its **Settings** tab holds:

| Setting | What it does |
|---|---|
| **Git repository URL** | The repository, over HTTPS or SSH. |
| **Git branch** | The branch to use. |
| **Git path** | The folder within the repository that holds the content. |
| **Git commit** | Optional. Pins the content to one commit. |
| **Automatically push** | Pushes local changes every minute through the **Git Repo Push** job. |
| **Credentials** | A stored credential: username and password, access token or SSH key. |

The buttons on the same tab do the work:

* **Check for updates** shows what has changed in the repository, as a diff.
* **Pull from Git** imports the latest content into Stroom.
* **Push to Git** asks for a commit message, then pushes your changes.

{{% warning %}}
Pulling from Git can overwrite or remove local changes below the Git Repo.
{{% /warning %}}

Git Repos can be nested.
A Git Repo inside another one manages its own content, and the outer one leaves it alone.

Credentials are kept in **Security > Credentials Manager** and used by name, so a password or key is never stored in the document itself.

{{< image src="guides/content-management/StroomGitRepo.png" alt="A content pack backed by Git inside Stroom. Down the left, the explorer tree showing folders and a pack opened to reveal the splitter, pipeline, feed and XSLT it contains. On the right, that pack's settings: its content store and pack name, then the Git repository URL and branch." >}}A Git-backed content pack. The settings name the repository, the branch and the path, and the credential is referenced by name rather than stored here.{{< /image >}}


## The content store

The Content Store installs ready-made **content packs**: tested sets of schemas, pipelines, translations and other content.
Open it from **Tools > Content Store**, pick a pack and click **Install**.
Stroom creates a Git Repo document for the pack and pulls its content.

When a newer version of an installed pack is available, the **Upgrade** button becomes active.
You can also use **Check for updates** and **Pull from Git** on the pack's Git Repo.
A pack's Git settings are controlled by the Content Store, and changes can't be pushed back.
If you need to push, create your own Git Repo.

A Content Store is a YAML file listing packs and where each one lives in Git.
Stroom uses the public store by default.
Add others to `stroom.contentStore.urls`.

{{% warning %}}
Content in a pack has full access to your Stroom.
Review a pack before you trust it.
{{% /warning %}}

To remove a pack, delete its Git Repo document.


## Naming conventions

Stroom enforces one naming rule: feed names must match `stroom.feed.feedNamePattern`, which by default allows upper-case letters, digits, `_` and `-`, at least three characters long.
Feed names must also be unique.
Beyond that, consistent names make content easier to find and to share.
A few habits help:

* Name feeds in one pattern everywhere.
  An established convention is `<SYSTEM>-<ENVIRONMENT>-<TYPE>-<EVENTS/REFERENCE>-<VERSION>`.
* Keep a pipeline, its translations and its feeds together in one folder per data source.
* Keep shared content, such as schemas and standard pipelines, in its own folder.


## Related pages

* [User interface]({{< relref "../concepts/user-interface/_index.md" >}}): the explorer tree and folder views.
* [Users, groups and permissions]({{< relref "../operate/users-and-permissions.md" >}}): who can see, edit and create content.
* [Feeds]({{< relref "../concepts/feed.md" >}}): the documents most other content hangs from.
* [Nodes, jobs and properties]({{< relref "../operate/nodes-and-jobs.md" >}}): the jobs that clean up deleted content and push to Git.

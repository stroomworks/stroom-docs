---
title: "Git Repo"
linkTitle: "Git Repo"
weight: 10
date: 2026-01-16
tags:
description: >
  Import and export from Git Repositories.
---

## Motivation

The Git Repo configuration item allows users to synchronise Stroom configuration via Git repositories.
Stroom content can be stored in the Git repository and downloaded to other Stroom clusters. 


## Appearance

A Git Repo document appears in the Explorer Tree. 
Any Stroom content can be added below it. 
All that content will be managed by the Git Repo instance.

Git Repo instances can have other Git Repo instances under them in the Explorer Tree. However, the top-level Git Repo will not manage the lower-level Git Repos nor their contents. So Git Repos can be nested, and each will work independently.


## Creation

Git Repo instances can be created by:

- Pressing the {{< stroom-icon "add.svg" >}} button in the top-left of the Explorer Tree, then Configuration > {{< stroom-icon "document/GitRepo.svg" >}} Git Repo
- Right-clicking on an item within the Explorer Tree and selecting {{< stroom-icon "add.svg" >}} New > Configuration > {{< stroom-icon "document/GitRepo.svg" >}} Git Repo
- Importing a Content Pack from the Content Store. 
  This is described elsewhere in the documentation.

## Settings

**Note**: Git Repo instances created from Content Packs have a slightly different appearance. This page describes Git Repo instances created by adding them manually.


### Git repository URL

The URL that identifies the Git repository. 
For example, [https://github.com/gchq/stroom-content.git](https://github.com/gchq/stroom-content.git) or [git@github.com:gchq/stroom-content.git](git@github.com:gchq/stroom-content.git).


### Git branch

The branch within the repository. Branches can be used to separate out content for different versions of Stroom, or content that is in development.
Examples might be 7.1, 7.2, 7.5, 7.10.


### Git path

The path within the Git repository to the content to be imported. 
Within the overall Git repository there may be multiple sets of content that could be imported. 
For example, the [Stroom Content](https://github.com/gchq/stroom-content/) contains multiple sets of content under the [stroom-content/source](https://github.com/gchq/stroom-content/tree/master/source) path.

Examples in this case include:

- [source/core-xml-schemas/stroomContent](https://github.com/gchq/stroom-content/tree/master/source/core-xml-schemas/stroomContent) core-xml-schemas content pack
- [source/example-index/stroomContent](https://github.com/gchq/stroom-content/tree/master/source/example-index/stroomContent) example-index content pack
- [source/stroom-101/stroomContent](https://github.com/gchq/stroom-content/tree/master/source/stroom-101/stroomContent) stroom-101 content pack, providing the content for the introductory example. 

If the content is stored in the 7.11 format (import export format version 2.0) then the path can point to anywhere within the content.
This means Stroom can import a subset of the content available within Git.
However, with earlier import/export formats the path must point to the root of the content pack. 

You'll know when you are at the root of the Stroom import/export content as you'll see files and folders that look like these:

- Stroom_101.Folder.71fed11d-7aff-409d-82ff-d7c2fef45eb1.node
- XML_Schemas.Folder.428918b8-4088-42ad-8c49-663b7a428ea9
- index_documents_v1_0.XMLSchema.b5c7bd44-ca00-448d-ba64-66b48f926ec4.meta


### Git commit

Each update to a Git repository is known as a Commit. 
These commits are labeled with a number that look like this: `337b5`. 
The number identifies the state of the whole repository - every file - at that point in time.

If you want to always get the same version of content, regardless of what else may have been committed to that repository, you can set the Git Repo Git commit field.


### Automatically push

If this is checked then the `Git Repo Push` job will automatically push any changes into Git every minute. 


### Credentials


### Push to Git


### Check for updates


### Pull from Git
---
title: "Developing Content"
linkTitle: "Developing Content"
weight: 30
date: 2026-10-15
tags:
  - content
description: >
  Shared Stroom content, such as content packs for common log formats and useful dashboards, and how to contribute to it.
---

Much of what makes Stroom useful is the content built in it: XML schemas, Data Splitter definitions, XSLT translations, pipelines, dashboards and so on.
Content that is useful to more than one Stroom installation can be shared as a **content pack**.


## Content packs and content stores

A content pack is a folder of Stroom content held in a Git repository.
A **content store** is a YAML manifest that lists content packs.
For each pack it gives a name, an icon, a licence, a description, the path in Stroom to install it to, and the Git URL, branch, path and commit to take the content from.

Installing a pack from **Tools > Content Store** creates a Git Repo document in Stroom that points at the pack's repository, and pulls its content.
See [Content management]({{< relref "/docs/guides/content-management.md#the-content-store" >}}) for how to install and upgrade packs, and [Hosting your own content store]({{< relref "/docs/operate/install/local-content-store.md" >}}) for how to mirror the packs and point Stroom at your own manifest.


## The public content store

By default Stroom uses the public content store, whose manifest is [`source/content-store.yml`](https://github.com/gchq/stroom-content/blob/master/source/content-store.yml) in the [gchq/stroom-content](https://github.com/gchq/stroom-content) repository.
It includes packs such as the core XML schemas, the _event-logging_ XML Schema, standard and template pipelines, internal dashboards and statistics, Stroom's own logs, Plan B and the Stroom 101 example content.
Most packs come from the stroom-content repository itself, but a manifest can point at any Git repository: the Visualisations pack, for example, comes from [gchq/stroom-visualisations-dev](https://github.com/gchq/stroom-visualisations-dev).

Content in a pack has full access to the Stroom it is installed in, so review a pack before you trust it.


## Contributing content

Most content for the public store is developed in the [stroom-content](https://github.com/gchq/stroom-content) repository.
Its [README](https://github.com/gchq/stroom-content/blob/master/README.md) describes how to build, validate and develop packs.
In summary:

* Create or change content in Stroom, ideally in an empty development instance with any packs it depends on already imported.
* Export the content and unzip it into the pack's directory under `source/` in the repository.
  The `createSkeletonPack.sh` script creates the structure for a new pack.
* Remove the audit elements (`createUser`, `createTime`, `updateUser` and `updateTime`) that Stroom adds on export; the `removeAuditElements.py` script does this.
* Keep the UUIDs of existing entities and dependencies unchanged, because Stroom links content by UUID.
  Folders shared between packs must have the same UUID in each.
* Run `./gradlew validate` to check the UUID references, then offer the change as a pull request to the repository.

For bugs or suggestions, raise an [issue](https://github.com/gchq/stroom-content/issues) on the repository.

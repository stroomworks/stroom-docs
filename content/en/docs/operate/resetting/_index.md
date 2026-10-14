---
title: "Resetting"
linkTitle: "Resetting"
weight: 50
date: 2026-10-14
tags:
description: >
  How to make a Stroom component start again from a known state, and what each reset costs you.
pageKind: concept
aliases:
  - /docs/user-guide/data-retention/
---

Sometimes the fix is to make something start again.
A pipeline was wrong and the output it produced is wrong with it; an index holds data in a shape you have since changed; a cache is serving a document you have already corrected.

Each page here covers one component.
They share a shape, because the same three questions apply every time:

* **What does it actually clear?**
  Rarely only the thing you had in mind.
* **What is lost, and can it be rebuilt?**
  Most of Stroom's derived data can be rebuilt from the [stream store]({{< relref "../../concepts/streams/_index.md" >}}), which is the strongest argument for keeping raw data.
  Some things cannot.
* **What has to happen afterwards?**
  A reset usually leaves work to redo, and a system that has been reset but not reprocessed looks like a system that has lost data.

{{% warning %}}
Read the whole page before running anything on it.
Several of these operations are irreversible, and two of them delete data that no amount of reprocessing will bring back.
{{% /warning %}}


## Which one do you want?

| Symptom | Page |
|---|---|
| The output is wrong, and the pipeline is now right | [Reprocess data]({{< relref "reprocess-data.md" >}}) |
| New data processes but old data was skipped | [Reset a processor filter]({{< relref "reset-a-processor-filter.md" >}}) |
| Searches are wrong, or you changed an index field type | [Reset an index]({{< relref "reset-an-index.md" >}}) |
| A corrected document is still behaving as it did before | [Clear caches]({{< relref "clear-caches.md" >}}) |
| Reference lookups return stale or deleted values | [Purge reference data]({{< relref "purge-reference-data.md" >}}) |
| A Plan B store is full, stale, or has the wrong schema | [Reset a Plan B store]({{< relref "reset-a-plan-b-store.md" >}}) |
| Nobody can sign in as admin | [Reset a user's password]({{< relref "reset-a-user-password.md" >}}) |

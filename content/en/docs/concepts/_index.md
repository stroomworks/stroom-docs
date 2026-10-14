---
title: "Concepts"
linkTitle: "Concepts"
weight: 20
date: 2026-10-14
tags:
description: >
  How Stroom works: feeds, pipelines, indexes and state stores, and how they fit together.
pageKind: concept
aliases:
  - /docs/user-guide/concepts/
---

Stroom is built out of a few ideas that recur everywhere: data arrives on a [**feed**]({{< relref "feed.md" >}}), a [**pipeline**]({{< relref "pipelines.md" >}}) turns it into something structured, and the result is written to a [**stream**]({{< relref "streams/_index.md" >}}), an [**index**]({{< relref "lucene-index.md" >}}) or a [**state store**]({{< relref "planb.md" >}}).
Learn these and the rest of the product reads as variations on them.

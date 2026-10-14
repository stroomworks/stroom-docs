---
title: "Match References"
linkTitle: "Match References"
weight: 60
date: 2026-10-14
tags:
description: >
  The `<group>` and `<data>` elements can reference match groups from parent expressions or from stored matches in variables.
pageKind: reference
aliases:
  - /docs/user-guide/data-splitter/match-reference/
---

The [`<group>`]({{< relref "../element-reference/content-providers.md" >}}) and [`<data>`]({{< relref "../element-reference/output.md" >}}) elements can reference match groups from parent expressions or from stored matches in variables.
In the case of the `<group>` element, referenced values are passed on to child expressions whereas the `<data>` element can use match group references for name and value attributes.
In the case of both elements the way of specifying references is the same.

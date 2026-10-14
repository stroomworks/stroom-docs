---
title: "Translating"
linkTitle: "Translating"
weight: 30
date: 2026-10-14
tags:
description: >
  Turning what a source actually sent into structured events you can search.
pageKind: concept
aliases:
  - /docs/user-guide/pipelines/
  - /docs/user-guide/pipelines/context-data/
  - /docs/user-guide/pipelines/file-output/
  - /docs/user-guide/pipelines/parser/
  - /docs/user-guide/pipelines/parser/xml-fragments/
  - /docs/user-guide/pipelines/recipies/
  - /docs/user-guide/pipelines/xslt/
  - /docs/user-guide/pipelines/xslt/xslt-basics/
  - /docs/user-guide/pipelines/xslt/xslt-includes/
---

[Translation]({{< relref "../../concepts/translation.md" >}}) is where most of the work in Stroom is, and most of the difficulty.
A source sends you whatever it sends: delimited text, fixed-width columns, XML, JSON, or something with no format at all.
A [pipeline]({{< relref "../../concepts/pipelines.md" >}}) turns that into events in a shape you choose.

Two pieces do the work.
A **Text Converter** written in [Data Splitter]({{< relref "data-splitter/_index.md" >}}) splits unstructured text into XML records.
An **XSLT** then reshapes those records into whatever schema you are standardising on.

Everything else is plumbing around those two.

[Writing a translation]({{< relref "writing-a-translation.md" >}}) is the way in: it builds a pipeline in stages and checks each one in the Stepper before building on it, which is much faster than writing the whole thing and asking why the output is empty.

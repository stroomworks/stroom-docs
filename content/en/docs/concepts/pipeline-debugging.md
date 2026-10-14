---
title: "Pipeline Debugging"
linkTitle: "Pipeline Debugging"
weight: 80
date: 2026-10-14
tags:
description: >
  How to check if a pipeline is working, and what to do if it isn't doing what you expect.
pageKind: concept
---

## Debugging with stepping mode

The **Stepper** is Stroom's most powerful debugging feature.
Unlike traditional logs, it allows you to visualise the data transformation as it happens, one record at a time.


### How to start stepping

There are two ways in, and which you take depends on what you already have in front of you.

**From the pipeline**, when you know what you want to test:

1. Open a {{< stroom-icon "document/Pipeline.svg" "Pipeline" >}} [Pipeline]({{< relref "pipelines.md" >}}) on its **Structure** tab.
1. Click the **Step** {{< stroom-icon "step.svg" >}} button in the toolbar.

**From the data**, when you have a stream that behaved oddly:

1. Open a {{< stroom-icon "document/Feed.svg" "Feed" >}} Feed, or the **Stream Store**.
1. Select the stream you want to test against.
1. Click the **Step** {{< stroom-icon "step.svg" >}} button, on the toolbar or in the context menu.
1. Choose the {{< stroom-icon "document/Pipeline.svg" "Pipeline" >}} Pipeline to step it through.


### What the stepper shows

The UI will split into multiple panes, each representing an element in your pipeline (e.g., Source, Parser, XSLTFilter, XMLWriter).

* **Input vs. output**: You can click on any element to see exactly what data it received and what data it produced.
* **Navigation**: You can move forward or backward through the stream record-by-record using the arrow buttons.
* **Finding errors**: If an XSLT transformation fails on record #502, you can jump to that specific record and see the input XML that caused the crash.
* **Markers**: Fatal errors and warnings are highlighted with red and yellow markers in the margin, allowing you to quickly identify "bad" data.


### Use cases for stepping

* **Developing XSLT**: See the immediate effect of your stylesheet changes on real data (see [Parsers and translation]({{< relref "translation.md" >}})).
* **Fixing parsers**: Identify why a specific log line isn't being split into the correct XML fields.
* **Validating lookups**: Verify that [reference data]({{< relref "pipeline-reference-data.md" >}}) lookups are returning the expected values.


## Then checking it at scale

The Stepper proves what a pipeline does to **one record**.
It cannot tell you whether the pipeline is keeping up, whether some streams are failing, or whether anything is being processed at all, because it never touches the processing path.

Those are different questions with their own pages:

* [Is data processing?]({{< relref "../operate/checking-it-works/is-data-processing.md" >}}) covers the processor and filter switches, the task counts, and where errors surface.
* [Performance and queues]({{< relref "../operate/troubleshooting/performance-and-queues.md" >}}) covers a pipeline that runs but cannot keep up.
* [Reading the logs]({{< relref "../operate/troubleshooting/reading-the-logs.md" >}}) covers what a failing stream leaves behind.

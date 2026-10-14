---
title: "Your First Translation"
linkTitle: "Your First Translation"
weight: 40
date: 2026-10-14
tags:
description: >
  Building a pipeline that turns the CSV you sent into structured events, using the Stepper to prove each element.
pageKind: tutorial
verification: required
---

Raw data is stored exactly as it arrived.
To search it you first have to give it a shape, and that is what a **[pipeline]({{< relref "../concepts/pipelines.md" >}})** does: a parser turns the bytes into XML events, and an XSLT reshapes those events into a common form.

This is the part of Stroom that takes the longest to learn, and the part where the [Stepper]({{< relref "../concepts/pipeline-debugging.md" >}}) earns its keep.


## What you are building

```text
Source → DSParser → XSLTFilter → XMLWriter → StreamAppender
```

The {{< pipe-elm "DSParser" >}} uses a **[Text Converter]({{< relref "../concepts/translation.md" >}})** to split the CSV into fields.
The {{< pipe-elm "XSLTFilter" >}} turns those fields into events.
The {{< pipe-elm "XMLWriter" >}} and {{< pipe-elm "StreamAppender" >}} write the result back out as a new stream.


## The documents

Create three documents, in this order, because the pipeline will point at them.

**A Text Converter** called `TEST-EVENTS-SPLITTER`, with its type set to `Data Splitter`.
This is what tells Stroom your file is comma-separated with a header row.
The [CSV example with a heading]({{< relref "../guides/translating/data-splitter/simple-csv-example-with-heading.md" >}}) shows the same idea in detail.

**An XSLT** called `TEST-EVENTS-XSLT`.
This turns the split records into events.

**A Pipeline** called `TEST-EVENTS`.
Build the element chain above on its **Structure** tab, then set each element's properties to point at the documents you just made.

The [content pack]({{< relref "../guides/content-management.md" >}}) that ships with the evaluation stack has working examples of all three.
Copying one that works and changing it is a faster way to learn this than starting from an empty document.

{{< timing mode="immediate" >}}
The Stepper is **immediate**: it runs one record through the pipeline as you watch, with no processing to wait for.

That is the whole reason to use it here.
Processing a feed is asynchronous and slow; stepping is neither.
{{< /timing >}}

{{< verify >}}
Open the feed's **Data** tab, select your raw stream, and start the **Stepper**.
Walk forward one record at a time.

At each element, the Stepper shows you its input on one side and its output on the other.
Check three things:

* The **DSParser** turns a CSV line into XML records, with one field per column.
* The **XSLTFilter** turns those records into events.
  If its output pane is empty, the XSLT matched nothing.
* No red or yellow markers appear in the margin.

{{< golden >}}
**Every element in the chain shows output for the record you are stepping.**

An element with input and no output is the one that is broken, and the Stepper names it for you.
This is the fastest diagnostic in Stroom and there is no API for it, so it is worth learning now.
{{< /golden >}}

{{< not-proof >}}
**An XSLTFilter producing output is not proof the output is right.**
Read it.
An XSLT that matched a different element than you intended still produces valid XML.

**Stepping one record is not proof the translation handles the file.**
Step several, including the first and the last, and any record that looks unusual.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**An XSLT whose namespace does not match its input matches nothing, and says nothing.**

The parser emits XML in a namespace, and the XSLT's `xpath-default-namespace` has to agree with it.
When it does not, every template fails to match, the transform produces a valid empty result, and you get an output stream containing no events.

It is the single most common beginner mistake, and it looks exactly like "nothing happened".
The Stepper shows it immediately: input on the left, nothing on the right.
{{< /trap >}}

{{< diagnose >}}
1. **Does the Stepper open at all?**
   If not, the pipeline has a structural problem rather than a translation one.
   Check every element has its properties set.
1. **Which element stops producing output?**
   Step through and watch.
   That element is the problem; the ones before it are fine.
1. **If it is the parser**, the Text Converter does not match the file.
   Check the delimiter, and whether you told it there is a header row.
1. **If it is the XSLT**, check `xpath-default-namespace` against what the parser emits.
   See the trap.
1. **Are there markers in the margin?**
   Red is fatal, yellow is a warning.
   Click one to read it.
1. **Does a document the pipeline points at still exist?**
   A deleted or renamed XSLT leaves the property pointing at nothing, and the element then produces nothing without reporting an error.
{{< /diagnose >}}


## Next

The translation works on one record.
Now make it run over the whole stream, and index the result: [index and search it]({{< relref "index-and-search.md" >}}).

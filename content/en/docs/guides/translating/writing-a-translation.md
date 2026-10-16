---
title: "Writing a Translation"
linkTitle: "Writing a Translation"
weight: 5
date: 2026-10-14
tags:
description: >
  Going from raw data to validated events, one step at a time, checking each step before building on it.
pageKind: guide
verification: required
aliases:
  - /docs/howtos/eventfeeds/translation-how-to/
---

A translation is built in stages, and each stage can be looked at on its own.
Building it that way is much faster than writing the whole pipeline and asking why the output is empty, because every stage has its own ways of failing quietly.


## The stages

1. **Get the data in.**
   Send a sample to a feed.
   You cannot translate what you cannot read, and real data is reliably stranger than a sample someone described to you.
1. **Parse it into XML.**
   A {{< pipe-elm "DSParser" >}} with a Text Converter for text formats, or a parser that reads XML or JSON directly.
   With a Data Splitter, the output is `records:2`.
1. **Reshape it with XSLT.**
   An {{< pipe-elm "XSLTFilter" >}} turns those records into the schema you are standardising on.
1. **Validate it.**
   A {{< pipe-elm "SchemaFilter" >}} confirms the output is what you think it is.
1. **Write it somewhere**, or index it.

Build and check them in that order.
A problem at stage 2 produces confusing symptoms at stage 4, and chasing it from the wrong end is where the time goes.


## Use the Stepper for all of it

The Stepper runs one record through the pipeline and shows the input and output of every element.
It is the single most useful thing in Stroom for this work, because it turns "the output is wrong" into "the output of this element is wrong".

Step first, process second.
A processor filter over a million streams tells you much less than one record stepped, and costs much more to undo.

See [Debugging pipelines]({{< relref "../../concepts/pipeline-debugging.md" >}}) for how stepping behaves.

{{< image src="guides/translating/writing-a-translation/StroomSteppingMode.png" alt="Stroom's pipeline stepper. Along the top the pipeline elements run from Source through an XML parser, a split filter and an ID enrichment filter to the selected XSLT filter, then on to indexing. Above, the XSLT doing the work. Below it the same event twice: the raw input on the left and the translated output on the right." >}}The Stepper, with the XSLT filter selected: the element chain along the top, the stylesheet above, and one event shown as it arrives and as it leaves.{{< /image >}}


## Writing the XSLT

Two practical habits:

* **Start from an identity transform** and change one thing at a time.
  An XSLT that emits nothing is almost always a template that never matched, and starting from something that does match makes that obvious.
* **Match the input you actually have**, not the input you expect.
  Step the parser, copy what it produced, and write templates against that.

Stroom's own XSLT functions are available for lookups, dates, identifiers and logging.
See [XSLT functions]({{< relref "../../reference/xslt-functions/_index.md" >}}), and [Reference data]({{< relref "../reference-data/_index.md" >}}) for enrichment.

{{< timing mode="immediate" >}}
Stepping is interactive: each step runs as you ask for it, against one record.
Nothing is stored and nothing is processed, so stepping the same record repeatedly costs nothing and changes nothing.

Processing is the opposite.
Once a processor filter is created, output is written and indexed, and undoing it means deleting streams and reprocessing.
{{< /timing >}}

{{< verify >}}
Step one record all the way through and read the output of every element, then confirm the final output validates against the schema.

{{< golden >}}
**One known record produces the exact event you intended, and passes schema validation in the same stepped run.**

Both halves are needed.
Output that looks right but does not validate will be rejected later; output that validates but has fields in the wrong place is valid and wrong.
{{< /golden >}}

{{< not-proof >}}
**An XSLT that runs without errors is not proof it did anything.**
A stylesheet whose templates never match produces empty output and reports no error, which is the single most common translation fault.

**One record working is not proof the feed works.**
Sources vary their format far more than they admit: optional fields, different line endings, occasional multi-line records.
Step several records, including one you expect to be awkward.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A template that never matches produces nothing, and that is not an error.**

XSLT is declarative: if no template matches, the default behaviour applies and you get either empty output or the text content of the input with no markup.
Both look like "the translation did not run".

Check the XSLTFilter's input in the Stepper before suspecting the stylesheet.
Nine times out of ten the input is not the shape the templates were written for, often because of a namespace.
{{< /trap >}}

{{< trap severity="silent" >}}
**Namespaces are the usual reason a template does not match.**

Data Splitter output is in the `records:2` namespace, and a template matching a bare element name does not match a namespaced one.
The stylesheet looks correct, matches nothing, and reports nothing.

Declare the namespace and match on the prefix, or set `xpath-default-namespace`.
{{< /trap >}}

{{< diagnose >}}
1. **Step the parser first.**
   If stage 2 output is wrong or empty, nothing after it can be right.
   This is where most problems actually are.
1. **Is the XSLTFilter's input what the templates expect?**
   Read it in the Stepper rather than assuming.
1. **Is it a namespace mismatch?**
   The commonest cause of an unmatched template.
1. **Does the output validate?**
   Turn the SchemaFilter on.
   A validation message names the element and the expected content, which is usually enough on its own.
1. **Try several records.**
   A translation that works for one record and fails for the feed is a format variation you have not seen yet.
1. **Check the processing errors.**
   If it works in the Stepper but fails when processing, read the errors on the stream rather than re-reading the XSLT.
   See [Reading the logs]({{< relref "../../operate/troubleshooting/reading-the-logs.md" >}}).
{{< /diagnose >}}

---
title: "Building a Reference Feed"
linkTitle: "Building a Reference Feed"
weight: 10
date: 2026-10-14
tags:
description: >
  Turning a feed of facts into a loaded reference map that lookups can reach.
pageKind: guide
verification: required
aliases:
  - /docs/howtos/referencefeeds/
  - /docs/howtos/referencefeeds/createsimplereferencefeed/index/
  - /docs/howtos/referencefeeds/usesimplereferencefeedhowto/
---

A reference feed is ordinary data sent to an ordinary feed.
What makes it reference data is the pipeline that reads it: a loader pipeline translates it into the `reference-data:2` format and {{< pipe-elm "ReferenceDataFilter" >}} loads the result into the store.


## The format to produce

Your XSLT's job is to emit this, whatever the source data looks like:

```xml
<referenceData xmlns="reference-data:2">
  <reference>
    <map>hostToLocation</map>
    <key>10.1.4.7</key>
    <value>Cardiff</value>
  </reference>
  <reference>
    <map>hostToLocation</map>
    <key>10.1.4.8</key>
    <value>Bristol</value>
  </reference>
</referenceData>
```

Three things decide everything downstream:

* **`<map>`** is the name a lookup asks for.
  One stream can write into several maps.
* **`<key>`** is what the lookup matches on.
  Decide early whether keys are case sensitive in practice, and normalise in the XSLT if they are not.
* **`<value>`** may be a plain string, as above, or an XML fragment, in which case the lookup returns a node set you can copy into the event.

A key range is written with `<from>` and `<to>` instead of `<key>`, which is how numeric ranges such as employee or asset identifiers are loaded without a row per value:

```xml
<reference>
  <map>employeeIdToCountry</map>
  <from>1001</from>
  <to>1700</to>
  <value>UK</value>
</reference>
```


## Building it

1. **Create the feed** and send the reference data to it, exactly as for event data.
   See [Choosing a feed]({{< relref "../sending-data/choosing-a-feed.md" >}}): a reference feed is still a permission boundary.
1. **Create the loader pipeline.**
   It is a normal translation pipeline whose last element is {{< pipe-elm "ReferenceDataFilter" >}} rather than a writer.
   Parse, then {{< pipe-elm "XSLTFilter" >}} producing `reference-data:2`, then the filter.
1. **Set the stream type.**
   Reference streams must be stored as **Reference** rather than Events, so that effective-time selection applies to them.
1. **Process the feed** with that pipeline, as for any other.

{{< timing mode="async" >}}
Loading is lazy.
Creating the loader pipeline and processing the feed does not populate the store; the store is filled when a lookup first asks for a map, and only with the stream that lookup needs.

So a successfully processed reference stream and an empty store are a normal, healthy combination.
The check below triggers a load rather than waiting for one.
{{< /timing >}}

{{< verify >}}
Use the Stepper on an event pipeline that calls the map, over a record whose key you know is in the reference data, and confirm the looked-up value appears in the output.

{{< golden >}}
**The value appears in the stepped output for a key you chose in advance.**

Choosing the key first matters.
Stepping over an arbitrary record and seeing a value prove only that some lookup worked, not that the mapping you built is the one being used.
{{< /golden >}}

{{< not-proof >}}
**A reference stream that processed without errors is not proof it loaded anything.**
It proves the translation ran.
A translation that emits a well-formed `<referenceData>` document containing no `<reference>` elements processes perfectly and loads nothing.

**A non-empty store is not proof your map is in it.**
Check the map name, not the size.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A map name mismatch is silent.**
The loader writes into whatever `<map>` the XSLT produced, and the lookup asks for whatever name the event XSLT passed.
If they differ by a character or by case, the load succeeds, the lookup succeeds in the sense of not throwing, and the value is simply absent from the output.

Nothing in the UI compares the two names.
Copy the name between the two XSLTs rather than typing it twice.
{{< /trap >}}

{{< diagnose >}}
1. **Did the stream store as type Reference?**
   Look at the stream's type on the Data screen.
   An events-typed stream is never considered by a lookup.
1. **Did the translation emit any `<reference>` elements?**
   Step the loader pipeline and look at the XSLTFilter output, not the final result.
   An empty `<referenceData>` document is the most common cause of "nothing was loaded".
1. **Is the namespace right?**
   The output must be in `reference-data:2`.
   A document in no namespace, or in an older one, is not loaded.
1. **Does the map name match the lookup exactly?**
   Compare the two strings character by character.
1. **Is the effective time what you expect?**
   See [Effective times]({{< relref "effective-times.md" >}}).
   A stream effective from today enriches nothing from last week.
1. **Did the lookup run on a node that could load the stream?**
   The store is per node.
   If one node cannot read the stream, lookups differ between nodes.
{{< /diagnose >}}

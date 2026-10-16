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
   Tag it `reference-loader`: the pipeline picker in `pipelineReference` is pre-filtered to that tag, and an untagged loader is hidden until the filter is cleared.
1. **Name it from the event pipeline**, in the `pipelineReference` property of the {{< pipe-elm "XSLTFilter" >}} that does the lookup: the loader, the reference feed, and the stream type the reference data was sent as.
   **Type** defaults to `Reference`.
   If the reference feed holds `Raw Reference` streams, set **Type** to `Raw Reference`.
   See [Looking up values]({{< relref "looking-up-values.md" >}}).

The reference feed does not need a processor filter.
The loader runs on demand, inside the event pipeline's lookup, against streams of the type named in `pipelineReference`.

{{< timing mode="async" >}}
Loading is lazy.
Creating the loader pipeline does not populate the store; the store is filled when a lookup first asks for a map, and only with the stream that lookup needs.

So a reference stream on the feed and an empty store are a normal, healthy combination.
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
**A loader that steps without errors is not proof it loaded anything.**
It proves the translation ran.
A translation that emits a well-formed `<referenceData>` document containing no `<reference>` elements processes perfectly and loads nothing.

**A non-empty store is not proof your map is in it.**
Check the map name, not the size.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A map name mismatch is silent if the lookup sets `ignoreWarnings`.**
The loader writes into whatever `<map>` the XSLT produced, and the lookup asks for whatever name the event XSLT passed.
If they differ by a character or by case, the load succeeds and the value is simply absent from the output.

By default each such lookup warns `Map not found in effective streams`, so the mismatch shows up on the stepped XSLT and in the `Error` streams of the processed feed.
With `ignoreWarnings` set to true that warning is suppressed, and nothing in the UI compares the two names.
Copy the name between the two XSLTs rather than typing it twice.
{{< /trap >}}

{{< diagnose >}}
1. **Does the stream's type match the Type in `pipelineReference`?**
   Look at the stream's type on the reference feed's Data screen, typically `Raw Reference` or `Reference`.
   A lookup only considers streams of the type named, so a mismatch warns `No effective streams found in any of the reference loaders` and finds nothing.
1. **Did the translation emit any `<reference>` elements?**
   Step the loader pipeline and look at the XSLTFilter output, not the final result.
   An empty `<referenceData>` document is the most common cause of "nothing was loaded".
1. **Is the output valid `reference-data:2`?**
   {{< pipe-elm "ReferenceDataFilter" >}} matches elements by name and does not check the namespace or the structure.
   Add a {{< pipe-elm "SchemaFilter" >}} before it to catch malformed output.
1. **Does the map name match the lookup exactly?**
   Compare the two strings character by character.
   A mismatch warns `Map not found in effective streams` unless `ignoreWarnings` is set.
1. **Is the effective time what you expect?**
   See [Effective times]({{< relref "effective-times.md" >}}).
   A stream effective from today enriches nothing from last week.
1. **Did the lookup run on a node that could load the stream?**
   The store is per node.
   If one node cannot read the stream, lookups differ between nodes.
{{< /diagnose >}}

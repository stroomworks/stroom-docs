---
title: "Looking Up Values"
linkTitle: "Looking Up Values"
weight: 30
date: 2026-10-14
tags:
description: >
  Calling a reference map from a translation, and handling the key that is not there.
pageKind: guide
verification: required
---

A lookup happens inside the XSLT that translates event data.
Two things have to be in place: the pipeline must know where to load reference data from, and the XSLT must ask for it.


## Point the pipeline at the loader

On the event pipeline's {{< pipe-elm "XSLTFilter" >}}, the `pipelineReference` property lists where reference data may be loaded from.
Each entry has three settings in the dialog: **Pipeline**, **Feed** and **Type**.

* **Pipeline** is the loader pipeline that reads the reference data.
  The picker opens pre-filtered to `tag:reference-loader`, so a loader without that tag is hidden until you clear the filter.
* **Feed** is the reference feed.
* **Type** is the stream type to load from, and defaults to `Reference`.
  It must match the type the reference data was sent as: if the feed holds `Raw Reference` streams and **Type** is left at `Reference`, every lookup warns `No effective streams found in any of the reference loaders` and returns nothing.

This is a property of the *consuming* pipeline.
A reference feed that loads perfectly is still invisible to a translation that has not named it here.
With no entry at all, each lookup is an error on the XSLT step: `No reference loaders have been added to this XSLT step to perform a lookup`.


## Call it from the XSLT

```xml
<xsl:value-of select="stroom:lookup('hostToLocation', Host)"/>
```

The two-argument form resolves against the time the stream being processed was received, not against the event's own time.
Every event in a stream is looked up at the same moment, so an event timed before a change in the reference data can still get the value from after it, if its stream arrived later.
The longer forms let you be explicit:

```text
lookup(map, key)
lookup(map, key, time)
lookup(map, key, time, ignoreWarnings)
lookup(map, key, time, ignoreWarnings, trace)
```

* **`time`** sets the lookup time.
  Pass the event's own time here whenever the value that applied *when the event happened* matters, which for most enrichment it does:

  ```xml
  <xsl:value-of select="stroom:lookup('hostToLocation', Host, EventTime)"/>
  ```

  Passing a literal is a way to investigate a particular moment, not something to leave in a finished translation.
* **`ignoreWarnings`** turns a failed lookup from a warning into silence.
* **`trace`** records how the lookup was resolved, which is the fastest way to see *which* reference stream answered.

Where the value was loaded as an XML fragment, copy it rather than taking its string value:

```xml
<xsl:copy-of select="stroom:lookup('hostToDetail', Host)"/>
```

See [Reference data functions]({{< relref "../../reference/xslt-functions/reference-data.md" >}}) for the full signatures, including `bitmap-lookup()`.


## Keys that are not there

A missing key is normal.
Hosts get decommissioned, users appear before the directory export catches up, and a reference feed is never perfectly in step with events.

Decide deliberately which you want:

* **A warning per miss**, the default, which makes gaps visible on the processing screens and noisy when gaps are expected.
  The warning reads `Key not found`, with the map, key and lookup time.
* **Silence**, with `ignoreWarnings` set to true, which is right when misses are routine and wrong when they indicate a broken load.
* **A fallback**, by testing the result in the XSLT and emitting a placeholder, which keeps the output shape consistent for whatever searches it later.

The third is usually the best of the three, because a field that is sometimes absent is harder to search than one that is sometimes `unknown`.

{{< image src="guides/reference-data/looking-up-values/missing-key-warning.png" alt="A feed's Data tab listing its streams. The selected processed stream has an Events stream and an Error stream beside the Raw Events stream it came from. The Error tab below shows one warning from the XSLT Filter: Lookup - Key not found, with the map name, the key and the lookup time." >}}A missed lookup during processing. The warning is written as an `Error` stream next to the `Events` stream, so the event still comes out, just without the value.{{< /image >}}

{{< verify >}}
Step the event pipeline over one record whose key you know is present and one whose key you know is absent, and confirm the first enriches and the second behaves the way you chose.

{{< golden >}}
**A known-present key enriches, and a known-absent key produces the handling you intended, in the same stepped run.**

Both halves matter.
Testing only the present key leaves the miss behaviour untested, and miss behaviour is what you will meet in production.
{{< /golden >}}

{{< not-proof >}}
**A lookup that works on a stepped stream without a `time` argument is not proof it resolves per event.**
Without it every event uses the stream's received time, so data sent soon after it happened looks right, and late or back-filled data quietly gets the value in effect when its stream arrived.
Step a record whose time falls before a change in the reference data to tell the two apart.

**A lookup that works with a literal `time` argument is not proof either.**
It shows the value at that moment, not at the time of each event.

**No warnings is not proof every lookup resolved.**
With `ignoreWarnings` set, a translation in which every single lookup missed is indistinguishable from one in which they all matched.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Without a `time` argument, every lookup uses the stream's received time, and nothing says so.**

The lookup succeeds and returns a real value, just the one in effect when the stream arrived rather than when the event happened.
Nothing warns, because nothing failed.
Pass the event's time as the third argument wherever the history of the reference data matters.
{{< /trap >}}

{{< diagnose >}}
1. **Is the loader listed in `pipelineReference` on this XSLTFilter?**
   Without it the step reports `No reference loaders have been added to this XSLT step`.
1. **Does the entry's Type match the reference streams' type?**
   A warning naming `stream type 'Reference'` when the feed holds `Raw Reference` streams means it does not.
1. **Turn on `trace` for one stepped record.**
   It names the reference stream that answered, which settles map-name, effective-time and stream-type questions at once.
1. **Does the map name match the loader's `<map>` exactly?**
   Including case.
   A mismatch warns `Map not found in effective streams`.
1. **Is the key what you think?**
   Step the pipeline and look at the value being passed in, not at the source data.
   Trimming and case normalisation in earlier steps change it.
1. **Is the lookup time the one you meant, and inside the reference data's range?**
   Without a `time` argument it is the stream's received time, not the event's.
   A time before the earliest reference stream warns `No effective stream can be found`.
   See [Effective times]({{< relref "effective-times.md" >}}).
1. **Does it behave the same on every node?**
   The reference store is per node, so a node that failed to load a stream answers differently.
   Compare a stepped result against processed output from a different node.
{{< /diagnose >}}

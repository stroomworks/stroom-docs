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
Each entry names a feed, a stream type and the loader pipeline that reads it.

This is a property of the *consuming* pipeline.
A reference feed that loads perfectly is still invisible to a translation that has not named it here, and nothing warns you: the lookup simply returns nothing.


## Call it from the XSLT

```xml
<xsl:value-of select="stroom:lookup('hostToLocation', Host)"/>
```

The two-argument form resolves against the event's time.
The longer forms let you be explicit:

```text
lookup(map, key)
lookup(map, key, time)
lookup(map, key, time, ignoreWarnings)
lookup(map, key, time, ignoreWarnings, trace)
```

* **`time`** overrides the event time.
  Passing a literal here is a common way to make a lookup appear to work while the real data still resolves differently.
  Use it to investigate, not in finished translations.
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
* **Silence**, with `ignoreWarnings` set to true, which is right when misses are routine and wrong when they indicate a broken load.
* **A fallback**, by testing the result in the XSLT and emitting a placeholder, which keeps the output shape consistent for whatever searches it later.

The third is usually the best of the three, because a field that is sometimes absent is harder to search than one that is sometimes `unknown`.

{{< verify >}}
Step the event pipeline over one record whose key you know is present and one whose key you know is absent, and confirm the first enriches and the second behaves the way you chose.

{{< golden >}}
**A known-present key enriches, and a known-absent key produces the handling you intended, in the same stepped run.**

Both halves matter.
Testing only the present key leaves the miss behaviour untested, and miss behaviour is what you will meet in production.
{{< /golden >}}

{{< not-proof >}}
**A lookup that works with an explicit `time` argument is not proof it works in production** , where the event's own time is used.
If you passed a time to make it work, you have found the bug rather than fixed it.

**No warnings is not proof every lookup resolved.**
With `ignoreWarnings` set, a translation in which every single lookup missed is indistinguishable from one in which they all matched.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A pipeline that does not name the loader in `pipelineReference` returns nothing, not an error.**

The XSLT is valid, the translation succeeds, the field is just missing from every event.
It looks exactly like a reference feed that failed to load, which is why this is worth checking first: it costs a glance at one property.
{{< /trap >}}

{{< diagnose >}}
1. **Is the loader listed in `pipelineReference` on this XSLTFilter?**
   The commonest cause, and the quickest to rule out.
1. **Turn on `trace` for one stepped record.**
   It names the reference stream that answered, which settles map-name, effective-time and stream-type questions at once.
1. **Does the map name match the loader's `<map>` exactly?**
   Including case.
1. **Is the key what you think?**
   Step the pipeline and look at the value being passed in, not at the source data.
   Trimming and case normalisation in earlier steps change it.
1. **Is the event's time inside the reference data's range?**
   See [Effective times]({{< relref "effective-times.md" >}}).
1. **Does it behave the same on every node?**
   The reference store is per node, so a node that failed to load a stream answers differently.
   Compare a stepped result against processed output from a different node.
{{< /diagnose >}}

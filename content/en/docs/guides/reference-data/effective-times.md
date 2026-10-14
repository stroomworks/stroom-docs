---
title: "Effective Times"
linkTitle: "Effective Times"
weight: 20
date: 2026-10-14
tags:
description: >
  Which reference stream a lookup uses, and how to make it the one that was true when the event happened.
pageKind: guide
verification: required
---

Every reference stream has an **effective time**: the moment from which the facts it contains are true.
A lookup picks the reference stream whose effective time is the latest one **not after** the lookup time.

The lookup time is the part that surprises people.
Unless the XSLT passes one, it is the time the stream being processed was received, not the time of the event inside it:

```xml
<!-- Resolves against when the event stream arrived -->
<xsl:value-of select="stroom:lookup('hostToLocation', Host)"/>

<!-- Resolves against when the event happened -->
<xsl:value-of select="stroom:lookup('hostToLocation', Host, EventTime)"/>
```

That rule is the whole of it, and almost every surprising lookup result follows from it.


## Why it works that way

Reference data describes a world that changes.
A host moves office, a user changes department, an asset changes owner.
An event from March enriched with today's facts is wrong in a way that is hard to notice and hard to undo once it is indexed.

Selecting by effective time, with the event's time passed as the lookup time, means a March event is enriched with what was true in March, even if you process it today, and even if you reprocess it next year.
The enrichment is a function of the data, not of when the processing happened, which is what makes reprocessing produce the same answer twice.

Without the event's time, the answer depends on when the event stream arrived.
For data sent as it happens that is close enough; for late or back-filled event data it is not.


## What this means in practice

Suppose `hostToLocation` has been loaded three times, and the translation passes each event's time to the lookup:

| Effective time | `10.1.4.7` maps to |
|---|---|
| 1 January | Cardiff |
| 1 June | Bristol |
| 1 October | Bristol, rack 4 |

An event from 10 March looks up `Cardiff`.
An event from 10 July looks up `Bristol`.
An event from yesterday looks up `Bristol, rack 4`.
All three are correct at the same time.

Without the third argument, all three events would look up whatever was effective when their stream arrived: if the March and July events were sent yesterday, all three would get `Bristol, rack 4`.

{{< image src="guides/reference-data/effective-times/effective-times.svg" alt="A timeline. Above it, three reference streams with effective times of 1 January, 1 June and 1 October, mapping the same host to Cardiff, then Bristol, then Bristol rack 4. Below it, three events dated 10 March, 10 July and yesterday, each with an arrow running back to the latest stream whose effective time is not after it, and each resolving to a different value." >}}Each event resolves against the latest reference stream whose effective time is not after it. All three answers are correct at the same moment.{{< /image >}}

{{< image src="guides/reference-data/effective-times/event-time-lookup.png" alt="The Stepper on an event pipeline at the XSLT Filter. The XSLT calls stroom:lookup with the map name, the IP address and the record's time value as a third argument. The input record is alice downloading from 192.168.1.10 at 09:16:22, and the output event has a Location of Bristol." >}}Stepping a translation that passes the event's time as the third argument. Stepping records either side of a reference change shows each one resolving against its own time.{{< /image >}}

Two consequences worth holding on to:

* **Correcting a mistake needs an effective time in the past.**
  Loading the correction today fixes events whose lookup time is from today.
  Events from before that still resolve to the stream that was effective then, including the wrong one.
* **There is no lookup before the first stream.**
  A lookup time earlier than your earliest effective time has no stream to resolve against, and the lookup finds nothing, with a `No effective stream can be found` warning.


## Setting the effective time

The effective time comes from the reference stream's metadata, set when the data is sent, not from when it was processed.
Send it with the `EffectiveTime` header in the datafeed request, in ISO-8601 form.
See [The datafeed contract]({{< relref "../../reference/the-datafeed-contract.md" >}}).

Without that header the effective time falls back to the time the data was received, which is correct for a feed that is kept continuously up to date and wrong for a backfill.
A backfill of last year's reference data, sent today with no header, becomes effective today and enriches nothing historic.

{{< verify >}}
Look up the same key twice through the Stepper, over two events with times either side of a known reference change, and confirm the two results differ in the way the table above describes.

{{< golden >}}
**The same key returns different values for events at two different times, matching the effective times you loaded.**

This is the only check that actually tests effective-time selection.
One lookup at one time tells you a lookup works, not that it is resolving by event time.
Step two records from the *same* stream: if the XSLT does not pass the event's time, both get the same value however far apart they are.
{{< /golden >}}

{{< not-proof >}}
**A correct lookup "now" is not proof for historic data.**
The present is the easiest case and the one that almost always works.

**Seeing several reference streams on the Data screen is not proof they are all reachable.**
Only the latest one not after the lookup time is consulted; the others are invisible to that event.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A reference stream sent without an `EffectiveTime` header takes the time it arrived.**

For a backfill this is almost never what was meant, and it fails quietly: the load succeeds, the store fills, and lookups for historic events carry on returning the older values or nothing at all, because the new stream is effective from today.

Set `EffectiveTime` explicitly on any reference data that describes a period other than now.
{{< /trap >}}

{{< trap severity="immutable" >}}
**Events already enriched and indexed keep the values they were given.**

Correcting reference data changes what future processing produces.
It does not reach back into streams already translated or documents already indexed.
Fixing those means reprocessing the affected period, which is a deliberate and sometimes large operation: see [Reprocess data]({{< relref "../../operate/resetting/reprocess-data.md" >}}).
{{< /trap >}}

{{< diagnose >}}
1. **What is the lookup time?**
   If the XSLT passes no `time` argument, it is the received time of the stream being processed, not the event's time.
   Turn on `trace`, or read the lookup time in any lookup warning.
   Everything follows from it.
1. **What effective times exist for that feed?**
   List the reference streams and their effective times.
   The one that will be used is the latest not after the lookup time.
1. **Is the earliest effective time after the lookup time?**
   Then no stream applies and the lookup finds nothing.
   This is the usual cause of a lookup that works for recent data and fails for a backfill.
1. **Was `EffectiveTime` set when the reference data was sent?**
   If not, it is the receipt time, which for a backfill is wrong.
1. **Are two streams effective at the same instant?**
   Make them distinct.
   Which one wins is not something to rely on.
1. **Has the needed stream been purged?**
   The store rebuilds from streams, but a stream removed by data retention cannot be reloaded.
   See [Purge reference data]({{< relref "../../operate/resetting/purge-reference-data.md" >}}).
{{< /diagnose >}}

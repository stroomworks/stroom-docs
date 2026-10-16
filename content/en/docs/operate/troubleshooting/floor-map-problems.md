---
title: "Floor Map Problems"
linkTitle: "Floor Map Problems"
weight: 30
date: 2026-10-14
tags:
description: >
  A blank map, a layout with no entities, or entities that vanish, and what each one means.
pageKind: operate
verification: required
---

A floor map draws two separate things from two separate stores: the **layout** comes from its facts store, and the **entities** moving over it come from its events store.
Almost every floor map problem is really the question of which of those two is missing, so the first thing to establish is which half of the map is blank.

For what the pieces are, see [Enterprise Floor Mapping]({{< relref "../../concepts/floor-mapping.md" >}}).
To set one up from scratch, see [Building a floor map]({{< relref "../../guides/building-a-floor-map.md" >}}).

{{< timing mode="immediate" >}}
Drawing is immediate: the map runs its queries and renders what comes back.

Getting data *into* the two stores is not.
The events store is a [Plan B]({{< relref "../../concepts/planb.md" >}}) store and inherits its merge cycle, so newly ingested events are not immediately visible.
See [Plan B problems]({{< relref "plan-b-problems.md" >}}).
{{< /timing >}}

{{< verify >}}
Open the **Map** tab and set the timeline to an instant you know has both a layout and events.
The layout should draw, and entities should appear on it.

{{< golden >}}
**The layout draws, and at least one entity appears, at a known instant.**

Both halves at a time you have reasoned about.
A map that is blank "now" may be perfectly correct for a period you have not looked at.
{{< /golden >}}

{{< not-proof >}}
**A populated facts store does not mean the map will draw.**
The background image is itself a **fact**, and the image it shows is an **asset** uploaded on the Floor Map document's **Assets** tab.
Both have to be present: a facts store full of objects with no background fact, or a background fact whose image is missing, still looks broken.

**Events existing in the store does not mean they reach the canvas.**
They have to be selected by the events query and mapped to roles.
See the trap below.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**The event columns must match the aliases the events query actually selects.**

The map maps query result columns onto roles: which column is the entity id, which is the location, which is the type.
If a configured column name does not match an alias the query returns, that role simply never binds.

Nothing fails.
The query runs, rows come back, and no entity reaches the canvas.
This is the most common cause of "the layout draws but nothing moves".
The only signs are the Map tab's status line, which reads "Events found, but no entity could be read — check the column mapping", and the browser console, which lists the mapping role by role next to the columns the query actually returned.
{{< /trap >}}

{{< trap severity="silent" >}}
**Renaming either store breaks the map quietly.**

A facts store's name is how its data is addressed.
An events store's name is both its Plan B state store key, which the ingest XSLT's `<map>` element must equal, and the value substituted into the events query's store parameter.

Rename either and the `<map>` your ingest XSLT writes no longer names a store.
Processing reports that against each stream it processes (for the events store, `Unable to find state doc for map name`), but the floor map does not.
After a rename, change the XSLT, check the ingest feeds for `Error` streams, and choose the store again on the Floor Map's **Settings** tab.
{{< /trap >}}

{{< diagnose >}}
1. **Is anything drawn at all?**
   If not, the problem is the facts side.
   Check the map has a facts store set, that the store has facts in it, including a background fact, and that the background's image has been uploaded on the Floor Map document's **Assets** tab and the document saved since: an uploaded image is only served once the document is saved.
   If the status line reads "No floor plan at this time, so entities have nowhere to be placed", no fact is in effect at the timeline position: the store is empty, or every fact's effective time is later than the position.
1. **Does the layout draw but no entities appear?**
   The problem is the events side.
   Work through 3 to 6.
1. **Is the events store the right type?**
   It must be a FloorMap Event Store, not a plain Plan B document.
   They are not interchangeable.
   A map pointed at a Plan B document says so on its status line.
1. **Does the events query return rows at all?**
   Run it on the **Events Query** tab.
   If it returns nothing, this is a query or an ingest problem, not a mapping one.
   On the Map tab the same case reads "No events at this time", which is often just a timeline position the data does not cover.
1. **Do the configured event columns match the query's aliases exactly?**
   See the trap.
   Check this before anything subtler: it accounts for most cases.
1. **Did entities appear and then vanish?**
   That is event expiry.
   An entity stays on the map for a fixed period after its last event, defaulting to **24 hours** and capped by the store's data retention.
   A source that reports rarely needs a longer expiry.
   If **Condense Data** is on in the event store's settings, an entity that keeps reporting the same value expires while still reporting, because the repeats are collapsed to the earliest.
1. **Are entities drawn where nothing is?**
   Events can carry literal coordinates, frozen at ingest, or a reference to a fact.
   Literal coordinates do not move when you move the object; a fact reference is resolved at the timeline instant and does.
   If things are stuck in the wrong place, they are probably literal.
1. **Does a fact reference point at a fact that exists?**
   If no entity's location matches a fact, the Map tab's status line says "Entities reference locations that are not on this floor plan".
   If only some miss, those entities are left off the map without a message.
{{< /diagnose >}}

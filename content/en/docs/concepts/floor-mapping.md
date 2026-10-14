---
title: "Enterprise Floor Mapping"
linkTitle: "Enterprise Floor Mapping"
weight: 160
date: 2026-10-14
tags:
description: >
  Plot events for people, devices and assets on a floor plan, and replay who was where, and when.
pageKind: concept
status: beta
betaNote: "Stroom issue #5834. Names, settings and limits may change before it ships."
---

A floor map draws your events on a plan of a building.
A badge scan shows up at the gate that read it, and a log from a device shows up at the desk the device sits on.
A timeline then lets you replay the data, so you can see who was where, and when.


## How it fits together

A floor map is built from three documents:

* {{< stroom-icon "document/FloorMap.svg" "Floor Map" >}} **Floor Map** is the map itself.
  You draw it and view it here.
  It appears under **Search** when you create a new document.
* {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} **SQL Temporal Store** holds the map's **facts**: the background plans, the objects on them (desks, gates, cameras) and the areas, each with its position.
  You can also keep static details here, such as a person's name.
  It appears under **Indexing**.
* {{< stroom-icon "document/FloorMapEventStore.svg" "FloorMap Event Store" >}} **FloorMap Event Store** holds the **events**, keyed by the entity they are about (a person, a device).
  It is a {{< stroom-icon "document/PlanB.svg" "Plan B" >}} [Plan B]({{< relref "planb.md" >}}) temporal state store with a fixed key and value schema.
  It also appears under **Indexing**.

Facts say what the site looks like at a given time.
Events say what happened on it.
Facts never animate.
Events are what the timeline plays back.

{{< image src="concepts/floor-mapping/StroomFloorMap.png" alt="A Stroom floor map. An office floor plan, its rooms tinted by zone, with pins dropped onto it from a query: blue workstation pins labelled Desk 102 through Desk 120, several marked as moved; orange person pins labelled alice, bob, carol and dave; and a yellow vehicle pin labelled forklift-7." >}}A floor map. The plan and the pin positions are facts; the pins themselves are events, placed by a query over the event store.{{< /image >}}


## Setting up a floor map

1. Create a {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} SQL Temporal Store for facts and a {{< stroom-icon "document/FloorMapEventStore.svg" "FloorMap Event Store" >}} FloorMap Event Store for events.
1. Build [pipelines]({{< relref "pipelines.md" >}}) to load your facts and events into those stores.
   The event store's name must match the `<map>` element your ingest XSLT writes to.
1. Create a {{< stroom-icon "document/FloorMap.svg" "Floor Map" >}} Floor Map.
   Stroom asks for its facts store and events store, and you can't finish until you have chosen both.
   It then fills in default queries for events, the timeline histogram and the time range.
1. Draw or correct the layout on the **Editor** tab.
1. View and replay it on the **Map** tab.

{{% note %}}
The event store's name is used in two places: the events query reads it as `param('EventStore')`, and the ingest XSLT writes to it as a map name.
If you rename the store, change both.
{{% /note %}}


## Facts: the shape of the site

Each fact is a value, in JSON (the default) or XML, stored against a key and the time it takes effect.
A fact never changes in place.
Instead, it gets a new version from a later time, so the store keeps a record of how the site has changed.

On the **Settings** tab, the **Value Schema** tells the map where each part of a fact is.
The default schema reads these JSON paths:

| Path | What it holds |
|---|---|
| `.type` | The object's type, such as `gate` or `camera`. `background`, `person` and `area` have special meanings. |
| `.name` | The label shown on the map. |
| `.coords` | Its position. |
| `.img` | An image, such as the background plan. |
| `.tm-world-to-map` | The transform from real-world coordinates to the map. |
| `.geometry` | The outline of an area. |
| `.fill`, `.opacity` | How an area is filled. |
| `.status` | `ACTIVE`, the default when blank, or `DELETED`. |

A `DELETED` version hides the fact on the map from that time onwards.
Only the floor map reads this status.
XSLT lookups and [dashboards]({{< relref "dashboards.md" >}}) still see the fact.


## Events: what happened

The map finds its events by running a [StroomQL]({{< relref "query-language.md" >}}) query against the event store.
On the **Events Query** tab you choose which result column plays each role:

* **Entity ID** (required): who or what the event is about.
* **Location**: literal `x, y` coordinates, fixed when the event was loaded.
* **Location ref**: the key of a fact, such as a desk or gate.
  It is looked up at the time shown on the timeline, so if the desk moves, its occupants move with it.
* **Type**: which layer the entity is drawn on, and how.
  If no type is given, an ID containing `@` is drawn as a person.

The default query selects `Status` and `Message` as well.
The map doesn't use them yet.

On the event store's **Settings** tab, **Event Expiry** sets how long an entity stays on the map after its last event.
The default is 24 hours, and it can't be longer than the store's data retention.


## Drawing the map: the editor tab

The Editor shows the canvas, a **Layers** panel, the timeline, a list of every fact, and the time versions of the selected fact.

* **Select** by clicking.
  Hold Shift, Ctrl or Cmd to add to the selection, or drag with one of them held to select a region.
* **Move** by dragging.
  Corner handles scale and the round handle rotates (hold Shift to snap to 15°).
* **Right-click** on empty space to add an object or draw an area.
  Right-click on an object to edit its properties, add a time version, duplicate it, delete it from the current time, or erase its history.
* **Set Scale** by drawing a line over something whose length you know and entering that length.
  Sizes and positions are then in real units.

**Delete From This Time** keeps the object's past and hides it from now on.
**Erase History** removes the object completely.
Edits are only written to the facts store when you save the document.


### Layers

There is one layer per type, and the order of the list is the drawing order.
Each layer can be drawn as a coloured shape, as one of the built-in icons (people, doors, gates, badge readers, cameras, sensors, servers and other things that produce logs), or as an image you upload on the **Assets** tab.
**Discover** scans the facts store for types that don't have a layer yet.


## Viewing and replaying: the map tab

The Map tab is read-only.

* **Tracking** lists the entities on the map and the area each one is in.
  Select one to follow it.
* **Groups** let you name a set of entities and highlight them in a colour.
* Entities that overlap are drawn as a cluster.
  Click the cluster to list its members.

The **timeline** has a histogram of event density, a scrubber, play and step buttons, and playback speeds from 0.5× to 10,000×.
Its settings let you loop playback, fix the start and end dates, or show the whole time range.
Entities move smoothly between positions and leave a short trail.


## Current limits

* The map reads at most 20,000 rows of events, and at most 20,000 rows of fact history.
* A floor map keeps the default queries it was created with.
  If the defaults change later, existing maps don't pick up the change.
* A Location Ref that points at a fact which doesn't exist is ignored.


## Related pages

* [Plan B]({{< relref "planb.md" >}}): the store that {{< stroom-icon "document/FloorMapEventStore.svg" "FloorMap Event Store" >}} FloorMap Event Stores are built on.
* [Reference data example]({{< relref "pipeline-reference-data-example.md" >}}): enriching badge-scan events with names, icons and locations.
* [Floor map problems]({{< relref "../operate/troubleshooting/floor-map-problems.md" >}}): when the map is empty or entities are missing.

---
title: "Floor Maps"
linkTitle: "Floor Maps"
weight: 45
date: 2026-08-18
tags:
  - search
  - floor-map
description: >
  A Floor Map document plots events onto a plan of a physical space and animates them over time.
---

## What a Floor Map Is

A {{< stroom-icon "document/FloorMap.svg" "Floor Map" >}} Floor Map document shows *where* logged activity happened.
It draws a plan of a physical space — a floor of an office, a site, a car park — and animates the entities seen in your event data as they move around that space over time.

Where a [Dashboard]({{< relref "../dashboards" >}}) answers "how many" and "when", a Floor Map answers "where".
It is the right tool when the location in your events is meaningful in itself: badge readers on doors, cameras in corridors, workstations in rooms, vehicles in a yard.

A Floor Map is built from two kinds of thing.

* **Facts** are the longer-lived content that makes up the plan.
  The background image, the gates, the desks, the cameras and the areas are all facts.
  Each fact is versioned over time, so the map can show how the space was arranged at the moment selected on the timeline.

* **Events** are the time-varying records that move.
  A person, a vehicle or an asset is an event entity: it has a position at each point in time, and the map animates it between those positions as the timeline plays.

Both come from {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} SQL Temporal Store documents, and both are read by {{< glossary "StroomQL" >}} queries.


## Prerequisites

Before you create a Floor Map you need the following.

1. A {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} SQL Temporal Store to hold the map's facts.
   This is the store the Editor tab reads and writes, so it can start out empty.
1. A {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} SQL Temporal Store holding your events, keyed by the entity the event is about.
   The same store can serve as both if you write your facts and events into one place.
1. Data being written into the events store, typically by a {{< stroom-icon "document/Pipeline.svg" "Pipeline" >}} Pipeline whose {{< stroom-icon "document/XSLT.svg" "XSLT" >}} XSLT emits one entry per event.
1. An image of the space, ready to upload as a document asset.

A Floor Map with no events store is still useful — it shows a plan whose facts change over time — but nothing will move on it.


## Creating a Floor Map

Create the document in the {{< stroom-icon "explorer.svg" "Explorer" >}} Explorer Tree in the usual way:

{{< stroom-menu "New" "Search" "Floor Map" >}}

A Floor Map cannot exist without knowing where its data lives, so a dialog opens immediately asking for the **Facts Store** and the **Events Store**.
Both must be chosen before {{< stroom-btn "OK" >}} is enabled.
Cancelling the dialog deletes the part-created document.

The stores are referenced by *name*: the name is substituted into the `param('FactStore')` and `param('EventStore')` placeholders of the queries the document runs.
Either store can be changed later on the [Configuration]({{< relref "configuration" >}}) tab.


## The Document Tabs

| Tab | Purpose |
| --- | --- |
| Map | Watch the map. Play the timeline, follow an entity, control layers and groups. See [Viewing a Floor Map]({{< relref "viewing" >}}). |
| Editor | Author the map. Place facts, draw areas, set the scale, style the layers. See [Editing a Floor Map]({{< relref "editing" >}}). |
| Events Query | The {{< glossary "StroomQL" >}} query that supplies the moving entities. See [Events Query]({{< relref "events-query" >}}). |
| Settings | The store references and the schema that says how to read each stored value. See [Configuration]({{< relref "configuration" >}}). |
| Assets | Images used by the map, uploaded to this document. |
| Documentation | Free-text notes about this document, as on any Stroom document. |
| Permissions | Who may read and edit this document. |

The document opens on the Map tab.
All the tabs share one save: pressing {{< stroom-icon "save.svg" "Save" >}} Save writes the document, the Editor tab's staged edits and any asset changes together.


## Map Space and Scale

Positions on a Floor Map are held in *map space*, an abstract coordinate system in which one map unit is one screen pixel at 100% zoom.
Facts are placed into map space by a six-element affine matrix, which is how a fact can be moved, scaled and rotated independently of everything else.

Map space says nothing about the real world, so every distance the map displays — the grid labels, the scale bar in the corner, the readout that follows the cursor while you drag — depends on the map's *scale*.
A map that has never been calibrated falls back to one centimetre per map unit, which means the distances shown are real measurements but arbitrary ones.
Set the true scale with the Editor tab's [Set Scale]({{< relref "editing#setting-the-scale" >}}) tool.

Distances are always shown in metric, promoting between millimetres, centimetres, metres and kilometres to suit the value.


## Suggested Order of Work

1. Create the document and choose its stores.
1. Upload the plan image on the **Assets** tab.
1. On the **Editor** tab, add the image as a background fact, then set the scale from something in the image whose real length you know.
1. Place the fixed content — gates, desks, cameras — and draw the areas.
1. On the **Settings** tab, check the value schema matches how your data is written.
1. On the **Events Query** tab, write the query that returns your moving entities and map its columns.
1. On the **Editor** tab's Layers panel, discover the types in your data and style each one.
1. On the **Map** tab, play the timeline.

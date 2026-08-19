---
title: "Configuration"
linkTitle: "Configuration"
weight: 10
date: 2026-08-18
tags:
  - search
  - floor-map
description: >
  The Settings tab, where a Floor Map is told which stores hold its data and how to read the values in them.
---

The **Settings** tab holds everything a Floor Map needs in order to make sense of its stores.
Nothing on this tab affects how the map *looks* — that is configured on the Editor tab's [Layers]({{< relref "editing#layers" >}}) panel.


## Stores

### Facts Store

The {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} SQL Temporal Store supplying the map's facts — the longer-lived content such as background images, gates, desks and rooms.

Each fact is versioned over time, so the map shows how the space was arranged at the moment selected on the timeline.
This is also the store the [Editor]({{< relref "editing" >}}) tab reads and writes, and the store that the Layers panel's **Discover types** action scans.


### Events Store

The {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} SQL Temporal Store supplying the map's time-varying events — for example the people or vehicles whose position changes over time.
Events are drawn as the overlay that moves, and leaves a fading trail, as the timeline plays.

Leave this blank if the map has no moving events.
It is legitimate for the facts store and the events store to be the same document.

Only the referenced document's *name* is used at query time, substituted into the `param('EventStore')` placeholder of the [events query]({{< relref "events-query" >}}).


## Value Format

Each entry in a temporal store has a `Value` column holding a serialised structure.
This setting says how that structure is encoded, and therefore how the **Value Schema** paths below are interpreted.

* **JSON** — paths are JSON field names, e.g. `.type` or `.coords`.
* **XML** — paths address elements and attributes within the XML value.

Set this to match how your feed or pipeline writes the store.
Changing it re-interprets every entry in the store, so only change it if the stored format really has changed.


## Value Schema

The value schema is what turns an opaque stored value into something the map can draw.
Each row maps a **Role** — what the renderer needs — to a **Path** within the value.

| Column | Meaning |
| --- | --- |
| Role | What the map uses this field for. |
| Path | Where to find it in the value, e.g. `.coords` for JSON. |
| Display Name | Optional label for the field in the Editor's properties form. |
| Default | Value used when the field is absent from an entry. |

Use the toolbar above the grid to {{< stroom-icon "add.svg" "Add" >}} add or {{< stroom-icon "remove.svg" "Remove" >}} remove a mapping.

A new Floor Map is seeded with a schema for the JSON layout below, so if you write your facts in that shape there is nothing to configure here.

```json
{
  "type": "gates",
  "name": "North Gate",
  "coords": [ 120, 340 ],
  "img": "gate.png",
  "tm-world-to-map": [ 1, 0, 0, 1, 0, 0 ],
  "geometry": [ 0, 0, 100, 0, 100, 80, 0, 80 ],
  "fill": "#1e88e5",
  "opacity": 0.3
}
```


### Roles

| Role | Purpose |
| --- | --- |
| Type | The fact's type. This drives the paint order and the default graphic, both configured per layer. |
| Label | The name shown on the map and in the lists. |
| Position | The coordinates `[x, y]` of a point fact. |
| Image | The name of an image in this document's asset store. A fact with an image is drawn as a scaled image, so a background is simply an image fact. |
| World-to-Map | A six-element affine matrix `[a, b, c, d, e, f]` that positions, scales and rotates the fact in map space. Every fact, backgrounds included, is placed by this matrix. |
| Geometry | The vertices of an area, as a flat array `[x0, y0, x1, y1, ...]` in the fact's own frame. |
| Fill | An area's fill colour, as a hex string such as `#1e88e5`. |
| Opacity | An area's fill opacity, a number between `0` and `1`. |
| Custom | Any extra field of your own. It is carried through and shown in the properties form but not otherwise interpreted. |

{{% note %}}
There is no editable "facts query".
The query that reads the facts store is generated from the value schema and the value format, so it is always in step with them.
{{% /note %}}

An older document whose schema predates areas is given the `Geometry`, `Fill` and `Opacity` mappings automatically, with paths derived as siblings of the paths it already uses.
A schema that maps one of those roles to a path of your own is left alone.

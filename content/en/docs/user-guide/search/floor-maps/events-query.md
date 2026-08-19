---
title: "Events Query"
linkTitle: "Events Query"
weight: 20
date: 2026-08-18
tags:
  - search
  - floor-map
description: >
  The query that supplies the moving entities a Floor Map animates, and how its columns are mapped.
---

The **Events Query** tab holds the {{< glossary "StroomQL" >}} query that returns the map's moving entities.
It is an ordinary query editor: you can run it, see the results as a table, and set a time range, exactly as you would in a {{< stroom-icon "document/Query.svg" "Query" >}} [Query]({{< relref "../queries" >}}) document.
The difference is what happens to the results — each row becomes an entity on the map.

The map runs this same query repeatedly as the timeline plays, so it is worth keeping it cheap.
During playback the query is re-run at most about three times a second no matter how fast the playback speed, and the movement between refreshes is interpolated rather than queried.


## Writing the Query

The events store is referenced by the `param('EventStore')` placeholder, which is substituted with the name of the store chosen on the [Configuration]({{< relref "configuration" >}}) tab.
Selecting a different store there therefore does not require the query to be edited.

The query must return, at a minimum, a column identifying the entity and a column saying where it was.

```text
from param('EventStore')
select
  EffectiveTime as "Effective Time",
  Key as "Entity ID",
  replace(jq(Value, '.location'), '"', '') as "Location ID",
  jq(Value, '.type') as "Type",
  jq(Value, '.status') as "Status",
  jq(Value, '.message') as "Message"
```


## Column Mappings

Two dropdowns above the query editor say which of the returned columns mean what.
They are populated from the columns of the last result, so run the query once before setting them.

**Entity ID Column** identifies the thing that moves — a person, a vehicle, an asset.
This value is the entity's identity everywhere else on the map: it is what the Tracking panel lists, what a group holds as a member, and what is matched against a fact of the same key.

**Location ID Column** says where the event happened, and is read in one of two ways.

* **A reference** — anything that is not coordinates is read as the *key of the fact* the event happened at, such as a desk, a gate or a camera.
  The entity is then drawn wherever that fact currently is.

* **Coordinates** — a value of the form `map, x, y`, with the position already baked into the event when it was ingested, typically by an XSLT `lookup` against a location store.
  The coordinates are used as they stand.

Prefer a reference where you can.
Baked coordinates are frozen at ingest time, so if you later move the desk on the Editor tab, every event that ever happened at it still reports the old position and entities keep visiting a spot nothing occupies.
A reference is resolved against the facts loaded for the current timeline instant, so moving the fact moves its visitors with it.

An event whose location is neither valid coordinates nor a resolvable reference is dropped rather than drawn in the wrong place.


## Entity Type

The map also looks for a column named `Type`, matched by name and ignoring case.
Its value is the entity's type, which decides the layer the entity is drawn on and therefore its colour, its graphic and its paint order.

If there is no such column, the type is guessed:

* an entity id containing `@`, i.e. one that looks like an email address, is treated as a `person`
* anything else is treated as an `object`

Naming the column exactly `Type` is worth doing.
Without it, every non-person entity lands on one layer and cannot be styled apart from the rest.


## Time Range

The query's time range limits which events are considered at all.
The timeline on the Map tab moves *within* whatever this returns, so a range of `All time` lets the timeline reach any event in the store.

A narrow range makes the query cheaper on a busy store, at the cost of the timeline no longer being able to reach outside it.


{{% see-also %}}
[Stroom Query Language]({{< relref "../queries/stroom-query-language" >}})  
[Viewing a Floor Map]({{< relref "viewing" >}})
{{% /see-also %}}

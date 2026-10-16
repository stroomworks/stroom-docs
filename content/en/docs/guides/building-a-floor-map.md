---
title: "Building a Floor Map"
linkTitle: "Building a Floor Map"
weight: 75
date: 2026-10-16
tags:
description: >
  From two empty stores to a floor map that replays your events: the stores, the pipelines that load them, the background, the layout and the column mapping.
pageKind: guide
verification: required
---

You have events that happen at places, such as badge scans at gates or logins at desks, and you want to see them on a plan of the building.
This guide builds a floor map from nothing: two stores, two pipelines, a background plan, a layout, and an events query mapped onto the map.
It ends with a map you can scrub and play, and a way to tell it is placing entities where it should.

For what each piece is and why there are two stores, read [Enterprise Floor Mapping]({{< relref "../concepts/floor-mapping.md" >}}) first.
Floor maps need Stroom 7.14 or later.


## Before you start

* **Two feeds**, one for facts (the objects on the site and where they are) and one for events (what happened at them).
  See [Choosing a feed]({{< relref "sending-data/choosing-a-feed.md" >}}).
* **Decide your keys now.**
  Every object an event can happen at needs a key, such as `G-NORTH-01` for a gate, and the events must carry that same key.
  The match is exact and case-sensitive.
* **Permissions.**
  You need **Use** permission on both stores to choose them for the map.
  The facts pipeline writes as its processor filter's **Run As User**, who needs **Edit** permission on the facts store.


## 1. Create the two stores

1. Create a {{< stroom-icon "document/SqlTemporalStore.svg" "SQL Temporal Store" >}} **SQL Temporal Store** for the facts, under **Indexing**.
   This guide calls it `site_facts`.
   Pipelines find it by name, ignoring case, so give it a name no other SQL Temporal Store has.
1. Create a {{< stroom-icon "document/FloorMapEventStore.svg" "FloorMap Event Store" >}} **FloorMap Event Store** for the events, also under **Indexing**.
   This guide calls it `site_events`.
   Its name may only contain lower-case letters, digits and underscores.
1. On the event store's **Settings** tab, check **Event Expiry**, under **Map Display**.
   It is how long an entity stays on the map after its last event, 24 hours by default.
   If **Data Retention** is on, the expiry can't be longer than the retention period.
   Leave **Condense Data** off: with it on, an entity that keeps reporting the same place disappears from the map while it is still reporting.

{{% note %}}
Pick both names before you write the pipelines.
Every `<map>` element an XSLT writes must equal its store's name, and the floor map reads both stores by name too.
Renaming a store later means changing the XSLT and choosing the store again on the Floor Map's **Settings** tab.
{{% /note %}}


## 2. Load the facts

A fact is a JSON value stored against a key from an effective time.
Build a pipeline that parses your source data, then an {{< pipe-elm "XSLTFilter" >}} producing `reference-data:2`, then a {{< pipe-elm "SqlStoreFilter" >}}.
See [Writing a translation]({{< relref "translating/writing-a-translation.md" >}}) for the parser and XSLT.

The XSLT's output for two gates and a desk:

```xml
<referenceData xmlns="reference-data:2" version="2.0.1">
  <reference>
    <map>site_facts</map>
    <key>G-NORTH-01</key>
    <value>{"type": "gate", "name": "North Entrance", "coords": [500, 28]}</value>
  </reference>
  <reference>
    <map>site_facts</map>
    <key>G-SOUTH-22</key>
    <value>{"type": "gate", "name": "South Entrance", "coords": [500, 972]}</value>
  </reference>
  <reference>
    <map>site_facts</map>
    <key>DESK-102</key>
    <value>{"type": "desk", "name": "Desk 102", "coords": [310, 455]}</value>
  </reference>
</referenceData>
```

* **`<map>`** is the facts store's name.
* **`<key>`** is the key events will refer to.
* **`<value>`** is JSON that the floor map's default **Value Schema** reads: `type` picks the layer, `name` is the label, and `coords` is the position as `[x, y]`.
  You don't need to get positions right yet; you will correct them on the map.

If a name can contain `"` or `\`, escape it in the XSLT, or the value isn't valid JSON and the map skips that fact.

Unlike a reference loader, this pipeline only writes when it processes, so add a processor filter for the facts feed.
See [Processing]({{< relref "../concepts/processing/_index.md" >}}).

{{< trap severity="silent" >}}
**A fact only exists on the map from its effective time.**

A `<reference>` takes the effective time of the stream it came from, and a stream sent without an `EffectiveTime` header takes the time it was received.
Facts sent today are then not on the map for last week's events, and the Map tab says "No floor plan at this time, so entities have nowhere to be placed".

Either send the facts with an `EffectiveTime` earlier than your first event (see [Effective times]({{< relref "reference-data/effective-times.md" >}})), or give each fact its own time.
The SQL Store Filter also accepts Plan B's `<temporal-state>` form, which carries a `<time>`:

```xml
<plan-b xmlns="plan-b:2" version="2.0">
  <temporal-state>
    <map>site_facts</map>
    <key>G-NORTH-01</key>
    <time>2024-01-01T00:00:00.000Z</time>
    <value>{"type": "gate", "name": "North Entrance", "coords": [500, 28]}</value>
  </temporal-state>
</plan-b>
```
{{< /trap >}}


## 3. Load the events

Build a second pipeline: parse, then an {{< pipe-elm "XSLTFilter" >}} producing `plan-b:2`, then a {{< pipe-elm "PlanBFilter" >}}.
Add a processor filter for the events feed.

The XSLT's output for one badge scan:

```xml
<plan-b xmlns="plan-b:2" version="2.0">
  <temporal-state>
    <map>site_events</map>
    <key>jane.doe@example.org</key>
    <time>2026-10-14T09:15:00.000Z</time>
    <value>{"locationRef": "G-NORTH-01", "type": "person", "status": "OK", "message": "Access granted"}</value>
  </temporal-state>
</plan-b>
```

* **`<map>`** is the event store's name, exactly.
* **`<key>`** is the entity the event is about: a person, a device, a vehicle.
  Each distinct key is one thing on the map.
* **`<time>`** is when it happened, as `yyyy-MM-ddTHH:mm:ss.SSSZ`.
* **`<value>`** is JSON that the default events query reads:

| Field | What it is |
|---|---|
| `locationRef` | The key of the fact the event happened at. The entity is drawn wherever that fact is at the time shown. |
| `location` | Coordinates instead, as a string: `"310, 455"`. Fixed at ingest, so they don't follow the fact if you move it. Use one or the other. |
| `type` | The entity's layer, such as `person` or `vehicle`. Without it, a key containing `@` is drawn as a person and anything else as an object. |
| `status`, `message` | Selected by the default query, but not used by the map. |

In the XSLT, the value is ordinary text with `xsl:value-of` where the data goes, for example `<value>{"locationRef": "<xsl:value-of select="$reader"/>", "type": "person"}</value>`.

The events store is a [Plan B]({{< relref "../concepts/planb.md" >}}) store, so the `Plan B Merge Processor` job must be running on the Plan B storage nodes before anything written is readable.


## 4. Create the floor map

1. Create a {{< stroom-icon "document/FloorMap.svg" "Floor Map" >}} **Floor Map**, under **Search**.
1. In **Initialise New Floor Map**, set **Facts Store** to `site_facts` and **Events Store** to `site_events`.
   Each picker only offers stores of the right type that you have **Use** permission on.
   **OK** stays disabled until both are set, and **Cancel** deletes the new document.

Stroom fills in the events query, the histogram and Show All queries, the column mapping and the default Value Schema.


## 5. Add the background plan

The background is a fact like any other, whose type is `background` and whose image is uploaded to the Floor Map document.

1. On the **Assets** tab, click **Add file** and choose **Upload File**.
   Choose the plan image and upload it.
1. **Save the document.**
   An uploaded image is only served once the document is saved.
1. On the **Editor** tab, right-click the canvas and choose **Add Object Here**.
1. In **Add Object**, set **Type** to `background`, give it a **Name**, and pick the plan in **Image**.
1. Set **Effective From Time** to before your first event.
   It defaults to the time the timeline is at, and the background isn't drawn before it.
1. Click **OK**, then save the document.
   Editor changes are only written to the facts store when you save.

The image is stored as `/assets/<floor map UUID>/<file name>`.
To load backgrounds from the facts pipeline instead, put that path in the fact's `img` field.


## 6. Lay out the map

Your objects are drawn at their `coords` and the plan at its own size, so the two won't line up yet.

1. **Fit the plan to the objects, or the objects to the plan.**
   Click the background to select it, then drag a square corner handle to scale it or drag it to move it.
   Drag individual objects onto the right spot on the plan.
   Hold Shift, Ctrl or Cmd to select several.
1. **Set the scale.**
   Right-click and choose **Set Scale**, drag a line along something whose real length you know, such as a doorway or a wall, and enter that length under **It is really**.
   The grid labels, the scale bar and the measurements shown while you drag are then real distances.
1. **Save the document.**

A move, resize or rotation changes the version of the fact that is in effect at the timeline position.
It does not start a new version.
To record that a desk moved on a given date, put the timeline on that date, right-click the desk and choose **Add Time Version** first.
Loading a fact again with the same key and effective time replaces that version, so a correction made here is lost if the facts pipeline reprocesses the same data.

{{< trap severity="silent" >}}
**Objects you add in the Editor get generated keys.**

**Add Object Here** gives the new fact a key such as `new-48213`, and the dialog has no field to change it.
No event's `locationRef` will match it.
Load anything an event can happen at through the facts pipeline, with the key your events use, and use the Editor to place it.
{{< /trap >}}


## 7. Set up the layers

The **Layers** panel on the Editor tab has one layer per type, drawn in list order.

1. Click **Discover types** to scan the facts store for types without a layer, and add the ones you want.
1. Drag layers into drawing order, with `background` first so it is drawn underneath.
1. Click a layer's swatch to choose how it is drawn: a coloured shape, one of the built-in icons, or an image from the document's assets.
   An image uploaded from this dialog appears once the document is saved.
1. Save the document.


## 8. Check the events query and its mapping

The **Events Query** tab holds the query the map runs against the event store.
A new map starts with:

```text
from param('EventStore')
select EffectiveTime as "Effective Time",
  Key as "Entity ID",
  jq(Value, '.location') as "Location",
  jq(Value, '.locationRef') as "Location Ref",
  jq(Value, '.type') as "Type",
  jq(Value, '.status') as "Status",
  jq(Value, '.message') as "Message"
```

`param('EventStore')` is replaced with the event store's name when the query runs.

Above the query, **Entity ID**, **Location**, **Location Ref** and **Type** say which result column plays each role.
The defaults match the aliases above, so if your values use the field names from step 3 you need change nothing.

1. Run the query.
   The role lists only offer the query's columns once it has run.
1. If you changed an alias, or your value uses different field names, choose the matching column for each role.
   **Entity ID** is required, and so is at least one of **Location** and **Location Ref**.
1. Save the document.

{{< trap severity="silent" >}}
**A role pointing at a column the query doesn't return draws nothing.**

The query still returns rows, so it looks as if it worked.
The Map tab's status line says "Events found, but no entity could be read — check the column mapping", and the browser console lists each role next to the columns the query returned.
{{< /trap >}}


## 9. View and replay it

On the **Map** tab:

1. Open the timeline's settings (the gear) and click **Show All** to fit the timeline to your events.
1. Drag the scrubber to a time just after an event you know, or press play and pick a speed from the speed badge.
1. Use the **Tracking** panel to find an entity and follow it.

{{< timing mode="async" >}}
Nothing reaches the map until the pipelines have processed the data.
Facts are in the facts store as soon as the facts pipeline has run.
Events are readable only after the `Plan B Merge Processor` job, which runs every minute by default, has merged them.

An open Map tab re-reads the facts about once a minute, and whenever you switch back to it.
An empty map straight after processing usually means not yet, not failed.
{{< /timing >}}

{{< verify >}}
Pick one event before you look: an entity key, the fact key in its `locationRef`, and its time.
On the Map tab, move the timeline to just after that time.

{{< golden >}}
**The entity you picked is drawn at the fact its event names.**

That one check proves the whole chain: the fact loaded with the right key and an early enough effective time, the event loaded into the store the map reads, the query selects it, and the column mapping places it.
{{< /golden >}}

{{< not-proof >}}
**Rows on the stores' Data tabs are not proof.**
The facts store's **Data** tab shows the facts are there, and the event store's shows `Location Ref` and `Type` for each event, but neither tests effective times, the mapping, or whether the keys match.

**A drawn plan is not proof the facts are right.**
The background can be in effect while the objects, loaded later, are not.

**Events found by the query are not proof either.**
See the column-mapping trap above.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Does the facts pipeline's output contain your facts?**
   Step it, and look at the XSLTFilter's output for `<reference>` elements with the store's name in `<map>`.
   Check the facts feed for `Error` streams: a store the filter can't find, or can't write to, is reported there.
1. **Does the events feed have `Error` streams?**
   `Unable to find state doc for map name` means `<map>` doesn't match the event store's name.
1. **Is the background drawn at the time you are looking at?**
   If not, check its **Effective From Time**, and that the document was saved after the image was uploaded.
1. **Does the Map tab's status line say anything?**
   "No events at this time" is usually a timeline position the data doesn't cover; the other messages point at the facts or the mapping.
1. **Does each `locationRef` equal a fact's key exactly?**
   An entity whose reference matches no fact is left off the map.
{{< /diagnose >}}

For more, see [Floor map problems]({{< relref "../operate/troubleshooting/floor-map-problems.md" >}}).


## Related pages

* [Enterprise Floor Mapping]({{< relref "../concepts/floor-mapping.md" >}}): facts, events, the Value Schema and the editor in detail.
* [SQL Temporal Store]({{< relref "../concepts/sql-temporal-store.md" >}}): the store that holds the facts.
* [Plan B]({{< relref "../concepts/planb.md" >}}): the store the FloorMap Event Store is built on.
* [Floor map problems]({{< relref "../operate/troubleshooting/floor-map-problems.md" >}}): a blank map, a layout with no entities, or entities that vanish.

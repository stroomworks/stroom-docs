---
title: "Viewing a Floor Map"
linkTitle: "Viewing"
weight: 40
date: 2026-08-18
tags:
  - search
  - floor-map
description: >
  The Map tab, where the finished map is played through time, entities are followed, and layers and groups are controlled.
---

The **Map** tab is what a Floor Map is for.
It draws the plan as it was at the time selected on the timeline, animates the event entities as they move, and lets you follow one of them.

The tab is laid out as the canvas, a timeline along the bottom, and a dock on the right holding the Tracking, Layers and Groups panels.


## The Timeline

The timeline chooses the point in time the map shows.
Facts and moving entities are drawn as they were at that time, and playback animates through time like a video.

| Control | Purpose |
| --- | --- |
| {{< stroom-icon "step-backward.svg" "Step Back" >}} {{< stroom-icon "step-forward.svg" "Step Forward" >}} Step back / forward | Jump one step, i.e. one histogram bin, earlier or later. |
| {{< stroom-icon "play.svg" "Play" >}} Play / {{< stroom-icon "pause.svg" "Pause" >}} Pause | Animate time forward at the chosen speed; click again to pause. |
| Scrubber | Drag the handle, or click the histogram, to jump to a time. A pill above the handle shows the exact time. |
| Histogram | The bars show how many events fall in each time bin. Hover a bar for its count. |
| Speed badge | The current playback speed, e.g. `x1`. Click it to choose another. |
| {{< stroom-icon "settings.svg" "Settings" >}} Settings | Loop on or off, the visible start and end date range, and **Show All**, which widens the range to cover all the data. |
| « / » | A warning that the selected object's time is before or after the visible range. Widen the range to see it. |

Playback speeds run from half real time up to ten thousand times real time, so a day of activity can be watched in seconds.
The position on screen updates every frame, but the underlying query is re-run at most about three times a second however fast the playback, and movement between refreshes is interpolated.

Entities that move leave a fading trail behind them, and an entity whose position jumps discontinuously is teleported rather than glided across the map.


## The Canvas

Interaction is the same as on the [Editor]({{< relref "editing" >}}) tab's canvas, minus the editing: drag empty space to pan, use the mouse wheel to zoom towards the pointer, click to select and press {{< key-bind "esc" >}} to deselect.

Hover an object, without clicking, for a panel giving its name, type, position and the areas it is inside.
Hovering a merged group of entities lists the entities in it instead.

An entity that exists both as a fact and as an event stream is drawn once — the animated event position wins, because it is the live one.


## Tracking

The **Tracking** panel lists every entity seen on the map: the moving entities from the events stream, plus the static facts from the facts query.
Tracking is about things that move, so the grid lists event entities only by default.

| Column | Meaning |
| --- | --- |
| Name | The entity's display name. |
| Type | Its type, i.e. the layer it is drawn on. |
| Area | Which area it is inside. |
| Id | Its entity id, as returned by the events query. |

The **Area** column answers one question: which area is this entity inside?
It names every containing area, innermost first, or `—` when it is inside none.
Area rows themselves always show `—`; how many entities are in an area is shown by the area's own badge on the canvas instead.
Detail that will not fit on the row — the containing areas one per line, or where an entity was last seen — is in the cell's tooltip.

| Toolbar button | Action |
| --- | --- |
| {{< stroom-icon "clear.svg" "Stop Tracking" >}} Stop Tracking | Clear the selection, so nothing is being followed. |
| {{< stroom-icon "add.svg" "Add to Group" >}} Add to Group | Put the selected entity into one of the document's groups, or into a new group, without leaving the panel. |
| {{< stroom-icon "locate.svg" "Show Facts" >}} Show Facts | A toggle that folds the fact rows — objects, backgrounds and areas — into the list. |

Selecting a row follows that entity: it is highlighted on the canvas, the camera centres on it and then keeps up with it as it moves.
A deliberate pan pauses following — click the row again to resume.

The roster accumulates.
An events query at a given instant only returns entities with events near that time, so the panel holds everything seen since the map was loaded rather than emptying as entities go quiet.
That keeps the rows, and your selection, stable across playback refreshes.
The **Show Facts** toggle is view state only, and the roster always holds everything, so flipping it back costs no query.


## Layers

The **Layers** panel lists the map's types front to back, each with a visibility control that cycles fully visible, dimmed to 30%, then hidden.
Use it to strip a busy map back to the layers you care about.

Visibility is view state for the current session and is not saved with the document.
The reordering, locking and appearance controls are on the [Editor]({{< relref "editing#layers" >}}) tab's copy of this panel.


## Groups

A **group** is a named collection of entities you assemble by hand — "Maintenance", "Security", "Contractors".
Membership is deliberately loose: a group can hold people from the events stream, static facts such as a gate or a camera, and even areas, all mixed together.

| Column | Meaning |
| --- | --- |
| Name | The group's name, which can be changed freely — a group's identity is not its name. |
| Members | How many entities the group holds. |
| Positioned | How many of them have a position *right now*. |

Switching a group's {{< stroom-icon "eye.svg" "Highlight" >}} eye on rings its members on the canvas in the group's colour.
Selecting a group selects it for editing and never moves the camera, so an entity you are following on the Tracking panel keeps being followed while you work with groups.

Groups are saved with the document.
Which of them are *highlighted* is not — every group starts hidden, including one you have just created, so adding members produces no change on the canvas.
The confirmation that the membership landed is the Members and Positioned columns.

The Positioned count is not a head count of who is on site: a member whose events have gone quiet has no position and is not counted, so the number can fall without anyone moving.

| Toolbar button | Action |
| --- | --- |
| {{< stroom-icon "add.svg" "New Group" >}} New Group | Create a group. |
| {{< stroom-icon "edit.svg" "Edit Group" >}} Edit Group | Edit the selected group's name, colour and members. |
| {{< stroom-icon "delete.svg" "Delete Group" >}} Delete Group | Delete the selected group. |

The edit dialog holds the name, the highlight colour and a filterable checkbox list of members, which is why membership is edited there rather than in the narrow dock.
A member the roster has not seen — someone who has had a quiet afternoon — is kept and listed with a note, not silently dropped.
Entities can also be added to a group from the Tracking panel.


## Clusters

Entities are drawn at a fixed size on screen while their positions live in map space, so ten people at one desk would otherwise be ten glyphs stacked in the same pixel, with only the last drawn visible and the other nine unreachable.

When entities of the same type come closer together on screen than a glyph is wide, they are merged into a single glyph carrying a count and a caption, such as "10 persons".
Only fixed-size glyphs cluster; images and areas scale with the map and shrink out of the way on their own.
Clustering depends on zoom only, never on panning, so dragging the view does not reshuffle the clusters.

To reach a member, click the cluster.
A dialog lists its members, with a search box and Area and Group filters to narrow a large one down.
Choosing a row follows that entity and closes the dialog.

A cluster containing the entity you are following is drawn around *that* entity rather than at the cluster's centre, and named accordingly, so following something does not make it jump.


## Areas and Occupancy {#areas-and-occupancy}

Areas drawn on the [Editor]({{< relref "editing#areas" >}}) tab are what turn a position into a place.

* Each area with occupants carries a badge giving how many entities are inside it.
  An area with none has no badge.
* Focus an entity and the areas containing it are highlighted; focus an area and its occupants are highlighted.
  The highlight is green and dashed.
* A group highlight is solid and in the group's colour, and takes precedence where both apply to the same entity.

Containment is purely geometric and is recomputed whenever the facts or the entities change, not on every frame.
Only entities and object facts are treated as occupants: an area inside another area is deliberately not reported, so the Area column and the occupancy badge each mean exactly one thing.

Occupancy here means "positioned inside this polygon at this instant", which is not the same as who is present.
An entity is only positioned if the events query returned a position for it near the current time, so an entity that has gone quiet simply drops out of the count.


## Keyboard Control

The canvas can be operated without a mouse.

| Key | Action |
| --- | --- |
| Arrow keys | Pan. Hold {{< key-bind "shift" >}} to pan five times as far. |
| {{< key-bind "+" >}} / {{< key-bind "-" >}} | Zoom about the centre of the view. |
| {{< key-bind "0" >}} | Reset to the opening view. |
| {{< key-bind "enter" >}} or {{< key-bind "space" >}} | Open the context menu for the selection, on the Editor tab. |
| {{< key-bind "esc" >}} | Cancel the gesture in progress, otherwise clear the selection. |

The timeline scrubber follows the standard slider conventions: {{< key-bind "left" >}} and {{< key-bind "right" >}} move one histogram bin, {{< key-bind "pgup" >}} and {{< key-bind "pgdn" >}} move ten, and {{< key-bind "home" >}} and {{< key-bind "end" >}} jump to the ends of the range.
While the scrubber has focus, the date and time pill is shown, and {{< key-bind "esc" >}} dismisses it without moving the time.

{{< key-bind "tab" >}} always leaves the canvas in one press, so there is no keyboard trap.
Zoom is centred on the view rather than the pointer, because a keyboard user has no pointer.

The canvas is exposed to a screen reader as a single named image with a generated summary — the time shown, the population by type, the number of areas, what is being followed and the zoom level — rather than as a tree of shapes.
The Tracking panel is the canvas's text alternative, giving the same content one row per entity.
Selection, tracking, playback and zoom changes are announced as they happen; the time is deliberately not announced during playback, since at several ticks a second it would drown out everything else.

Animation honours the operating system's reduced-motion setting.


{{% see-also %}}
[Editing a Floor Map]({{< relref "editing" >}})  
[Events Query]({{< relref "events-query" >}})
{{% /see-also %}}

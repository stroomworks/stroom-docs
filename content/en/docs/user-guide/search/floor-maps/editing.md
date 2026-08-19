---
title: "Editing a Floor Map"
linkTitle: "Editing"
weight: 30
date: 2026-08-18
tags:
  - search
  - floor-map
description: >
  The Editor tab, where the plan itself is authored — placing facts, drawing areas, setting the scale and styling the layers.
---

The **Editor** tab is the authoring environment for a Floor Map.
It is always in edit mode and shows every editing panel at once.

```text
┌──────────────────────────────────────────────────────┐
│                      Map Canvas                      │
├──────────────────────────────────────────────────────┤
│                  Timeline control                    │
├────────────────────┬────────────────┬────────────────┤
│     Fact List      │   Time List    │   Properties   │
└────────────────────┴────────────────┴────────────────┘
```

A {{< stroom-icon "help.svg" "Help" >}} help button on the canvas, the Fact List, the Time List and the timeline shows the same guidance in the application itself.


## Staged Saves

Edits made on this tab are *staged*, not written straight to the facts store.
They are held until you press {{< stroom-icon "save.svg" "Save" >}} Save, which flushes them as part of the normal document save, alongside any changes to the settings, the queries and the assets.

If the flush fails, an error is shown and every panel reloads from the server, so what you see afterwards is what is actually stored.


## The Canvas

The canvas is the main editing surface.
It shows the map's facts — the background image, the gates, the desks, the cameras — arranged as they were at the time selected on the timeline.
A fact is drawn from its image, or as a coloured shape or icon when it has no image.


### Selecting

* **Click** an object to select it.
* {{< key-bind "shift" >}}, {{< key-bind "ctrl" >}} or {{< key-bind "meta" >}} and click an object to add it to, or remove it from, the selection.
* Hold {{< key-bind "shift" >}}, {{< key-bind "ctrl" >}} or {{< key-bind "meta" >}} and drag across empty space to draw a band box.
  Every object it touches is added to the selection.
* Click empty space, or press {{< key-bind "esc" >}}, to deselect everything.
* **Hover** an object, without clicking, for a panel giving its name, type and position.


### Moving, Rotating and Scaling

A dashed frame with handles appears around the selection.

* **Move** — drag any selected object.
  Dragging one member of a multiple selection moves the whole group together.
* **Scale** — drag one of the four square corner handles.
  Scaling keeps the aspect ratio and grows or shrinks the selection about the opposite corner.
* **Rotate** — drag the round handle above the top of the frame.
  The selection rotates about its centre.
  Hold {{< key-bind "shift" >}} to snap to 15 degree steps.

While you move or resize, a label follows the cursor with the live measurement: the selection's size as you scale it, and its position as you move it.


### Panning and Zooming

* **Pan** — drag empty space to scroll the view.
* **Zoom** — turn the mouse wheel to zoom in and out towards the pointer.

The background image is itself a fact.
Click it to select it, after which it can be moved, scaled and rotated like anything else; while it is not selected, dragging over it pans the view.


### The Right-Click Menu

| Where you right-click | Actions |
| --- | --- |
| Empty space | {{< stroom-icon "add.svg" "Add" >}} Add Object Here |
| An object | {{< stroom-icon "edit.svg" "Edit" >}} Edit Properties, {{< stroom-icon "history.svg" "History" >}} Add Time Version, {{< stroom-icon "copy.svg" "Copy" >}} Duplicate Object, {{< stroom-icon "delete.svg" "Delete" >}} Delete Object |
| A multiple selection | {{< stroom-icon "copy.svg" "Copy" >}} Duplicate Selected, {{< stroom-icon "delete.svg" "Delete" >}} Delete Selected |
| An area vertex handle | {{< stroom-icon "delete.svg" "Delete" >}} Delete Vertex |
| Anywhere | {{< stroom-icon "pen.svg" "Pen" >}} Draw Area Here, {{< stroom-icon "double-arrow.svg" "Set Scale" >}} Set Scale |

Draw Area Here and Set Scale appear on every branch of the menu because a map is usually covered edge to edge by its background image, leaving nowhere to right-click that is truly empty.

There is no {{< key-bind "delete" >}} shortcut for deleting objects — use the menu.


## Adding the Background Image

1. Upload the image on the document's **Assets** tab.
1. On the Editor tab, right-click the canvas and choose **Add Object Here**.
1. In the properties form, give the object a type of `background`, choose the uploaded image, and confirm.
1. Select the image and drag, scale and rotate it until it sits where you want it.

A background is not a special kind of object — it is simply a fact with an image.
It usually sits at the bottom of the paint order, which is controlled by the position of its type in the [Layers]({{< relref "#layers" >}}) panel.


## Setting the Scale

A new map starts at a nominal scale of one centimetre per map unit, so the distances it displays mean nothing until you calibrate it.

1. Right-click the canvas and choose **Set Scale**.
1. Drag a line across something whose real length you know — a doorway, a parking bay, a wall.
1. Type that length in and choose the unit it is in.

Everything showing a size relabels at once: the grid labels, the scale bar in the corner and the readout that follows the cursor while you drag.

The unit you choose says what the *typed* distance is in, so a doorway can be given in metres and a desk in centimetres.
It is not a display preference — maps are always displayed in metric, promoting between millimetres, centimetres, metres and kilometres as the value warrants.

This drag is the only way to scale a map.
There is deliberately no numeric scale-factor field, because for a background image placed by eye nobody knows that number.


## Facts and Time Versions

A fact is one thing on the map, identified by its *key*.
Each fact has one or more *time versions*, each holding its state from a given effective time, so a fact can look different, or be somewhere different, at different points on the timeline.


### Fact List

Lists every object in the map, one row per object, showing its Key, Type and Name.

Select a row to select that object on the canvas; hold {{< key-bind "ctrl" >}} or {{< key-bind "shift" >}} and click to select several.
When a *single* object is selected the Time List and Properties panels update to match it; selecting several clears them.

| Toolbar button | Action |
| --- | --- |
| {{< stroom-icon "add.svg" "Add" >}} Add | Create a new object at the centre of the current view and open its properties. |
| {{< stroom-icon "delete.svg" "Delete" >}} Delete | Delete the selected object and all of its time versions. With several selected this removes only the primary one — use the canvas right-click menu to delete a whole group. |
| {{< stroom-icon "history.svg" "Show All" >}} Show all | A toggle. When on, every object in the store is listed regardless of the timeline position; when off, only objects present at the current time are listed. |


### Time List

Shows the time versions of the object selected in the Fact List.
Clicking a row moves the timeline to that version's time.

| Toolbar button | Action |
| --- | --- |
| {{< stroom-icon "edit.svg" "Edit" >}} Edit | Edit the selected version's properties. |
| {{< stroom-icon "add.svg" "Add" >}} Add | Add a new version at the current timeline time, cloned from the version in effect then. |
| {{< stroom-icon "delete.svg" "Delete" >}} Delete | Delete the selected version. |


### Properties

The properties form edits one time version of one fact.

| Field | Meaning |
| --- | --- |
| Type | The fact's type, which decides its layer and therefore its graphic and paint order. |
| Name | The label shown on the map. |
| Image | An image from this document's asset store. |
| X / Y | The fact's position in map space. |
| Effective time | The time from which this version applies. |
| World-to-Map matrix | The six-element affine transform that places, scales and rotates the fact. |

Any extra fields your value schema defines with the `Custom` role appear here too.

{{% note %}}
Moving a fact on the canvas rewrites the version that is in effect at the time shown, rather than creating a new one.
To record that something moved *at* a point in time, add a time version first — from the canvas right-click menu or the Time List — and then move it.
{{% /note %}}


## Areas

An area is a fact with vertices and no image: a room, a zone, a restricted space.
Areas are what let the map answer "which area is this person in?", and they carry the occupancy badges shown on the [Map]({{< relref "viewing#areas-and-occupancy" >}}) tab.

To draw one, right-click the canvas and choose **Draw Area Here**, then:

* click to add each vertex, at least three
* finish by clicking the first point again, double-clicking, or pressing {{< key-bind "enter" >}}
* right-click to undo the last point
* press {{< key-bind "esc" >}} to cancel

A hint along the canvas says which of these apply as you draw.

An existing area's vertices can be dragged individually, and a vertex can be removed by right-clicking its handle and choosing **Delete Vertex**.
The fill colour and opacity come from the area's own `Fill` and `Opacity` fields, falling back to the colour of its layer.

Areas can overlap and can be drawn one inside another, so an entity can be inside several at once.
Where that happens, the innermost — the smallest — area is reported first.


## Layers {#layers}

The **Layers** panel in the dock on the right of the canvas lists the map's types, front to back.
A layer is a type: everything whose Type field says `gates` is drawn on the `gates` layer.

The list order is the paint order — a layer earlier in the list is painted behind the ones after it.
A type seen in the data but not in the list is painted on top, so it cannot go missing.

| Control | Purpose |
| --- | --- |
| Grip | Reorder the layer, which changes the paint order. Drag it, or focus it and use the {{< key-bind "up" >}} and {{< key-bind "down" >}} arrow keys. |
| {{< stroom-icon "eye.svg" "Visibility" >}} Eye | Cycles the layer's visibility: fully visible, dimmed to 30%, then hidden. |
| {{< stroom-icon "locked.svg" "Lock" >}} Lock | Locked layers stay visible but their items cannot be moved on the canvas. |
| Swatch | Opens the appearance dialog for the layer. |

Visibility and lock are view state for the current session only — neither is saved with the document.
The paint order and the appearance are saved.


### Discovering Types

The panel's {{< stroom-icon "refresh.svg" "Discover" >}} **Discover types** action scans the whole facts store and lists every type it finds.
Types found in the data but not yet saved as layers appear as provisional rows; press {{< stroom-icon "add.svg" "Add" >}} on one to make it a layer.

This is normally the quickest way to populate the panel: load the facts, discover the types, then style each one.


### Layer Appearance

The appearance dialog says what is drawn for a fact of this type that has no image of its own.
A layer draws one of three things:

* a **shape** — circle, square, triangle, diamond or pin — filled with the layer's colour
* an **icon**, filled with the layer's colour
* an **image** from the document's asset store

The built-in icons cover the kinds of thing that generate logs, since that is what a floor map exists to show:

`Person`, `Door`, `Gate`, `Barrier`, `Badge Reader`, `Smart Lock`, `Camera`, `Sensor`, `Alarm`, `Lift`, `Printer`, `Computer`, `Laptop`, `Mobile`, `Kiosk`, `Phone`, `Server`, `Network`, `Wifi`, `Power`, `Vehicle`

Furniture that emits nothing — a desk, a staircase, a fire extinguisher — has no icon and should be drawn as a shape or an uploaded image.

The colour stays editable even when an image is chosen, because it is still used for areas of that type and for the label on the glyph.
An uploaded image cannot be recoloured; an icon can, which is why an icon renders correctly before the document has ever been saved.

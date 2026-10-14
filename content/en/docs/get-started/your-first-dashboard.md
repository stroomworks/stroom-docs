---
title: "Your First Dashboard"
linkTitle: "Your First Dashboard"
weight: 60
date: 2026-10-14
tags:
description: >
  Wiring a query, a table and a visualisation together to see the data you sent.
pageKind: tutorial
verification: required
---

A [dashboard]({{< relref "../concepts/dashboards.md" >}}) is a set of components wired together: a **query** gets the data, a **table** shows it, and a **[visualisation]({{< relref "../concepts/visualisations.md" >}})** draws it.
Each feeds the next.


## Build it

Create a **Dashboard**.
It starts with a query and a table already linked.

**Point the query at your index**, set a time range that covers when you sent the data, and add an expression term or leave it unfiltered for now.

**Choose the table's columns.**
The table can only show fields the index **stored**, unless the index has a [default extraction pipeline]({{< relref "../concepts/lucene-index.md#default-extraction-pipeline" >}}) that can go back to the original event for more.

**Add a visualisation** and set its data source to the table.
A visualisation declares the **roles** it needs, such as a value and a series, and you map the table's columns onto them.

{{< timing mode="immediate" >}}
A dashboard query runs when you run it, and usually returns in seconds against an index this small.

A query that never completes is a different problem from one that [returns nothing]({{< relref "../operate/checking-it-works/is-search-working.md" >}}).
{{< /timing >}}

{{< verify >}}
Run the query.
The table should fill with the rows you sent, and the visualisation should draw something.

{{< golden >}}
**A row in the table that you can trace back to a line of the CSV you posted.**

That single row proves the whole chain: receipt, translation, indexing, extraction and search.
It is the end-to-end check, and it is worth doing deliberately once.
{{< /golden >}}

{{< not-proof >}}
**An empty table is not necessarily an empty index.**
Check the time range first: a dashboard defaults to a recent window, and your data has the event times you gave it, not the time you sent it.

**A visualisation drawing nothing is not necessarily a data problem.**
If the table has rows, the problem is the mapping from columns to roles.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A table can only show what the index stored.**

Indexed and stored are different: a field can be searchable without its value being kept.
A column over a field that was indexed but not stored comes back empty, with no error.

The other route is a **default extraction pipeline** on the index, which goes back to the original event for the full record.
Without one, a dashboard is limited to stored fields, and that limit is invisible until you hit it.
{{< /trap >}}

{{< diagnose >}}
1. **Does `select count()` against the index still return rows?**
   If not, this is an indexing problem.
   Go back to [Index and search it]({{< relref "index-and-search.md" >}}).
1. **Is the time range right?**
   The commonest cause by far.
   Widen it to something obviously generous and run again.
1. **Are the columns empty rather than the table?**
   That is stored versus indexed, or a missing extraction pipeline.
   See the trap.
1. **Does the visualisation have its roles mapped?**
   A role left unmapped means nothing is drawn, and the component does not complain.
1. **Does the query return but the table stay empty?**
   Check the table is wired to the query component rather than to nothing.
{{< /diagnose >}}


## Next

You have been through the whole path once.
[Where to go next]({{< relref "where-next.md" >}}), or, to build one on an index or Plan B store of your own, [A dashboard from a store]({{< relref "../guides/dashboard-from-a-store.md" >}}).

---
title: "Clear Caches"
linkTitle: "Clear Caches"
weight: 40
date: 2026-10-14
tags:
description: >
  When a corrected document keeps behaving as it did before, and how to make Stroom read it again.
pageKind: operate
verification: required
---

Stroom caches a great deal in memory: documents, permissions, configuration, resolved references.
That is why it is quick, and it is also why a document you have just fixed can go on behaving as though you had not.

Caches are the cheapest thing on this section to reset.
Nothing is lost by clearing one: everything in a cache is a copy of something that still exists elsewhere, so the only cost is the work of fetching it again.


## The procedure

Caches are listed under **Monitoring** → **Caches**.
The upper list names every cache; selecting one shows, in the lower list, its size and hit rate on each node.

1. **Find the cache that holds the thing you changed.**
   The names are reasonably descriptive, and clearing a single cache is less disruptive than clearing everything.
   For example, the **Index Field Cache** holds the field definitions that indexing writes with, for up to 10 hours after it reads them, so a changed field definition is not used for new data until it is cleared or expires.
1. **Clear it with the clear button on its row in the upper list.**
   A cache is held per node, but this button clears it on every enabled node at once.
   The clear button on a row of the lower list clears that one node only.
1. **Retry whatever was wrong.**

{{< timing mode="immediate" >}}
Clearing takes effect at once.
The next request for that item fetches it fresh.

Expect a brief dip in performance afterwards while the cache refills, which matters only for the large ones on a busy system.
{{< /timing >}}

{{< verify >}}
Repeat the operation that was behaving as though your change had not happened.
It should now reflect the change.

{{< golden >}}
**The behaviour that was stale is now correct, on every node.**

Check more than one node if you have them.
The lower list on the **Caches** screen shows the cache on each node; straight after clearing, it should be at or near empty on all of them, not just one.
{{< /golden >}}

{{< not-proof >}}
**The cache showing zero entries does not prove the problem is fixed.**
It proves the cache is empty.
If the underlying document is still wrong, it will be fetched, cached and wrong again within moments.

**It working for you is not proof it works for everyone.**
If you cleared one node from the lower list, you may be on the node you cleared.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Disabled nodes are skipped, and the per-node button clears one node only.**

The clear button in the upper list clears the cache on every node that is enabled on the **Nodes** screen.
A node that is disabled but still running keeps its old copy, and so does every node except the one you chose if you clear from the lower list.
In a cluster this produces a system that is correct or stale depending on which node answers.
Users report that the problem "comes and goes", which is true, and which sends everyone looking in the wrong place.

Clear from the upper list, and clear any disabled node that is still serving requests from the lower list.
{{< /trap >}}

{{< diagnose >}}
1. **Is the underlying document actually right?**
   Open it and read it.
   Clearing a cache to fix a document you have not fixed is a common and frustrating loop.
1. **Did you clear the cache that matters?**
   If you are unsure which one holds it, clear the obvious candidate first, then widen.
1. **Did you clear it everywhere?**
   Clearing from the lower list clears one node, and a disabled node is never cleared from the upper list.
   See the trap.
1. **Is it a cache at all?**
   Some staleness is not cached but stored: a [processor filter]({{< relref "../../concepts/processing/_index.md" >}}) holds a reference to a specific version of a pipeline, and reference data is loaded into a store rather than a cache.
   If clearing caches changes nothing, see [Purge reference data]({{< relref "purge-reference-data.md" >}}).
1. **Is it the browser?**
   The UI caches too.
   A hard refresh rules it out in seconds.
{{< /diagnose >}}

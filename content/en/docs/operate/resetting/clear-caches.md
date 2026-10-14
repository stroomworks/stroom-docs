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

Caches are listed under **Monitoring**, with their size and hit rate, and each can be cleared individually.

1. **Find the cache that holds the thing you changed.**
   Clear that one.
   The names are reasonably descriptive, and clearing a single cache is less disruptive than clearing everything.
1. **Clear it on every node.**
   A cache is per node, not per cluster.
   Clearing it where you happen to be signed in leaves the other nodes serving the old copy, which is a particularly confusing state to debug.
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
A cache cleared on one node is a cache still warm on the others.
{{< /golden >}}

{{< not-proof >}}
**The cache showing zero entries does not prove the problem is fixed.**
It proves the cache is empty.
If the underlying document is still wrong, it will be fetched, cached and wrong again within moments.

**It working for you is not proof it works for everyone.**
You may be on the node you cleared.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Caches are per node, so clearing one node fixes one node.**

In a cluster this produces a system that is correct or stale depending on which node answers.
Users report that the problem "comes and goes", which is true, and which sends everyone looking in the wrong place.

Clear on every node, every time.
{{< /trap >}}

{{< diagnose >}}
1. **Is the underlying document actually right?**
   Open it and read it.
   Clearing a cache to fix a document you have not fixed is a common and frustrating loop.
1. **Did you clear the cache that matters?**
   If you are unsure which one holds it, clear the obvious candidate first, then widen.
1. **Did you clear it everywhere?**
   See the trap.
1. **Is it a cache at all?**
   Some staleness is not cached but stored: a [processor filter]({{< relref "../../concepts/processing.md" >}}) holds a reference to a specific version of a pipeline, and reference data is loaded into a store rather than a cache.
   If clearing caches changes nothing, see [Purge reference data]({{< relref "purge-reference-data.md" >}}).
1. **Is it the browser?**
   The UI caches too.
   A hard refresh rules it out in seconds.
{{< /diagnose >}}

---
title: "Configuration"
linkTitle: "Configuration"
weight: 20
date: 2026-10-14
tags:
description: >
  The three places a property can be set, which one wins, and why a change in the user interface sometimes does nothing.
pageKind: operate
verification: required
aliases:
  - /docs/install-guide/configuration/
  - /docs/install-guide/configuration/configuring-mysql/
  - /docs/install-guide/configuration/configuring-nginx/
  - /docs/install-guide/configuration/configuring-stroom-log-sender/
  - /docs/install-guide/configuration/stroom-and-proxy/
  - /docs/install-guide/configuration/stroom-and-proxy/common-configuration/
  - /docs/install-guide/configuration/stroom-and-proxy/configuring-stroom-proxy/
  - /docs/install-guide/configuration/stroom-and-proxy/configuring-stroom/
---

Stroom has several hundred configuration properties.
You rarely need to touch most of them, and the ones you do touch are easier to get right once you know where a value can come from.

[Configuration properties]({{< relref "../reference/configuration-properties.md" >}}) lists every setting with its default.


## Three sources, one winner

Every property has a value from one of three places:

1. **The default**, built into the software.
1. **A database override**, set in the user interface under **Administration** → **Properties**.
   It applies to the whole cluster.
1. **A YAML override**, set in the configuration file on a node.
   It applies to that node.

When more than one is present, **the YAML file wins, then the database, then the default**.

That order is the single most useful thing to know about Stroom configuration, because it produces a failure that looks like a bug:

{{% warning %}}
**A property set in the YAML file cannot be changed from the user interface.**
You can edit it, it saves, and the effective value does not move, because the YAML override still takes precedence.
Nothing warns you when you save.
(On a cluster where the nodes disagree, the property editor does show a warning icon, *Multiple value sources exist in the cluster*, but that is about nodes differing from each other, not about the YAML winning.)
{{% /warning %}}

The Properties screen shows all three values for each property along with the effective one, so it will tell you this has happened if you look at the right column.

{{< image src="operate/configuration/config-precedence.svg" alt="Three stacked sources of a property value. The configuration file on the node is at the top and wins; the Properties screen, stored in the database and applying cluster-wide, is below it; the built-in default is at the bottom. Arrows run upward showing each overriding the one below. Alongside: if the file sets it, editing the Properties screen saves your value and changes nothing, and no conflict is reported." >}}Precedence runs upward. The consequence on the right is the one that costs people time.{{< /image >}}


## Which to use

* **The user interface** for anything you may want to change without a deployment, and for anything that should be the same across the cluster.
  This is the right default.
* **The YAML file** for things that genuinely differ per node, such as paths and ports, and for anything that must be in place before the database is reachable.

Setting a value in YAML on every node because it is the same everywhere is the common mistake.
It works, and it takes the property out of reach of the UI for good.


## When a change takes effect

Most properties take effect without a restart, but not instantly.
A database override is written once and each node picks it up when it next reloads, which the **Property Cache Reload** job does on its schedule.

So after a change, other nodes keep running on the old value briefly.
If that job is disabled on a node, that node keeps the old value indefinitely and behaves differently from the rest, with nothing to show for it.
See [Scheduled jobs]({{< relref "../reference/jobs.md" >}}).

Some properties do require a restart, and the Properties screen marks them.
Those are values read once while the system is starting, so editing them changes the stored value and not the running behaviour until the node restarts.

{{< timing mode="async" >}}
A change made in the user interface is saved immediately and applied by each node when it next reloads its property cache.
Expect the cluster to be briefly inconsistent after any change, which matters when you are changing something and testing its effect at the same time.
{{< /timing >}}

{{< verify >}}
Change a harmless property, then read the effective value back on the Properties screen and confirm the behaviour it controls actually changed.

{{< golden >}}
**The effective value is the one you set, and the behaviour it governs has changed.**

Both halves matter, because the value changing is exactly what happens in the YAML override case while the behaviour does not follow.
{{< /golden >}}

{{< not-proof >}}
**The property saving is not proof it took effect.**
An override shadowed by YAML saves perfectly and changes nothing.

**One node behaving correctly is not proof the cluster has picked it up.**
Nodes reload independently, so check more than one if the change matters.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A YAML override silently defeats the user interface.**

This is worth repeating because it costs people hours: the UI accepts the edit, shows your value in the database column, and goes on using the YAML one.
Check the effective value, not the value you typed.
{{< /trap >}}

{{< trap severity="destructive" >}}
**Changing a path property does not move the data that is already there.**

Repointing a volume or a store directory changes where Stroom writes next.
What was written under the old path stays there and becomes unreachable, which looks exactly like data loss and is recoverable only by putting the setting back or moving the files deliberately.
{{< /trap >}}

{{< diagnose >}}
1. **What is the effective value?**
   Not the default, not what you typed.
   The Properties screen shows all three sources side by side, and the answer is almost always visible there.
1. **Is there a YAML override?**
   If so, the UI cannot change this property.
   Edit the file on each node, or remove it from the file so the database value takes over.
1. **Does it need a restart?**
   The Properties screen says so.
   A restart-only property stored but not applied looks identical to one that was ignored.
1. **Have the other nodes reloaded?**
   Check the same property on another node.
   If they disagree, look at **Property Cache Reload** on the stale one.
1. **Is the value valid?**
   A malformed duration or size is rejected at load, and depending on the property the node may fall back to the default rather than refusing to start.
1. **Did the behaviour depend on something else?**
   Many properties only matter when a related job is enabled or a feature is switched on.
{{< /diagnose >}}

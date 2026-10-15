---
title: "Monitoring"
linkTitle: "Monitoring"
weight: 75
date: 2026-10-14
tags:
description: >
  What to watch day to day, what normal looks like, and which numbers are worth an alert.
pageKind: operate
verification: required
---

[Checking it works]({{< relref "checking-it-works/_index.md" >}}) is for answering a question once.
Monitoring is for noticing before anyone asks.

Stroom's characteristic failure is not a crash.
It is a piece of background work that stops happening while everything else carries on, so the system looks healthy and the consequence turns up days later as missing data or a full disk.
Monitoring is mostly about watching for things that *stop*.


## The four things worth watching

**Is data still arriving?**
Receipt volume per feed, compared with the same period last week.
Feeds are bursty, so an absolute threshold produces noise; a feed that has gone completely silent is the signal worth alerting on, and it usually means something changed at the source rather than in Stroom.

**Is the processing queue draining?**
The number of unprocessed tasks should move up and down through the day and come back to roughly where it started.
A queue that only grows means processing cannot keep up, or has stopped.
Watch the trend over days rather than the instantaneous number, which is meaningless on its own.

**Are the volumes filling?**
Both data and index volumes, as a percentage and as a rate.
The rate matters more: a volume at 60% that gains a percent a day deserves attention before one at 85% that has been stable for a year.

**Are the jobs running?**
Every enabled job records its last run.
A job whose last run stops advancing has failed, and nothing else reports it.
See [Scheduled jobs]({{< relref "../reference/jobs.md" >}}), which says what stops in each case.


## Where the numbers come from

* **The Jobs screen** shows each job's last and next run, per node.
* **The Nodes screen** shows which nodes are up, how long since each started, its build version and how quickly it answers a ping.
* **The Node Status job** records each node's CPU and memory use as internal statistics, every minute.
  They go to the statistic stores named in `stroom.statistics.internal.enabledStoreTypes`, where you can query or chart them like any other statistic.
  With no statistic store set up, they are dropped.
* **The health endpoints** give the same information in a form a monitoring system can scrape.
  See [Health endpoints]({{< relref "checking-it-works/health-endpoints.md" >}}).
* **Stroom's own logs**, which can be fed back into Stroom.
  See [Reading the logs]({{< relref "troubleshooting/reading-the-logs.md" >}}).

{{< image src="operate/monitoring/StroomNodes.png" alt="The node list in Stroom, showing a two-node cluster: node1a and node2a, each with its cluster base endpoint, build version, ping time, the time it came up, whether it is the master, its priority and whether it is enabled." >}}The Nodes screen. A node missing from this list, or one whose up-time has just reset, is the first thing to check when work stops happening on part of the cluster.{{< /image >}}


## What to alert on

Prefer alerts on things that should never happen over alerts on thresholds:

| Alert on | Rather than |
|---|---|
| A feed silent for longer than it has ever been silent | Volume below a fixed number |
| A job whose last run has not advanced in several intervals | A job being disabled, which is often deliberate |
| Queue depth growing for several hours | Queue depth above a number |
| A node missing from the Nodes screen | CPU above a percentage |
| A volume that will be full within a week at its current rate | A volume above 80% |

The right-hand column produces alerts people learn to ignore, and an ignored alert is worse than none.

{{< verify >}}
Disable a harmless job on one node, wait for more than its interval, and confirm your monitoring notices.

{{< golden >}}
**Your monitoring reported the stopped job without anyone looking for it.**

This is the only way to find out whether monitoring works, because the thing being tested is whether a silent failure becomes visible.
Re-enable the job afterwards.
{{< /golden >}}

{{< not-proof >}}
**A dashboard that looks healthy is not proof anything is being watched.**
Nobody is looking at it at three in the morning, which is when the queue starts growing.

**An endpoint returning healthy is not proof the work is happening.**
Health endpoints report whether components are up, not whether jobs that are up are achieving anything.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A disabled job looks exactly like a job with nothing to do.**

Neither runs, and neither reports anything.
The difference is visible only on the Jobs screen, as an enabled flag, which is why it is worth monitoring the enabled state as well as the last-run time after a cluster change or an upgrade.
{{< /trap >}}

{{< diagnose >}}
1. **Is it one node or all of them?**
   Per-node job switches mean a fault can affect a fraction of the work.
   Compare the same job across nodes before anything else.
1. **Did the last run advance?**
   A job enabled but not advancing is failing; the reason is in that node's logs.
1. **Is the queue growing or just large?**
   Large and stable is a capacity decision.
   Growing is a fault.
   See [Performance and queues]({{< relref "troubleshooting/performance-and-queues.md" >}}).
1. **Has a feed changed shape rather than stopped?**
   A source that still sends but now fails translation looks healthy on receipt and produces nothing afterwards.
1. **Are volumes filling faster than before?**
   A change in rate usually means a new feed or a retention job that has stopped.
1. **Is it a clock problem?**
   Event times far from receipt times make data appear in the past or the future, and it looks like missing data to anyone searching recent ranges.
{{< /diagnose >}}

---
title: "Execution Schedules"
linkTitle: "Execution Schedules"
weight: 15
date: 2026-10-14
tags:
description: >
  When a scheduled rule runs, what time it thinks it is running for, and why a rule can be enabled and still detect nothing.
pageKind: guide
verification: required
---

A scheduled query rule does not have one schedule.
It has a list of **execution schedules**, each running the rule independently, on the **Execution** tab.
The same machinery drives [reports]({{< relref "../searching/_index.md" >}}).

Having more than one is genuinely useful.
The common pattern is a frequent schedule that keeps up with new data, plus a second schedule with a start and end time, enabled once, to work back over history.


## What a schedule holds

| Field | What it decides |
|---|---|
| Name | How this schedule appears in the history, and is recorded on every detection it raises. Defaults to `Daily` |
| Enabled | Whether it runs at all. A new schedule starts disabled |
| Processing node | Which node runs the rule |
| Schedule | A frequency or cron expression. Defaults to the cron expression `0 0 0 * * ?`, midnight every day. See [Cron expressions]({{< relref "../../reference/cron.md" >}}) |
| Start time | The effective time of the first run. Defaults to now |
| End time | Optional: an effective time after which it stops |
| Run as user | **The user whose permissions the query runs with** |


## Two different times

Each run has two times, and telling them apart is most of understanding scheduled rules.

* **Execution time** is the wall clock time the rule actually ran.
* **Effective execution time** is the point in time the run *represents*, and it is what relative date expressions in the query resolve against.

For a rule keeping up with new data they are nearly the same.
They diverge whenever a rule is catching up: a rule that is behind runs *now* for an effective time in the past.

The first run's effective time comes from the schedule's start time, which the dialog sets to now unless you change it.
After each successful run Stroom records where it has reached, and the next run continues from there.


## Catching up

A schedule always catches up.
Each run takes its next effective time from the last one, not from now, so a rule that has not run for a week works forward through that week one run at a time until it is current, and no window of data is missed.

The consequence is that a rule disabled for a long time, or given a start time well in the past, has a great deal of catching up to do the moment it is enabled.

Every schedule made in the UI behaves this way: the dialog has no setting for it.
The schedule's API representation does have a `contiguous` field, and a schedule created through the API with it set to false takes its next effective time from now instead, skipping whatever it missed.

{{< timing mode="async" >}}
Enabling a schedule with an old start time does not produce one run.
It produces one run per interval between that start time and now, worked through in order.

A rule scheduled every ten minutes with a start time a month ago is over four thousand runs.
They will happen, and they will compete with everything else the cluster is doing.
The default start time of now avoids this, so move it into the past only when you mean the schedule to work back over history.
{{< /timing >}}

{{< verify >}}
After enabling a schedule, look at the history in the lower pane of the Execution tab and confirm runs are appearing with the effective times you expect, not merely that the rule is enabled.

{{< golden >}}
**The history shows runs whose effective times advance through the period you intended.**

The effective times are the check.
A rule can be running happily, on schedule, for effective times nowhere near the data you care about, and the only place that shows is the history.
{{< /golden >}}

{{< not-proof >}}
**An enabled schedule is not proof it has run.**
Check the history, not the checkbox.

**Runs with no detections are not proof there was nothing to detect.**
The same appearance comes from a query that matches nothing, a window with no data, and a run-as user who cannot see the data.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**The query runs with the run-as user's permissions, not yours.**

If that user cannot see some of the data, the rule detects nothing in it, raises no error, and records a successful run.
A rule you tested by hand and watched work can therefore detect nothing once scheduled, because you were testing with your own permissions and it runs with somebody else's.

Check the run-as user can read every feed and index the query touches, and prefer a service account whose access you have deliberately granted over whoever happened to create the rule.
{{< /trap >}}

{{< diagnose >}}
1. **Does the history show runs?**
   If not, the schedule is not running, whatever the enabled flag says.
1. **What effective times do those runs have?**
   Compare them with the period your data is in.
   This is where catch-up and start-time mistakes become visible.
1. **Who is the run-as user, and can they see the data?**
   Run the rule's query yourself as that user.
   The commonest cause of a rule that works by hand and not on a schedule.
1. **Is it still catching up?**
   Compare the latest effective time in the history with now.
   A schedule with an old start time, or one that was disabled for a while, runs for past effective times until it is current.
1. **Is the processing node healthy?**
   A schedule pinned to a node that is down does not move to another one.
1. **Is the analytic job enabled?**
   Schedules do not run themselves.
   See [Scheduled jobs]({{< relref "../../reference/jobs.md" >}}); the analytic executor jobs are off by default.
{{< /diagnose >}}

---
title: "Post-Install Checks"
linkTitle: "Post-Install Checks"
weight: 50
date: 2026-10-14
tags:
description: >
  The sequence to run before you call a Stroom installation finished, and what each step proves.
pageKind: operate
verification: required
---

An installation that starts is not an installation that works.
Stroom has a number of parts that fail independently and quietly: a node that cannot see the database still serves its UI, an index with no volume group still looks configured, a feed set to drop still returns `200`.

This is the sequence to run once, end to end, before handing the system over.
It takes about twenty minutes and it is worth every one of them, because each of these failures is far cheaper to find now than in three weeks when someone asks where their data went.

Run it **per node**, not once through the load balancer.

{{< timing mode="async" >}}
Steps 1 to 4 answer immediately.
Step 5 onwards involves processing, which is asynchronous: allow minutes rather than seconds, and see [Is data processing?]({{< relref "is-data-processing.md" >}}) before concluding that a step has failed.
{{< /timing >}}


## The sequence

1. **Every node reports healthy.**
   `200` from the admin health endpoint on each node individually.
   See [Health endpoints]({{< relref "health-endpoints.md" >}}) for why a `501` is a failure and not a pass.
1. **You can sign in**, with an account that is not the bootstrap admin.
   If you intend to use an [external identity provider]({{< relref "../users-and-permissions.md" >}}), test it now: OIDC misconfiguration is much easier to diagnose before there is data to worry about.
1. **The [explorer tree]({{< relref "../../concepts/user-interface.md" >}}) loads and you can create a document.**
   Make a folder.
   This proves the database is writable, not merely reachable.
1. **[Volumes]({{< relref "../../concepts/volumes.md" >}}) are configured and have space.**
   Both kinds: the stream store's volumes and the index volume groups.
   An index volume group that does not exist is the cause of the most common silent indexing failure in Stroom.
1. **A test feed accepts data.**
   Create one, post a small file to it with `curl`, and confirm the stream appears.
   See [Is data arriving?]({{< relref "is-data-arriving.md" >}}).
1. **A pipeline processes that data.**
   The [simplest translation]({{< relref "../../get-started/your-first-translation.md" >}}) that produces output is enough.
   Confirm an `Events` stream appears and no `Error` stream does.
1. **The data is searchable.**
   Index the output, then `select count()` against the index.
   See [Is search working?]({{< relref "is-search-working.md" >}}).
1. **Jobs are enabled and running.**
   Check the [job list]({{< relref "../nodes-and-jobs.md" >}}).
   A system with processing jobs disabled looks healthy and does nothing, indefinitely.

{{< verify >}}
You have completed this sequence when a single event you sent yourself in step 5 can be found by a search in step 7, on the node you are standing on.

{{< golden >}}
**One event, posted by you, retrieved by a search.**
End to end, through every component.

Every other check on this page is a way of finding out *where* this one broke.
If it passes on every node, the installation works; if you have not done it, you do not know that it does, whatever the health endpoints say.
{{< /golden >}}

{{< not-proof >}}
**A healthy cluster status page does not prove the data path works.**
It proves the nodes can see each other.

**A successful install script does not prove the install.**
It proves the files landed and the process started.

**Checking through the load balancer does not prove every node works.**
A broken node behind a working one is invisible until the working one is busy.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A system with its jobs disabled looks completely healthy.**

Health endpoints pass, the UI works, data arrives and is stored.
Nothing processes, nothing is retained, nothing is cleaned up, and no screen says anything is wrong: the stream count simply grows and the output never appears.

It is an easy state to end up in after a maintenance window.
Step 8 exists because of it.
{{< /trap >}}

{{< diagnose >}}
1. **Which step failed?**
   Each step depends on the ones before it, so work forward and stop at the first failure rather than reading the last one.
   A search returning nothing at step 7 is usually a step 6 problem.
1. **Is it one node or all of them?**
   Run the failing step against each node directly.
   One node failing points at that node's configuration, its database connectivity, or its volumes.
   All of them failing points at shared configuration.
1. **Does the health endpoint name the failing check?**
   Fetch the full output rather than the minimal form, and read which check is unhealthy.
1. **Is there an `Error` stream?**
   From step 6 onwards, most failures write one, and it names the element that failed.
1. **Has anything been logged at startup?**
   A failure that happens while the application starts is in the log, not on a screen.
   See [Reading the logs]({{< relref "../troubleshooting/reading-the-logs.md" >}}) before guessing.
{{< /diagnose >}}


## Keep the test feed

It is worth leaving the feed and pipeline from steps 5 to 7 in place, clearly named as a test.
Being able to repeat the end-to-end check in two minutes, on a system that is already in use, is the fastest way to answer "is Stroom broken, or is it just my data?" after any change.

---
title: "Air-Gapped Installation"
linkTitle: "Air-Gapped Installation"
weight: 30
date: 2026-10-14
tags:
description: >
  Installing and running Stroom on a network with no outbound internet access.
pageKind: operate
verification: required
aliases:
  - /docs/install-guide/air-gapped/
---

Stroom is often run on isolated networks, and it is built to work that way: nothing it does at run time requires outbound internet access.
The work is in getting the pieces across, and in noticing the few places where something tries to reach out and quietly fails instead.


## What has to come across

* **The application**, and the Java runtime it needs.
* **The database** software.
* **Container images**, if you deploy that way.
  Pull each one on a connected machine, export it, carry it over and load it into the local registry or daemon.
  Images are the usual reason an otherwise complete transfer fails, because a stack definition names images by tag and the daemon tries to fetch anything it does not already hold.
* **Content packs**, if you want the standard content.
  Stroom can fetch these from a content store over the internet, which is the one part of normal operation that expects a route out.

Take exact versions rather than latest of anything.
A version mismatch found on an isolated network is expensive to fix, because fixing it means another trip across.


## Turn off what reaches out

Two things try the internet by default and should be settled deliberately rather than left to fail:

* **Content store downloads.**
  `stroom.contentStore.urls` points at a public content store.
  On an isolated network, either clear it or point it at a copy you host internally: see [Hosting your own content store]({{< relref "local-content-store.md" >}}).
* **Content pack import on start**, under `stroom.contentPackImport`, if you use it.

Neither failing is fatal, which is exactly the problem: the system comes up looking healthy and some content you expected is simply absent.


## Certificates

An isolated estate usually has its own certificate authority.
Stroom has to trust it, and so does the Java runtime, for anything Stroom connects to over TLS: the database, an identity provider, a downstream proxy.

A certificate trust problem reads as a connection failure rather than as a trust failure, so it is worth confirming deliberately rather than inferring from a working login.

{{< timing mode="async" >}}
Transferring images and packages is the slow part and happens before anything can be tested, so plan on doing it once and checking you have everything rather than discovering a missing piece halfway through.

A written manifest of versions, taken on the connected side, is what makes the second trip avoidable.
{{< /timing >}}

{{< verify >}}
With the system up and the network genuinely isolated, send data, process it, index it and search for it, then look through the logs for anything reporting a failed outbound connection.

{{< golden >}}
**Data goes in and comes back out of a search, and no log reports a connection that could not be made.**

The second half matters as much as the first.
The failure mode here is not that Stroom stops; it is that something it would have fetched is missing, and the only evidence is a log line nobody read.
{{< /golden >}}

{{< not-proof >}}
**Stroom starting is not proof the transfer was complete.**
It starts without the content it would have downloaded, and without content packs it failed to import.

**Testing on a machine that still has a route out proves nothing.**
Verify with the network as it will actually be, not as it is during the build.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Something that cannot reach the internet usually degrades rather than stops.**

A content store it cannot reach, a content pack it cannot import, a certificate revocation list it cannot check: each of these leaves a system that runs, and leaves you without something you assumed was there.

Read the logs of a first start on an isolated network specifically looking for outbound connection failures, rather than only for errors.
{{< /trap >}}

{{< diagnose >}}
1. **Does the log show a connection that timed out?**
   That names what is still trying to reach out.
1. **Is a container image missing?**
   A deployment that hangs or restarts before the application logs anything is usually an image the daemon cannot fetch.
1. **Is the content store URL still pointing outside?**
   See [Configuration properties]({{< relref "../../reference/configuration-properties.md" >}}).
1. **Does Java trust your certificate authority?**
   Test the connection to the database and the identity provider specifically, rather than assuming a working user interface covers it.
1. **Do the versions match what you transferred?**
   Compare against the manifest taken on the connected side.
1. **Is content missing rather than broken?**
   An empty explorer tree on a new system is expected; content packs that did not import is a different problem with the same appearance.
{{< /diagnose >}}

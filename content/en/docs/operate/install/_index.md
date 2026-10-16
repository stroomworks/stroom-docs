---
title: "Installing"
linkTitle: "Installing"
weight: 10
date: 2026-10-14
tags:
description: >
  What a Stroom installation consists of, the order to build it in, and the step that is easy to miss.
pageKind: concept
aliases:
  - /docs/howtos/install/
  - /docs/howtos/install/installapplicationhowto/
  - /docs/howtos/install/installcertificateshowto/
  - /docs/howtos/install/installdatabasehowto/
  - /docs/howtos/install/installhowto/
  - /docs/howtos/install/installhttpdhowto/
  - /docs/howtos/install/installnfshowto/
  - /docs/howtos/install/installnodeshowto/
  - /docs/howtos/install/installprocessingusersetuphowto/
  - /docs/howtos/install/installproxyhowto/
  - /docs/howtos/install/installtestinghowto/
  - /docs/howtos/install/installvolumeshowto/
  - /docs/install-guide/
  - /docs/install-guide/kubernetes/
  - /docs/install-guide/kubernetes/configure-database-server/
  - /docs/install-guide/kubernetes/configure-stroom-cluster/
  - /docs/install-guide/kubernetes/configure-stroomtaskautoscaler/
  - /docs/install-guide/kubernetes/install-operator/
  - /docs/install-guide/kubernetes/introduction/
  - /docs/install-guide/kubernetes/remove-operator/
  - /docs/install-guide/kubernetes/restart-node/
  - /docs/install-guide/kubernetes/stop-stroom-cluster/
  - /docs/install-guide/kubernetes/upgrade-operator/
  - /docs/install-guide/setup/
  - /docs/install-guide/setup/java-key-store-setup/
  - /docs/install-guide/setup/mysql-server-setup/
  - /docs/install-guide/setup/processing-user-setup/
  - /docs/install-guide/single-node-docker/
  - /docs/install-guide/stroom-6-installation/
---

{{% note %}}
Building Stroom from source and running it on your own machine to work on it?
See [Running Stroom in an IDE]({{< relref "/community/dev-guide/stroom-in-an-ide.md" >}}) instead.
{{% /note %}}

A Stroom installation is a handful of pieces that have to agree with each other: a database, one or more Stroom nodes, somewhere to put the data, and a way for people to sign in.

Getting them up in the right order saves time, because each one is hard to test until the one before it works.


## The order

1. **A database.**
   One database serves the whole cluster, not one per node.
   Build it first, because a Stroom node that cannot reach it will not start.
1. **Java and the application** on each node.
   See [Requirements]({{< relref "requirements.md" >}}).
1. **The configuration file** on each node, which is where the database connection and anything node-specific lives.
   See [Configuration]({{< relref "../configuration.md" >}}).
1. **The first administrator**, from the command line.
   A new installation has nobody who can sign in, so until this is done the user interface is of no use to you.
   See [The first administrator]({{< relref "first-administrator.md" >}}).
1. **Authentication**, if you are using an external provider.
   See [Security setup]({{< relref "../security-setup.md" >}}).
1. **Volumes**, so there is somewhere to write data and index shards.
   See [Volumes]({{< relref "../../concepts/volumes.md" >}}).
1. **Turn processing on.**
   Pipeline processing ships disabled, so nothing is processed until both the **Processor Task Creator** and **Data Processor** jobs are enabled.
   The first creates the work and the second does it, on each node where it is on.
   See [Scheduled jobs]({{< relref "../../reference/jobs.md" >}}).

Steps 4 and 7 are the two that catch people, because neither announces itself.
A system with no administrator looks like a broken login, and a system with processing off looks like a broken pipeline.


## Then check it

[Post-install checks]({{< relref "../checking-it-works/post-install-checks.md" >}}) walks through confirming the installation does what you think, in an order that isolates each piece.

Worth doing even when everything appears fine: most of what Stroom does happens in the background, so "it started without errors" and "it works" are different claims.


## Where this fits

This section covers what Stroom needs and the steps that have to happen outside the user interface.
How you deliver it, whether that is a container stack, a package on a virtual machine, or an orchestrated cluster, depends on your own estate and standards.

[Running a proxy]({{< relref "a-proxy.md" >}}) covers standing up a Stroom Proxy, which needs a JVM and a disk and no database at all.
[Air-gapped installation]({{< relref "air-gapped.md" >}}) covers the part that differs on an isolated network, and [Hosting your own content store]({{< relref "local-content-store.md" >}}) covers mirroring the content packs into a Git server you control.
[Upgrading]({{< relref "upgrading.md" >}}) covers what to change before moving an existing installation to 7.14, and why the whole cluster has to stop.

---
title: "Operate"
linkTitle: "Operate"
weight: 50
date: 2026-10-14
tags:
description: >
  Installing Stroom, keeping it running, checking that it is, and fixing it when it isn't.
pageKind: concept
---

Stroom is a system you run, not a service someone else runs for you.
This section is for whoever is responsible for it: getting it installed, knowing whether it is working, and getting it working again.

Stroom does most of its work in the background and keeps going when a single piece of configuration is not what you intended, which is what lets a busy system stay up.
The practical consequence is that confirming a change had the effect you wanted is a step worth taking, rather than something to assume.

**[Checking it works]({{< relref "checking-it-works/_index.md" >}})** shows you where to look, and every page says what proves the answer.
**[Monitoring]({{< relref "monitoring.md" >}})** is the standing version of the same question, for noticing before anyone asks.
**[Troubleshooting]({{< relref "troubleshooting/_index.md" >}})** is organised by symptom, for when the answer is not what you hoped, and **[Resetting]({{< relref "resetting/_index.md" >}})** is for when something has to start again.

The other pages here are about the system itself rather than the data moving through it: [installing it]({{< relref "install/_index.md" >}}), [who can see and change what]({{< relref "users-and-permissions.md" >}}), how people [sign in]({{< relref "security-setup.md" >}}), how [configuration]({{< relref "configuration.md" >}}) reaches a node, the [nodes and jobs]({{< relref "nodes-and-jobs.md" >}}) that do the work, and [backup and restore]({{< relref "backup-and-restore.md" >}}), which is worth reading before you need it rather than after.

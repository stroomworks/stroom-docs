---
title: "Where to Go Next"
linkTitle: "Where to Go Next"
weight: 70
date: 2026-10-14
tags:
description: >
  A map of the rest of the documentation, and what to read depending on what you are doing.
pageKind: concept
---

You have sent data to Stroom, translated it, indexed it, searched it and drawn it.
That is the whole path, once, on three rows of CSV.
Everything else is doing it properly.


## If you are evaluating

Read [Concepts]({{< relref "../concepts/_index.md" >}}).
It explains the model rather than the mechanics: what a [stream]({{< relref "../concepts/streams/_index.md" >}}) really is, how [pipelines inherit]({{< relref "../concepts/pipelines.md" >}}) from each other, what [Plan B]({{< relref "../concepts/planb.md" >}}) is for, and why [reference data]({{< relref "../concepts/pipeline-reference-data.md" >}}) has an effective time.


## If you are connecting a real source

Go to [Sending data]({{< relref "../guides/sending-data/_index.md" >}}).
If you already run Vector, Fluent Bit, rsyslog, syslog-ng, Logstash, Fluentd, NiFi or Cribl Stream, there is a page for pointing it at Stroom, and it is almost always configuration rather than code.

Read [Choosing a feed]({{< relref "../guides/sending-data/choosing-a-feed.md" >}}) before you send anything at volume.
Feed names are a security boundary and they are awkward to change afterwards.


## If you are building something real

[Guides]({{< relref "../guides/_index.md" >}}) follows the life of the data, and each page ends with how to check the step worked:

* [Receiving and routing]({{< relref "../guides/receiving-and-routing/_index.md" >}}), for deciding what Stroom accepts and what it quietly discards.
* [Translating]({{< relref "../guides/translating/_index.md" >}}), which is where most of the work is.
* [Reference data]({{< relref "../guides/reference-data/_index.md" >}}), for enriching events with facts that live elsewhere.
* [Indexing]({{< relref "../guides/indexing/_index.md" >}}) and [Searching]({{< relref "../guides/searching/_index.md" >}}), for making it findable and asking questions of it.
* [Automation]({{< relref "../guides/automation/_index.md" >}}), for driving all of it from outside the user interface.


## If you are going to run it

[Operate]({{< relref "../operate/_index.md" >}}) is for whoever is responsible for the system.

Three parts of it are worth reading before you need them rather than after:

* [Checking it works]({{< relref "../operate/checking-it-works/_index.md" >}}), which is how to find out whether Stroom is doing what you asked.
* [Resetting]({{< relref "../operate/resetting/_index.md" >}}), for when something has to start again, and what each reset costs.
* [Troubleshooting]({{< relref "../operate/troubleshooting/_index.md" >}}), organised by symptom.


## If you are looking something up

[Reference]({{< relref "../reference/_index.md" >}}) has the lists: every pipeline element and its properties, every expression function, every document type, every scheduled job, every datafeed response code, and a [glossary]({{< relref "../reference/glossary.md" >}}).


## The habit worth keeping

Every instruction in these docs ends by telling you how to check it worked, and what to do if it did not.
Much of what Stroom does happens in the background and across several nodes, so the check is usually quick, specific, and somewhere you would not have thought to look.

They are the difference between a system you believe is working and one you know is.

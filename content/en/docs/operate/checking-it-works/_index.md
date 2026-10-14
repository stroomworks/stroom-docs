---
title: "Checking It Works"
linkTitle: "Checking It Works"
weight: 40
date: 2026-10-14
tags:
description: >
  How to find out whether Stroom is actually doing what you asked it to, rather than assuming.
pageKind: concept
---

Each page here answers one question, in the order you would ask it: [is Stroom up]({{< relref "health-endpoints.md" >}}), is data [arriving]({{< relref "is-data-arriving.md" >}}), is it [being processed]({{< relref "is-data-processing.md" >}}), can you [search it]({{< relref "is-search-working.md" >}}).

Work down the list rather than jumping to the end.
The questions are ordered because the answers are: there is no point asking why a search returns nothing if no data ever arrived, and "the search is broken" is the wrong place to start looking for a feed that is set to reject.

Two habits worth keeping, both of which this section is built around:

* **Check the thing itself, not something near it.**
  Stroom has a lot of screens, and a healthy one next door is not an answer about the thing you changed.
  Each page says what proves the answer and, where it matters, what looks like proof but is not.
* **Know how long to wait.**
  Most of Stroom's work is asynchronous, and the usual mistake is to decide something has failed when it has not started.
  Each page says what normal looks like.

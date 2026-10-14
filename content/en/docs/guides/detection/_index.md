---
title: "Detection"
linkTitle: "Detection"
weight: 80
date: 2026-10-14
tags:
description: >
  Turning searches into detections: analytic rules that watch your data, and annotations for working what they find.
pageKind: concept
---

Searching tells you what happened.
Detection keeps asking the question for you.

An **[analytic rule]({{< relref "analytic-rules.md" >}})** is a [StroomQL]({{< relref "../../concepts/query-language.md" >}}) query that Stroom runs continually, either against events as they are processed or on a schedule.
When the query matches, the rule raises a detection.
An **[annotation]({{< relref "annotations.md" >}})** is how a person picks a detection or an event up, assigns it, comments on it and closes it, without the case ever leaving the data it came from.

A scheduled rule's **execution schedules** decide when it runs and, separately, what point in time each run represents.
That distinction is the one to read before trusting a rule that is enabled and detecting nothing: see [Execution schedules]({{< relref "execution-schedules.md" >}}).

---
title: "Get Started"
linkTitle: "Get Started"
weight: 10
date: 2026-10-14
tags:
description: >
  One thread, from nothing to a dashboard built on data you sent yourself.
pageKind: concept
aliases:
  - /docs/quick-start-guide/
  - /docs/quick-start-guide/dashboard/
  - /docs/quick-start-guide/feed/
  - /docs/quick-start-guide/indexing/
  - /docs/quick-start-guide/process/
  - /docs/quick-start-guide/running/
---

This is one continuous walk-through.
Each page ends where the next begins, and by the end you will have sent data into Stroom, turned it into structured events, indexed it, searched it and drawn it on a dashboard.

It takes about an hour, and it needs a machine that can run Docker.
Nothing here is production configuration: the point is to see the whole path working once, so that the parts make sense when you meet them for real.

Work through it in order.
Each step depends on the one before, and each ends by telling you how to check it worked before you move on.
**That habit is the most useful thing to take away from this section**, because Stroom can be quiet about failure: data that was dropped, a translation that matched nothing and an index that stored nothing all look much the same from a distance.

If you only want to understand what Stroom is, read [What Stroom is]({{< relref "what-stroom-is.md" >}}) and stop there.

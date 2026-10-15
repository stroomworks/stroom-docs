---
title: "Roadmap"
linkTitle: "Roadmap"
weight: 10
date: 2026-10-15
tags: 
description: >
  What happened to the 2022 roadmap for Stroom, and where to find current plans.

---

This page previously held a roadmap for Stroom written in January 2022, when v7.0 was the current release and v7.1 and v7.2 were still to come.
It is no longer maintained as a forward-looking plan.

For current work and plans, see the [issues](https://github.com/gchq/stroom/issues) on the [Stroom GitHub repository](https://github.com/gchq/stroom).
For what has changed in each version, see the [release notes]({{< relref "/releases/_index.md" >}}).


## Items from the 2022 roadmap that have shipped

The version given is the first release in which the item appeared, according to the Stroom change log and release notes.

| Item | Version | Notes |
|---|---|---|
| Reference data storage | 7.0 | Reference data is held in an off-heap, disk-backed LMDB store rather than in direct memory. |
| Search result storage | 7.0 | Search results are written to on-disk LMDB stores while a search runs, rather than held in memory. |
| Modularisation | 7.0 | Stroom was split into separate modules with their own database access. |
| Modernisation of libraries | 7.0 | Spring was replaced by Guice for dependency injection, and Hibernate by jOOQ for database access. |
| Annotations | 7.0 | Search results in dashboards can be annotated with a status and comments, and annotations can be searched. |
| Elasticsearch integration | 7.1 | Data can be indexed into Elasticsearch from a pipeline and searched from a dashboard. |
| User preferences | 7.1 | User preferences were added, including a theme (dark mode), date and time format and layout density. |
| Improved proxy aggregation | 7.2 | Stroom Proxy was rewritten in 7.2 to allow data to be forwarded to many destinations, and re-implemented again in 7.8. |

Some of these features have been extended considerably since they first shipped.
The release notes for each version have the details.


## Other items from the 2022 roadmap

The 2022 roadmap also listed the following items.
Their status has not been established for this page, so they are listed here without saying whether or not they have been done:

* Interactive visualisations
* XSLT 3 support
* Accessibility improvements
* Authorisation enhancements, including a separate authorisation service
* Pipeline processing on Stroom Proxy
* Multiple input sources (Kafka, HDFS, local file system)
* Multiple output destinations
* Improved field extraction
* Kafka analytics
* Query fusion
* Reference data deltas

Check the [issues](https://github.com/gchq/stroom/issues) and the [release notes]({{< relref "/releases/_index.md" >}}) for the current state of any of these.

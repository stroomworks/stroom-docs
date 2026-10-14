---
title: "Connecting a Shipper"
linkTitle: "Connecting a Shipper"
weight: 30
date: 2026-10-14
tags:
description: >
  Pointing a log shipper you already run at Stroom, usually with configuration alone.
pageKind: concept
aliases:
  - /docs/sending-data/example-clients/
  - /docs/sending-data/example-clients/c-sharp-client/
  - /docs/sending-data/example-clients/curl-linux/
  - /docs/sending-data/example-clients/curl-windows/
  - /docs/sending-data/example-clients/event-logging/
  - /docs/sending-data/example-clients/send_to_stroom/
  - /docs/sending-data/example-clients/simple-java-client/
  - /docs/sending-data/example-clients/stroom-log-sender/
  - /docs/sending-data/example-clients/vb-script/
  - /docs/sending-data/example-clients/wget-windows/
---

If you already run a log shipper, you almost certainly do not need to write anything.
Most of them can POST with custom headers, which is all Stroom's datafeed endpoint asks for.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.
Every recipe here depends on it, and skipping it is how you end up with silently corrupted data through the `Compression` header, or data in the wrong permission domain through the feed name.


## Pick a route

| If you… | Use | Infrastructure added |
|---|---|---|
| Control your own agents, or are starting fresh | [Vector]({{< relref "vector.md" >}}) or [Fluent Bit]({{< relref "fluent-bit.md" >}}) | One small binary |
| Already run rsyslog | [rsyslog]({{< relref "rsyslog.md" >}}) | None |
| Already run syslog-ng | [syslog-ng]({{< relref "syslog-ng.md" >}}) | None |
| Already run Logstash | [Logstash]({{< relref "logstash.md" >}}) | None |
| Already run Fluentd | [Fluentd]({{< relref "fluentd.md" >}}) | None |
| Already run Apache NiFi | [Apache NiFi]({{< relref "nifi.md" >}}) | None |
| Already run Cribl Stream | [Cribl Stream]({{< relref "cribl.md" >}}) | None |
| Run agents locked to another vendor's protocol | [Protocol shims]({{< relref "protocol-shims.md" >}}) | One small binary |
| Have a system that can only write files | [ZIP drop folder]({{< relref "zip-drop-folder.md" >}}) | None, but a proxy is required |
| Want to read a Kafka topic | [Vector]({{< relref "vector.md" >}}) or [Fluent Bit]({{< relref "fluent-bit.md" >}}) | One small binary, no code |
| Need database change data capture | [Debezium Server]({{< relref "debezium.md" >}}) | One process, **plus a header-injecting hop** |

Vector and Fluent Bit are the recommended default for anything greenfield: a single small binary, a large source catalogue, and good buffering.

One of these is not configuration-only, and the table marks it in bold.
[Debezium Server]({{< relref "debezium.md" >}}) cannot set the headers Stroom requires, so it needs a second process in front of it.
Worth knowing before it is costed as simple.

**Reading a Kafka topic needs no code at all**: Vector and Fluent Bit both have a Kafka source, so a topic reaches Stroom through the same HTTP sink as everything else here.


## What every recipe has in common

Four decisions, whichever tool you use:

* **The feed name.**
  See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).
  Decide it before you configure anything.
* **Compression.**
  If you turn it on in the shipper, set the `Compression` header to match in the same request.
  Nothing else will tell you that you got this wrong.
* **Batch shape.**
  One event per post, newline-delimited, or a JSON array.
  The receiving pipeline's [parser]({{< relref "../../../concepts/translation.md" >}}) has to match, so tell whoever builds it which you chose.
* **Buffering.**
  What the shipper does when Stroom is unreachable.
  For audit data, apply backpressure rather than dropping.

{{% note %}}
Each recipe's Stroom-side facts are verified against the Stroom source.
The shipper's own configuration is written from that tool's documentation and has not been run here, and plugin names and options move between releases.
Each page says so, and each ends with how to validate it locally.
{{% /note %}}

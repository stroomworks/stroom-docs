---
title: "Sending Data"
linkTitle: "Sending Data"
weight: 10
date: 2026-10-14
tags:
description: >
  Getting data into Stroom, from any system that can make an HTTP request or write a file.
pageKind: concept
---

[Stroom's ingest]({{< relref "../../concepts/data-receipt.md" >}}) is deliberately plain: metadata in HTTP headers, opaque bytes in the body.
There is no SDK to adopt, no handshake, no wire format and no schema registry to satisfy.
**If a system can POST with custom headers, it can send to Stroom.**

That is worth knowing before you plan an integration, because it means most of the work is configuration rather than code.
Nearly every common log shipper can already do it.


## Where to start

* **[How data gets in]({{< relref "how-data-gets-in.md" >}})** if you are choosing an approach.
  Stroom has three entry points, and which one you want is mostly decided by what the sending system is capable of.
* **[Choosing a feed]({{< relref "choosing-a-feed.md" >}})** before you send anything.
  The feed is a security boundary, not a label, and getting it wrong is expensive to unpick later.
* **[Connecting a shipper]({{< relref "connecting-a-shipper/_index.md" >}})** if you already run Vector, Fluent Bit, rsyslog, Logstash, NiFi or similar.
  Configuration only, in most cases.
* **[The datafeed contract]({{< relref "../../reference/the-datafeed-contract.md" >}})** for the headers, compression and authentication detail, when you are writing something yourself.

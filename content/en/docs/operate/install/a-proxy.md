---
title: "Running a Proxy"
linkTitle: "Running a Proxy"
weight: 25
date: 2026-10-14
tags:
description: >
  Setting up Stroom Proxy in front of Stroom, or at a remote site, and proving data is getting through it.
pageKind: operate
verification: required
aliases:
  - /docs/proxy/
  - /docs/proxy/stroom-7-proxy-installation/
---

Stroom Proxy receives data, keeps it on local disk, and forwards it on.
It is what you put at a site that cannot reach Stroom directly, and what you put in front of Stroom to batch many small posts into fewer large ones.

[Data receipt]({{< relref "../../concepts/data-receipt.md" >}}) explains what it does and why.
This page is about standing one up.


## What it needs

Much less than Stroom: **a JVM and a disk**.
A proxy has no database, and nothing in it depends on one.
Everything it holds is a directory on its own filesystem, worked through as a series of queues, which is why its disk is the thing to size and watch.


## The configuration file

A proxy's settings sit under **`proxyConfig`**, not `appConfig`.
That catches people who know Stroom's file, because everything else about the two files looks alike:

```yaml
proxyConfig:
  proxyId: "site-cardiff-1"

  path:
    home: "/opt/stroom-proxy"

  downstreamHost:
    scheme: "https"
    hostname: "stroom.example.internal"
    port: 443
    apiKey: "…"

  aggregator:
    enabled: true
    maxItemsPerAggregate: 1000
    maxUncompressedByteSize: "1G"
    aggregationFrequency: 10m
```


### `proxyId`

Set it, and make it unique across the estate.
It goes into every receipt ID this proxy issues, and a chain of proxies appends each one to `ReceiptIdPath`, which is how a stream can be traced back through the hops it took.
Two proxies sharing an id makes that trace ambiguous exactly when you need it.


### `downstreamHost`

One setting with four jobs.
It names the Stroom or proxy immediately downstream, and is used for **forwarding**, for **feed status** checks, for fetching **receipt policy rules**, and for **verifying API keys**.
Getting it wrong therefore breaks more than forwarding, and the symptoms look unrelated to each other.

Its `apiKey` authenticates this proxy to that downstream.
See [API keys]({{< relref "../../guides/automation/api-keys.md" >}}).


## Where data goes next

A proxy forwards to any number of destinations, configured separately:

| Setting | Sends to |
|---|---|
| `forwardHttpDestinations` | Stroom, or another proxy |
| `forwardFileDestinations` | A directory on disk |
| `forwardS3Destinations` | An S3 bucket |

More than one may be enabled, and each keeps its own queue and retries independently.

{{% note %}}
Forwarding to S3 is in the 7.14 betas only, and is not in a stable release.
{{% /note %}}


## Authentication

A proxy defaults to **`NO_IDP`** and that is usually right: it authenticates nobody, and trust is established at the transport with certificates.
Stroom's internal identity provider is **not valid for a proxy**, which has no accounts of its own.
Use an external provider only where the proxy genuinely needs one.

See [Security setup]({{< relref "../security-setup.md" >}}).

{{< timing mode="async" >}}
A proxy answers the sender as soon as it has written the data to its own disk, not when the data reaches Stroom.
Forwarding happens afterwards, on its own schedule, and with aggregation on it waits until a batch is full or old enough.

So a successful post means the proxy has it, and nothing more.
With the default settings there can be ten minutes between a sender being told "yes" and the data appearing in Stroom, which is normal rather than a fault.
{{< /timing >}}

{{< verify >}}
Post one record to the proxy, then find that stream in Stroom and confirm its `ReceiptIdPath` attribute names this proxy.

{{< golden >}}
**The stream arrives in Stroom and its `ReceiptIdPath` includes this proxy's id.**

Arrival alone only proves something got through.
The receipt path proves it came this way, which is the question you are actually asking when a proxy is in the chain.
{{< /golden >}}

{{< not-proof >}}
**A `200` from the proxy is not proof the data reached Stroom.**
It means the proxy wrote it to disk.
Everything after that is the forwarder's business, and a proxy whose forwarding has been failing for hours still answers `200` to every post.

**An empty forward queue is not proof everything forwarded.**
It is also what a proxy receiving nothing looks like.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A proxy that cannot forward keeps accepting data and says nothing to the sender.**

That is the point of it, and it is also how a disk fills.
Senders see success throughout, Stroom sees nothing arriving, and the only evidence is the proxy's own queue directories growing.

Monitor the proxy's disk and its queue depth, not just whether it is answering.
See [Proxy problems]({{< relref "../troubleshooting/proxy-problems.md" >}}).
{{< /trap >}}

{{< trap severity="silent" >}}
**The receipt check mode must match on every hop.**

A proxy that checks differently from the one downstream of it produces data accepted at one layer and discarded at another, with nothing in either place describing it as a mismatch.
Set it the same along the whole chain.
See [Controlling what is accepted]({{< relref "../../guides/receiving-and-routing/controlling-what-is-accepted.md" >}}).
{{< /trap >}}

{{< diagnose >}}
1. **Is the data on the proxy's disk?**
   Look at its queue directories.
   That separates "did not arrive" from "arrived and has not moved", which need completely different answers.
1. **Can the proxy reach `downstreamHost`?**
   Check from the proxy itself, not from your desktop.
   One wrong value here breaks forwarding, feed status and rule fetching at once.
1. **Is the API key valid and the downstream user enabled?**
   A rejected key fails forwarding while receipt carries on working.
1. **Is it waiting rather than stuck?**
   With aggregation on, a batch is held until it is full or old enough.
   Compare the age of the oldest queued item against `aggregationFrequency`.
1. **Is `proxyId` set and unique?**
   Without it, receipt paths cannot be traced and two sites can look like one.
1. **Does the receipt check mode match downstream?**
   See the trap above.
1. **Is the disk filling?**
   A store-and-forward component with nowhere to forward is a disk that fills at the rate data arrives.
{{< /diagnose >}}

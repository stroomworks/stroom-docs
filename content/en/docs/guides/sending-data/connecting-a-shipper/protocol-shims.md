---
title: "Protocol Shims"
linkTitle: "Protocol Shims"
weight: 25
date: 2026-10-14
tags:
description: >
  Redirecting agents that have no generic HTTP output, by terminating the protocol they do speak.
pageKind: guide
verification: required
thirdParty: "Vector and Fluent Bit"
---

Vector and Fluent Bit do not only read sources: they can **terminate other vendors' ingest protocols**.
That turns them into shims.
An agent that believes it is talking to its usual destination is pointed at the shim, and the shim re-emits everything to Stroom.

This matters because some agents have no generic HTTP output at all.
Elastic Beats emit only to Elasticsearch, Logstash, Kafka, Redis, a file or the console, so there is no configuration that makes Filebeat post to Stroom directly.

Read [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}) first.
The compression trap applies to the shim's outbound side exactly as it does everywhere else.


## Beats estates: an Elasticsearch bulk listener

Fluent Bit's `elasticsearch` input accepts the Elasticsearch bulk API, so Filebeat can be pointed at it as though it were a cluster.

```text
[INPUT]
    Name   elasticsearch
    Listen 0.0.0.0
    Port   9200
    Tag    beats.in

[OUTPUT]
    Name   http
    Match  beats.in
    Host   stroom.example.com
    Port   443
    URI    /<base>/datafeed
    tls    on
    Format json
    Header Feed BEATS_LOGS
    Header Compression NONE
    Header Authorization Bearer ${STROOM_TOKEN}
```

On the Filebeat side, repoint the output and leave the inputs untouched:

```yaml
output.elasticsearch:
  hosts: ["fluent-bit-host:9200"]

setup.ilm.enabled: false
setup.template.enabled: false
```

{{< trap severity="silent" >}}
**Beats expects a real cluster, and the handshake is what fails.**

On connect, Beats performs a version and capability handshake, and by default tries to install index templates and lifecycle policies.
A shim is not a cluster.
Those behaviours have to be disabled, as above, and the handshake still has to succeed with your Beats version.

**This is the single most likely thing to fail in this recipe.**
Prove it with one Filebeat instance before rolling anything out.

Separately, the input's buffer defaults to 4 MB and Beats' bulk batches can exceed it under load.
Raise it, or lower Filebeat's batch size, if requests are rejected.
{{< /trap >}}


## HEC estates

Both tools can terminate the HTTP Event Collector protocol.
Fluent Bit's input is `splunk`; Vector's source is `splunk_hec`, listening on 8088 in both cases, with the usual HTTP output to Stroom.

{{< trap severity="silent" >}}
**A HEC shim does not redirect a Universal Forwarder.**

The Universal Forwarder speaks S2S, a proprietary binary forwarding protocol, and neither Vector nor Fluent Bit terminates it.
Pointing a forwarder at a HEC listener will not work, and planning an estate migration on the assumption that it will is an expensive mistake.

A HEC shim helps only where something is **already** emitting HEC: applications using the HTTP API directly, container log shippers configured with a HEC output, or a heavy forwarder configured to output HEC.

If you genuinely need to redirect Universal Forwarders, this does not solve it.
The realistic options are to reconfigure or replace the agents, to put a heavy forwarder in the path to convert S2S to HEC, which keeps the vendor dependency, or to read the data out downstream.
Treat it as an open question, not a solved one.
{{< /trap >}}


## Datadog estates

Vector's `datadog_agent` source listens for agent traffic; point the agent's destination URL at this host instead of the vendor's endpoint.


## OTel estates

Either tool can terminate OTLP, which substitutes for a native receiver Stroom does not have.
Vector's `opentelemetry` source takes both gRPC on 4317 and HTTP on 4318.
Fluent Bit's equivalent input defaults to 4318, and two of its options matter when clients are strict: the success response code, which defaults to `201`, and tagging from the URI.

**OTLP carries logs, metrics and traces, each with a different shape.**
Decide which signals you actually want and filter at the shim: sending all three into one feed makes the downstream [pipeline's]({{< relref "../../../concepts/translation.md" >}}) job much harder.
A separate feed per signal type is usually right.


## Fluentd-forward estates

Vector's `fluent` source listens on 24224, so any Fluentd or Fluent Bit instance using `out_forward` can point at it unchanged.


## What every shim has in common

{{< trap severity="silent" >}}
**A shim is a new single point of failure, and the agents behind it cannot see it.**

They believe they delivered successfully the moment the shim accepts the data.
If the shim then cannot reach Stroom, nothing upstream knows.

Enable the shim's on-disk buffering, and monitor the shim itself.
You have taken responsibility for durability away from the agents.
{{< /trap >}}

**Feed derivation.**
All traffic through one listener lands in one feed unless you split it.
Prefer separate listeners, on distinct ports with distinct feed names, over deriving the feed from source metadata.
See [Choosing a feed]({{< relref "../choosing-a-feed.md" >}}).

**Inbound authentication.**
A shim's listener typically accepts anything that can reach it, and you are replacing an endpoint the agents previously authenticated to.
Restrict it at the network level and enable TLS where the agent supports it.
Fluent Bit's `splunk` input can at least validate a token; most other shim inputs offer nothing equivalent.

{{< timing mode="immediate" >}}
The shim forwards as it receives, subject to its own batching and buffering.
A disk buffer defers delivery during a Stroom outage rather than losing it, which is the whole reason to configure one here.
{{< /timing >}}

{{< verify >}}
Send **one** real event through the **real agent**, end to end, and confirm it arrives in Stroom with the expected feed.

{{< golden >}}
**One event, from the unmodified agent, on the right feed in Stroom.**

Testing the shim with `curl` proves the shim.
It does not prove the agent will talk to it, and the handshake behaviours above are exactly where that fails.
{{< /golden >}}

{{< not-proof >}}
**The shim accepting data is not proof it reached Stroom.**
That is the point of the single-point-of-failure trap: the shim answers the agent, then forwards separately.

**A working shim with one agent version is not proof for another.**
Input plugin names and agent behaviours both move between releases.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Prove Stroom without the shim.**
   Use the `curl` test in [The datafeed contract]({{< relref "../../../reference/the-datafeed-contract.md" >}}).
1. **Prove the shim without the agent.**
   Post to the shim's listener directly and confirm the data reaches Stroom.
   That splits the problem in half.
1. **Is the agent connecting at all?**
   For Beats, this is where the cluster handshake fails.
   Read the agent's own log before the shim's.
1. **Are requests being rejected for size?**
   Raise the input's buffer, or lower the agent's batch size.
1. **Is everything landing in one feed?**
   One listener is one feed.
   Split by listener.
1. **Is the shim buffering to disk?**
   If not, an outage is loss, and the agents will not have reported it.
1. **Check input plugin names against your installed versions**, of both the shim and the agent, since this page is written from documentation rather than from a run.
{{< /diagnose >}}

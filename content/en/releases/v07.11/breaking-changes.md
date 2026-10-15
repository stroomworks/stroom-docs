---
title: "Breaking Changes"
linkTitle: "Breaking Changes"
weight: 30
date: 2026-03-04
tags: 
description: >
  Changes in Stroom version 7.11 that may break existing processing or ways of working.
---

{{% warning %}}
Please read this section carefully in case any of the changes affect you.
Most of the changes in v7.11 are to Stroom-Proxy's configuration.
{{% /warning %}}


## Stroom

### Receipt Policy Replaced by Data Receipt Rules

The property `stroom.receive.receiptPolicyUuid` has been removed.
Decisions about whether to receive, reject or drop data are now made by the receipt check mode, `stroom.receive.receiptCheckMode`, and, in `RECEIPT_POLICY` mode, by the rules on the new **Data Receipt Rules** screen.
**If your configuration sets `receiptPolicyUuid`, remove it**, and recreate the policy as data receipt rules if you used one.
See [Upgrade Notes]({{< relref "upgrade-notes#data-receipt" >}}).


### Elasticsearch Retention Scroll Size Removed

The property `stroom.elastic.retention.scrollSize` has been removed.
Remove it from your configuration if you set it.


## Stroom-Proxy

### Downstream Host Configuration

Stroom-Proxy's connections to the Stroom or Stroom-Proxy downstream of it have been brought together under a single new branch, `proxyConfig.downstreamHost`.
It holds the host, port, scheme, path prefix and API key, and is used for forwarding, feed status checks, receipt rules and API key verification.

As a result:

* **The `contentSync` branch has been removed.**
  Its `apiKey` moves to `downstreamHost.apiKey`, and the receipt rules URL is now `receiptPolicy.receiveDataRulesUrl`.
* **`feedStatus.apiKey`, `feedStatus.defaultStatus` and `feedStatus.enabled` have been removed.**
  The API key moves to `downstreamHost.apiKey`.
  Whether and how data is checked on receipt is now set by `receive.receiptCheckMode`.
* **`forwardHttpDestinations[*].forwardUrl`, `livenessCheckUrl` and `feedStatus.url` are now empty by default.**
  Left empty, or set to just a path, they are combined with `downstreamHost` to form the URL.
  A full URL still works as before.
* **The named Jersey clients `CONTENT_SYNC` and `FEED_STATUS` have been replaced by `DOWNSTREAM`.**
  If you configure them under `jerseyClients` in your configuration file, rename them.

**If your configuration sets any of the removed properties, Stroom-Proxy will fail to start.**
See [Upgrade Notes]({{< relref "upgrade-notes#downstream-host" >}}) for the new configuration.


### Receipt Check Mode

`proxyConfig.receive.receiptCheckMode` replaces `feedStatus.enabled`, and defaults to `FEED_STATUS`, which is the previous behaviour.
The other modes are `RECEIPT_POLICY`, `FEED_EXISTENCE`, `RECEIVE_ALL`, `DROP_ALL` and `REJECT_ALL`.

With `RECEIPT_POLICY`, **every Stroom-Proxy in the chain down to Stroom must use the same mode**.

`proxyConfig.receive.receiptPolicyUuid` has also been removed.


## Stroom & Stroom-Proxy

### Java 25

Stroom v7.11 requires Java 25, where v7.10 required Java 21.
See [Upgrade Notes]({{< relref "upgrade-notes#java-version" >}}).

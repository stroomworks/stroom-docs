---
title: "Breaking Changes"
linkTitle: "Breaking Changes"
weight: 30
date: 2026-03-24
tags: 
description: >
  Changes in Stroom version 7.12 that may break existing processing or ways of working.
---

{{% warning %}}
Please read this section carefully in case any of the changes affect you.
{{% /warning %}}


## Stroom

No Stroom specific breaking changes in v7.12.


## Stroom-Proxy

No Stroom-Proxy specific breaking changes in v7.12.


## Stroom & Stroom-Proxy

### Data Feed Key Files

If you authenticate data receipt with data feed keys, **every data feed key file has to be replaced**.

The property `.receive.dataFeedKeysDir` has been renamed to `.receive.dataFeedIdentitiesDir`, its default has changed from `data_feed_keys` to `data_feed_identities`, and the structure of the files in it has changed.
Files in the old format are not read, so data from senders using data feed keys will be rejected until the files are replaced.

The property `.receive.dataFeedKeyOwnerMetaKey` has also been renamed, to `.receive.dataFeedOwnerMetaKey`.

See [Upgrade Notes]({{< relref "upgrade-notes#data-feed-identities" >}}) for details.

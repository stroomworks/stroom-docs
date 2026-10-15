---
title: "New Features"
linkTitle: "New Features"
weight: 10
date: 2026-03-24
tags: 
description: >
  New features in Stroom version 7.12.
---

## Data Receipt

### Certificate Identities

Data feed authentication can now identify a sender by the Distinguished Name (DN) of its X509 certificate, as well as by a data feed key.
Enable it by adding `CERTIFICATE_IDENTITY` to `.receive.enabledAuthenticationTypes`.

The identities are held in the same files as data feed keys, in the directory set by `.receive.dataFeedIdentitiesDir`.
Each certificate identity lists a certificate DN, the stream meta data to apply to data received from it, and an expiry.
The DN is read from the header named by `.receive.x509CertificateDnHeader`, and, as with a data feed key, the sender must also supply its owner in the header named by `.receive.dataFeedOwnerMetaKey`.

This applies to both Stroom and Stroom-Proxy.
The directory and the file format have both changed; see [Upgrade Notes]({{< relref "upgrade-notes" >}}).


## Auto Content Creation

`stroom.autoContentCreation` has three new properties to give more control over the explorer structure and the permissions of content it generates:

* `destinationExplorerSubPathTemplate`: a sub-path, below `destinationExplorerPathTemplate`, where the copied dependencies of the generated feed (XSLTs, text converters and so on) are created.
  Defaults to `dev`; left unset, they go in the main destination folder.
* `groupParentGroupName`: the group that each generated group is made a member of.
  Defaults to `Data Feed Reader`.
* `additionalGroupParentGroupName`: the group that each generated additional group is made a member of.
  Defaults to `Data Feed Developer`.

The default for `additionalGroupTemplate` has also changed, from `grp-${accountid}-sandbox` to `grp-${accountid}-dev`.


## Data Formats

`JSON_LINES` has been added to the base list of data formats in `stroom.data.meta.dataFormats`, for data with one JSON object per line.

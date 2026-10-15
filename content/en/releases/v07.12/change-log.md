---
title: "Change Log"
linkTitle: "Change Log"
weight: 50
date: 2026-03-24
tags: 
description: >
  Full list of changes in this release.
---

<!--
To build this list run diff_changelog.sh in the root of the stroom repo.
E.g. ./diff_changelog.sh 7.11 7.12 | sed -E -e 's/^/\n/' -e 's|Issue \*\*#([0-9]+)\*\*|Issue **{{< external-link "#\1" "https://github.com/gchq/stroom/issues/\1" >}}**|g'
-->

## Features and Changes

* Issue **{{< external-link "#5427" "https://github.com/gchq/stroom/issues/5427" >}}** : Change the Data Feed Key authentication mechanism to support authentication by X509 certificate DN. Add a new allowed type of `CERTIFICATE_IDENTITY` to `.receive.enabledAuthenticationTypes`. Rename property `.receive.dataFeedKeysDir` to  `.receive.dataFeedIdentitiesDir` and change the structure of the files in it, all files will have to be replaced. Rename property `.receive.dataFeedKeyOwnerMetaKey` to `.receive.dataFeedOwnerMetaKey`. Change the default value of `.receive.dataFeedIdentitiesDir` from `data_feed_keys` to `data_feed_identities`.

* Issue **{{< external-link "#5442" "https://github.com/gchq/stroom/issues/5442" >}}** : Add more configuration options to `stroom.autoContentCreation` to improve the explorer structure and permissions of the generated content. Add properties `additionalGroupParentGroupName`, `destinationExplorerSubPathTemplate` and `groupParentGroupName`. All have sensible defaults.

* Issue **{{< external-link "#5473" "https://github.com/gchq/stroom/issues/5473" >}}** : Add `JSON_LINES` to the base list of data formats in the `.data.meta.dataFormats` property.





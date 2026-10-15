---
title: "Upgrade Notes"
linkTitle: "Upgrade Notes"
weight: 40
date: 2026-03-24
tags: 
description: >
  Required actions and information relating to upgrading to Stroom version 7.12.
---

{{% warning %}}
Please read this section carefully in case any of it is relevant to your Stroom/Stroom-Proxy instance.
{{% /warning %}}


## Upgrade Path

You can upgrade to v7.12.x from any v7.x release that is older than the version being upgraded to.

If you want to upgrade to v7.12.x from v5.x or v6.x we recommend you do the following:

1. Upgrade v5.x to the latest patch release of v6.0.
1. Upgrade v6.x to the latest patch release of v7.0.
1. Upgrade v7.x to the latest patch release of v7.12.

{{% warning %}}
v7.12 **cannot** migrate content in legacy formats, i.e. content created in v5/v6.
You must therefore upgrade to v7.0.x first to migrate this content, before upgrading to v7.12.x.
{{% /warning %}}


## Java Version

Stroom v7.12 requires Java 25.
This is the same java version as Stroom v7.11.
Ensure the Stroom and Stroom-Proxy hosts are running the latest patch release of Java v25.


## Configuration File Changes

<!--
Check changes using something like this (run from an up-to-date stroom repo):
old_ver=7.11
new_ver=7.12
git diff origin/${old_ver}..origin/${new_ver} stroom-config/stroom-config-app/src/test/resources/stroom/config/app/expected.yaml
git diff origin/${old_ver}..origin/${new_ver} stroom-proxy/stroom-proxy-app/src/test/resources/stroom/dist/proxy-expected.yaml
-->

### Stroom's `config.yml`

#### Data Feed Identities

The data feed key settings under `receive` have been renamed, and the directory default has changed:

| Was | Now |
|---|---|
| `dataFeedKeysDir: "data_feed_keys"` | `dataFeedIdentitiesDir: "data_feed_identities"` |
| `dataFeedKeyOwnerMetaKey: "AccountId"` | `dataFeedOwnerMetaKey: "AccountId"` |

```yaml
appConfig:
  receive:
    dataFeedIdentitiesDir: "data_feed_identities"
    dataFeedOwnerMetaKey: "AccountId"
    enabledAuthenticationTypes:
    - "TOKEN"
    - "CERTIFICATE"
```

If you set either of the old properties, rename it.
`enabledAuthenticationTypes` accepts a new value, `CERTIFICATE_IDENTITY`, alongside the existing `DATA_FEED_KEY`, `TOKEN` and `CERTIFICATE`.

**The files in the directory have to be replaced**, because their structure has changed.
A file used to hold a `dataFeedKeys` list.
It now holds a `dataFeedIdentity` list, in which each entry has a `type` saying what kind of identity it is, and the hash algorithm field is now `hashAlgorithm` rather than `hashAlgorithmId`:

```json
{
  "dataFeedIdentity": [
    {
      "type": "DATA_FEED_KEY",
      "hash": "...",
      "salt": "...",
      "hashAlgorithm": "ARGON2",
      "streamMetaData": {
        "AccountId": "1234"
      },
      "expiryDateEpochMs": 1798761600000
    },
    {
      "type": "CERTIFICATE_DN",
      "certificateDn": "CN=sender.example.com,OU=Example,O=Example Ltd,C=GB",
      "streamMetaData": {
        "AccountId": "5678"
      },
      "expiryDateEpochMs": 1798761600000
    }
  ]
}
```

Only files ending in `.json` are read.
Regenerate the files with whatever tooling issues your keys, and place them in the new directory before starting v7.12.


#### Auto Content Creation

Three properties have been added and one default has changed.
See [New Features]({{< relref "new-features#auto-content-creation" >}}).

```yaml
appConfig:
  autoContentCreation:
    additionalGroupParentGroupName: "Data Feed Developer"
    additionalGroupTemplate: "grp-${accountid}-dev"
    destinationExplorerSubPathTemplate: "dev"
    groupParentGroupName: "Data Feed Reader"
```


#### Data Formats

`JSON_LINES` has been added to the default list in `data.meta.dataFormats`.
If you have set this list yourself, add `JSON_LINES` to it if you want to use it.


### Stroom-Proxy's `config.yml`

#### Data Feed Identities

The changes described above in [Stroom - Data Feed Identities]({{< relref "#data-feed-identities" >}}) also apply to Stroom-Proxy, under `proxyConfig.receive`.


## Database Migrations

When Stroom boots for the first time with a new version it will run any required database migrations to bring the database schema up to the correct version.

{{% warning %}}
It is highly recommended to ensure you have a database backup in place before booting stroom with a new version.
This is to mitigate against any problems with the migration.
It is also recommended to test the migration against a copy of your database to ensure that there are no problems when you do it for real.
{{% /warning %}}

On boot, Stroom will ensure that the migrations are only run by a single node in the cluster.
This will be the node that reaches that point in the boot process first.
All other nodes will wait until that is complete before proceeding with the boot process.

It is recommended however to use a single node to execute the migration.
To avoid Stroom starting up and beginning processing you can use the `migrate` command to just migrate the database and not fully boot Stroom.
See [`migrate` command]({{< relref "/docs/guides/automation/command-line.md" >}}) for more details.

The migration log, `logs/migration/migration.log`, shows each migration as it runs.



### Migration Scripts

<!--
#############################################################################################
#                                                                                           #
#  This section is auto-generated by TestListDbMigrations.listDbMigrationsForLatestVersion  #
#                                                                                           #
#############################################################################################
-->

There are no database migrations for v7.12.


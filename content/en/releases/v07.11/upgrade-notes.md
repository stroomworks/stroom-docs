---
title: "Upgrade Notes"
linkTitle: "Upgrade Notes"
weight: 40
date: 2026-03-04
tags: 
description: >
  Required actions and information relating to upgrading to Stroom version 7.11.
---

{{% warning %}}
Please read this section carefully in case any of it is relevant to your Stroom/Stroom-Proxy instance.
{{% /warning %}}


## Upgrade Path

You can upgrade to v7.11.x from any v7.x release that is older than the version being upgraded to.

If you want to upgrade to v7.11.x from v5.x or v6.x we recommend you do the following:

1. Upgrade v5.x to the latest patch release of v6.0.
1. Upgrade v6.x to the latest patch release of v7.0.
1. Upgrade v7.x to the latest patch release of v7.11.

{{% warning %}}
v7.11 **cannot** migrate content in legacy formats, i.e. content created in v5/v6.
You must therefore upgrade to v7.0.x first to migrate this content, before upgrading to v7.11.x.
{{% /warning %}}


## Java Version

Stroom v7.11 requires Java 25.

{{% warning %}}
This is different to the java version required for Stroom v7.10 (Java 21).
{{% /warning %}}

Ensure the Stroom and Stroom-Proxy hosts are running the latest patch release of Java v25.


## Configuration File Changes

<!--
Check changes using something like this (run from an up-to-date stroom repo):
old_ver=7.10
new_ver=7.11
git diff origin/${old_ver}..origin/${new_ver} stroom-config/stroom-config-app/src/test/resources/stroom/config/app/expected.yaml
git diff origin/${old_ver}..origin/${new_ver} stroom-proxy/stroom-proxy-app/src/test/resources/stroom/dist/proxy-expected.yaml
-->

These notes cover changes since the last v7.10 patch release, v7.10.20.
Several changes were released in v7.10 patch releases and so are not repeated here: the OpenID `allowedAudiences` and `fullNameClaimTemplate` properties, `x509CertificateDnFormat`, Stroom-Proxy's zip file directory ingest (`dirScanner`), `autoCreateAdminAccountOnBoot`, `TOKEN` in the default `enabledAuthenticationTypes`, and the longer HTTP client timeouts for forward destinations.
See the [v7.10 release notes]({{< relref "../v07.10/_index.md" >}}).


### Removed Properties

Stroom and Stroom-Proxy fail to start if the configuration file sets a property that does not exist.
**Remove any of these from your configuration before upgrading:**

| Property | Notes |
|---|---|
| `appConfig.elastic.retention.scrollSize` | |
| `appConfig.receive.receiptPolicyUuid` | Replaced by `receiptCheckMode` and data receipt rules |
| `proxyConfig.contentSync` | Replaced by `downstreamHost` and `receiptPolicy` |
| `proxyConfig.feedStatus.apiKey` | Use `downstreamHost.apiKey` |
| `proxyConfig.feedStatus.defaultStatus` | |
| `proxyConfig.feedStatus.enabled` | Replaced by `receive.receiptCheckMode` |
| `proxyConfig.receive.receiptPolicyUuid` | Replaced by `receiptCheckMode` and data receipt rules |


### Stroom's `config.yml`

#### Data Receipt

Data receipt rules let Stroom decide whether to receive, reject or drop data from its attributes, managed on the new **Data Receipt Rules** screen under **Administration**, which needs the **Manage Data Receipt Rules** permission.

```yaml
appConfig:
  receive:
    fallbackReceiveAction: "RECEIVE"
    maxRequestSize: null
    receiptCheckMode: "FEED_STATUS"
  receiptPolicy:
    obfuscatedFields:
    - "AccountId"
    - "AccountName"
    - "Component"
    - "Feed"
    - "ReceivedPath"
    - "RemoteDN"
    - "RemoteHost"
    - "System"
    - "UploadUserId"
    - "UploadUsername"
    - "X-Forwarded-For"
    obfuscationHashAlgorithm: "SHA2_512"
```

* `receiptCheckMode` decides how incoming data is checked.
  `FEED_STATUS`, the default, checks the feed's status as before.
  `RECEIPT_POLICY` applies the data receipt rules.
  `FEED_EXISTENCE` only checks that the feed exists, and `RECEIVE_ALL`, `DROP_ALL` and `REJECT_ALL` do what they say.
* `fallbackReceiveAction` is the action taken when the receipt check cannot be performed, for example because a Stroom-Proxy cannot reach its downstream, until the check succeeds again.
* `receiptPolicy.obfuscatedFields` lists the attributes whose values are hashed, with `obfuscationHashAlgorithm`, when the rules are sent to a Stroom-Proxy, so that the rules do not reveal them.
  `receiptPolicy.receiptRulesInitialFields` lists the fields offered when writing rules.
* `maxRequestSize` optionally limits the size of a single data post, uncompressed; larger posts get a `413` response.


#### Content Store

```yaml
appConfig:
  contentStore:
    urls:
    - "https://raw.githubusercontent.com/gchq/stroom-content/refs/heads/master/source/content-store.yml"
```

The content store lists the content packs that can be installed from **Tools** → **Content Store**.
On an isolated network, replace this URL with your own; see [Hosting your own content store]({{< relref "/docs/operate/install/local-content-store.md" >}}).


#### Credentials and Git Repositories

New `credentials` and `gitRepo.db` branches hold the database settings for the Credentials Manager and Git Repo documents, defaulting to the common database settings.
`credentials.keyStoreCachePath`, default `${stroom.home}/keystores`, is where key stores held as credentials are cached on disk.


#### Ask Stroom AI

```yaml
appConfig:
  askStroomAi:
    chatMemory:
      timeToLive:
        time: 1
        timeUnit: "HOURS"
      tokenLimit: 30000
    tableSummary:
      maximumBatchSize: 16384
      maximumTableInputRows: 100
```


### Stroom-Proxy's `config.yml`

#### Downstream Host

```yaml
proxyConfig:
  downstreamHost:
    apiKey: null
    apiKeyVerificationUrl: null
    enabled: true
    hostname: null
    maxCachedKeyAge: "PT10M"
    maxPersistedKeyAge: "P30D"
    noFetchIntervalAfterFailure: "PT30S"
    pathPrefix: null
    persistedKeysHashAlgorithm: "SHA2_512"
    port: null
    scheme: "https"
  receiptPolicy:
    receiveDataRulesUrl: null
    syncFrequency: "PT1M"
  receive:
    receiptCheckMode: "FEED_STATUS"
```

`downstreamHost` describes the Stroom or Stroom-Proxy this proxy talks to.
It is used for forwarding, feed status checks, fetching data receipt rules and verifying API keys.
Set `enabled: false` for a proxy that only forwards to files.

`forwardHttpDestinations[*].forwardUrl`, `livenessCheckUrl`, `feedStatus.url`, `downstreamHost.apiKeyVerificationUrl` and `receiptPolicy.receiveDataRulesUrl` can each be left empty, to use the default path on `downstreamHost`, set to just a path, or set to a full URL.

A minimal configuration for a proxy forwarding to Stroom is therefore:

```yaml
proxyConfig:
  downstreamHost:
    hostname: "stroom.example.com"
    apiKey: "<API key>"
  forwardHttpDestinations:
  - name: "stroom"
    enabled: true
```

The `jerseyClients` named `CONTENT_SYNC` and `FEED_STATUS` have been replaced by one named `DOWNSTREAM`.

`receive.receiptCheckMode`, `fallbackReceiveAction` and `maxRequestSize` apply to Stroom-Proxy as described above for Stroom.
With `RECEIPT_POLICY`, the proxy fetches the rules from downstream every `receiptPolicy.syncFrequency`, and every proxy in the chain must use the same mode.


#### HTTP Forward Destinations

`livenessCheckEnabled`, default `true`, has been added to each HTTP forward destination.


#### Logging

`DataReceiptRule` has been added to the default `logStream.metaKeys`, so the receipt log records which rule decided the fate of each post.


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

For information purposes only, the following are the database migrations that will be run when upgrading to 7.11.0 from the previous minor version.

Note, the `legacy` module will run first (if present) then the other module will run in no particular order.

#### Module `stroom-annotation`

##### Script `V07_11_00_001__annotation3.sql`

**Path**: `stroom-annotation/stroom-annotation-impl-db/src/main/resources/stroom/annotation/impl/db/migration/V07_11_00_001__annotation3.sql`

```sql
-- ------------------------------------------------------------------------
-- Copyright 2023 Crown Copyright
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
-- ------------------------------------------------------------------------

-- Stop NOTE level warnings about objects (not)? existing
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

DROP PROCEDURE IF EXISTS V07_11_00_001_annotation;

DELIMITER $$

CREATE PROCEDURE V07_11_00_001_annotation ()
BEGIN
    DECLARE object_count integer;

    --
    -- Add entry parent id
    --
    SELECT COUNT(1)
    INTO object_count
    FROM information_schema.columns
    WHERE table_schema = database()
    AND table_name = 'annotation_entry'
    AND column_name = 'parent_id';

    IF object_count = 0 THEN
        ALTER TABLE `annotation_entry` ADD COLUMN `parent_id` bigint DEFAULT NULL;
    END IF;

    --
    -- Add entry update time
    --
    SELECT COUNT(1)
    INTO object_count
    FROM information_schema.columns
    WHERE table_schema = database()
    AND table_name = 'annotation_entry'
    AND column_name = 'update_time_ms';

    IF object_count = 0 THEN
        ALTER TABLE `annotation_entry` ADD COLUMN `update_time_ms` bigint(20) NOT NULL;

        -- Copy all entry times to update times.
        SET @sql_str = CONCAT(
            'UPDATE annotation_entry a ',
            'SET a.update_time_ms = a.entry_time_ms');
        PREPARE stmt FROM @sql_str;
        EXECUTE stmt;

    END IF;

    --
    -- Add entry update user
    --
    SELECT COUNT(1)
    INTO object_count
    FROM information_schema.columns
    WHERE table_schema = database()
    AND table_name = 'annotation_entry'
    AND column_name = 'update_user_uuid';

    IF object_count = 0 THEN
        ALTER TABLE `annotation_entry` ADD COLUMN `update_user_uuid` varchar(255) NOT NULL;

        -- Copy all entry users to update users.
        SET @sql_str = CONCAT(
            'UPDATE annotation_entry a ',
            'SET a.update_user_uuid = a.entry_user_uuid');
        PREPARE stmt FROM @sql_str;
        EXECUTE stmt;

    END IF;

END $$

DELIMITER ;

CALL V07_11_00_001_annotation;

DROP PROCEDURE IF EXISTS V07_11_00_001_annotation;

SET SQL_NOTES=@OLD_SQL_NOTES;

-- vim: set shiftwidth=4 tabstop=4 expandtab:
```

#### Module `stroom-credentials`

##### Script `V07_11_00_001__credential.sql`

**Path**: `stroom-credentials/stroom-credentials-impl-db/src/main/resources/stroom/credentials/impl/db/migration/V07_11_00_001__credential.sql`

```sql
-- ------------------------------------------------------------------------
-- Copyright 2025 Crown Copyright
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
-- ------------------------------------------------------------------------

-- Stop NOTE level warnings about objects (not)? existing
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

--
-- Create the credential tables
--
CREATE TABLE IF NOT EXISTS credential (
    uuid                  varchar(255) NOT NULL,
    create_time_ms        bigint(20) NOT NULL,
    create_user           varchar(255) NOT NULL,
    update_time_ms        bigint(20) NOT NULL,
    update_user           varchar(255) NOT NULL,
    name                  varchar(255) NOT NULL,
    crendential_type      varchar(255) NOT NULL,
    key_store_type        varchar(255) DEFAULT NULL,
    expiry_time_ms        bigint DEFAULT NULL,
    secret_json           json NOT NULL,
    key_store             longblob DEFAULT NULL,
    PRIMARY KEY  (uuid),
    UNIQUE KEY name (name)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

SET SQL_NOTES=@OLD_SQL_NOTES;

-- vim: set shiftwidth=4 tabstop=4 expandtab:
```

#### Module `stroom-index`

##### Script `V07_11_00_001__index_field.sql`

**Path**: `stroom-index/stroom-index-impl-db/src/main/resources/stroom/index/impl/db/migration/V07_11_00_001__index_field.sql`

```sql
-- Stop NOTE level warnings about objects (not)? existing
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

ALTER TABLE index_field ADD COLUMN `dense_vector` json DEFAULT NULL;

SET SQL_NOTES=@OLD_SQL_NOTES;
```

#### Module `stroom-processor`

##### Script `V07_11_00_001__processor_filter.sql`

**Path**: `stroom-processor/stroom-processor-impl-db/src/main/resources/stroom/processor/impl/db/migration/V07_11_00_001__processor_filter.sql`

```sql
-- ------------------------------------------------------------------------
-- Copyright 2020 Crown Copyright
--
-- Licensed under the Apache License, Version 2.0 (the "License");
-- you may not use this file except in compliance with the License.
-- You may obtain a copy of the License at
--
--     http://www.apache.org/licenses/LICENSE-2.0
--
-- Unless required by applicable law or agreed to in writing, software
-- distributed under the License is distributed on an "AS IS" BASIS,
-- WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
-- See the License for the specific language governing permissions and
-- limitations under the License.
-- ------------------------------------------------------------------------

-- Stop NOTE level warnings about objects (not)? existing
SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0;

-- --------------------------------------------------

DELIMITER $$

-- --------------------------------------------------

DROP PROCEDURE IF EXISTS processor_run_sql_v1 $$

-- DO NOT change this without reading the header!
CREATE PROCEDURE processor_run_sql_v1 (
    p_sql_stmt varchar(1000)
)
BEGIN

    SET @sqlstmt = p_sql_stmt;

    SELECT CONCAT('Running sql: ', @sqlstmt);

    PREPARE stmt FROM @sqlstmt;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END $$

-- --------------------------------------------------

DROP PROCEDURE IF EXISTS processor_add_column_v1$$

-- DO NOT change this without reading the header!
CREATE PROCEDURE processor_add_column_v1 (
    p_table_name varchar(64),
    p_column_name varchar(64),
    p_column_type_info varchar(64) -- e.g. 'varchar(255) default NULL'
)
BEGIN
    DECLARE object_count integer;

    SELECT COUNT(1)
    INTO object_count
    FROM information_schema.columns
    WHERE table_schema = database()
    AND table_name = p_table_name
    AND column_name = p_column_name;

    IF object_count = 0 THEN
        CALL processor_run_sql_v1(CONCAT(
            'alter table ', database(), '.', p_table_name,
            ' add column ', p_column_name, ' ', p_column_type_info));
    ELSE
        SELECT CONCAT(
            'Column ',
            p_column_name,
            ' already exists on table ',
            database(),
            '.',
            p_table_name);
    END IF;
END $$

-- idempotent
CALL processor_add_column_v1(
        'processor_filter',
        'export',
        'TINYINT(1) NOT NULL DEFAULT 0')$$

-- vim: set shiftwidth=4 tabstop=4 expandtab:
```


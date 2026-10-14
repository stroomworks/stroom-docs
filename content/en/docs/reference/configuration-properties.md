---
title: "Configuration Properties"
linkTitle: "Configuration Properties"
weight: 140
date: 2026-10-14
tags:
description: >
  Every setting in the configuration file, what it defaults to, and how to decide where to set it.
pageKind: reference
---

Stroom reads its settings from a YAML file on each node.
Most of them you will never touch; the ones you do are easier to get right knowing what the defaults already are.

There are **1122** settings in total.
589 of those are the database and cache blocks that repeat for every module, so they are explained once below rather than 589 times, leaving **533** distinct settings.


## Two names for the same setting

A setting has one name in the file and a different one on the **Properties** screen, and it catches everybody once.

In the file, everything here sits under the `appConfig` key:

```yaml
appConfig:
  data:
    store:
      deletePurgeAge: "P7D"
```

On the Properties screen the same setting is called `stroom.data.store.deletePurgeAge`.
Same setting, two spellings: **`appConfig` in the file, `stroom` in the user interface.**
The paths in the tables below are written the way the file nests them.


## Deciding where to set it

A value in the file beats a value set in the user interface, which beats the default.
That order has consequences worth understanding before you edit anything: see [Configuration]({{< relref "../operate/configuration.md" >}}).

The short version:

* **Put it in the file** when it genuinely differs per node, such as paths and ports, or when it must be right before the database can be reached.
* **Set it in the user interface** for everything else.
  It applies to the whole cluster and can be changed later without a deployment.

Putting a value in the file because it is the same everywhere is the common mistake: it works, and it puts that setting permanently out of reach of the user interface.


## Reading the tables

* **Default** is what Stroom uses when you say nothing.
  *unset* means no value at all, which for most settings turns the feature off.
* Settings marked **Needs a restart** are read once while a node starts.
  Changing one stores the new value without changing how the running node behaves.
  83 of the settings below are marked this way.
* Where the description says the source does not describe it, that is a gap upstream rather than something we have left out.
  343 of 533 carry one.


## Value formats

| Kind | Written as | Example |
|---|---|---|
| Duration | ISO-8601 | `PT30S` is thirty seconds, `PT10M` ten minutes, `P7D` seven days |
| Size | A number with a unit | `32KiB`, `1GiB` |
| Boolean | `true` or `false` | `true` |
| List | A YAML list | one `- value` per line |
| Unset | Omit it, or `null` | |

A duration written without the `P` is the most common mistake, and it stops the node starting rather than being quietly ignored, which is the better of the two outcomes.


## Settings every module's database block has

Each module keeps its own database settings under its own `db` key, so these 13 names repeat for every one of them.
They mean the same thing each time.

Setting them per module is only worth doing when a module genuinely needs its own connection behaviour.
Otherwise set `commonDbDetails` once and leave these alone.

| Setting | Default | What it does |
|---|---|---|
| `db.connection.jdbcDriverClassName` | *unset* | The class name for the JDBC database connection, e.g. com.mysql.cj.jdbc.Driver. |
| `db.connection.jdbcDriverPassword` | *unset* | The password to connect to the database with. |
| `db.connection.jdbcDriverUrl` | *unset* | The URL for the JDBC database connection, e.g. jdbc:mysql://some-host:3306/db-name?useUnicode=yes&characterEncoding=UTF-8. |
| `db.connection.jdbcDriverUsername` | *unset* | The username to connect to the database with. |
| `db.connectionPool.cachePrepStmts` | `false` | Sets the cachePrepStmts property on the at the JDBC driver level. Set to true to enable caching of prepared statements at the JDBC driver level. |
| `db.connectionPool.connectionTimeout` | `PT30S` | The maximum amount of time that a client will wait for a connection from the pool. |
| `db.connectionPool.idleTimeout` | `PT10M` | The maximum amount of time that a connection can sit idle in the pool. Only applies when minimumIdle is defined to be less than maximumPoolSize. |
| `db.connectionPool.leakDetectionThreshold` | `PT0S` | The amount of time that a connection can be out of the pool before a message is logged indicating a possible connection leak. A value of 0 means leak detection is disabled. Lowest acceptable value for enabling leak detection is 2 seconds. |
| `db.connectionPool.maxLifetime` | `PT30M` | The maximum lifetime of a connection in the pool. |
| `db.connectionPool.maxPoolSize` | `30` | The maximum size that the pool is allowed to reach, including both idle and in-use connections. |
| `db.connectionPool.minimumIdle` | `10` | The minimum number of idle connections that Hikari tries to maintain in the pool. |
| `db.connectionPool.prepStmtCacheSize` | `25` | Sets the prepStmtCacheSize property on the at the JDBC driver level. The number of prepared statements that the driver will cache per connection. |
| `db.connectionPool.prepStmtCacheSqlLimit` | `256` | Sets the prepStmtCacheSqlLimit property on the at the JDBC driver level. The maximum length for a prepared SQL statement that can be cached. |


## Settings every cache has

There are 58 caches in the tree and they all take the same 5 settings.
A cache entry is evicted when any limit it has is reached.

| Setting | What it does |
|---|---|
| `expireAfterAccess` | Specifies that each entry should be automatically removed from the cache once this duration has elapsed after the entry's creation, the most recent replacement of its value, or its last read. In ISO-8601 duration format, e.g. 'PT10M'. If no value is set then  entries will not be aged out based these criteria. |
| `expireAfterWrite` | Specifies that each entry should be automatically removed from the cache once a fixed duration has elapsed after the entry's creation, or the most recent replacement of its value. In ISO-8601 duration format, e.g. 'PT5M'. If no value is set then entries will not be aged out based on  these criteria. |
| `maximumSize` | Specifies the maximum number of entries the cache may contain. Note that the cache may evict an entry before this limit is exceeded or temporarily exceed the threshold while evicting. As the cache size grows close to the maximum, the cache evicts entries that are less likely to be used again. For example, the cache may evict an entry because it hasn't been used recently or very often. When size is zero, elements will be evicted immediately after being loaded into the cache. This can be useful in testing, or to disable caching temporarily without a code change. If no value is set then no size limit will be applied. |
| `refreshAfterWrite` | Specifies that each entry should be automatically refreshed in the cache after a fixed duration has elapsed after the entry's creation, or the most recent replacement of its value. In ISO-8601 duration format, e.g. 'PT5M'. Refreshing is performed asynchronously and the current value provided until the refresh has occurred. This mechanism allows the cache to update values without any impact on performance. |
| `statisticsMode` | Determines whether/how statistics are captured on cache usage (e.g. hits, misses, entries, etc.). Values are (NONE, INTERNAL, DROPWIZARD_METRICS). NONE means capture no stats, offering a very slight performance gain, but the Caches screen in Stroom won't be able to show any stats for this cache. INTERNAL means the stats are captured but are only accessible via the Stroom Caches screen, thus not suitable for Stroom-Proxy. DROPWIZARD_METRICS means the stats are captured and are accessible via the Stroom Caches screen AND via the metrics servlet on the admin port for integration with tools like Graphite/Collectd. |

The caches themselves are listed below.
Each takes the settings above, under its own key, so `ai.chatResponseCache.maximumSize` is how the first one's size is set.

* `ai.chatResponseCache`
* `analytics.streamingAnalyticCache`
* `annotation.annotationFeedCache`
* `annotation.annotationTagCache`
* `annotation.annotationValCache`
* `annotation.annotationValStringCache`
* `dashboard.visualisationDocCache`
* `data.filesystemVolume.feedPathCache`
* `data.filesystemVolume.s3VolumeCache`
* `data.filesystemVolume.typePathCache`
* `data.filesystemVolume.volumeCache`
* `data.meta.metaFeedCache`
* `data.meta.metaProcessorCache`
* `data.meta.metaTypeCache`
* `docstore.docRefInfoCache`
* `docstore.docRefNameCache`
* `elastic.indexCache`
* `elastic.indexClientCache`
* `feed.feedDocCache`
* `index.indexCache`
* `index.indexFieldCache`
* `index.writer.activeShardCache`
* `index.writer.indexShardWriterCache`
* `kafka.kafkaConfigDocCache`
* `logging.deviceCache`
* `node.nodeGroupCache`
* `pipeline.documentPermissionCache`
* `pipeline.httpClientCache`
* `pipeline.parser.cache`
* `pipeline.pipelineDataCache`
* `pipeline.referenceData.effectiveStreamCache`
* `pipeline.referenceData.metaIdToRefStoreCache`
* `pipeline.xmlSchema.cache`
* `pipeline.xslt.cache`
* `planb.stateDocCache`
* `processor.processorCache`
* `processor.processorFeedCache`
* `processor.processorFilterCache`
* `processor.processorNodeCache`
* `processor.processorProfileCache`
* `receive.authenticatedDataFeedKeyCache`
* `s3.s3ConfigDocCache`
* `search.shard.remoteSearchResultCache`
* `security.authentication.apiKeyCache`
* `security.authentication.authenticationStateCache`
* `security.authorisation.appPermissionIdCache`
* `security.authorisation.docTypeIdCache`
* `security.authorisation.userAppPermissionsCache`
* `security.authorisation.userByUuidCache`
* `security.authorisation.userCache`
* `security.authorisation.userDocumentPermissionsCache`
* `security.authorisation.userGroupsCache`
* `security.authorisation.userInfoByUuidCache`
* `security.identity.openid.accessCodeCache`
* `solr.indexCache`
* `solr.indexClientCache`
* `statistics.sql.dataSourceCache`
* `volumes.volumeSelectorCache`


## Every other property

By section, as the file nests them.


### analytics

| Property | Default | What it does |
|---|---|---|
| `duplicateCheckStore.lmdb.localDir` | `lmdb/duplicate_check` | The path relative to the home directory to use for storing the data stores. It MUST be on local disk, NOT network storage, due to use of memory mapped files. The directory will be created if it doesn't exist.If the value is a relative path then it will be treated as being relative to stroom.path.home. **Needs a restart.** |
| `duplicateCheckStore.lmdb.maxReaders` | `10` | The maximum number of concurrent readers/threads that can use the off-heap store. **Needs a restart.** |
| `duplicateCheckStore.lmdb.maxStoreSize` | `10G` | The maximum size for the off heap store. There must be available space on the disk to accommodate this size. It can be larger than the amount of available RAM and will only be allocated as it is needed. Can be expressed in IEC units (multiples of 1024), e.g. 1024, 1024B, 1024bytes, 1KiB, 1KB, 1K, etc. **Needs a restart.** |
| `duplicateCheckStore.lmdb.readAheadEnabled` | `true` | Read ahead means the OS will pre-fetch additional data from the disk in the expectation that it will be used at some point. This generally improves performance as more data is available in the page cache. Read ahead is enabled by default. It may be worth disabling it if the actively used data is larger than the available RAM, as this will stop it evicting hot entries to make space for pre-fetched data. **Needs a restart.** |
| `emailConfig.fromAddress` | `noreply@stroom` | *Not described in the source.* |
| `emailConfig.fromName` | `Stroom Analytics` | *Not described in the source.* |
| `emailConfig.smtp.host` | `localhost` | *Not described in the source.* |
| `emailConfig.smtp.password` | *unset* | *Not described in the source.* |
| `emailConfig.smtp.port` | `2525` | *Not described in the source.* |
| `emailConfig.smtp.transport` | `plain` | *Not described in the source.* |
| `emailConfig.smtp.username` | *unset* | *Not described in the source.* |
| `executionHistoryRetention` | `P10D` | *Not described in the source.* |
| `resultStore.lmdb.localDir` | `lmdb/analytic_store` | The path relative to the home directory to use for storing the data stores. It MUST be on local disk, NOT network storage, due to use of memory mapped files. The directory will be created if it doesn't exist.If the value is a relative path then it will be treated as being relative to stroom.path.home. **Needs a restart.** |
| `resultStore.lmdb.maxReaders` | `10` | The maximum number of concurrent readers/threads that can use the off-heap store. **Needs a restart.** |
| `resultStore.lmdb.maxStoreSize` | `10G` | The maximum size for the off heap store. There must be available space on the disk to accommodate this size. It can be larger than the amount of available RAM and will only be allocated as it is needed. Can be expressed in IEC units (multiples of 1024), e.g. 1024, 1024B, 1024bytes, 1KiB, 1KB, 1K, etc. **Needs a restart.** |
| `resultStore.lmdb.readAheadEnabled` | `true` | Read ahead means the OS will pre-fetch additional data from the disk in the expectation that it will be used at some point. This generally improves performance as more data is available in the page cache. Read ahead is enabled by default. It may be worth disabling it if the actively used data is larger than the available RAM, as this will stop it evicting hot entries to make space for pre-fetched data. **Needs a restart.** |
| `resultStore.maxPayloadSize` | `1G` | The maximum byte size of a payload buffer. |
| `resultStore.maxPutsBeforeCommit` | `10000` | The maximum number of puts into the store (in a single load) before the transaction is committed. There is only one write transaction available at a time so reducing this value allows multiple loads to potentially each load a chunk at a time. However, load times increase rapidly with values below around 2,000. For maximum performance of a single load set this value to 0 to only commit at the very end of the load. |
| `resultStore.maxSortedItems` | `500000` | Maximum number of results that can be returned in a single page if the results are sorted. This will affect downloading all search results if results are sorted. |
| `resultStore.maxStringFieldLength` | `1000` | The maximum length of a string field value. Longer strings will be truncated. |
| `resultStore.minPayloadSize` | `1M` | The minimum byte size of a payload buffer. |
| `resultStore.offHeapResults` | `true` | Should search results be stored off heap (experimental feature). |
| `resultStore.valueQueueSize` | `10000` | The size of the value queue. |
| `timezone` | `UTC` | *Not described in the source.* |


### annotation

| Property | Default | What it does |
|---|---|---|
| `createText` | `Create Annotation` | The text to display to create an annotation |
| `defaultRetentionPeriod` | `5y` | How long should we retain annotations by default, e.g. 5y |
| `eventLinkCacheSizeLimit` | `1000000` | The maximum number of annotation to event links that can be cached. If this number is breached, it will result in an error. |
| `physicalDeleteAge` | `P7D` | How long to keep logically deleted annotations before deleting them. In ISO-8601 duration format, e.g. 'P1DT12H' |


### askStroomAi

| Property | Default | What it does |
|---|---|---|
| `attachmentDownloadTimeoutMs` | `60000` | Timeout in milliseconds when waiting for attachment downloads to complete. |
| `chatSystemPrompt` | *A long value; see the file.* | System prompt used for the AI chat assistant. |
| `dockLocation` | `RIGHT` | AI panel dock location. |
| `dockSize` | `300` | AI panel dock size in pixels. |
| `dockType` | `DOCK` | AI panel dock type. |
| `enableDebugDetail` | `true` | When enabled, the full LLM exchange (prompts sent and responses received) is stored and displayed as an expandable detail section beneath each AI response. |
| `historySummaryPrompt` | *A long value; see the file.* | System prompt used to summarise older conversation history when progressive trimming is needed to fit the model's context window. |
| `maxHistorySafetyCapMessages` | `200` | Safety cap on the maximum number of history messages loaded from the database. The actual context boundary is determined by the model's context window via progressive trimming. |
| `tableAnalysis.maxParallelBatches` | `4` | Maximum number of concurrent LLM calls when processing batches in parallel |
| `tableAnalysis.maxRowsPerBatch` | `1000` | Maximum number of data rows to include in a single AI prompt batch when using batch processing for large tables |
| `tableAnalysis.maxTotalRows` | `10000` | Maximum total number of rows to download from the table for AI analysis. |
| `tableAnalysis.multiSummaryMergePrompt` | *A long value; see the file.* | Prompt template for merging multiple summaries at once. Use {{summaries}} for the numbered list of summaries to merge |
| `tableAnalysis.tableQuerySystemPrompt` | *A long value; see the file.* | System prompt used when querying the AI about table data |
| `tableAnalysis.tableQueryUserPrompt` | *A long value; see the file.* | User prompt template for table queries. Use {{query}} for the user's question, {{table}} for the markdown table data, and {{context}} for prior conversation history |


### autoContentCreation

| Property | Default | What it does |
|---|---|---|
| `additionalGroupParentGroupName` | `Data Feed Developer` | An optional group to add the group defined by groupTemplate to.The value of this property is the name of a group. It can be the same as groupParentGroupName if required. It allows all the templated groups to belong to a common group for easier permission management. |
| `additionalGroupTemplate` | `grp-${accountid}-dev` | If set, when Stroom auto-creates a feed, it will create an additional user group with a name derived from this template. This is in addition to the user group defined by 'groupTemplate'.If not set, only the latter user group will be created. Default value is 'grp-${accountid}-dev'. If this property is set in the YAML file, use single quotes to prevent the variables being expanded when the config file is loaded. |
| `createAsSubjectId` | `Administrators` | The subjectId of the user/group who the auto-created content will be created by, typically a group with administrator privileges. This user/group must have the permission to create all content required. It will also be the 'run as' user for created pipeline processor filters. |
| `createAsType` | `GROUP` | The type of the entity represented by createAsSubjectId, i.g. 'USER' or 'GROUP'. It is possible for content to be owned by a group rather than individual users. |
| `destinationExplorerPathTemplate` | `/Feeds/${accountid}` | The templated path to a folder in the Stroom explorer tree where Stroom will auto-create content. If it doesn't exist it will be created. Content will be created in a sub-folder of this folder with a name derived from the system name of the received data. By default this is 'Feeds/${accountid}'.If this property is set in the YAML file, use single quotes to prevent the variables being expanded when the config file is loaded. |
| `destinationExplorerSubPathTemplate` | `dev` | An optional templated sub-path of 'destinationExplorerPathTemplate'. If set, copied dependencies (e.g.XSLT filters, Test Converters, etc.) will be created in the sub-directory defined by this template. If not set, that content will be created in the directory |
| `enabled` | `false` | Whether the auto-creation of content on data receipt is enabled or not. If enabled, Stroom will automatically create content such as Feeds/XSLTs/Pipelines on receipt of a data stream. The property 'templatesPath' will contain content to be used as templates for auto-creation. Content will only be created if a Content Template rule matches the attributes on the incoming data. |
| `groupParentGroupName` | `Data Feed Reader` | An optional group to add the group defined by groupTemplate to.The value of this property is the name of a group. It allows all the templated groups to belong to a common group for easier permission management. |
| `groupTemplate` | `grp-${accountid}` | When Stroom auto-creates a feed, it will create a user group with a name derived from this template. Default value is 'grp-${accountid}'. If this property is set in the YAML file, use single quotes to prevent the variables being expanded when the config file is loaded. |
| `templateMatchFields` | `accountid, accountname, component, feed, format, schema, schemaversion` | The header keys available for use when matching a request to a content template. Must be in lower case. |


### byteBufferPool

| Property | Default | What it does |
|---|---|---|
| `blockOnExhaustedPool` | `false` | Whether the thread should be blocked when requesting a buffer from the pool and the limit for that buffer size has been reached. If false new buffers will be created and excess buffers will have to be destroyed when no longer needed which may have a performance/memory penalty. |
| `pooledByteBufferCounts.1` | `50` | *Not described in the source.* |
| `pooledByteBufferCounts.10` | `50` | *Not described in the source.* |
| `pooledByteBufferCounts.100` | `50` | *Not described in the source.* |
| `pooledByteBufferCounts.1000` | `50` | *Not described in the source.* |
| `pooledByteBufferCounts.10000` | `50` | *Not described in the source.* |
| `pooledByteBufferCounts.100000` | `10` | *Not described in the source.* |
| `pooledByteBufferCounts.1000000` | `3` | *Not described in the source.* |
| `warningThresholdPercentage` | `90` | When the number of created buffers for any size reaches this threshold a warning will be logged. **Needs a restart.** |


### cluster

| Property | Default | What it does |
|---|---|---|
| `clusterCallIgnoreSSLHostnameVerifier` | `true` | If cluster calls are using SSL then choose if we want to ignore host name verification **Needs a restart.** |
| `clusterCallReadTimeout` | `PT30S` | Time before throwing read timeout **Needs a restart.** |
| `clusterCallUseLocal` | `true` | Do local calls when calling our own local services (true is an optimisation) **Needs a restart.** |
| `clusterResponseTimeout` | `PT30S` | Time before giving up on cluster results |


### clusterLock

| Property | Default | What it does |
|---|---|---|
| `lockTimeout` | `PT10M` | The minimum period of time to keep trying to obtain a cluster lock for. This allows a timeout to be set that is greater than that configured on the database, but not less. |


### commonDbDetails

| Property | Default | What it does |
|---|---|---|
| `connection.jdbcDriverClassName` | `com.mysql.cj.jdbc.Driver` | The class name for the JDBC database connection, e.g. com.mysql.cj.jdbc.Driver. **Needs a restart.** |
| `connection.jdbcDriverPassword` | `stroompassword1` | The password to connect to the database with. **Needs a restart.** |
| `connection.jdbcDriverUrl` | `jdbc:mysql://localhost:3307/stroom?useUnicode=yes&characterEncoding=UTF-8` | The URL for the JDBC database connection, e.g. jdbc:mysql://some-host:3306/db-name?useUnicode=yes&characterEncoding=UTF-8. **Needs a restart.** |
| `connection.jdbcDriverUsername` | `stroomuser` | The username to connect to the database with. **Needs a restart.** |
| `connectionPool.cachePrepStmts` | `false` | Sets the cachePrepStmts property on the at the JDBC driver level. Set to true to enable caching of prepared statements at the JDBC driver level. **Needs a restart.** |
| `connectionPool.connectionTimeout` | `PT30S` | The maximum amount of time that a client will wait for a connection from the pool. **Needs a restart.** |
| `connectionPool.idleTimeout` | `PT10M` | The maximum amount of time that a connection can sit idle in the pool. Only applies when minimumIdle is defined to be less than maximumPoolSize. **Needs a restart.** |
| `connectionPool.leakDetectionThreshold` | `PT0S` | The amount of time that a connection can be out of the pool before a message is logged indicating a possible connection leak. A value of 0 means leak detection is disabled. Lowest acceptable value for enabling leak detection is 2 seconds. **Needs a restart.** |
| `connectionPool.maxLifetime` | `PT30M` | The maximum lifetime of a connection in the pool. **Needs a restart.** |
| `connectionPool.maxPoolSize` | `30` | The maximum size that the pool is allowed to reach, including both idle and in-use connections. **Needs a restart.** |
| `connectionPool.minimumIdle` | `10` | The minimum number of idle connections that Hikari tries to maintain in the pool. **Needs a restart.** |
| `connectionPool.prepStmtCacheSize` | `25` | Sets the prepStmtCacheSize property on the at the JDBC driver level. The number of prepared statements that the driver will cache per connection. **Needs a restart.** |
| `connectionPool.prepStmtCacheSqlLimit` | `256` | Sets the prepStmtCacheSqlLimit property on the at the JDBC driver level. The maximum length for a prepared SQL statement that can be cached. **Needs a restart.** |


### contentIndex

| Property | Default | What it does |
|---|---|---|
| `contentIndexDir` | `content_index` | The directory where the index of Stroom content will be stored. If relative, the path be relative to stroom.home (or stroom.temp if storageType is TEMP). If null 'content_index' will be used. **Needs a restart.** |
| `minRebuildAge` | `PT1M` | The minimum age of the content index for a rebuild to happen. |
| `storageType` | `LOCAL` | The type of storage that contentIndexDir sits on. 'SHARED' - Storage that is shared between all nodes. 'LOCAL' - Storage that is local to the node and only access by that node. 'TEMP' - Ephemeral storage that is local to the node and may be lost on host reboot. If null a default of 'TEMP' is used. TEMP will be more performant, but will require an index re-build on host reboot. **Needs a restart.** |


### contentPackImport

| Property | Default | What it does |
|---|---|---|
| `enabled` | `false` | If true any content packs found in 'importDirectory' will be imported into Stroom. Only intended for use on new Stroom instances to reduce the risk of overwriting existing entities. **Needs a restart.** |
| `importAsSubjectId` | `Administrators` | The unique identifier for the user/group that the content import will run as. In the case of an Open ID Connect userthis would be the claim value that uniquely identifies the user on the IDP (often 'sub' or 'oid'). These values are often UUIDs and thus not pretty to look at for an admin. For the internal IDP this would likely be a more human friendly username. Currently import can only imported as a user and not a group. **Needs a restart.** |
| `importAsType` | `GROUP` | The type of the entity represented by importAsSubjectId, i.g. 'USER' or 'GROUP' **Needs a restart.** |
| `importDirectory` | `content_pack_import` | When stroom starts, if 'enabled' is set to true, it will attempt to import content packs from this directory. If the value is null or the directory does not exist it will be ignored.If the value is a relative path then it will be treated as being relative to stroom.path.home. **Needs a restart.** |


### contentStore

| Property | Default | What it does |
|---|---|---|
| `urls` | `https://raw.githubusercontent.com/gchq/stroom-content/refs/heads/master/source/content-store.yml` | The URLs of the Content Stores for Stroom Content **Needs a restart.** |


### credentials

| Property | Default | What it does |
|---|---|---|
| `keyStoreCachePath` | `${stroom.home}/keystores` | The path to stored cached key stores. |


### data

| Property | Default | What it does |
|---|---|---|
| `filesystemVolume.createDefaultStreamVolumesOnStart` | `true` | If no existing stream volumes are present default volumes will be created on application start.  Use property defaultStreamVolumePaths to define the volumes created. **Needs a restart.** |
| `filesystemVolume.defaultStreamVolumeFilesystemUtilisation` | `0.9` | Fraction of the filesystem beyond which the system will stop writing to the default stream volumes that may be created on application start. |
| `filesystemVolume.defaultStreamVolumeGroupName` | `Default Volume Group` | The name of the default stream volume group that is created if none exist on application start. |
| `filesystemVolume.defaultStreamVolumePaths` | `volumes/default_stream_volume` | The paths used if the default stream volumes are created on application start.If a path is a relative path then it will be treated as being relative to stroom.path.home. |
| `filesystemVolume.findOrphanedMetaBatchSize` | `7000` | Number of meta records to check in each batch. |
| `filesystemVolume.maxVolumeStateAge` | `PT30S` | When refreshing the local cache of volumes, the state will only be updated in the database if it is older then this threshold age. Value must be less than the period of the job 'File System Volume Status'. |
| `filesystemVolume.metaTypeExtensions.Detections` | `dtxn` | *Not described in the source.* |
| `filesystemVolume.metaTypeExtensions.Error` | `err` | *Not described in the source.* |
| `filesystemVolume.metaTypeExtensions.Events` | `evt` | *Not described in the source.* |
| `filesystemVolume.metaTypeExtensions.Records` | `rec` | *Not described in the source.* |
| `filesystemVolume.metaTypeExtensions.Reference` | `ref` | *Not described in the source.* |
| `filesystemVolume.volumeSelector` | `RoundRobin` | How should volumes be selected for use? Possible volume selectors include ('MostFreePercent', 'MostFree', 'Random', 'RoundRobinIgnoreLeastFreePercent', 'RoundRobinIgnoreLeastFree', 'RoundRobin', 'WeightedFreePercentRandom', 'WeightedFreeRandom') default is 'RoundRobin' |
| `meta.dataFormats` | `CSV, CSV_NO_HEADER, FIXED_WIDTH, FIXED_WIDTH_NO_HEADER, INI, JSON, JSON_LINES, PSV, PSV_NO_HEADER, SYSLOG, TEXT, TOML, TSV, TSV_NO_HEADER, XML, XML_FRAGMENT, YAML` | Set of data format names. This set must contain all of the names in the default value for this property but can contain additional names. |
| `meta.metaStatusUpdateBatchSize` | `0` | The number of streams to delete/restore using a filter in a single batch. Each batch will run in a separate transaction. A value of zero means a single batch will be used. |
| `meta.metaTypes` | `Context, Detections, Error, Events, Meta Data, Raw Events, Raw Reference, Records, Reference, Test Events, Test Reference` | Set of supported meta type names. This set must contain all of the names in the default value for this property but can contain additional names. Any custom types added here that are used for raw data must also be added to the property 'rawMetaTypes'. **Needs a restart.** |
| `meta.metaValue.addAsync` | `true` | *Not described in the source.* |
| `meta.metaValue.deleteAge` | `P30D` | *Not described in the source.* |
| `meta.metaValue.deleteBatchSize` | `500` | *Not described in the source.* |
| `meta.metaValue.flushBatchSize` | `500` | *Not described in the source.* |
| `meta.rawMetaTypes` | `Raw Events, Raw Reference` | Set of meta type names that are used for received raw data. Types defined here will be read using the Data Encoding set on the Feed's settings.Any custom types added to the 'metaTypes' property that are used for raw data must also be added here.This set must contain all of the names in the default value for this property but can contain additional names. |
| `retention.deleteBatchSize` | `1000` | *Not described in the source.* |
| `retention.useQueryOptimisation` | `true` | *Not described in the source.* |
| `store.deleteBatchSize` | `1000` | How many logically deleted data records we want to try and physically delete in a single batch |
| `store.deleteFailureThreshold` | `100` | The number of streams to accept file delete failures for before aborting the '' job. This job deletes a stream's files before removing its records from the database. Deletion of files may fail due to network connectivity. A value of zero means it will abort on the first stream with errors. A value of 100 means it will abort on the 101st stream that errors. Due to concurrent processing, the number of streams processed may go some way beyond this value. |
| `store.deletePurgeAge` | `P7D` | How long data records are left logically deleted before they are deleted from the database |
| `store.fileSystemCleanBatchSize` | `20` | Set child jobs to be created by the file system clean sub task |
| `store.fileSystemCleanDeleteOut` | `false` | Write a delete out in the root of the volume rather than physically deleting the files |
| `store.fileSystemCleanOldAge` | `P1D` | Duration until a file is deemed old |
| `store.fsyncMode` | `ENABLED` | Controls whether a stream's files, directories, or both are forced to durable storage before its metadata is marked as unlocked. Note that this covers the file system only. Whether the matching database commit itself survives a power failure is governed by the database, for MySQL by 'innodb_flush_log_at_trx_commit', which Stroom does not set. |


### docstore

| Property | Default | What it does |
|---|---|---|
| `physicalDeleteAge` | `P30D` | How long to keep logically deleted documents before physically deleting them and all associated data, audit, and snapshot rows. In ISO-8601 duration format, e.g. 'P30D' for 30 days. |


### documentAsset

| Property | Default | What it does |
|---|---|---|
| `aceEditorModes.css` | `CSS` | *Not described in the source.* |
| `aceEditorModes.htm` | `HTML` | *Not described in the source.* |
| `aceEditorModes.html` | `HTML` | *Not described in the source.* |
| `aceEditorModes.js` | `JAVASCRIPT` | *Not described in the source.* |
| `aceEditorModes.svg` | `XML` | *Not described in the source.* |
| `aceEditorModes.txt` | `TEXT` | *Not described in the source.* |
| `aceEditorModes.xml` | `XML` | *Not described in the source.* |
| `assetCacheDir` | `asset_cache` | The path relative to the home directory to use for storing cached assets. **Needs a restart.** |
| `clearAssetCacheOnStartup` | `false` | Whether to clear the asset cache on startup **Needs a restart.** |
| `default` | `application/octet-stream` | Mimetype to use if nothing else matches **Needs a restart.** |
| `defaultAceEditorMode` | `TEXT` | The default editor mode if nothing else matches **Needs a restart.** |
| `maxUploadSize` | `50M` | The largest asset upload accepted, e.g. "50MiB". Enforced before the data is streamed into the database. Note this is separate from the 512KiB limit on editing an asset's content in the UI. **Needs a restart.** |
| `mimetypes.apng` | `image/apng` | *Not described in the source.* |
| `mimetypes.avif` | `image/avif` | *Not described in the source.* |
| `mimetypes.bmp` | `image/bmp` | *Not described in the source.* |
| `mimetypes.css` | `text/css` | *Not described in the source.* |
| `mimetypes.gif` | `image/gif` | *Not described in the source.* |
| `mimetypes.htm` | `text/html` | *Not described in the source.* |
| `mimetypes.html` | `text/html` | *Not described in the source.* |
| `mimetypes.ico` | `image/vnd.microsoft.icon` | *Not described in the source.* |
| `mimetypes.jpeg` | `image/jpeg` | *Not described in the source.* |
| `mimetypes.jpg` | `image/jpeg` | *Not described in the source.* |
| `mimetypes.js` | `text/javascript` | *Not described in the source.* |
| `mimetypes.png` | `image/png` | *Not described in the source.* |
| `mimetypes.svg` | `image/svg+xml` | *Not described in the source.* |
| `mimetypes.tif` | `image/tiff` | *Not described in the source.* |
| `mimetypes.tiff` | `image/tiff` | *Not described in the source.* |
| `mimetypes.txt` | `text/plain` | *Not described in the source.* |
| `mimetypes.webp` | `image/webp` | *Not described in the source.* |
| `mimetypes.xml` | `application/xml` | *Not described in the source.* |


### documentAssetDb

| Property | Default | What it does |
|---|---|---|
| `connection.jdbcDriverClassName` | *unset* | The class name for the JDBC database connection, e.g. com.mysql.cj.jdbc.Driver. **Needs a restart.** |
| `connection.jdbcDriverPassword` | *unset* | The password to connect to the database with. **Needs a restart.** |
| `connection.jdbcDriverUrl` | *unset* | The URL for the JDBC database connection, e.g. jdbc:mysql://some-host:3306/db-name?useUnicode=yes&characterEncoding=UTF-8. **Needs a restart.** |
| `connection.jdbcDriverUsername` | *unset* | The username to connect to the database with. **Needs a restart.** |
| `connectionPool.cachePrepStmts` | `false` | Sets the cachePrepStmts property on the at the JDBC driver level. Set to true to enable caching of prepared statements at the JDBC driver level. **Needs a restart.** |
| `connectionPool.connectionTimeout` | `PT30S` | The maximum amount of time that a client will wait for a connection from the pool. **Needs a restart.** |
| `connectionPool.idleTimeout` | `PT10M` | The maximum amount of time that a connection can sit idle in the pool. Only applies when minimumIdle is defined to be less than maximumPoolSize. **Needs a restart.** |
| `connectionPool.leakDetectionThreshold` | `PT0S` | The amount of time that a connection can be out of the pool before a message is logged indicating a possible connection leak. A value of 0 means leak detection is disabled. Lowest acceptable value for enabling leak detection is 2 seconds. **Needs a restart.** |
| `connectionPool.maxLifetime` | `PT30M` | The maximum lifetime of a connection in the pool. **Needs a restart.** |
| `connectionPool.maxPoolSize` | `30` | The maximum size that the pool is allowed to reach, including both idle and in-use connections. **Needs a restart.** |
| `connectionPool.minimumIdle` | `10` | The minimum number of idle connections that Hikari tries to maintain in the pool. **Needs a restart.** |
| `connectionPool.prepStmtCacheSize` | `25` | Sets the prepStmtCacheSize property on the at the JDBC driver level. The number of prepared statements that the driver will cache per connection. **Needs a restart.** |
| `connectionPool.prepStmtCacheSqlLimit` | `256` | Sets the prepStmtCacheSqlLimit property on the at the JDBC driver level. The maximum length for a prepared SQL statement that can be cached. **Needs a restart.** |


### elastic

| Property | Default | What it does |
|---|---|---|
| `client.maxConnections` | `30` | Total number of connections maintained by the Elastic Java client pool. |
| `client.maxConnectionsPerRoute` | `10` | Maximum number of connections maintained by the Elastic Java client pool on a per-route basis. This should be set to at least the number of concurrent indexing tasks you expect each node to be performing against a given index. |
| `indexing.initialRetryBackoffPeriodMs` | `1000` | Delay in milliseconds, before the indexing request is initially retried. Subsequent retries occur after a multiple of this initial delay. |
| `indexing.maxNestedElementDepth` | `10` | Maximum allowed depth of JSON XML `array`/`map` elements, that a JSON document may have when being sent to Elasticsearch for indexing. |
| `indexing.retryCount` | `5` | Number of times to retry the indexing request, before failing and generating an Error |
| `search.highlight` | `true` | Highlight matched terms in the source document. |
| `search.scrollDuration` | `PT1M` | Amount of time to allow an Elasticsearch scroll request to continue before aborting. |
| `search.storeSize` | `1000000,100,10,1` | The maximum number of search results to keep in memory at each level. |
| `search.suggestions.enabled` | `true` | Suggest terms in query expressions when using an Elasticsearch index as the data source. |


### explorer

| Property | Default | What it does |
|---|---|---|
| `dependencyWarningsEnabled` | `false` | Enables warning indicators in the explorer tree for documents with broken dependencies |
| `suggestedTags` | `reference-loader, dynamic, extraction` | A set of explorer node tags that will be provided to the user to pick from along with any custom tags added to nodes by the user. |


### export

| Property | Default | What it does |
|---|---|---|
| `enabled` | `false` | Determines if the system will allow configuration to be exported via the export servlet |


### feed

| Property | Default | What it does |
|---|---|---|
| `feedNamePattern` | `^[A-Z0-9_-]{3,}$` | The regex pattern for feed names |
| `unknownClassification` | `UNKNOWN CLASSIFICATION` | The classification banner to display for data if one is not defined |


### gitRepo

| Property | Default | What it does |
|---|---|---|
| `localDir` | `git_repo` | The path relative to the home directory to use for storing local Git Repositories.The directory will be created if it doesn't exist.If the value is a relative path then it will be treated as being relative to stroom.path.home. **Needs a restart.** |


### haltBootOnConfigValidationFailure

| Property | Default | What it does |
|---|---|---|
| `haltBootOnConfigValidationFailure` | `true` | If true, Stroom will halt on start up if any errors are found in the YAML configuration file. If false, the errors will simply be logged.Setting this to false is not advised. |


### index

| Property | Default | What it does |
|---|---|---|
| `ramBufferSizeMB` | `1024` | The amount of RAM Lucene can use to buffer when indexing in Mb |
| `writer.cache.coreItems` | `50` | The number of items that we hope to keep in the cache if items aren't removed due to TTL or TTI constraints |
| `writer.cache.maxItems` | `100` | The maximum number of items that can be kept in the cache. LRU items are removed to ensure we do not exceed this amount |
| `writer.cache.minItems` | `0` | The minimum number of items that will be left in the cache after a sweep |
| `writer.cache.timeToIdle` | `PT0S` | How long a cache item can idle before it is removed from the cache during a sweep. A duration of zero means items will not be aged out of the cache. |
| `writer.cache.timeToLive` | `PT0S` | How long a cache item can live before it is removed from the cache during a sweep. A duration of zero means items will not be aged out of the cache. |
| `writer.slowIndexWriteWarningThreshold` | `PT1S` | A warning will be logged for any index shard writes that take longer than this threshold to complete. A value of '0' or 'PT0' means no warnings will be logged at all. |


### job

| Property | Default | What it does |
|---|---|---|
| `enabled` | `true` | Enables/disables the job system that manages the execution of Stroom's enabled scheduled jobs. Set this to false for development and testing purposes otherwise the Stroom will try and process files automatically outside of test cases. **Needs a restart.** |
| `enableJobsOnBootstrap` | `false` | On boot Stroom will ensure all jobs are created. If this property is set to true the jobs will also be set to enabled upon creation, else they will be disabled. This should only be set to true in a demo environment and never in production therefore default is false. |
| `executionInterval` | `10s` | How frequently should the lifecycle service attempt to execute any jobs that are ready (by their frequency or schedule) to be executed. **Needs a restart.** |


### kafka

| Property | Default | What it does |
|---|---|---|
| `skeletonConfigContent` | *A long value; see the file.* | The value of this property will be used to pre-populate a new Kafka Configuration. It must be in Java Properties File format. Its purpose is to provide a skeleton for creating a working Kafka Configuration. |


### lifecycle

| Property | Default | What it does |
|---|---|---|
| `enabled` | `true` | Set this to false for development and testing purposes otherwise the Stroom will try and process files automatically outside of test cases. **Needs a restart.** |


### lmdbLibrary

| Property | Default | What it does |
|---|---|---|
| `providedJffiLibraryPath` | *unset* | The path to a provided JFFI native library file, which is used by LMDBJava. If unset the JFFI binary bundled with Stroom will be extracted to 'systemLibraryExtractDir'. This property can be used if you provide your own version of JFFI. If you set this property care needs to be taken over version compatibility between the version of JFFI and the version of the JFFI binary. By default this is unset. **Needs a restart.** |
| `providedSystemLibraryPath` | *unset* | The path to a provided LMDB native library file. If unset the LMDB binary bundled with Stroom will be extracted to 'systemLibraryExtractDir'. This property can be used if you already have LMDB installed or want to make use of a package manager provided instance. If you set this property care needs to be taken over version compatibility between the version of LMDBJava (that Stroom uses to interact with LMDB) and the version of the LMDB binary. By default this is unset. **Needs a restart.** |
| `systemLibraryExtractDir` | `lmdb_library` | The directory to extract the bundled LMDB and JFFI native libraries to. Only used if property providedSystemLibraryPath or property providedJffiLibraryPath are not set. On boot Stroom will clear this directory and then extract the native libraries into it. IMPORTANT: This directory must not have the 'noexec' mount option, or all LMDB use will error. Also, the contents are ephemeral, so should ideally be mounted using tmpfs or similar. **Needs a restart.** |


### logging

| Property | Default | What it does |
|---|---|---|
| `logEveryRestCallEnabled` | `false` | Ensure that every RESTful service calls is logged, not only user initiated ones. |
| `maxDataElementStringLength` | `500` | Maximum number of characters for values of Data items. |
| `maxListElements` | `5` | Maximum number of elements in event log before truncation. |
| `omitRecordDetailsLoggingEnabled` | `true` | Suppress standard database record fields 'createUser', 'updateUser', 'createTime', 'updateTime' and 'version' being reported within event log. |


### node

| Property | Default | What it does |
|---|---|---|
| `name` | `tba` | The name of the node to identify it in the cluster. Should only be set per node in the application YAML config file. The node name should not be changed once set. This node name will be used in the 'receiptId' meta attribute so if a stroom cluster is forwarding to another stroom cluster, then the node name should be unique across all clusters involved. |
| `status.heapHistogram.classNameMatchRegex` | `^stroom\\..*$` | A single regex that will be used to filter classes from the heap histogram internal statistic based on their name. e.g '^(stroom\..*)$'. If no value is supplied all classes will be included. If a value is supplied only those class names matching the regex will be included. |
| `status.heapHistogram.classNameReplacementRegex` | *A long value; see the file.* | A single regex that will be used to replace all matches in the class name with '--REPLACED--'. This is to prevent ids for anonymous inner classes and lambdas from being included in the class name. E.g '....DocRefResourceHttpClient$$Lambda$46/1402766141' becomes '....DocRefResourceHttpClient$$Lambda$--REPLACED--'. |


### nodeUri

| Property | Default | What it does |
|---|---|---|
| `hostname` | *unset* | The hostname, FQDN or IP address of the node. The value must be resolvable by all other nodes in the cluster. This is used for inter-node communications. If not set, Stroom will attempt to determine this. |
| `pathPrefix` | *unset* | An optional prefix to the base path. This may be needed when the inter-node communication goes via some form of gateway where the paths are mapped to something else. |
| `port` | *unset* | This is the port to use for inter-node communications. This is typically the Drop Wizard application port and would typically only be open within the Stroom cluster. If not set, Stroom will attempt to determine this. |
| `scheme` | *unset* | The scheme, i.e. http or https. If not set, Stroom will attempt to determine this. |


### path

| Property | Default | What it does |
|---|---|---|
| `home` | *unset* | By default, unless configured otherwise, all other configured paths (except stroom.path.temp) will be relative to this directory. If this value is null thenStroom will use either of the following to derive stroom.path.home: the directory of the Stroom application JAR file or ~/.stroom. Should only be set per node in application YAML configuration file. It must be an absolute path and it does not support '~' or variable substitution like other paths. **Needs a restart.** |
| `temp` | *unset* | This directory is used by stroom to write any temporary file to. Should only be set per node in application YAML configuration file. If not set then Stroom will use <SYSTEM TEMP>/stroom.It must be an absolute path and it does not support '~' or variable substitution like other paths. **Needs a restart.** |


### pipeline

| Property | Default | What it does |
|---|---|---|
| `appender.maxActiveDestinations` | `100` | The maximum number active destinations that Stroom will allow rolling appenders to be writing to at any one time. |
| `parser.disableExternalEntities` | `true` | When true (the default), XML parsing disallows DOCTYPE declarations and the resolution of external general/parameter entities and external DTDs, to prevent XML External Entity (XXE) attacks (server-side file disclosure, SSRF and entity-expansion denial of service). Set this to false only if a data feed or pipeline legitimately requires DOCTYPE or external entities; note that doing so re-exposes the XXE risk. Stroom's internal XML fragment parser is unaffected either way. **Needs a restart.** |
| `parser.secureProcessing` | `true` | Instructs the implementation to process XML securely. This may set limits on XML constructs to avoid conditions such as denial of service attacks. **Needs a restart.** |
| `referenceData.lmdb.localDir` | `reference_data` | The path relative to the home directory to use for storing the reference data store. It MUST be on local disk, NOT network storage, due to use of memory mapped files. The directory will be created if it doesn't exist.If the value is a relative path then it will be treated as being relative to stroom.path.home. **Needs a restart.** |
| `referenceData.lmdb.maxReaders` | `150` | The maximum number of concurrent readers/threads that can use the off-heap store. **Needs a restart.** |
| `referenceData.lmdb.maxStoreSize` | `50G` | The maximum size for the off heap store. There must be available space on the disk to accommodate this size. It can be larger than the amount of available RAM and will only be allocated as it is needed. Can be expressed in IEC units (multiples of 1024), e.g. 1024, 1024B, 1024bytes, 1KiB, 1KB, 1K, etc. **Needs a restart.** |
| `referenceData.lmdb.readAheadEnabled` | `true` | Read ahead means the OS will pre-fetch additional data from the disk in the expectation that it will be used at some point. This generally improves performance as more data is available in the page cache. Read ahead is enabled by default. It may be worth disabling it if the actively used data is larger than the available RAM, as this will stop it evicting hot entries to make space for pre-fetched data. **Needs a restart.** |
| `referenceData.lmdb.readerBlockedByWriter` | `true` | If true, then a process writing to the data store will block all other processes from reading from the store. As only one writer is allowed the active writer will also block all other writers. If false, then multiple processes can read from the store regardless of whether a process is writing to it. Also when false, if there are active readers during a write then empty space in the store cannot be reclaimed, instead the store will grow. This setting is a trade off between performance and store size. **Needs a restart.** |
| `referenceData.loadingLockStripes` | `2048` | The number of lock stripes used for preventing multiple pipeline processes from loading the same reference stream at the same time. Values should be a power of 2. Lower values will mean it is more likely for two different streams from blocking one another. **Needs a restart.** |
| `referenceData.maxPurgeDeletesBeforeCommit` | `200000` | The maximum number of entries in one reference stream to purge before the transaction is committed. A value high enough to purge all entries in one transaction is preferable but for large reference streams this may result in errors due to the transaction being too large. |
| `referenceData.maxPutsBeforeCommit` | `200000` | The maximum number of puts into the store (in a single load) before the transaction is committed. There is only one write transaction available at a time so reducing this value allows multiple loads to potentially each load a chunk at a time. However, load times increase rapidly with values below around 2,000. For maximum performance of a single load set this value to 0 to only commit at the very end of the load. |
| `referenceData.purgeAge` | `P30D` | The time to retain reference data for in the off heap store. The time is taken from the time that the reference stream was last accessed, e.g. a lookup was made against it. In ISO-8601 duration format, e.g. 'P1DT12H'. Used by job ''. |
| `referenceData.stagingLmdb.localDir` | `reference_staging_data` | The path to store temporary reference staging data stores in. It will contain one sub directory per staging store. It MUST be on local disk, NOT network storage, due to use of memory mapped files. Use the fastest disk you can, but using a tmpfs file system is not advised. A staging store only exists for the life of a reference stream load. The directory will be created if it doesn't exist.If the value is a relative path then it will be treated as being relative to stroom.path.home. **Needs a restart.** |
| `referenceData.stagingLmdb.maxReaders` | `5` | The maximum number of concurrent readers/threads that can use the off-heap store. **Needs a restart.** |
| `referenceData.stagingLmdb.maxStoreSize` | `10G` | The maximum size for the off heap store. There must be available space on the disk to accommodate this size. It can be larger than the amount of available RAM and will only be allocated as it is needed. Can be expressed in IEC units (multiples of 1024), e.g. 1024, 1024B, 1024bytes, 1KiB, 1KB, 1K, etc. **Needs a restart.** |
| `referenceData.stagingLmdb.readAheadEnabled` | `true` | Read ahead means the OS will pre-fetch additional data from the disk in the expectation that it will be used at some point. This generally improves performance as more data is available in the page cache. Read ahead is enabled by default. It may be worth disabling it if the actively used data is larger than the available RAM, as this will stop it evicting hot entries to make space for pre-fetched data. **Needs a restart.** |
| `referenceData.stagingLmdb.readerBlockedByWriter` | `false` | If true, then a process writing to the data store will block all other processes from reading from the store. As only one writer is allowed the active writer will also block all other writers. If false, then multiple processes can read from the store regardless of whether a process is writing to it. Also when false, if there are active readers during a write then empty space in the store cannot be reclaimed, instead the store will grow. This setting is a trade off between performance and store size. **Needs a restart.** |
| `stepping.eagerMaterialisationRecords` | `5000` | Under the skeleton sweep, a stream whose record count is at or below this is materialised in full the first time a step needs anything below the record boundary - paying roughly what a whole-pipeline sweep would have cost, once, so that every later step is a store read. Streams above it are materialised on demand, a record or window at a time, so the cost follows what the user looks at. The default is set where the eager pass costs a few seconds (measured ~1ms per record of below-boundary work on the sample event pipeline). Edits are never materialised eagerly, whatever the stream size - a post-edit refresh stays per-record, which is what keeps it interactive. |
| `stepping.filteredScanWindow` | `50` | How many records a filtered stepping scan materialises per poll. When a filter is applied at or below an edited element, whether a record matches is not known until that record has been produced, so navigation materialises a window of records at a time and scans it, resuming from where it left off on the next poll. Larger values find a distant match in fewer polls; smaller values do less work when a filter matches nothing. |
| `stepping.maxBytesPerStream` | `2147483648` | The maximum number of bytes of persisted IO per stream before stepping stops with an error. |
| `stepping.maxRecordSizeBytes` | `104857600` | The maximum size in bytes of a single element's IO for a single record. |
| `stepping.maxRecordsPerStream` | `1000000` | The maximum number of records to capture and persist per stream before stepping stops with an error. |
| `stepping.maxRetainedFingerprintsPerElement` | `3` | How many config-fingerprint versions of an element's IO to retain on disk before evicting the least-recently-used version. Higher values make reverting pipeline edits cheaper at the cost of more disk. |
| `stepping.maxSessionIdleTime` | `PT10M` | How long a stepping session may be idle before it is torn down and its persisted IO deleted. |
| `stepping.maxSweptStreamsPerSession` | `10` | The maximum number of streams that may be lazily swept within a single stepping session. |
| `stepping.orphanMaxAge` | `PT1H` | Orphaned stepping session directories older than this are deleted by the scheduled cleanup job. |
| `stepping.prefetchWindow` | `10` | How many records an unfiltered navigation step materialises in its direction of travel on a skeleton-swept stream, so that stepping onward hits records the previous step already produced (a store read, no pipeline launch) rather than launching per record. The demanded record is produced first, so a larger window does not delay the step being served; it trades below-boundary work (~1ms per record on the sample pipeline) for fewer launches. Refreshes are never widened - a post-edit refresh materialises exactly the record it names. |
| `stepping.skeletonSweep` | `true` | Whether the first capture of a stream is a skeleton (backbone) sweep that captures IO only for the parser - the record boundary - leaving everything below it to be materialised on demand for the records the user actually visits. Roughly ten times cheaper as a first pass over a stream, at the cost of below-boundary panes being produced lazily. When off, the first capture runs the whole pipeline for every record, as before. |
| `stepping.storeSubDir` | `stepping` | The sub-directory of the Stroom temp directory under which stepping session IO is persisted. |
| `xslt.maxElements` | `1000000` | The maximum number of elements that the XSLT filter will expect to receive before it errors. This protects Stroom from running out of memory in cases where an appropriate XML splitter has not been used in a pipeline. |


### planb

| Property | Default | What it does |
|---|---|---|
| `defaultShardCounts.HISTOGRAM` | `16` | *Not described in the source.* |
| `defaultShardCounts.METRIC` | `16` | *Not described in the source.* |
| `defaultShardCounts.RANGED_STATE` | `16` | *Not described in the source.* |
| `defaultShardCounts.SESSION` | `32` | *Not described in the source.* |
| `defaultShardCounts.STATE` | `16` | *Not described in the source.* |
| `defaultShardCounts.TEMPORAL_RANGED_STATE` | `32` | *Not described in the source.* |
| `defaultShardCounts.TEMPORAL_STATE` | `32` | *Not described in the source.* |
| `defaultShardCounts.TRACE` | `64` | *Not described in the source.* |
| `mergedCheckpointCacheTtl` | `PT10M` | How long to keep a large split-trace's in-memory merged DFS checkpoint index (used for random-access/last-page paging across the live shard and archive buckets) after last use before evicting it. Defaults to 10 minutes. |
| `mergeStatusRetention` | `P30D` | How long to keep the per source merge status records that stop additive stores (histogram and metric) double counting when a merge is rerun after interruption. Records are only pruned once no replayable copy of the source data remains, so this only needs to exceed any realistic replay delay. |
| `minTimeToKeepSnapshotEnv` | `PT20M` | How long snapshot data remains useful. This bounds both how stale a snapshot may be and still be served, measured from when the store node last confirmed it was current, and how long an inactive snapshot shard is kept before being cleaned up. Should be at least twice minTimeToKeepSnapshots. |
| `minTimeToKeepSnapshots` | `PT10M` | How long should we keep snapshots before we fetch new ones. |
| `minTimeToKeepStoreShardEnv` | `PT1H` | How long to keep a shared-file-store shard's local copy after last use before evicting it due to inactivity. The copy is re-synced from the shared store on next access, so this trades local disk usage against re-sync cost. Defaults to 1 hour. |
| `nodeList` | *empty* | Nodes to use to store Plan B shards. If none are specified only the local node is used. This is only appropriate in a single node setup. |
| `path` | `planb` | The root path to store shards and snapshots. |
| `sendPartAttempts` | `3` | How many times to attempt sending a part of Plan B data to a node, including the first attempt. Only transport level failures, e.g. a DNS lookup failure during a network blip, are retried. A node that answers, even with an error, is not asked again. Set to 1 for no retries. |
| `sendPartRetryDelay` | `PT10S` | How long to wait between attempts to send a part of Plan B data to a node. Note that the sending processing task is held for the duration of any retries. |
| `shardMergeThreadCount` | `4` | Maximum number of shard merges to run concurrently per merge cycle. Defaults to 4. |
| `snapshotRetryFetchInterval` | `PT1M` | How often should we retry to fetch snapshots when we fail to get a snapshot. |


### processor

| Property | Default | What it does |
|---|---|---|
| `assignTasks` | `true` | Should the master node assign tasks to workers when tasks are requested? Only used when claimTasksOnWorker is false. |
| `claimTasksOnWorker` | `false` | EXPERIMENTAL (gh-5699), off by default and not yet proven in production - leave this false unless you have been asked to trial it. Should each worker node find and claim its own processor tasks directly from the database (true), or be fed by the task queue held in memory on the master node (false, the default and the long-standing behaviour)? A worker knows which filters its own processing profiles allow it to run, which the master has to guess at on its behalf, so claiming both removes the master from the processing path and lets a node ask only about work it can actually do. THIS MUST BE THE SAME ON EVERY NODE. The two modes use different task states and neither can see the other's in flight work, so changing it means a hard cutover: stop the whole cluster, change the value everywhere, start it again. Running a mixed cluster is not supported and will leave tasks unprocessed. Turning it back off is the supported way to recover if worker claiming does not keep the cluster fed; tasks left behind by either mode are returned to the created state, so nothing is lost, though tasks in flight when the cluster stopped wait for stroom.processor.taskLeaseTimeout before being picked up again. |
| `createTasksBeyondProcessLimit` | `true` | Do we want to eagerly create tasks beyond the concurrent processing limit specified by filters? If we don't then those filters will likely run out of queued tasks to process before new tasks are created. |
| `databaseMultiInsertMaxBatchSize` | `500` | The maximum number of rows to insert in a single multi insert statement, e.g. INSERT INTO X VALUES (...), (...), (...) |
| `deleteAge` | `P1D` | How long to keep tasks and filters on the database for before deleting them (if they are complete). After a duration of 'deleteAge', they will be logically deleted and unavailable in the user interface. After a subsequent duration of 'deleteAge' they will be physically deleted. In ISO-8601 duration format, e.g. 'P1DT12H' |
| `fillTaskQueue` | `true` | Should the master node fill the task queue ready for workers to fetch tasks? Only used when claimTasksOnWorker is false. |
| `queueSize` | `1000` | The number of tasks to attempt to queue from filters considered in priority order. Note that this number will be exceeded if we have currently queued tasks from lower priority filters. This is a cluster wide total shared by all nodes, so it should comfortably exceed the number of tasks all nodes will ask for at once, i.e. the number of nodes multiplied by their Data Processing job task limit. Note also that no further filters of a processing profile are considered once half this number is already queued for that profile. It is applied separately to each processing profile, and to the filters that have no profile, so that a busy profile can't fill the queue and leave the nodes of another profile asking for work that is never queued. The total number of queued tasks therefore grows with the number of profiles in use. Only used when claimTasksOnWorker is false. |
| `skipEmptyFilterFetchDuration` | `PT10S` | How long to leave a filter alone after looking for created tasks to queue for it and finding none. The queue is filled after every task assignment, and a fill only stops early once every processing profile has enough tasks queued, which a profile with nothing to do never does, so without this every fill would query for every filter that has no work. This bounds how long tasks created for an idle filter wait before being queued. Set to zero to look for tasks for every filter on every fill. |
| `skipNonProducingFiltersDuration` | `PT10S` | How long should we wait before retrying task creation for previously non producing filters. This is also the amount by which the wait increases after each successive poll that creates no tasks, up to skipNonProducingFiltersMaxDuration. |
| `skipNonProducingFiltersMaxDuration` | `PT1M` | The longest we will wait before retrying task creation for a filter that keeps creating no tasks. The wait starts at skipNonProducingFiltersDuration and grows by that amount after each successive non producing poll until it reaches this value. This bounds how long a filter that suddenly receives data will wait for its first task, so raising it reduces the cost of polling idle filters at the expense of latency. Individual filters can override this with their own maximum task creation delay. Set to zero to poll non producing filters on every run. |
| `taskAvailabilityInterval` | `PT5S` | gh-5699. How long a node may reuse its summary of which of the processor filters it is allowed to process have tasks waiting, before taking a fresh one. Each node takes this summary for itself in one query, instead of asking about each filter in turn, so this is the main cost of looking for work on an idle cluster. Raising it lowers that cost but delays a node noticing that an idle filter has gained work by up to this long. Set to zero to take a fresh summary every time work is looked for. |
| `taskCreationThreadCount` | `5` | The number of concurrent threads to use for task creation. |
| `taskLeaseTimeout` | `PT10M` | gh-5699. How long a processing task's heartbeat (its status time) may go un-renewed before the task is considered dead: the reaper returns such tasks to CREATED for another node to pick up, and a node that cannot renew for this long terminates its own in-flight tasks to prevent duplicate output. Must be comfortably longer than the 'Processor Task Heartbeat' job frequency; a 10:1 ratio gives ample slack for a GC pause or database blip. |
| `tasksToCreate` | `1000` | How many tasks should we try to create in the DB ready to be queued. This is applied separately to each processing profile, and to the filters that have no profile, so that a busy profile can't use up a whole task creation run and leave the nodes of another profile with nothing they are allowed to process. The total number of tasks created in a run therefore grows with the number of profiles in use. Note that the number of tasks created may be greater than this number as each task creation thread will try and create the same number of tasks. |
| `useMaxMetaIdFromPreviousPoll` | `true` | Should task creation be bounded by the max meta id seen on the previous poll rather than the current max meta id? The database allocates meta ids at insert time but only makes the rows visible at commit time, so a max id read now may sit above a meta that is still in flight. Using the previous poll's value gives such a meta a full poll interval to become visible before task creation moves past it, at the cost of up to one poll interval of extra latency before a new stream gets a task. Setting this to false bounds task creation with the current max meta id instead, which risks a stream silently never being processed. |
| `waitToQueueTasksDuration` | `PT10S` | How long should we wait to queue new tasks if we previously managed to queue 0 new tasks. Only used when claimTasksOnWorker is false. |


### publicUri

| Property | Default | What it does |
|---|---|---|
| `hostname` | *unset* | The hostname, FQDN or IP address of the public facing Stroom API gateway, i.e. Nginx. |
| `pathPrefix` | *unset* | Any prefix to be added to the beginning of paths for this URI. This may be needed if there is some form of gateway in front of Stroom that requires different paths. |
| `port` | *unset* | The port to use when passing requests to the API gateway. If no port is supplied then no port will be used in the resulting URL and it will be inferred from the scheme. |
| `scheme` | `https` | The scheme to use when passing requests to the API gateway,  i.e. https |


### queryHistory

| Property | Default | What it does |
|---|---|---|
| `daysRetention` | `365` | The number of days query history items will be retained for |
| `itemsRetention` | `100` | The maximum number of query history items that will be retained |


### receiptPolicy

| Property | Default | What it does |
|---|---|---|
| `obfuscatedFields` | `AccountId, AccountName, Component, Feed, ReceivedPath, RemoteDN, RemoteHost, System, UploadUserId, UploadUsername, X-Forwarded-For` | The set of field names used in receipt data policy that need to be obfuscated (using a hash function) when transferred to stroom-proxy. |
| `obfuscationHashAlgorithm` | `SHA2_512` | The hash algorithm to use for obfuscating fields defined in obfuscatedFields. Possible values are SHA3_256, SHA2_256, BCRYPT, ARGON_2. |
| `receiptRulesInitialFields.AccountId` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.Component` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.Compression` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.ContextEncoding` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.ContextFormat` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.EffectiveTime` | `Date` | *Not described in the source.* |
| `receiptRulesInitialFields.Encoding` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.Environment` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.Feed` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.Format` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.ReceiptId` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.ReceiptIdPath` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.ReceivedPath` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.ReceivedTime` | `Date` | *Not described in the source.* |
| `receiptRulesInitialFields.ReceivedTimeHistory` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.RemoteAddress` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.RemoteCertExpiry` | `Date` | *Not described in the source.* |
| `receiptRulesInitialFields.RemoteDN` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.RemoteHost` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.Schema` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.SchemaVersion` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.System` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.Type` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.UploadUserId` | `Text` | *Not described in the source.* |
| `receiptRulesInitialFields.UploadUsername` | `Text` | *Not described in the source.* |


### receive

| Property | Default | What it does |
|---|---|---|
| `allowedCertificateProviders` | *empty* | An allow-list containing IP addresses or fully qualified host names to verify that the direct sender of a request (e.g. a load balancer or reverse proxy) is trusted to supply certificate/DN headers as configured with 'x509CertificateHeader' and 'x509CertificateDnHeader'. If this list is null/empty then no check will be made on the client's address. |
| `authenticationRequired` | `true` | If true, the sender will be authenticated using a certificate or token depending on the state of tokenAuthenticationEnabled and certificateAuthenticationEnabled. If the sender can't be authenticated an error will be returned to the client.If false, then authentication will be performed if a token/key/certificate is present, otherwise data will be accepted without a sender identity. |
| `dataFeedIdentitiesDir` | `data_feed_identities` | The directory where Stroom will look for datafeed identity files. Only used if enabledAuthenticationTypes contains DATA_FEED_KEY or .If the value is a relative path then it will be treated as being relative to stroom.path.home. Data feed key files must have the extension .json. Files in sub-directorieswill be ignored. |
| `dataFeedOwnerMetaKey` | `AccountId` | The meta key that is used to identify the owner of a Data Feed Key. This may be an AccountId or similar. It must be provided as a header when sending data using the associated Data Feed Key, and its value will be checked against the value held with the hashed Data Feed Key by Stroom. Default value is 'AccountId'. Case does not matter. |
| `enabledAuthenticationTypes` | `TOKEN, CERTIFICATE` | The types of authentication that are enabled for data receipt. |
| `fallbackReceiveAction` | `RECEIVE` | If receiptCheckMode is RECEIPT_POLICY or FEED_STATUS and stroom/proxy is unable to perform the receipt check, then this action will be used as a fallback until the receipt check can be successfully performed. |
| `feedNameGenerationEnabled` | `false` | If true the client is not required to set the 'Feed' header. If Feed is not present a feed name will be generated based on the template specified by the 'feedNameTemplate' property. If false (the default), a populated 'Feed' header will be required. |
| `feedNameGenerationMandatoryHeaders` | `AccountId, Component, Format, Schema` | The set of header keys are mandatory if feedNameGenerationEnabled is set to true. Should be set to complement the header keys used in 'feedNameTemplate', but may be a sub-set of those in the template to allow for optional headers. |
| `feedNameTemplate` | `${accountid}-${component}-${format}-${schema}` | A template for generating a feed name from a set of headers. The value of each header referenced in the template will have any unsuitable characters replaced with '_'. If this property is set in the YAML file, use single quotes to prevent the variables being expanded when the config file is loaded. |
| `maxRequestSize` | *unset* | If defined then states the maximum size of a request (uncompressed for gzip requests). Will return a 413 Content Too Long response code for any requests exceeding this value. If undefined then there is no limit to the size of the request. |
| `metaTypes` | `Context, Detections, Error, Events, Meta Data, Raw Events, Raw Reference, Records, Reference, Test Events, Test Reference` | Set of supported meta type names. This set must contain all of the names in the default value for this property but can contain additional names. |
| `receiptCheckMode` | `FEED_STATUS` | Controls how or whether data is checked on receipt. Valid values (FEED_STATUS\|RECEIPT_POLICY\|RECEIVE_ALL\|REJECT_ALL\|DROP_ALL). |
| `s3Event.rePollDuration` | `PT5M` | This is the time to keep polling for. Once reached polling will stop and will begin again at the next scheduled execution time for the job. |
| `s3Event.sqs` | *unset* | *Not described in the source.* |
| `x509CertificateDnFormat` | `LDAP` | The format of the Distinguished Name used in the certificate. Valid values are LDAP and OPEN_SSL, where LDAP is the default. |
| `x509CertificateDnHeader` | `X-SSL-CLIENT-S-DN` | The HTTP header key used to extract the distinguished name (DN) as obtained from an X509 certificate. This is used when a load balancer does the SSL/mTLS termination and passes the client DN though in a header. Only used for authentication if a value is set and 'enabledAuthenticationTypes' includes CERTIFICATE. |
| `x509CertificateHeader` | `X-SSL-CERT` | The HTTP header key used to extract an X509 certificate. This is used when a load balancer does the SSL/mTLS termination and passes the client certificate though in a header. Only used for authentication if a value is set and 'enabledAuthenticationTypes' includes CERTIFICATE. |


### s3

| Property | Default | What it does |
|---|---|---|
| `skeletonConfigContent` | *A long value; see the file.* | The value of this property will be used to pre-populate a new S3 Configuration. |


### search

| Property | Default | What it does |
|---|---|---|
| `extraction.extractionDelayMs` | `100` | Extraction delay in milliseconds. A delay reduces the chance of a stream being extracted more than once. |
| `extraction.maxStoredDataQueueSize` | `1000` | The maximum number documents that will have stored data retrieved from the index shard and queued prior to further processing |
| `extraction.maxStreamEventMapSize` | `1000000` | The maximum size of the stream event map used to queue events prior to extraction |
| `extraction.maxThreadsPerTask` | `5` | The maximum number of threads per search, per node, used to extract search results from streams using a pipeline |
| `maxBooleanClauseCount` | `1024` | The maximum number of clauses that a boolean search can contain. |
| `maxStoredDataQueueSize` | `1000` | The maximum number documents that will have stored data retrieved from the index shard and queued prior to further processing |
| `resultStore.lmdb.localDir` | `search_results` | The path relative to the home directory to use for storing the data stores. It MUST be on local disk, NOT network storage, due to use of memory mapped files. The directory will be created if it doesn't exist.If the value is a relative path then it will be treated as being relative to stroom.path.home. **Needs a restart.** |
| `resultStore.lmdb.maxReaders` | `10` | The maximum number of concurrent readers/threads that can use the off-heap store. **Needs a restart.** |
| `resultStore.lmdb.maxStoreSize` | `10G` | The maximum size for the off heap store. There must be available space on the disk to accommodate this size. It can be larger than the amount of available RAM and will only be allocated as it is needed. Can be expressed in IEC units (multiples of 1024), e.g. 1024, 1024B, 1024bytes, 1KiB, 1KB, 1K, etc. **Needs a restart.** |
| `resultStore.lmdb.readAheadEnabled` | `true` | Read ahead means the OS will pre-fetch additional data from the disk in the expectation that it will be used at some point. This generally improves performance as more data is available in the page cache. Read ahead is enabled by default. It may be worth disabling it if the actively used data is larger than the available RAM, as this will stop it evicting hot entries to make space for pre-fetched data. **Needs a restart.** |
| `resultStore.map.minUntrimmedSize` | `100000` | The minimum size of sorted results for on heap result stores before they are trimmed. |
| `resultStore.map.trimmedSizeLimit` | `500000` | The trimmed size of sorted results for on heap result stores. |
| `resultStore.maxPayloadSize` | `1G` | The maximum byte size of a payload buffer. |
| `resultStore.maxPutsBeforeCommit` | `10000` | The maximum number of puts into the store (in a single load) before the transaction is committed. There is only one write transaction available at a time so reducing this value allows multiple loads to potentially each load a chunk at a time. However, load times increase rapidly with values below around 2,000. For maximum performance of a single load set this value to 0 to only commit at the very end of the load. |
| `resultStore.maxSortedItems` | `500000` | Maximum number of results that can be returned in a single page if the results are sorted. This will affect downloading all search results if results are sorted. |
| `resultStore.maxStringFieldLength` | `1000` | The maximum length of a string field value. Longer strings will be truncated. |
| `resultStore.minPayloadSize` | `1M` | The minimum byte size of a payload buffer. |
| `resultStore.offHeapResults` | `true` | Should search results be stored off heap (experimental feature). |
| `resultStore.valueQueueSize` | `10000` | The size of the value queue. |
| `shard.maxDocIdQueueSize` | `1000000` | The maximum number of doc ids that will be queued ready for stored data to be retrieved from the index shard |
| `shard.maxThreadsPerTask` | `5` | The maximum number of threads per search, per node, used to search Lucene index shards |


### security

| Property | Default | What it does |
|---|---|---|
| `authentication.csrf.protectBrowserOriginatedRequests` | `true` | Defence in depth against an undeclared authenticating proxy: reject a state-changing request that was authenticated by a request token, whose fetch metadata (Sec-Fetch-Site) says the browser made it cross-site, and that carries no X-CSRF header. Cross-origin scripts cannot attach an Authorization header and forms cannot at all, so such a token can only have been injected by an intermediary - i.e. the credential is ambient even though edgeAuthentication.enabled has not been set. Non-browser clients send no fetch metadata and are unaffected. |
| `authentication.edgeAuthentication.enabled` | `false` | Set to true when an authenticating reverse proxy in front of stroom (e.g. an AWS Application Load Balancer with an authenticate-oidc/authenticate-cognito rule, or NGINX with oauth2-proxy) is the OIDC Relying Party. Stroom will then never initiate an OIDC flow of its own and will treat request-token identities on browser-issued requests as ambient for CSRF purposes. Requires identityProviderType EXTERNAL_IDP. Note that with this enabled ALL browser access must traverse the proxy; API keys and bearer tokens still work for direct machine access. |
| `authentication.edgeAuthentication.logout.cookiesToExpire` | *empty* | Cookie name prefixes to expire when the user logs out of stroom, so the authenticating proxy's session ends too. Prefixes, because proxies shard large session cookies, e.g. an AWS ALB's 'AWSELBAuthSessionCookie' becomes 'AWSELBAuthSessionCookie-0', '-1', ...; oauth2-proxy's '_oauth2_proxy' chunks similarly. Every request cookie whose name starts with one of these prefixes is expired on logout. |
| `authentication.edgeAuthentication.logout.signOutUrl` | *unset* | The authenticating proxy's or IdP's sign-out endpoint to send the browser to after logging out of stroom, e.g. Cognito's 'https://<domain>.auth.<region>.amazoncognito.com/logout?client_id=...&logout_uri=...', oauth2-proxy's '/oauth2/sign_out' or Cloudflare's '/cdn-cgi/access/logout'. The post-logout landing page must be on a path the proxy does not authenticate, or the sign-in flow will simply restart. |
| `authentication.maxApiKeyExpiryAge` | `P365D` | The maximum expiry age for new API keys. Defaults to 365 days. |
| `authentication.openId.allowedAudiences` | *empty* | A set of audience claim values, one of which must appear in the audience claim in the token. If empty, the audience claim is validated against the configured clientId instead (unless validateAudience is false, in which case no audience validation is performed). If audienceClaimRequired is false and there is no audience claim in the token, then the audience is not validated. |
| `authentication.openId.audienceClaimRequired` | `true` | If true (the default) an inbound token fails validation when it does not carry an audience (aud) claim. The audience, when present, is validated against allowedAudiences, or the configured clientId when allowedAudiences is empty. Set this to false only for external identity providers that omit the aud claim on their access tokens. |
| `authentication.openId.authEndpoint` | *unset* | The authentication endpoint used in OpenId authentication.Should only be set if not using a configuration endpoint. |
| `authentication.openId.authenticationRequestExtraParams` | *empty* | Extra query parameters to append to the OIDC authentication request sent to the identity provider's authorization endpoint. E.g. Google requires 'access_type: offline' (and typically 'prompt: consent') or it will not issue a refresh token, leaving stroom unable to keep a session alive past the first access token's expiry. Parameters that clash with the standard OIDC parameters stroom sets itself (response_type, client_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method) are ignored. |
| `authentication.openId.clientCredentialsScopes` | `openid` | If custom scopes are required for client_credentials requests then this should be set to replace the default of 'openid'. E.g. for Azure AD you will likely need to set this to 'openid' and '<your-app-id-uri>/.default>'. |
| `authentication.openId.clientId` | *unset* | The client ID used in OpenId authentication. |
| `authentication.openId.clientSecret` | *unset* | The client secret used in OpenId authentication. |
| `authentication.openId.expectedSignerPrefixes` | *empty* | If using an AWS load balancer to handle the authentication, set this to the Amazon Resource Names (ARN) of the load balancer(s) fronting stroom, which will be something like 'arn:aws:elasticloadbalancing:region-code:account-id:loadbalancer/app/load-balancer-name/load-balancer-id'. This config value will be used to verify the 'signer' in the JWT header. Each value is the first N characters of the ARN and as a minimum must include up to the colon after the account-id, i.e. 'arn:aws:elasticloadbalancing:region-code:account-id:'.See https://docs.aws.amazon.com/elasticloadbalancing/latest/application/listener-authenticate-users.html#user-claims-encoding |
| `authentication.openId.formTokenRequest` | `true` | Some OpenId providers, e.g. AWS Cognito, require a form to be used for token requests. |
| `authentication.openId.fullNameClaimTemplate` | `${name}` | A template to build the user's full name using claim values as variables in the template. E.g '${firstName} ${lastName}' or '${name}'. If this property is set in the YAML file, use single quotes to prevent the variables being expanded when the config file is loaded. Note: claim names are case sensitive. |
| `authentication.openId.identityProviderType` | `INTERNAL_IDP` | The type of Open ID Connect identity provider that stroom/proxywill use for authentication. Valid values are: INTERNAL_IDP - Stroom's own built in IDP (not valid for stroom-proxy),EXTERNAL_IDP - An external IDP such as KeyCloak/Cognito (stroom's internal IDP can be used as stroom-proxy's external IDP). Changing this property will require a restart of the application. |
| `authentication.openId.issuer` | *unset* | The issuer used in OpenId authentication.Should only be set if not using a configuration endpoint. |
| `authentication.openId.jwksUri` | *unset* | The URI to obtain the JSON Web Key Set from in OpenId authentication.Should only be set if not using a configuration endpoint. |
| `authentication.openId.logoutEndpoint` | *unset* | The logout endpoint for the identity provider.This is not typically provided by the configuration endpoint. |
| `authentication.openId.logoutRedirectParamName` | `post_logout_redirect_uri` | The name of the URI parameter to use when passing the logout redirect URI to the IDP. This is here as the spec seems to have changed from 'redirect_uri' to 'post_logout_redirect_uri'. |
| `authentication.openId.openIdConfigurationEndpoint` | *unset* | You can set an openid-configuration URL to automatically configure much of the openid settings. Without this the other endpoints etc must be set manually. |
| `authentication.openId.publicKeyUriPattern` | `https://public-keys.auth.elb.${awsRegion}.amazonaws.com/${keyId}` | If the token is signed by AWS then use this pattern to form the URI to obtain the public key from. The pattern supports the variables '${awsRegion}' and '${keyId}'. Multiple instances of a variable are also supported. If this property is set in the YAML file, use single quotes to prevent the variables being expanded when the config file is loaded. |
| `authentication.openId.requestScopes` | `openid, email` | If custom auth flow request scopes are required then this should be set to replace the defaults of 'openid' and 'email'. |
| `authentication.openId.requiredAccessTokenType` | *unset* | The JOSE 'typ' header value a token must carry to be accepted as a bearer access token on the API, e.g. 'at+jwt' (RFC 9068) or 'Bearer' (Keycloak). When set, a token of any other type - such as an id_token - is rejected on the bearer path even if its signature is valid, preventing it from being replayed as an access token. Leave unset (the default) to accept any type, for identity providers that do not set a distinct type. Only applies to an external identity provider. |
| `authentication.openId.tokenEndpoint` | *unset* | The token endpoint used in OpenId authentication.Should only be set if not using a configuration endpoint. |
| `authentication.openId.uniqueIdentityClaim` | `sub` | The Open ID Connect claim used to link an identity on the IDP to a stroom user. Must uniquely identify the user on the IDP and not be subject to change. Uses 'sub' by default. |
| `authentication.openId.userDisplayNameClaim` | `preferred_username` | The Open ID Connect claim used to provide a more human friendly username for a user than that provided by uniqueIdentityClaim. It is not guaranteed to be unique and may change. |
| `authentication.openId.validateAudience` | `true` | If true (the default) the audience (aud) claim of an inbound token is validated when using an external identity provider. It is checked against allowedAudiences, or against the configured clientId when allowedAudiences is empty. Set to false to disable audience validation entirely. This is not recommended as a token minted for another application at the same identity provider could then be replayed against stroom. |
| `authentication.openId.validIssuers` | *empty* | A set of issuers (in addition to the 'issuer' property that is provided by the IDP that are deemed valid when seen in a token. If no additional valid issuers are required then set this to an empty set. Also this is used to validate the 'issuer' returned by the IDP when it is not a sub path of 'openIdConfigurationEndpoint'. If this set is empty then Stroom will verify that the |
| `authentication.preventLogin` | `false` | Prevent new logins to the system. This is useful if the system is scheduled to have an outage. |
| `crypto.secretEncryptionKey` | *empty* | Key used to encrypt and decrypt secrets stored in document entities |
| `identity.allowCertificateAuthentication` | `false` | In order for clients to be able to login with certificates this property must be set to true. For security certificate authentication should not be allowed unless the application is adequately secured and HTTPS is configured either directly for DropWizard or by an appropriate reverse proxy such as NGINX. **Needs a restart.** |
| `identity.allowLockedAccountPasswordReset` | `false` | If true, a user whose account has been locked by exceeding 'failedLoginLockThreshold' may unlock it themselves by completing the 'Forgot password' flow. Successfully setting a new password clears the locked state so the user can sign in again. This does not weaken the protection that locking gives against password guessing because completing a reset requires possession of the short lived token that is sent to the account's email address. Requires 'passwordPolicy.allowPasswordResets' and email to be configured. Only applies when using the internal identity provider. The default value for this property is false. |
| `identity.autoCreateAdminAccountOnBoot` | `false` | If true, then on boot, Stroom will ensure the presence of a local user account called 'admin' and a group called 'Administrators' with the app permission 'Administrator'. If the 'admin' user account is created then its password will be set to 'admin'. This feature also requires that the 'identityProviderType' property is set to INTERNAL_IDP. The default value for this property is false. If false it is possible to create administrator users/groups using the 'manage_users' CLI command. **Needs a restart.** |
| `identity.certificateCnCaptureGroupIndex` | `1` | Used in conjunction with property certificateCnPattern. This property value is the number of the regex capture group that represents the portion of certificate Common Name (CN) value that is the user identity. If all of the CN value is the user identity then set this property to 0 to capture the whole CN value. |
| `identity.certificateCnPattern` | `.*\\((.*)\\)` | The regular expression pattern that represents the Common Name (CN) value in an X509 certificate. The pattern should include a capture group for extracting the user identity from the CN value. For example the CN may be of the form 'Joe Bloggs [jbloggs]' in which case the pattern would be '.*?\[([^]]*)\].*'. The only capture group surrounds the user identity part. |
| `identity.email.fromAddress` | `noreply@stroom` | *Not described in the source.* |
| `identity.email.fromName` | `Stroom User Accounts` | *Not described in the source.* |
| `identity.email.passwordResetSubject` | `Password reset for Stroom` | *Not described in the source.* |
| `identity.email.passwordResetText` | *A long value; see the file.* | *Not described in the source.* |
| `identity.email.smtp.host` | `localhost` | *Not described in the source.* |
| `identity.email.smtp.password` | *unset* | *Not described in the source.* |
| `identity.email.smtp.port` | `2525` | *Not described in the source.* |
| `identity.email.smtp.transport` | `plain` | *Not described in the source.* |
| `identity.email.smtp.username` | *unset* | *Not described in the source.* |
| `identity.failedLoginLockDuration` | `PT30M` | How long an account locked by reaching 'failedLoginLockThreshold' failed logins stays locked before it is unlocked automatically, so that a lockout is temporary and cannot be used to deny a user access indefinitely. Set to zero (e.g. 'PT0S') to disable automatic unlocking, in which case a locked account stays locked until an administrator unlocks it or the user completes the 'Forgot password' flow. A lock set manually by an administrator is never affected by this and never expires. Only applies when using the internal identity provider. |
| `identity.failedLoginLockThreshold` | `3` | If the number of failed logins is greater than or equal to this value then the account  will be locked. |
| `identity.passwordPolicy.allowPasswordResets` | `true` | *Not described in the source.* |
| `identity.passwordPolicy.forcePasswordChangeOnFirstLogin` | `true` | *Not described in the source.* |
| `identity.passwordPolicy.mandatoryPasswordChangeDuration` | `P90D` | *Not described in the source.* |
| `identity.passwordPolicy.minimumPasswordLength` | `8` | *Not described in the source.* |
| `identity.passwordPolicy.minimumPasswordStrength` | `3` | *Not described in the source.* |
| `identity.passwordPolicy.neverUsedAccountDeactivationThreshold` | `P30D` | *Not described in the source.* |
| `identity.passwordPolicy.passwordPolicyMessage` | *A long value; see the file.* | *Not described in the source.* |
| `identity.passwordPolicy.unusedAccountDeactivationThreshold` | `P90D` | *Not described in the source.* |
| `identity.passwordResetRequestCooldown` | `PT1M` | How long a user must wait between requesting one password reset email and the next. This stops the unauthenticated 'Forgot password' endpoint being used to send mail to someone's address over and over. Requests for an address that has no account are not limited here because no mail is sent for them. Only applies when using the internal identity provider. |
| `identity.reactivateInactiveAccountsOnLogin` | `false` | If true, an account that has been marked as inactive by the 'Account Maintenance' job will be automatically made active again when the user next authenticates successfully with the correct password. Reactivation only happens on a successful authentication, so resetting a password does not by itself make an inactive account active again. Accounts that are locked, disabled or are processing accounts are never reactivated this way. Only applies when using the internal identity provider. The default value for this property is false. |
| `identity.token.accessTokenExpiration` | `PT1H` | *Not described in the source.* |
| `identity.token.algorithm` | `RS256` | *Not described in the source.* |
| `identity.token.defaultApiKeyExpiration` | `P365D` | *Not described in the source.* |
| `identity.token.emailResetTokenExpiration` | `PT10M` | *Not described in the source.* |
| `identity.token.idTokenExpiration` | `PT1H` | *Not described in the source.* |
| `identity.token.jwkRotationInterval` | `P30D` | *Not described in the source.* |
| `identity.token.jwsIssuer` | `stroom` | *Not described in the source.* |
| `identity.token.refreshTokenExpiration` | `P30D` | *Not described in the source.* |
| `webContent.contentSecurityPolicy` | *A long value; see the file.* | The content security policy (HTTP header 'Content-Security-Policy') |
| `webContent.contentTypeOptions` | `nosniff` | The content type options (HTTP header 'X-Content-Type-Options') |
| `webContent.frameOptions` | `sameorigin` | The frame options (HTTP header 'X-Frame-Options') |
| `webContent.strictTransportSecurity` | `max-age=31536000; includeSubDomains; preload` | HTTP Strict Transport Security (HSTS) (HTTP header 'Strict-Transport-Security'). If this is set then the first HTTPS request will make the browser use HTTPS for all future HTTP requests. This browser state cannot be cleared just by clearing the browser cache. |
| `webContent.xssProtection` | `1; mode=block` | XSS protection (HTTP header 'X-XSS-Protection') |


### session

| Property | Default | What it does |
|---|---|---|
| `maxInactiveInterval` | `P7D` | The maximum time interval between the last access of a HTTP session and it being considered expired. Set to null for sessions that never expire, however this will causes sessions to be held and build up in memory indefinitely, so is best avoided. **Needs a restart.** |


### sessionCookie

| Property | Default | What it does |
|---|---|---|
| `httpOnly` | `true` | *Not described in the source.* |
| `sameSite` | `STRICT` | *Not described in the source.* |
| `secure` | `true` | *Not described in the source.* |


### solr

| Property | Default | What it does |
|---|---|---|
| `search.maxBooleanClauseCount` | `1024` | The maximum number of clauses that a boolean search can contain. |
| `search.maxStoredDataQueueSize` | `1000` | The maximum number documents that will have stored data retrieved from the index shard and queued prior to further processing |


### statistics

| Property | Default | What it does |
|---|---|---|
| `internal.benchmarkCluster` | `type: StatisticStore` | the statistics produced by the Benchmark Cluster Test job. |
| `internal.benchmarkCluster.name` | `Benchmark-Cluster Test` | *Not described in the source.* |
| `internal.benchmarkCluster.uuid` | `946a88c6-a59a-11e6-bdc4-0242ac110002` | *Not described in the source.* |
| `internal.cpu` | `type: StatisticStore` | various statistic values relating to the CPU load on the node. |
| `internal.cpu.name` | `CPU` | *Not described in the source.* |
| `internal.cpu.uuid` | `af08c4a7-ee7c-44e4-8f5e-e9c6be280434` | *Not described in the source.* |
| `internal.enabledStoreTypes` | `StatisticStore` | Determines which statistic store(s) internal statistic events will be sent to. Valid values are "". An empty list means all internal statistic events will be dropped. |
| `internal.eventsPerSecond` | `type: StatisticStore` | the number of events processed per second by a node. |
| `internal.eventsPerSecond.name` | `EPS` | *Not described in the source.* |
| `internal.eventsPerSecond.uuid` | `a9936548-2572-448b-9d5b-8543052c4d92` | *Not described in the source.* |
| `internal.heapHistogramBytes` | `type: StatisticStore` | values from a Java heap histogram based on the number of bytes used by each class. |
| `internal.heapHistogramBytes.name` | `Heap Histogram Bytes` | *Not described in the source.* |
| `internal.heapHistogramBytes.uuid` | `934a1600-b456-49bf-9aea-f1e84025febd` | *Not described in the source.* |
| `internal.heapHistogramInstances` | `type: StatisticStore` | values from a Java heap histogram based on the number of instances used by each class. |
| `internal.heapHistogramInstances.name` | `Heap Histogram Instances` | *Not described in the source.* |
| `internal.heapHistogramInstances.uuid` | `e4f243b8-2c70-4d6e-9d5a-16466bf8764f` | *Not described in the source.* |
| `internal.memory` | `type: StatisticStore` | various values relating to the memory use on a node. |
| `internal.memory.name` | `Memory` | *Not described in the source.* |
| `internal.memory.uuid` | `77c09ccb-e251-4ca5-bca0-56a842654397` | *Not described in the source.* |
| `internal.metaDataStreamSize` | `type: StatisticStore` | the volume of data (in bytes) received by a feed. |
| `internal.metaDataStreamSize.name` | `Meta Data-Stream Size` | *Not described in the source.* |
| `internal.metaDataStreamSize.uuid` | `946a8814-a59a-11e6-bdc4-0242ac110002` | *Not described in the source.* |
| `internal.metaDataStreamsReceived` | `type: StatisticStore` | the number of streams received by a feed. |
| `internal.metaDataStreamsReceived.name` | `Meta Data-Streams Received` | *Not described in the source.* |
| `internal.metaDataStreamsReceived.uuid` | `946a87bc-a59a-11e6-bdc4-0242ac110002` | *Not described in the source.* |
| `internal.pipelineStreamProcessor` | `type: StatisticStore` | the number of streams processed by a pipeline. |
| `internal.pipelineStreamProcessor.name` | `PipelineStreamProcessor` | *Not described in the source.* |
| `internal.pipelineStreamProcessor.uuid` | `946a80fc-a59a-11e6-bdc4-0242ac110002` | *Not described in the source.* |
| `internal.refDataStoreEntryCount` | `type: StatisticStore` | the total number of map entries in the off heap reference data store. |
| `internal.refDataStoreEntryCount.name` | `Reference Data Store Entry Count` | *Not described in the source.* |
| `internal.refDataStoreEntryCount.uuid` | `f1587262-9cbc-46b4-80eb-51deb011b2c1` | *Not described in the source.* |
| `internal.refDataStoreSize` | `type: StatisticStore` | the total size in bytes of the off heap reference data store. |
| `internal.refDataStoreSize.name` | `Reference Data Store Size` | *Not described in the source.* |
| `internal.refDataStoreSize.uuid` | `e57959bf-0b2d-4008-98a7-ffcae4bbc4bb` | *Not described in the source.* |
| `internal.refDataStoreStreamCount` | `type: StatisticStore` | the total number of streams in the off heap reference data store. |
| `internal.refDataStoreStreamCount.name` | `Reference Data Store Stream Count` | *Not described in the source.* |
| `internal.refDataStoreStreamCount.uuid` | `0dfd4e00-e068-4667-9c60-d3f6163a6c04` | *Not described in the source.* |
| `internal.searchResultsStoreCount` | `type: StatisticStore` | the total number of off heap search results stores. |
| `internal.searchResultsStoreCount.name` | `Search Results Store Count` | *Not described in the source.* |
| `internal.searchResultsStoreCount.uuid` | `35d60e7d-f11a-45c9-981d-16d8ddda081e` | *Not described in the source.* |
| `internal.searchResultsStoreSize` | `type: StatisticStore` | the total size in bytes of the off heap search results stores. |
| `internal.searchResultsStoreSize.name` | `Search Results Store Size` | *Not described in the source.* |
| `internal.searchResultsStoreSize.uuid` | `de5b831d-3b7e-4bb5-836f-2f438ec30568` | *Not described in the source.* |
| `internal.streamTaskQueueSize` | `type: StatisticStore` | the number of items on the stream task queue. |
| `internal.streamTaskQueueSize.name` | `Stream Task Queue Size` | *Not described in the source.* |
| `internal.streamTaskQueueSize.uuid` | `946a7f0f-a59a-11e6-bdc4-0242ac110002` | *Not described in the source.* |
| `internal.volumes` | `type: StatisticStore` | the number of items on the stream task queue. |
| `internal.volumes.name` | `Volumes` | *Not described in the source.* |
| `internal.volumes.uuid` | `ac4d8d10-6f75-4946-9708-18b8cb42a5a3` | *Not described in the source.* |
| `sql.docRefType` | `StatisticStore` | The entity type for the sql statistics service |
| `sql.inMemAggregatorPoolSize` | `10` | Number of pooled in-memory aggregators in the pool.This pool of aggregators is the first stage of in-memory statistic aggregation. **Needs a restart.** |
| `sql.inMemFinalAggregatorSizeThreshold` | `1000000` | Maximum size (number of entries) of the final in-memory aggregator map.Once an aggregator has reached this size it will be flushed to the database.If statistic flush tasks are delaying shutdown of stroom you can reduce this value to make the flushes smaller, at the cost of efficiency.This aggregator is the final stage of in-memory statistic aggregation. |
| `sql.inMemPooledAggregatorAgeThreshold` | `PT5M` | Maximum age of each aggregator in the pool of in-memory aggregator maps. Once an aggregator has reached this age it will be merged into the final stage of in-memory aggregation.This pool of aggregators is the first stage of in-memory statistic aggregation. |
| `sql.inMemPooledAggregatorSizeThreshold` | `1000000` | Maximum size (number of entries) of each aggregator in the pool of in-memory aggregator maps. Once an aggregator has reached this size it will be merged into the final stage of in-memory aggregation.This pool of aggregators is the first stage of in-memory statistic aggregation. |
| `sql.maxProcessingAge` | *unset* | The maximum age of statistics to process and retain, i.e. any statistics with an statistic event time older than the current time minus maxProcessingAge will be silently dropped.  Existing statistic data over this age will be purged during statistic aggregation. Set to null to process/retain all data. |
| `sql.search.fetchSize` | `5000` | *Not described in the source.* |
| `sql.search.maxResults` | `100000` | *Not described in the source.* |
| `sql.slowQueryWarningThreshold` | `PT1S` | A warning will be logged for any statistics database queries that take longer than this threshold to complete. A value of '0' or 'PT0' means no warnings will be logged at all. |
| `sql.statisticAggregationBatchSize` | `1000000` | Number of SQL_STAT_VAL_SRC records to merge into SQL_STAT_VAL in one batchTypically a larger number is more efficient but means it will take longer which can delay a clean shutdown of stroom. Higher numbers may also lead to database lock contention and lock wait errors. |
| `sql.statisticAggregationStageTwoBatchSize` | `200000` | Number of SQL_STAT_VAL records to move to a coarser aggregation level in one batch. Typically a larger number is more efficient but means it will take longer which can delay a clean shutdown of stroom. Higher numbers may also lead to database lock contention and lock wait errors. |
| `sql.statisticFlushBatchSize` | `8000` | Number of statistic events to write to SQL_STAT_VAL_SRC in one batch. Sweet spot seems to be around 8-10k. Too high a number and there is a risk of the SQL statement being too large for MySQL. |


### ui

| Property | Default | What it does |
|---|---|---|
| `aboutHtml` | *A long value; see the file.* | *Not described in the source.* |
| `activity.chooseOnStartup` | `false` | *Not described in the source.* |
| `activity.editorBody` | *A long value; see the file.* | *Not described in the source.* |
| `activity.editorTitle` | `Edit Activity` | *Not described in the source.* |
| `activity.enabled` | `false` | *Not described in the source.* |
| `activity.managerTitle` | `Choose Activity` | *Not described in the source.* |
| `analyticUiDefaultConfig.defaultBodyTemplate` | *A long value; see the file.* | *Not described in the source.* |
| `analyticUiDefaultConfig.defaultSubjectTemplate` | `Detector '{{ detectorName \| escape }}' Alert` | *Not described in the source.* |
| `defaultApiKeyHashAlgorithm` | `SHA3_256` | *Not described in the source.* |
| `defaultMaxResults` | `1000000,100,10,1` | *Not described in the source.* |
| `helpSubPathDocumentation` | `/user-guide/content/documentation/` | *Not described in the source.* |
| `helpSubPathExpressions` | `/reference-section/expressions/` | *Not described in the source.* |
| `helpSubPathJobs` | `/reference-section/jobs/` | *Not described in the source.* |
| `helpSubPathProperties` | `/user-guide/properties/` | *Not described in the source.* |
| `helpSubPathQuickFilter` | `/user-guide/content/finding-things/` | *Not described in the source.* |
| `helpSubPathStroomQueryLanguage` | `/user-guide/search/queries/stroom-query-language/` | *Not described in the source.* |
| `helpUrl` | `https://gchq.github.io/stroom-docs/7.13/docs` | *Not described in the source.* |
| `htmlTitle` | `Stroom` | *Not described in the source.* |
| `maxEditorCompletionEntries` | `1000` | *Not described in the source.* |
| `namePattern` | `^[a-zA-Z0-9_\\- \\.\\(\\)]{1,}$` | *Not described in the source.* |
| `nestedIndexFieldsDelimiterPattern` | `[.:]` | *Not described in the source.* |
| `nodeMonitoring.pingMaxThreshold` | `500` | *Not described in the source.* |
| `nodeMonitoring.pingWarnThreshold` | `100` | *Not described in the source.* |
| `oncontextmenu` | `return false;` | *Not described in the source.* |
| `process.defaultRecordLimit` | `1000000` | *Not described in the source.* |
| `process.defaultTimeLimit` | `30` | *Not described in the source.* |
| `query.dashboardPipelineSelectorIncludedTags` | `extraction` | Set of explorer tags to use as a filter on the Dashboard screen's Extraction Pipeline selector. Explorer nodes will only be included if they have at least all the tags in this property. This property should contain a sub set of the tags in property stroom.explorer.suggestedTags |
| `query.indexPipelineSelectorIncludedTags` | `extraction` | Set of explorer tags to use as a filter on the Index screen's Pipeline selector. Explorer nodes will only be included if they have at least all the tags in this property. This property should contain a sub set of the tags in property stroom.explorer.suggestedTags |
| `query.infoPopup.enabled` | `false` | *Not described in the source.* |
| `query.infoPopup.title` | `Please Provide Query Info` | *Not described in the source.* |
| `query.infoPopup.validationRegex` | `^[\\s\\S]{3,}$` | *Not described in the source.* |
| `query.viewPipelineSelectorIncludedTags` | `extraction` | Set of explorer tags to use as a filter on the View screen's Pipeline selector. Explorer nodes will only be included if they have at least all the tags in this property. This property should contain a sub set of the tags in property stroom.explorer.suggestedTags |
| `referencePipelineSelectorIncludedTags` | `reference-loader` | *Not described in the source.* |
| `reportUiDefaultConfig.defaultBodyTemplate` | *A long value; see the file.* | *Not described in the source.* |
| `reportUiDefaultConfig.defaultSubjectTemplate` | `Report '{{ reportName \| escape }}'` | *Not described in the source.* |
| `source.maxCharactersInPreviewFetch` | `30000` | *Not described in the source.* |
| `source.maxCharactersPerFetch` | `80000` | *Not described in the source.* |
| `source.maxCharactersToCompleteLine` | `10000` | *Not described in the source.* |
| `source.maxHexDumpLines` | `1000` | *Not described in the source.* |
| `splash.body` | *A long value; see the file.* | *Not described in the source.* |
| `splash.enabled` | `false` | *Not described in the source.* |
| `splash.title` | `Splash Screen` | *Not described in the source.* |
| `splash.version` | `v0.1` | *Not described in the source.* |
| `theme.labelColours` | `TEST1=#FF0000,TEST2=#FF9900` | *Not described in the source.* |
| `welcomeHtml` | *A long value; see the file.* | *Not described in the source.* |


### uiUri

| Property | Default | What it does |
|---|---|---|
| `hostname` | *unset* | This is the hostname/DNS for where the UI is hosted if different to the public facing URI of the server, e.g. during development or some other deployments. |
| `pathPrefix` | *unset* | An optional prefix to the base path. This may be needed when the UI communicationgoes via some form of gateway where the paths are mapped to something else. |
| `port` | *unset* | This is the port to use for UI traffic, if different from the public facing URI. |
| `scheme` | `https` | The scheme, i.e. http or https |


### volumes

| Property | Default | What it does |
|---|---|---|
| `createDefaultIndexVolumesOnStart` | `true` | If no existing index volume groups are present a default volume group will be created on application start. Use property defaultIndexVolumeGroupName to define its name **Needs a restart.** |
| `defaultIndexVolumeFilesystemUtilisation` | `0.9` | Fraction of the filesystem beyond which the system will stop writing to the default index volumes that may be created on application start. |
| `defaultIndexVolumeGroupName` | `Default Volume Group` | The name of the default index volume group that is created if none exist on application start. Use properties defaultIndexVolumeGroupLimit, defaultIndexVolumeGroupPaths and defaultIndexVolumeGroupNodes to specify details. |
| `defaultIndexVolumeGroupPaths` | `volumes/default_index_volume` | The paths on the nodes that hold the data and are created on the defined list of nodes if the default index is created on application start. N.B. It is possible to have multiple paths per node and/or the same path repeated on multiple nodes but there must always be the same number of elements in this list as in property defaultIndexVolumeGroupNodes. If a path is a relative path then it will be treated as being relative to stroom.path.home. |
| `volumeSelector` | `RoundRobin` | How should index volumes be selected for use? Possible volume selectors include ('MostFreePercent', 'MostFree', 'Random', 'RoundRobinIgnoreLeastFreePercent', 'RoundRobinIgnoreLeastFree', 'RoundRobin', 'WeightedFreePercentRandom', 'WeightedFreeRandom') default is 'RoundRobin' |

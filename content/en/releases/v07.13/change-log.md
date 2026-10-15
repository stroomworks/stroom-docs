---
title: "Change Log"
linkTitle: "Change Log"
weight: 50
date: 2026-09-03
tags: 
description: >
  Full list of changes in this release.
---

<!--
To build this list run diff_changelog.sh in the root of the stroom repo.
E.g. ./diff_changelog.sh 7.12 7.13 | sed -E -e 's/^/\n/' -e 's|Issue \*\*#([0-9]+)\*\*|Issue **{{< external-link "#\1" "https://github.com/gchq/stroom/issues/\1" >}}**|g'
-->

## Features and Changes

* Issue **{{< external-link "#5758" "https://github.com/gchq/stroom/issues/5758" >}}** : Track Ask Stroom AI queries in Task Manager so they can be cancelled by an operator.

* Issue **{{< external-link "#5774" "https://github.com/gchq/stroom/issues/5774" >}}** : Add `Level` and `Status` to an Analytic Rule, which are written to every detection the rule produces and are available to notification email templates as `{{ level }}` and `{{ status }}`.

* Issue **{{< external-link "#5774" "https://github.com/gchq/stroom/issues/5774" >}}** : Move `Include Rule Documentation` and `Feed For Errors` from the Notifications tab of an Analytic Rule or Report to a new Settings tab, so the Notifications tab holds only notifications.

* Change YAML config code back to using the legacy Jackson v2 as this is consistent with the current version of DropWizard.

* Issue **{{< external-link "#5706" "https://github.com/gchq/stroom/issues/5706" >}}** : Retry sending Plan B data to a node when the send fails at the transport level, e.g. a DNS lookup failure during a network blip, controlled by `stroom.planb.sendPartAttempts` (default 3) and `stroom.planb.sendPartRetryDelay` (default 10s).

* Uplift java in docker images to 25.0.3_9.

* Issue **{{< external-link "#5712" "https://github.com/gchq/stroom/issues/5712" >}}** : Add an optional `ignoreWarnings` boolean argument to the XSLT functions `stroom:host-name()` and `stroom:host-address()` to suppress the WARN that is logged when a DNS lookup fails.

* Issue **{{< external-link "#5582" "https://github.com/gchq/stroom/issues/5582" >}}** : Add proper audit trail to doc history and store snapshots of data changes to allow future restore.

* Task **{{< external-link "#5588" "https://github.com/gchq/stroom/issues/5588" >}}** : Improve JOOQ code generation to work with Flyway to remove catch 22 issue.

* Issue **{{< external-link "#2109" "https://github.com/gchq/stroom/issues/2109" >}}** : Add doc dependencies to DB to improve capability.

* Issue **{{< external-link "#1556" "https://github.com/gchq/stroom/issues/1556" >}}** : Add safe delete feature now we can depend on a reliable dependency discovery service.

* Issue **{{< external-link "#4111" "https://github.com/gchq/stroom/issues/4111" >}}** : Add confirmation details when deleting a folder.

* Issue **{{< external-link "#5697" "https://github.com/gchq/stroom/issues/5697" >}}** : Apply CSRF Origin/X-CSRF checks to state-changing requests whose credential was injected by an authenticating edge proxy (previously only session-cookie identities were checked), and reject cross-site browser requests carrying a request token unless they send `X-CSRF: 1`. In-browser clients that attach their own bearer token must now send `X-CSRF: 1` on state-changing requests when `edgeAuthentication.enabled` is set; non-browser automation and inter-node traffic are unaffected.

* Issue **{{< external-link "#5697" "https://github.com/gchq/stroom/issues/5697" >}}** : Add `security.authentication.openId.authenticationRequestExtraParams` to append provider-specific parameters to the OIDC authentication request, e.g. Google's `access_type: offline` without which Google issues no refresh token and the session cannot outlive the first access token.

* Issue **{{< external-link "#5656" "https://github.com/gchq/stroom/issues/5656" >}}** : Add feature to view sessions and revoke them and associated user tokens.

* Issue **{{< external-link "#5675" "https://github.com/gchq/stroom/issues/5675" >}}** : Add HTTP and TLS configuration to Git repositories.

* Issue **{{< external-link "#5656" "https://github.com/gchq/stroom/issues/5656" >}}** : Add self service account unlocking for the internal identity provider, controlled by the new properties `stroom.security.identity.reactivateInactiveAccountsOnLogin` and `stroom.security.identity.allowLockedAccountPasswordReset`, and rebuild the 'Forgot password' reset page so that an emailed reset link can be completed.

* Issue **{{< external-link "#5652" "https://github.com/gchq/stroom/issues/5652" >}}** : Support Elasticsearch nested field types in search.

* Issue **{{< external-link "#5654" "https://github.com/gchq/stroom/issues/5654" >}}** : Support multiple dense_vector fields in Elasticsearch rerank search.

* Issue **{{< external-link "#5599" "https://github.com/gchq/stroom/issues/5599" >}}** : Add XPath to query functions so that users can pull XML apart in Dashboard Tables.

* Issue **{{< external-link "#5600" "https://github.com/gchq/stroom/issues/5600" >}}** : Add JQ to query functions so that users can pull JSON apart in Dashboard Tables.

* Issue **{{< external-link "#5559" "https://github.com/gchq/stroom/issues/5559" >}}** : Improve node selection for node groups to allow select all and selection inversion.

* Issue **{{< external-link "#5561" "https://github.com/gchq/stroom/issues/5561" >}}** : Add feature to delete individual attachments and messages from AI chat history.

* Issue **{{< external-link "#5561" "https://github.com/gchq/stroom/issues/5561" >}}** : Add time tooltips to AI chat messages.

* Issue **{{< external-link "#5561" "https://github.com/gchq/stroom/issues/5561" >}}** : Fix user preferences resetting stroom AI preferences.

* Issue **{{< external-link "#5561" "https://github.com/gchq/stroom/issues/5561" >}}** : Open and view attachments in the AI chat window.

* Issue **{{< external-link "#5561" "https://github.com/gchq/stroom/issues/5561" >}}** : Add names to tables so they can be identified by stroom AI.

* Issue **{{< external-link "#5565" "https://github.com/gchq/stroom/issues/5565" >}}** : Make vector embedding dimension count configurable.

* Issue **{{< external-link "#5616" "https://github.com/gchq/stroom/issues/5616" >}}** : Add  XSLT function for computing the similarity of two float vectors.

* Issue **{{< external-link "#5624" "https://github.com/gchq/stroom/issues/5624" >}}** : Upgrade langchain4j and openai-java libs.

* Issue **{{< external-link "#5622" "https://github.com/gchq/stroom/issues/5622" >}}** : Change Stroom UI auth flow so redirects are no longer required. Allows Stroom UI to be served from another location with BFF proxy.

* Issue **{{< external-link "#5630" "https://github.com/gchq/stroom/issues/5630" >}}** : Make embedding dimensions optional.

* Uplift AWS SDK to 2.46.7 and hbase-shaded-netty to 4.1.13.

* Uplift Dropwizard to 5.0.2.

* Issue **{{< external-link "#5557" "https://github.com/gchq/stroom/issues/5557" >}}** : Change config class constructors to correctly handle and default null primitive values on deserialisation from YAML.

* Issue **{{< external-link "#5567" "https://github.com/gchq/stroom/issues/5567" >}}** : Stop the content index rebuilding on first use after a node reboot. Add config props `stroom.contentIndex.contentIndexDir` (defaults to `content_index`), `stroom.contentIndex.storageType` (one of `TEMP|LOCAL|SHARED`, defaults to `LOCAL`) and `stroom.contentIndex.minRebuildAge` (defaults to `PT1M`). Thus the content index can now be stored locally on each node for better performance or on shared storage. Stroom now eagerly builds the content index on boot if the storage type is `SHARED`.

* Uplift DropWizard to v5.0.1.

* Uplift `net.openhft:zero-allocation-hashing` to `2026.0`.

* Add Jackson JSON library `3.1.2` in addition to the existing `2.21.2` version. Stroom/Stroom-Proxy are now using v3 with the exception of a few specific areas that need legacy capability only available in v2. v3 is a significant change from v2 with some breaking changes and some differences in behaviour. Special attention should be paid to the output of JSONParser pipeline element to ensure it is behaving as expected.

* Issue **{{< external-link "#5515" "https://github.com/gchq/stroom/issues/5515" >}}** : Change JSONParser pipeline element to truncate very long strings values. Currently very long string values can result in Out of Memory errors in Stroom. The following configuration properties have been added to the JSONParser element; `stringTruncateLength` (default 10,000) to truncate very long strings, `maxStringLength` (default 100,000,000) to cause a fatal error if a long string is encountered, `maxDepth` (default 500) to limit the depth of deeply nested documents. The JSONParser has also been changed so that the characters of string values are streamed to the downstream pipeline elements rather than reading the whole string into memory. NOTE: It is still possible for downstream XSLT XPATH functions to result in the entire string being read into memory.

* Change json (de)serialisation to not go via a String when dealing only with byte[] data.

* Uplift base docker images to `eclipse-temurin:25.0.3_9-jdk-alpine-3.23`.

* Issue **{{< external-link "#5303" "https://github.com/gchq/stroom/issues/5303" >}}** : Improve Stroom AI to add dockable panel, chat history, attachments, copy, download, chat details etc.

* Issue **{{< external-link "#5552" "https://github.com/gchq/stroom/issues/5552" >}}** : Add additional S3 properties to S3Appender.

* Improve logging and system info output for Data Feed Keys.

* Issue **{{< external-link "#5526" "https://github.com/gchq/stroom/issues/5526" >}}** : Add event logging to ask stroom AI.

* Issue **{{< external-link "#5183" "https://github.com/gchq/stroom/issues/5183" >}}** : Add title to dashboard link function.

* Add System Info Admin Servlet. Add menu of all admin servlets at `<admin port>/<admin path>/menu`.

* Add config prop `stroom.annotation.eventLinkCacheSizeLimit` (default 1,000,000) to protect Stroom from caching too many annotation to event links. If this limit is exceeded, the query will error.

* Change the annotation caching to invalidate on a field basis rather than the whole annotation.

* Fix CI build failure due to missing Docker container prefix.

* Issue **{{< external-link "#5282" "https://github.com/gchq/stroom/issues/5282" >}}** : Add pipeline scheduling.

* Issue **{{< external-link "#5346" "https://github.com/gchq/stroom/issues/5346" >}}** : Choose which external document changes to save when saving a pipeline.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Add level and status to rules.

* Issue **{{< external-link "#5377" "https://github.com/gchq/stroom/issues/5377" >}}** : Embedded pipeline docs.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Create new doc object DataGen.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Add Execution tab to DataGen.

* Issue **{{< external-link "#5387" "https://github.com/gchq/stroom/issues/5387" >}}** : Allow pipeline stepping across multiple streams.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Implement job scheduling for DataGen.

* Issue **{{< external-link "#3103" "https://github.com/gchq/stroom/issues/3103" >}}** : Allow multiple dashboard instances.

* Refactor the feedKey locking in PreAggregator and make AttributeMapUtil#readKeys() more lenient when reading `.meta `files.

* Uplift org.apache.commons:commons-pool2 from 2.12.1 to 2.13.1.

* Uplift org.flywaydb:flyway-core from 11.20.0 to 12.0.0.

* Uplift org.eclipse.jgit:org.eclipse.jgit from 7.3.0.202506031305-r to 7.5.0.202512021534-r.

* Uplift org.apache.solr:solr-solrj from 9.8.0 to 9.10.1.

* Uplift swagger from 2.2.41 to 2.2.42.

* Remove HBase statistics (may require change to default config).

* Remove ScyllaDB based state store.

* Editing items in the UI now indicates save required only when changes are made.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Refactor schedulers.

* Issue **{{< external-link "#3206" "https://github.com/gchq/stroom/issues/3206" >}}** : User tab sessions.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Refactor schedulers to interface and cleanup.

* Uplift gwt from 2.12.2 to 2.13.0.

* Uplift co.elastic.clients:elasticsearch-java from 9.2.1 to 9.3.2.

* Uplift gradle-wrapper from 9.3.0 to 9.3.1.

* Uplift org.yaml:snakeyaml from 2.2 to 2.6.

* Replace NullSafe.requireNonNullElse() with Objects.requireNonNullElse().

* Replace NullSafe.requireNonNullElseGet() with Objects.requireNonNullElseGet().

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Fix typo.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Rebase on master.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Cleanup.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Checkstyle.

* Issue **{{< external-link "#5232" "https://github.com/gchq/stroom/issues/5232" >}}** : Add standard annotation comments. MIGRATION: Any comments previously configured in standardComments property will need to saved as annotation comments.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Change icon for DataGen.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Add feed name to rule detection.

* Improve the ProgressMonitor task creation logging output to included counts of errored and skipped filters. Change task creation to re-test filter enabled/deleted state just prior to creating tasks. Add validation to ProcessorConfig to enforce a minimum value of `1` on some properties.

* Issue **{{< external-link "#5366" "https://github.com/gchq/stroom/issues/5366" >}}** : Fix DataGen destination feed not firing dirty event.

* Uplift docker images to `eclipse-temurin:25.0.2_10-jdk-alpine-3.23`. Change Java docker build to use 25.0.2. Change ERD build to use a fixed docker image.

* Issue **{{< external-link "#5490" "https://github.com/gchq/stroom/issues/5490" >}}** : Add rerank capability to dense vector search.

* Issue **{{< external-link "#5492" "https://github.com/gchq/stroom/issues/5492" >}}** : Change Git Repo folder colour as red looked like an error.

* Issue **{{< external-link "#5480" "https://github.com/gchq/stroom/issues/5480" >}}** : Group some annotation history items and make them expandable.

* Issue **{{< external-link "#5161" "https://github.com/gchq/stroom/issues/5161" >}}** : Make dashboard tab menu available from settings icon.


## Bug Fixes

* Issue **{{< external-link "#5766" "https://github.com/gchq/stroom/issues/5766" >}}** : Fix scheduled query and table builder analytic rules including the rule's documentation in detections when `Include Rule Documentation` is unticked.

* Issue **{{< external-link "#5768" "https://github.com/gchq/stroom/issues/5768" >}}** : Fix reports always being sent even when `Send Empty Reports` is unticked and the report has no rows.

* Issue **{{< external-link "#5770" "https://github.com/gchq/stroom/issues/5770" >}}** : Fix `Use Source Feed If Possible` having no effect, so a streaming rule again writes its detections to the feed the source data came from. The option is ignored, and disabled in the user interface, for rules that are not streaming.

* Issue **{{< external-link "#5747" "https://github.com/gchq/stroom/issues/5747" >}}** : Fix Stroom AI integration to support redirects.

* Issue **{{< external-link "#5749" "https://github.com/gchq/stroom/issues/5749" >}}** : Fix Ask Stroom AI so that it can deliver partial results if possible if the user terminates a request or a request fails.

* Issue **{{< external-link "#5752" "https://github.com/gchq/stroom/issues/5752" >}}** : Persist Ask Stroom AI settings to user preferences.

* Issue **{{< external-link "#5756" "https://github.com/gchq/stroom/issues/5756" >}}** : Enable Ask Stroom AI cancel button while query is in progress.

* Issue **{{< external-link "#5764" "https://github.com/gchq/stroom/issues/5764" >}}** : Add in missing SimpleMail batch module dependency to stop errors when sending email.

* Stop creation of content templates and data retention docs when they are just being fetched.

* Fix error when trying to edit content templates, data retention rules and data receipt rules.

* Issue **{{< external-link "#5738" "https://github.com/gchq/stroom/issues/5738" >}}** : Improve the error message produced by the `json-to-xml` XSLT function and the `JSONParser` pipeline element when the JSON is invalid.

* Issue **{{< external-link "#5742" "https://github.com/gchq/stroom/issues/5742" >}}** : Fix meta DB performance issues.

* Issue **{{< external-link "#5745" "https://github.com/gchq/stroom/issues/5745" >}}** : Fix meta find query performance.

* Issue **{{< external-link "#5730" "https://github.com/gchq/stroom/issues/5730" >}}** : Fix doc create permission bug.

* Issue **{{< external-link "#5732" "https://github.com/gchq/stroom/issues/5732" >}}** : Fix locate button enabled state.

* Fix (de)serialisation of enum values in YAML files. Now correctly uses the enum name rather than toString value.

* IMPORTANT! Rename DB migration scripts from `V07_14...` to `V07_13...` to correctly match the branch. This will break the DB migration when deploying the next release **IF** you have deployed **ANY** 7.13 version that is less than or equal to `v7.13-beta.10`. If you have deployed an earlier 7.13 version, you need to run the following script before running the next Stroom version to update the schema_history tables with the new names: https://raw.githubusercontent.com/gchq/stroom/refs/heads/7.13/scripts/v07_13_migration_script_rename.sql.

* Issue **{{< external-link "#5688" "https://github.com/gchq/stroom/issues/5688" >}}** : Failed CSV search requests now return sensible error responses.

* Issue **{{< external-link "#5688" "https://github.com/gchq/stroom/issues/5688" >}}** : Tell CSV search callers whether their results are complete, and add `incremental` and `timeout` query parameters so a slow query can return its full result set rather than silently returning nothing.

* Issue **{{< external-link "#5719" "https://github.com/gchq/stroom/issues/5719" >}}** : Fix favourites not including folders.

* Issue **{{< external-link "#5723" "https://github.com/gchq/stroom/issues/5723" >}}** : Fix QuickFilter passing partial text to credentials.

* Issue **{{< external-link "#5724" "https://github.com/gchq/stroom/issues/5724" >}}** : Fix QuickFilter field qualifier so it only applies to known fields. This allows unquoted date/time text.

* Issue **{{< external-link "#5720" "https://github.com/gchq/stroom/issues/5720" >}}** : Fix QuickFilter fields for dependencies.

* Issue **{{< external-link "#5645" "https://github.com/gchq/stroom/issues/5645" >}}** : Change the dashboard/query `xpath()` function to concatenate the values of all matched items, evaluate expressions with XPath 3.1 (Saxon) rather than XPath 1.0, take namespace prefix mappings as a single `'prefix:uri prefix2:uri2'` argument and ignore namespaces altogether when no mappings are supplied. It also adds an optional delimiter argument.

* Change the dashboard/query `jq()` function to concatenate the values of all matched elements rather than rendering them as a Java list, e.g. `[2, 3]`. It also adds an optional delimiter argument and stops the expression being re-compiled for every row.

* Issue **{{< external-link "#5726" "https://github.com/gchq/stroom/issues/5726" >}}** : Fix Stroom & Proxy docker images so the SIGTERM from a Docker `stop` is passed through to Dropwizard for a graceful shutdown.

* Issue **{{< external-link "#5705" "https://github.com/gchq/stroom/issues/5705" >}}** : Log a failure to get a Plan B shard at debug level rather than error as the failure is rethrown and reported by the caller, e.g. to the stream processing error file.

* Issue **{{< external-link "#5705" "https://github.com/gchq/stroom/issues/5705" >}}** : Stop a Plan B snapshot fetch treating a 304 Not Modified answer from the store node as a fetch failure, which made lookups fail once the snapshot of an unchanged store aged out.

* Issue **{{< external-link "#5707" "https://github.com/gchq/stroom/issues/5707" >}}** : Fix `lastName` arg on create_account command being used for `firstName`.

* Change stroom CLI commands to mask the value of arguments for key `password` in the logs.

* Issue **{{< external-link "#5706" "https://github.com/gchq/stroom/issues/5706" >}}** : Log a failure to send Plan B data to a node at debug level rather than error as the failure is rethrown and reported by the caller, e.g. to the stream processing error file.

* Issue **{{< external-link "#4621" "https://github.com/gchq/stroom/issues/4621" >}}** : Honour hidden columns when running Reports, and persist the hidden state of a column against Report and Analytic Rule documents so that it survives a save.

* Issue **{{< external-link "#5176" "https://github.com/gchq/stroom/issues/5176" >}}** : Disable rule execution if no error feed is configured.

* Issue **{{< external-link "#5176" "https://github.com/gchq/stroom/issues/5176" >}}** : Remove the need to set default feeds and nodes before being able to create rules and reports.

* Issue **{{< external-link "#5176" "https://github.com/gchq/stroom/issues/5176" >}}** : Validate scheduled executors to ensure an execution node is specified.

* Issue **{{< external-link "#5553" "https://github.com/gchq/stroom/issues/5553" >}}** : Fix DocRefInfo cache bug.

* Issue **{{< external-link "#4073" "https://github.com/gchq/stroom/issues/4073" >}}** : Stop explorer scrolling to the top on deleting an item.

* Issue **{{< external-link "#5697" "https://github.com/gchq/stroom/issues/5697" >}}** : Fix the UI bootstrap never recognising a user authenticated by an edge proxy (e.g. AWS ALB + Cognito, NGINX + oauth2-proxy): `/api/auth/flow/v1/status` now accepts a verified request token, and the new `security.authentication.edgeAuthentication` config block suppresses stroom's own OIDC flow and supports edge-aware logout when the proxy is the relying party.

* Issue **{{< external-link "#5696" "https://github.com/gchq/stroom/issues/5696" >}}** : Stop the Plan B merge processor deleting un-merged queued data at startup and stop merge queue consumers churning through the queue when merges are interrupted at shutdown. Data queued for merge now survives a restart and interrupted merges are rerun when the merge job next runs.

* Issue **{{< external-link "#5696" "https://github.com/gchq/stroom/issues/5696" >}}** : Fix Plan B merges double counting for histograms and metrics on resume.

* Issue **{{< external-link "#5696" "https://github.com/gchq/stroom/issues/5696" >}}** : Stop Plan B histogram and metric stores double counting when a merge is rerun, e.g. after an interrupted shutdown, a duplicate part delivery or a sender retry. Each part shard now carries an instance UUID and additive stores track per source merge progress, skipping fully merged sources and resuming interrupted merges exactly after their last commit.

* Issue **{{< external-link "#5696" "https://github.com/gchq/stroom/issues/5696" >}}** : Backport the Plan B filter staging buffer reuse from 7.13 so that a pooled buffer is no longer allocated and abandoned for every value element loaded.

* Issue **{{< external-link "#5689" "https://github.com/gchq/stroom/issues/5689" >}}** : Fix issue where snapshots were not found.

* Issue **{{< external-link "#5692" "https://github.com/gchq/stroom/issues/5692" >}}** : Fix `getState()` reporting "No state doc can be found for name: ..." for a Plan B store. The Scylla backed state provider is no longer registered, so it can no longer mask the Plan B provider.

* Issue **{{< external-link "#5689" "https://github.com/gchq/stroom/issues/5689" >}}** : Stop the Plan B startup cleanup deleting snapshots published by a node that stores shards, and stop a failed snapshot creation being recorded as a success, which could leave a shard that receives no further writes unable to publish a snapshot again.

* Issue **{{< external-link "#5689" "https://github.com/gchq/stroom/issues/5689" >}}** : Rework the Plan B snapshot serving strategy. Slightly stale snapshot data is now served, bounded by `minTimeToKeepSnapshotEnv`, while a refresh happens in the background. Reads with no servable snapshot block on a fetch when it may succeed, e.g. the first fetch, and fail fast when one has recently failed. A NOT_MODIFIED response now counts as confirmation that data is current rather than being treated as a fetch failure, and the first fetch no longer happens during shard creation.

* Issue **{{< external-link "#5669" "https://github.com/gchq/stroom/issues/5669" >}}** : Fix `HttpClientConfigConverter` not mapping `verifyHostname`, which prevented TLS hostname verification being disabled on HTTP clients.

* Issue **{{< external-link "#5671" "https://github.com/gchq/stroom/issues/5671" >}}** : Run directory-scanner file ingest as the processing user so that receipt checks requiring a user succeed.

* Issue **{{< external-link "#5674" "https://github.com/gchq/stroom/issues/5674" >}}** : Fix dirty behaviour on pipeline structure changes.

* Issue **{{< external-link "#5680" "https://github.com/gchq/stroom/issues/5680" >}}** : Fix account migration script.

* Issue **{{< external-link "#5679" "https://github.com/gchq/stroom/issues/5679" >}}** : Fix slow processor task assignment on large clusters. Task queueing now takes account of processing profiles so that tasks no node is allowed to process are not queued, and are released if a profile stops allowing them. Task assignment no longer repeatedly fills the queue when there is nothing to add, and only one request fills the queue at a time while the others wait for it.

* Issue **{{< external-link "#5679" "https://github.com/gchq/stroom/issues/5679" >}}** : Fix processor task creation not recording errors against the filter tracker, and not stopping when a task creation limit has been reached.

* Issue **{{< external-link "#5685" "https://github.com/gchq/stroom/issues/5685" >}}** : Fix inability to unset **Max Processing Tasks** on a processor filter.

* Issue **{{< external-link "#5678" "https://github.com/gchq/stroom/issues/5678" >}}** : Fix processor task retention only using the `stroom.processor.deleteAge` value that was current when the node started. The `Processor Task Retention` job now reads the property on each run, so a change to it takes effect without a node restart.

* Issue **{{< external-link "#5663" "https://github.com/gchq/stroom/issues/5663" >}}** : Fix OpenAPI spec for polymorphic types.

* Issue **{{< external-link "#5665" "https://github.com/gchq/stroom/issues/5665" >}}** : Change the basis for time variable replacement from now() to the meta create time when the stream store uses S3. The S3Appender still used now(). Also fix a bug with use of pipeline scoped objects outside of pipeline scope.

* Issue **{{< external-link "#5647" "https://github.com/gchq/stroom/issues/5647" >}}** : Fix user entered name being ignored when creating a new volume group.

* Issue **{{< external-link "#5646" "https://github.com/gchq/stroom/issues/5646" >}}** : Fix onChange() behaviour for document edits.

* Issue **{{< external-link "#5651" "https://github.com/gchq/stroom/issues/5651" >}}** : Fix file uploads bug introduced by CSRF change.

* Fix type in Data Volume validation message.

* Issue **{{< external-link "#5657" "https://github.com/gchq/stroom/issues/5657" >}}** : Improve Plan B lookup error handling.

* Issue **{{< external-link "#5560" "https://github.com/gchq/stroom/issues/5560" >}}** : Fix processing schedule list label.

* Issue **{{< external-link "#5548" "https://github.com/gchq/stroom/issues/5548" >}}** : Fix PlanB filter XML value bug.

* Issue **{{< external-link "#5562" "https://github.com/gchq/stroom/issues/5562" >}}** : Add missing tab types to session restore.

* Issue **{{< external-link "#5617" "https://github.com/gchq/stroom/issues/5617" >}}** : Fix tab visibility on resize.

* Issue **{{< external-link "#5621" "https://github.com/gchq/stroom/issues/5621" >}}** : Support numeric comparators for Elasticsearch float and double fields.

* Issue **{{< external-link "#5573" "https://github.com/gchq/stroom/issues/5573" >}}** : Fix Ask Stroom AI error handling behaviour when requests are too large.

* Issue **{{< external-link "#5574" "https://github.com/gchq/stroom/issues/5574" >}}** : Fix Ask Stroom AI dock behaviour.

* Issue **{{< external-link "#5575" "https://github.com/gchq/stroom/issues/5575" >}}** : Change ask Stroom AI table page menu item.

* Issue **{{< external-link "#5576" "https://github.com/gchq/stroom/issues/5576" >}}** : Increase default AI model HTTP timeouts to 10 minutes.

* Issue **{{< external-link "#5585" "https://github.com/gchq/stroom/issues/5585" >}}** : Fix dashboard tab rename bug.

* Issue **{{< external-link "#5577" "https://github.com/gchq/stroom/issues/5577" >}}** : Fix bug affecting AI chat model selection.

* Issue **{{< external-link "#5601" "https://github.com/gchq/stroom/issues/5601" >}}** : Fix bug stopping embedded queries being edited.

* Issue **{{< external-link "#5568" "https://github.com/gchq/stroom/issues/5568" >}}** : Add analytic rule info to error stream messages.

* Issue **{{< external-link "#5636" "https://github.com/gchq/stroom/issues/5636" >}}** : Fix expression term quote removal bug.

* Issue **{{< external-link "#5640" "https://github.com/gchq/stroom/issues/5640" >}}** : Fix CSRF checks.

* Issue **{{< external-link "#5596" "https://github.com/gchq/stroom/issues/5596" >}}** : Change S3Appender to replace path variables using the current time rather than the stream create time. This is to bring it into line with the FileAppender.

* Issue **{{< external-link "#5637" "https://github.com/gchq/stroom/issues/5637" >}}** : Fix doc perm issue.

* Issue **{{< external-link "#5606" "https://github.com/gchq/stroom/issues/5606" >}}** : Fix processor filter RunAs permissions.

* Issue **{{< external-link "#5605" "https://github.com/gchq/stroom/issues/5605" >}}** : Fix pipeline stepping bug.

* Change the behaviour of JSON deserialisation to not error when a null value is encountered for a primitive type. This is how it used to behave in 7.12. However it now logs an error if a null primitive is encountered, so the corresponding Java class can be fixed to properly support null values.

* Issue **{{< external-link "#5579" "https://github.com/gchq/stroom/issues/5579" >}}** : Change test collation to utf8mb4_0900_ai_ci.

* Issue **{{< external-link "#5558" "https://github.com/gchq/stroom/issues/5558" >}}** : Fix processor profiles allowing processing for disabled node groups.

* Issue **{{< external-link "#5584" "https://github.com/gchq/stroom/issues/5584" >}}** : Change the way the special singleton documents `DataRetentionRules`, `ReceiveDataRuleSet` and `ContentTemplates` are created for the first time. Now uses a cluster lock to ensure only one of each is ever created.

* Issue **{{< external-link "#5592" "https://github.com/gchq/stroom/issues/5592" >}}** : Fix `Volume Cache` so entries are invalidated when a data volume is changed/deleted. Also fix data volume selection so that the cached map of available volumes is cleared when a volume is changed/deleted/created. Default value for `stroom.data.filesystemVolume.volumeCache.expireAfterAccess` has changed from PT10M to null and `stroom.data.filesystemVolume.volumeCache.expireAfterWrite` has changed from null to PT10M. This is to ensure that cached items are not held indefinitely.

* Fix DocRef hover copy/open links not appearing.

* Issue **{{< external-link "#5535" "https://github.com/gchq/stroom/issues/5535" >}}** : Fix simple string values not appearing in Pipeline Property table.

* Fix Null Pointer type bug on Data Receipt Rules screen.

* Fix typo in query snippet name (`Eval first first value` => `Eval first value`).

* Issue **{{< external-link "#5549" "https://github.com/gchq/stroom/issues/5549" >}}** : Make jffi extract its native library to the same dir as the LMDB native library file. Add the config prop `providedJffiLibraryPath` to allow for a provided jffi lib.

* Issue **{{< external-link "#5544" "https://github.com/gchq/stroom/issues/5544" >}}** : Fix DocRef bug.

* Issue **{{< external-link "#5518" "https://github.com/gchq/stroom/issues/5518" >}}** : Fix expression editor bug.

* Issue **{{< external-link "#5507" "https://github.com/gchq/stroom/issues/5507" >}}** : Improve dashboard column filtering.

* Issue **{{< external-link "#5516" "https://github.com/gchq/stroom/issues/5516" >}}** : Allow event links with only feed USE permission.

* Fix permission exceptions when getting volume system info.

* Issue **{{< external-link "#5532" "https://github.com/gchq/stroom/issues/5532" >}}** : Relax Data Feed Identities validation so salt is optional.

* Issue **{{< external-link "#5520" "https://github.com/gchq/stroom/issues/5520" >}}** : Fix annotation decoration in queries/dashboards not working if the EventId/StreamId columns are not longs.

* Fix annotation dash/query columns not updating when status/label/collection names are deleted/modified.

* Fix annotation decorations in dash/query columns showing deleted annotation entries.

* Fix annotation Comment and History columns not updating when entries are added/updated/deleted.

* Issue **{{< external-link "#5508" "https://github.com/gchq/stroom/issues/5508" >}}** : Improve annotation decoration performance.

* Fix Annotation -> Events screen not refreshing the linked events list when an event link is added/removed.

* Add missing directories (data_feed_identities, git_repo, lmdb_library, planb, reference_staging_data) as volumes in the docker image.

* Fix output of the manage_users --listPermissions command.

* Fix missing arg validation on reset_password CLI command. Obfuscate password in logging.

* Issue **{{< external-link "#5503" "https://github.com/gchq/stroom/issues/5503" >}}** : Fix search rerank LLM processing and add debug logging.

* Issue **{{< external-link "#5484" "https://github.com/gchq/stroom/issues/5484" >}}** : Fix stream browser Retention column and Info pane showing wrong retention period/rule.

* Issue **{{< external-link "#5486" "https://github.com/gchq/stroom/issues/5486" >}}** : Fix SQL to physically delete annotations.

* Issue **{{< external-link "#5488" "https://github.com/gchq/stroom/issues/5488" >}}** : Fix `forwardFileDestinations[n].atomicMoveEnabled` property not being used.

* Issue **{{< external-link "#5485" "https://github.com/gchq/stroom/issues/5485" >}}** : Fix Plan B snapshot race condition bug.

* Issue **{{< external-link "#5495" "https://github.com/gchq/stroom/issues/5495" >}}** : Fix query column order bug.

* Issue **{{< external-link "#5495" "https://github.com/gchq/stroom/issues/5495" >}}** : Add option to reset query table customisation.


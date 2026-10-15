---
title: "Change Log"
linkTitle: "Change Log"
weight: 50
date: 2026-03-04
tags: 
description: >
  Full list of changes in this release.
---

<!--
To build this list run diff_changelog.sh in the root of the stroom repo.
E.g. ./diff_changelog.sh 7.10 7.11 | sed -E -e 's/^/\n/' -e 's|Issue \*\*#([0-9]+)\*\*|Issue **{{< external-link "#\1" "https://github.com/gchq/stroom/issues/\1" >}}**|g'

OR, if you use Vim use this command to read it straight into this buffer
(Hash '#' needs to be escaped with '\' to stop vim replacing it with the current file path)
:r !../stroom_v7_11/diff_changelog.sh 7.10 7.11 | sed -E -e 's/^/\n/' -e 's|Issue \*\*\#([0-9]+)\*\*|Issue **{{< external-link "\#\1" "https://github.com/gchq/stroom/issues/\1" >}}**|g'
-->

## Features and Changes

* Issue **{{< external-link "#5455" "https://github.com/gchq/stroom/issues/5455" >}}** : Add DictionaryAppender to pipelines as an optional pipeline destination.

* Issue **{{< external-link "#5313" "https://github.com/gchq/stroom/issues/5313" >}}** : Allow users to prevent empty reports from being sent on a per report basis.

* Issue **{{< external-link "#5314" "https://github.com/gchq/stroom/issues/5314" >}}** : Add `rowCount`, `fileType` (EXCEL|CSV|TSV), `fileName` to the templating context when generating email reports.

* Add enabled/disabled styling to table rows in the Report screens.

* Add column header tool tips to tables in the Report screens.

* Change the Report > Notifications _Max_ column to be right aligned.

* Add red/green sytling to the Report > Notifications _Status_ column (Complete/Error).

* Issue **{{< external-link "#5355" "https://github.com/gchq/stroom/issues/5355" >}}** : Fix HttpClient being closed by cache while in use.

* Issue **{{< external-link "#5303" "https://github.com/gchq/stroom/issues/5303" >}}** : Add debug to index dense vector retrieval.

* Issue **{{< external-link "#5344" "https://github.com/gchq/stroom/issues/5344" >}}** : Fix credential manager UI.

* Issue **{{< external-link "#5342" "https://github.com/gchq/stroom/issues/5342" >}}** : Fix issue querying Plan B shards where some stores have been deleted.

* Issue **{{< external-link "#5351" "https://github.com/gchq/stroom/issues/5351" >}}** : Make SSH key and known host configuration clearer.

* Issue **{{< external-link "#5353" "https://github.com/gchq/stroom/issues/5353" >}}** : Fix keystore config issue.

* Issue **{{< external-link "#5282" "https://github.com/gchq/stroom/issues/5282" >}}** : Processor task creation now supports feed dependencies to delay processing until reference data is available.

* Issue **{{< external-link "#5339" "https://github.com/gchq/stroom/issues/5339" >}}** : Fix NPE thrown when adding vises to dashboards.

* Issue **{{< external-link "#5337" "https://github.com/gchq/stroom/issues/5337" >}}** : Fix analytic doc serialisation.

* Issue **{{< external-link "#5100" "https://github.com/gchq/stroom/issues/5100" >}}** : Fix selection filters auto quoting parameter replacements.

* Issue **{{< external-link "#4124" "https://github.com/gchq/stroom/issues/4124" >}}** : Fix NodeResultSerialiser and add node name to errors.

* Issue **{{< external-link "#5256" "https://github.com/gchq/stroom/issues/5256" >}}** : Add option to omit documentation from rule detection.

* Issue **{{< external-link "#5309" "https://github.com/gchq/stroom/issues/5309" >}}** : Add long support to pathway values.

* Remove static imports except in test classes.

* Uplift base docker images to eclipse-temurin:25.0.1_8-jdk-alpine-3.23.

* Uplift dependency com.hubspot.jinjava:jinjava from 2.7.2 to 2.8.2.

* Uplift dependency swagger-* from 2.2.38 to 2.2.41.

* Uplift com.sun.xml.bind:jaxb-impl from 4.0.5 to 4.0.6.

* Uplift lanchain4j dependencies from 1.8.0-beta15 to 1.10.0-beta18 and 1.8.0 to 1.10.0.

* Issue **{{< external-link "#5303" "https://github.com/gchq/stroom/issues/5303" >}}** : Make AI HTTP connection configurable.

* Issue **{{< external-link "#5303" "https://github.com/gchq/stroom/issues/5303" >}}** : Make AI HTTP SSL certificate stores configurable.

* Issue **{{< external-link "#5303" "https://github.com/gchq/stroom/issues/5303" >}}** : Add KNN dense vector support to Lucene indexes.

* Issue **{{< external-link "#5303" "https://github.com/gchq/stroom/issues/5303" >}}** : Pass only visible columns to the Ask Stroom AI service.

* Issue **{{< external-link "#5317" "https://github.com/gchq/stroom/issues/5317" >}}** : Pathways now load current state to not endlessly output mutations.

* Issue **{{< external-link "#4123" "https://github.com/gchq/stroom/issues/4123" >}}** : New pipeline stepping mode.

* Issue **{{< external-link "#5318" "https://github.com/gchq/stroom/issues/5318" >}}** : Fix Plan B session condensation.

* Issue **{{< external-link "#5288" "https://github.com/gchq/stroom/issues/5288" >}}** : Fix config defaults for `ForwardHttpPostConfig` and `HttpClientConfiguration`.

* Issue **{{< external-link "#5281" "https://github.com/gchq/stroom/issues/5281" >}}** : Fix behaviour of query expression IN condition.

* Issue **{{< external-link "#5290" "https://github.com/gchq/stroom/issues/5290" >}}** : Plan B trace store now requires data to conform to Plan B trace schema.

* Fix build issue causing Stroom to not boot.

* Issue **{{< external-link "#5304" "https://github.com/gchq/stroom/issues/5304" >}}** : Fix error when unzipping the stroom-app-all jar file. This problem was also leading to AV scan alerts.

* Fix Files list on Stream Info pane so that you can copy each file path individually.

* Uplift Gradle to v9.2.1.

* Issue **{{< external-link "#5297" "https://github.com/gchq/stroom/issues/5297" >}}** : Fix missing execute permissions and incorrect file dates in stroom and stroom-proxy distribution ZIP files.

* Uplift docker image JDK to `eclipse-temurin:25_36-jdk-alpine-3.22`.

* Issue **{{< external-link "#5259" "https://github.com/gchq/stroom/issues/5259" >}}** : Fix PlanB Val.toString() NPE.

* Bumps org.quartz-scheduler:quartz from 2.5.0-rc1 to 2.5.1.

* Bumps org.eclipse.transformer:org.eclipse.transformer.cli from 0.5.0 to 1.0.0.

* Issue **{{< external-link "#5291" "https://github.com/gchq/stroom/issues/5291" >}}** : Fix explorer item sort order.

* Issue **{{< external-link "#5152" "https://github.com/gchq/stroom/issues/5152" >}}** : Fix position of the Clear icon on the Quick Filter.

* Make the Quick Filter Help button hide the help popup if it is visible.

* Add the same Quick Filter help popup as used on the explorer QF to the QFs on Dashboard table columns, Query help and Expression Term editors.

* Issue **{{< external-link "#5293" "https://github.com/gchq/stroom/issues/5293" >}}** : Fix pipeline element type and name display.

* Issue **{{< external-link "#5229" "https://github.com/gchq/stroom/issues/5229" >}}** : Change the default main method for the stroom-headless jar to be Headless rather than Cli. Fix errors when running stroom-headless.

* Issue **{{< external-link "#5257" "https://github.com/gchq/stroom/issues/5257" >}}** : Upgrade Lucene to 10.3.1.

* Issue **{{< external-link "#5263" "https://github.com/gchq/stroom/issues/5263" >}}** : Add copy for selected rows.

* Remove default value for `feedStatus.url` in the proxy config yaml as downstream host should now be used instead.

* Issue **{{< external-link "#5192" "https://github.com/gchq/stroom/issues/5192" >}}** : Support Elasticsearch kNN search on dense_vector fields.

* Issue **{{< external-link "#5124" "https://github.com/gchq/stroom/issues/5124" >}}** : Change cluster lock `tryLock` to use the database record locks rather than the inter-node lock handler.

* Issue **{{< external-link "#5254" "https://github.com/gchq/stroom/issues/5254" >}}** : Fix document NPE.

* Issue **{{< external-link "#5250" "https://github.com/gchq/stroom/issues/5250" >}}** : Add a new property `stroom.security.identity.autoCreateAdminAccountOnBoot` to control auto-creation of the default administrator account `admin` when stroom is running with an identity provider type of `INTERNAL_IDP` or `TEST_CREDENTIALS`. Enabling this property will create the `admin` account and stroom user. It will create the group `Administrators`, grant the app permission `Administrator` to it and add the `admin` user to the group. The auto-creation of the admin account/user was erroneously removed in a previous version of stroom.

* Change default for `.receive.enabledAuthenticationTypes` to `[CERTIFICATE,TOKEN]` and add `.receive.authenticationRequired` to the default docker config yml files for both stroom and proxy.

* Issue **{{< external-link "#5218" "https://github.com/gchq/stroom/issues/5218" >}}** : When `autoContentCreation` is enabled, don't attempt to find a content template if the `Feed` header has been provided and the feed exists.

* Issue **{{< external-link "#5244" "https://github.com/gchq/stroom/issues/5244" >}}** : Fix proxy throwing an error when attempting to do a feed status check.

* Issue **{{< external-link "#5186" "https://github.com/gchq/stroom/issues/5186" >}}** : Remove error logging for expected Plan B snapshot checking behaviour.

* Issue **{{< external-link "#5220" "https://github.com/gchq/stroom/issues/5220" >}}** : Fix duplicate check column list change confirm dialog not showing if the duplicate check store is on a remote node.

* Issue **{{< external-link "#5126" "https://github.com/gchq/stroom/issues/5126" >}}** : Improve Plan B null handling.

* Issue **{{< external-link "#5225" "https://github.com/gchq/stroom/issues/5225" >}}** : Fix NPE on DocRef.

* Issue **{{< external-link "#5237" "https://github.com/gchq/stroom/issues/5237" >}}** : Fix Plan B lookup no content error.

* Issue **{{< external-link "#656" "https://github.com/gchq/stroom/issues/656" >}}** : Allow table filters to use dictionaries.

* Issue **{{< external-link "#672" "https://github.com/gchq/stroom/issues/672" >}}** : Dashboards will only auto refresh when selected.

* Issue **{{< external-link "#5149" "https://github.com/gchq/stroom/issues/5149" >}}** : Fix context menus not appearing on dashboard tables.

* Issue **{{< external-link "#2029" "https://github.com/gchq/stroom/issues/2029" >}}** : Add OS memory stats to the node status stats.

* Uplift dependency java-jwt 4.4.0 => 4.5.0.

* Uplift org.apache.commons:commons-csv from 1.10.0 to 1.14.1.

* Uplift dependency org.apache.commons:commons-pool2 from 2.12.0 to 2.12.1.

* Issue **{{< external-link "#3799" "https://github.com/gchq/stroom/issues/3799" >}}** : Search for tags in Find In Content.

* Issue **{{< external-link "#3335" "https://github.com/gchq/stroom/issues/3335" >}}** : Preserve escape chars not preceding delimiters.

* Bumps jooq from 3.20.5 to 3.20.8.

* Bumps com.mysql:mysql-connector-j from 9.2.0 to 9.4.0.

* Bumps flyway from 11.9.1 to 11.14.0.

* Issue **{{< external-link "#1429" "https://github.com/gchq/stroom/issues/1429" >}}** : Protect against large file ingests.

* Add a proxy zip file ingest mechanism to proxy. Add property branch `proxyConfig.dirScanner` to the config.

* Issue **{{< external-link "#5175" "https://github.com/gchq/stroom/issues/5175" >}}** : Fix zip handling.

* Fix config validation not being run on config branches that are items in a list, e.g. `forwardHttpDestinations`.

* Remove `NotNull` validation condition on `forwardHttpDestinations[n].apiKey` as proxy may use OAuth tokens to authenticate with the downstream destination.

* Issue **{{< external-link "#5175" "https://github.com/gchq/stroom/issues/5175" >}}** : Add warning messages to stroom and proxy `/datafeed` to warn if a zip is received that contains paths that would unzip outside of a target directory. Only a warning as the paths in a zip sent to `/datafeed` are not used by stroom/proxy.

* Uplift all the content packs that are included in the docker and zip distributions.

* Issue **{{< external-link "#5191" "https://github.com/gchq/stroom/issues/5191" >}}** : Fix UI NPE.

* Issue **{{< external-link "#5189" "https://github.com/gchq/stroom/issues/5189" >}}** : Change how the proxy directory queues are initialised. Now on initialisation, the min/max ids take into account incomplete paths, so if the largest path is `1/900` then the max id will be taken to be `900999`. When proxy is getting the next item off the queue it will delete any incomplete paths it finds en-route to the next valid item.

* Issue **{{< external-link "#5126" "https://github.com/gchq/stroom/issues/5126" >}}** : Fix Plan B condense.

* Issue **{{< external-link "#5200" "https://github.com/gchq/stroom/issues/5200" >}}** : Fix problem of duplicate check store failing to open due to its directory being deleted.

* Issue **{{< external-link "#5201" "https://github.com/gchq/stroom/issues/5201" >}}** : Clear out the duplicate check store if the column names are changed. Add a confirm dialog to the Analytic Rule doc save action, to get the user to confirm that all dup check data will be deleted when there is a change to the derived/explicit dup check columns.

* Issue **{{< external-link "#5198" "https://github.com/gchq/stroom/issues/5198" >}}** : Increase the maximum limit for `top()` to 10,000.

* Issue **{{< external-link "#5117" "https://github.com/gchq/stroom/issues/5117" >}}** : Send Plan B data to all enabled target nodes regardless of active status.

* Issue **{{< external-link "#5146" "https://github.com/gchq/stroom/issues/5146" >}}** : Fix use of not equals in annotation queries.

* Issue **{{< external-link "#5145" "https://github.com/gchq/stroom/issues/5145" >}}** : Expand all now affects favourites.

* Issue **{{< external-link "#5109" "https://github.com/gchq/stroom/issues/5109" >}}** : Fix pipeline migration.

* Issue **{{< external-link "#5147" "https://github.com/gchq/stroom/issues/5147" >}}** : Fix proxy omitting allowed headers (e.g. 'Feed') if the case does not match that in the allowed set.

* Issue **{{< external-link "#5148" "https://github.com/gchq/stroom/issues/5148" >}}** : Allow annotation users to edit labels.

* Issue **{{< external-link "#4121" "https://github.com/gchq/stroom/issues/4121" >}}** : Add rename option for pipeline elements.

* Issue **{{< external-link "#2374" "https://github.com/gchq/stroom/issues/2374" >}}** : Add pipeline element descriptions.

* Issue **{{< external-link "#4099" "https://github.com/gchq/stroom/issues/4099" >}}** : Add InRange function.

* Issue **{{< external-link "#2374" "https://github.com/gchq/stroom/issues/2374" >}}** : Add description is now editable for pipeline elements.

* Issue **{{< external-link "#268" "https://github.com/gchq/stroom/issues/268" >}}** : Add not contains and not exists filters to pipeline stepping.

* Issue **{{< external-link "#844" "https://github.com/gchq/stroom/issues/844" >}}** : Add functions for hostname and hostaddress.

* Issue **{{< external-link "#4579" "https://github.com/gchq/stroom/issues/4579" >}}** : Add table name/id to conditional formatting exceptions.

* Issue **{{< external-link "#4124" "https://github.com/gchq/stroom/issues/4124" >}}** : Show severity of search error messages.

* Issue **{{< external-link "#4369" "https://github.com/gchq/stroom/issues/4369" >}}** : Add new rerun scheduled execution icon.

* Issue **{{< external-link "#3207" "https://github.com/gchq/stroom/issues/3207" >}}** : Add maxStringFieldLength table setting.

* Issue **{{< external-link "#1249" "https://github.com/gchq/stroom/issues/1249" >}}** : Dashboard links can open in the same tab.

* Issue **{{< external-link "#1304" "https://github.com/gchq/stroom/issues/1304" >}}** : Copy dashboard components between dashboards.

* Issue **{{< external-link "#4614" "https://github.com/gchq/stroom/issues/4614" >}}** : Fix StroomQL highlight.

* Issue **{{< external-link "#2145" "https://github.com/gchq/stroom/issues/2145" >}}** : New add-meta xslt function.

* Issue **{{< external-link "#370" "https://github.com/gchq/stroom/issues/370" >}}** : Perform schema validation on save.

* Issue **{{< external-link "#397" "https://github.com/gchq/stroom/issues/397" >}}** : Copy user permissions.

* Issue **{{< external-link "#5088" "https://github.com/gchq/stroom/issues/5088" >}}** : Add table column filter dashboard component.

* Issue **{{< external-link "#2571" "https://github.com/gchq/stroom/issues/2571" >}}** : Show Tasks for processor filter.

* Issue **{{< external-link "#4177" "https://github.com/gchq/stroom/issues/4177" >}}** : Add stream id links.

* Issue **{{< external-link "#2279" "https://github.com/gchq/stroom/issues/2279" >}}** : Drag and drop tabs.

* Issue **{{< external-link "#2584" "https://github.com/gchq/stroom/issues/2584" >}}** : Close all tabs to right/left.

* Issue **{{< external-link "#5013" "https://github.com/gchq/stroom/issues/5013" >}}** : Add row data to annotations.

* Issue **{{< external-link "#3049" "https://github.com/gchq/stroom/issues/3049" >}}** : Check for full/inactive/closed index volumes.

* Issue **{{< external-link "#4070" "https://github.com/gchq/stroom/issues/4070" >}}** : Show column information on hover tip.

* Issue **{{< external-link "#3815" "https://github.com/gchq/stroom/issues/3815" >}}** : Add selected tab colour property.

* Issue **{{< external-link "#4790" "https://github.com/gchq/stroom/issues/4790" >}}** : Add copy option for property names.

* Issue **{{< external-link "#2823" "https://github.com/gchq/stroom/issues/2823" >}}** : Add `autoImport` servlet to simplify importing content.

* Issue **{{< external-link "#5013" "https://github.com/gchq/stroom/issues/5013" >}}** : Add data to existing annotations.

* Issue **{{< external-link "#5013" "https://github.com/gchq/stroom/issues/5013" >}}** : Add links to other annotations and allow comments to make references to events and other annotations.

* Issue **{{< external-link "#4048" "https://github.com/gchq/stroom/issues/4048" >}}** : Add query csv API.

* Issue **{{< external-link "#5064" "https://github.com/gchq/stroom/issues/5064" >}}** : Fix ref data store discovery.

* Issue **{{< external-link "#5065" "https://github.com/gchq/stroom/issues/5065" >}}** : Make public key URI configurable.

* Change the proxy config properties `forwardUrl`, `livenessCheckUrl`, `apiKeyVerificationUrl` and `feedStatusUrl` to be empty by default and to allow them to be populated with either just a path or a full URL. `downstreamHost` config will be used to provide the host details if these properties are empty or only contain a path. Added the property `livenessCheckEnabled` to `forwardHttpDestinations` to control whether the forward destination liveness is checked (defaults to true).

* Issue **{{< external-link "#5028" "https://github.com/gchq/stroom/issues/5028" >}}** : Add build info metrics `buildVersion`, `buildDate` and `upTime`.

* Add admin port servlets for Prometheus to scrape metrics from stroom and proxy. Servlet is available as `http://host:<admin port>/(stroom|proxy)Admin/prometheusMetrics`.

* Issue **{{< external-link "#4735" "https://github.com/gchq/stroom/issues/4735" >}}** : Add expand/collapse to result tables.

* Issue **{{< external-link "#5013" "https://github.com/gchq/stroom/issues/5013" >}}** : Allow annotation status update without requery.

* Issue **{{< external-link "#5022" "https://github.com/gchq/stroom/issues/5022" >}}** : Fix weird spinner behaviour.

* Issue **{{< external-link "#259" "https://github.com/gchq/stroom/issues/259" >}}** : Maximise dashboard panes.

* Issue **{{< external-link "#5016" "https://github.com/gchq/stroom/issues/5016" >}}** : Fix sort state visibility on query table.

* Issue **{{< external-link "#5034" "https://github.com/gchq/stroom/issues/5034" >}}** : Fix query field help refresh.

* Issue **{{< external-link "#5025" "https://github.com/gchq/stroom/issues/5025" >}}** : Fix parsing of hyperlinks in dashboard cells.

* Add in validation of the Conditional Formatting custom style colours to ensure the user can only enter valid colours and nothing else.

* Replace incorrect uses of `appendHtmlConstant` with SafeHtmlTemplate.

* Issue **{{< external-link "#5012" "https://github.com/gchq/stroom/issues/5012" >}}** : Fix errors when trying to use `lookup()` with a Context stream.

* Fix bug in reference data loading when the reference data value is XML that includes an element called `<value>`.

* Fix behaviour in reference data loading of XML values where attributes with no explicit namespace would be given the unnamed namespace of the parent `referenceData` document, i.e. `<ci:data xmlns="reference-data:2" name="name" value="001" />`.

* Issue **{{< external-link "#3874" "https://github.com/gchq/stroom/issues/3874" >}}** : Add copy context menu to tables.

* Fix NPE when proxy tries to fetch the receipt rules from downstream.

* Add the Receive Data Rules screen to the Administration menu which requires the `Manage Data Receipt Rules` app permission. Add the following new config properties to the `receive` branch: `obfuscatedFields`, `obfuscationHashAlgorithm`, `receiptCheckMode` and `receiptRulesInitialFields`. Remove the property `receiptPolicyUuid`. Add the proxy config property `contentSync.receiveDataRulesUrl`.

* The proxy config property `feedStatus.enabled` has been replaced by `receive.receiptCheckMode` which takes values `FEED_STATUS`, `RECEIPT_POLICY` or `NONE`.

* In the proxy config, the named Jersey clients CONTENT_SYNC and FEED_STATUS have been removed and replaced with DOWNSTREAM.


## Bug Fixes

* Issue **{{< external-link "#5471" "https://github.com/gchq/stroom/issues/5471" >}}** : Fix bug in INFO logging output (the count of remaining shards) when flushing/deleting index shards.

* Issue **{{< external-link "#5466" "https://github.com/gchq/stroom/issues/5466" >}}** : Fix asynchronous code that was causing thread deadlocks on machines with a low number of cores (e.g. <= 2). This bug was caused by a change to the JVM.

* Issue **{{< external-link "#5449" "https://github.com/gchq/stroom/issues/5449" >}}** : Change the asynchronous behaviour in the data feed keys directory watcher.

* Issue **{{< external-link "#5449" "https://github.com/gchq/stroom/issues/5449" >}}** : Fix concurrency and exception handling Data Feed Key dir watcher (AbstractDirChangeMonitor).

* Issue **{{< external-link "#5445" "https://github.com/gchq/stroom/issues/5445" >}}** : Revert cache in PipelineDataCacheImpl to be keyed by PipelineDoc.

* Issue **{{< external-link "#5444" "https://github.com/gchq/stroom/issues/5444" >}}** : Initialise pipelineStructurePresenter when opening in stepping mode.

* Issue **{{< external-link "#5434" "https://github.com/gchq/stroom/issues/5434" >}}** : Fix dense vector token limit to be 1024 for Lucene indexing.

* Issue **{{< external-link "#5413" "https://github.com/gchq/stroom/issues/5413" >}}** : Fix column value selection.

* Issue **{{< external-link "#5275" "https://github.com/gchq/stroom/issues/5275" >}}** : Add option to XMLWriter to prevent char 0 disabling output escaping.

* Change proxy event store to close its appenders on app shutdown.

* Fix missing docker managed volues for proxy `zip_file_ingest` and `zip_file_ingest_failed` directories.

* Fix NPE in downstreamHostConfig ctor if there is no hostname, which is a possibility.

* Fix incorrect path for /datafeed in the ProxyWelcomeServlet response.

* Move the `/queues` proxy endpoint from the app port to the admin port.

* Issue **{{< external-link "#5424" "https://github.com/gchq/stroom/issues/5424" >}}** : Change the `receiptCheckMode` `RECEIVE_ALL` to no longer check for the existence of the feed. Add the `receiptCheckMode` `FEED_EXISTENCE` to perform a feed existence check.

* Fix `subPathTemplate.enabled` defaulting to `false` if subPathTemplate has been set in the yaml, but enabled has not.

* Fix bug in proxy which will throw an error if subPathTemplate contains repeated vars, e.g. `${year}/${year}-${month}`.

* Issue **{{< external-link "#5392" "https://github.com/gchq/stroom/issues/5392" >}}** : Fix PlanB segfault.

* Issue **{{< external-link "#5391" "https://github.com/gchq/stroom/issues/5391" >}}** : Fix folder DocRef NPE.

* Issue **{{< external-link "#5300" "https://github.com/gchq/stroom/issues/5300" >}}** : Fix path `millis` parameter.

* Fix Reports not respecting the start date during execution. It was executing from the last tracker time rather than from the start date, if the start date is later.

* Issue **{{< external-link "#5384" "https://github.com/gchq/stroom/issues/5384" >}}** : Improvements to annotations database code.

* Issue **{{< external-link "#5360" "https://github.com/gchq/stroom/issues/5360" >}}** : Fix NPE when annotation data retention fires change events.

* Issue **{{< external-link "#5361" "https://github.com/gchq/stroom/issues/5361" >}}** : Fix invalid SQL error when annotation data retention runs.

* Fix 'Data source already in use' errors when using annotations.

* Add missing cluster lock protection for annotation data retention job.

* Issue **{{< external-link "#5359" "https://github.com/gchq/stroom/issues/5359" >}}** : Fix 'Data source already in use' errors in the _Data Delete_ job.

* Issue **{{< external-link "#5185" "https://github.com/gchq/stroom/issues/5185" >}}** : Fix dashboard maximise NPE.

* Issue **{{< external-link "#5370" "https://github.com/gchq/stroom/issues/5370" >}}** : Hide rule notification doc checkbox on reports as it is not applicable.

* Issue **{{< external-link "#5311" "https://github.com/gchq/stroom/issues/5311" >}}** : Fix documentation markdown edit bug.

* Issue **{{< external-link "#5234" "https://github.com/gchq/stroom/issues/5234" >}}** : Fix spaces in `createAnnotation()` function link text.

* Issue **{{< external-link "#5364" "https://github.com/gchq/stroom/issues/5364" >}}** : Change PlanB snapshots to prevent closure when in use.


---
title: "New Features"
linkTitle: "New Features"
weight: 10
date: 2026-09-03
tags: 
description: >
  New features in Stroom version 7.13.
---

## Stroom AI

### Ask Stroom AI Chat Window

The Ask Stroom AI chat window has been significantly improved.
It can now be docked as a panel and keeps a history of your chats, so you can return to an earlier conversation.

The chat window now also supports:

* Attachments, e.g. table data sent from a Dashboard or Query table, which can be opened and viewed from within the chat.
* Deleting individual messages and attachments from a chat.
* Copying messages and downloading the chat history.
* Viewing the details of a chat.
* Tooltips on each message showing the time it was sent.

Dashboard and Query tables are now given names so that Stroom AI can identify which table it is being asked about.


### Cancelling Ask Stroom AI Queries

Ask Stroom AI queries are now tracked as tasks in the {{< stroom-menu "Monitoring" "Server Tasks" >}} screen, so a long running query can be seen and cancelled by an operator.
Ask Stroom AI requests are also now recorded in the audit event log.


### Embedding Model Dimensions

The _OpenAI Model_ document has a new _Embedding model dimensions_ setting to control the number of dimensions used by embedding models.
Lucene supports a maximum of 1024 dimensions while Elasticsearch can handle 4096.
The setting is optional; set it to zero to let the model use its default.


## Dashboard & StroomQL Functions

### `xpath(...)`

A new [`xpath`]({{< relref "/docs/reference/expression-functions.md#string" >}}) function has been added for extracting values from an XML string in Dashboard and Query tables.

```text
xpath(xml, xpath)
xpath(xml, xpath, namespaces)
xpath(xml, xpath, namespaces, delimiter)
```

The expression is evaluated using {{< glossary "XPath" >}} 3.1 and the string values of all matched items are concatenated in document order, separated by the optional `delimiter`.
If no `namespaces` are supplied then namespaces in the XML are ignored and element and attribute names are matched on their local name only.
Namespace prefix mappings are supplied as a single space delimited string of `prefix:uri` pairs.

For example:

```clike
xpath(${xml}, '/Event/EventDetail/TypeId')
xpath(${xml}, '//evt:User/evt:Id', 'evt:event-logging:3', ', ')
```


### `jq(...)`

A new [`jq`]({{< relref "/docs/reference/expression-functions.md#string" >}}) function has been added for extracting values from a {{< glossary "JSON" >}} string in Dashboard and Query tables using a JQ expression.

```text
jq(json, jq)
jq(json, jq, delimiter)
```

Where the expression matches more than one element, the string values of all the matched elements are concatenated, separated by the optional `delimiter`.

For example:

```clike
jq(${json}, '.user.name')
jq(${json}, '.items[].id', ',')
```


### `dashboard(...)` Link Title

The [`dashboard`]({{< relref "/docs/reference/expression-functions.md#link" >}}) link function now accepts an optional fifth argument, `title`, to set a custom title for the Dashboard tab that the link opens.

```text
dashboard(text, uuid, params, target, title)
```


## User Interface

### Multiple Dashboard Instances

It is now possible to open more than one instance of the same Dashboard at a time using the new _Duplicate Tab_ menu item.
This allows you to view the same Dashboard with, for example, different parameters or time ranges side by side.


### Tab Sessions

You can now save the set of tabs you currently have open as a named tab session and re-open it later.
Tab sessions are managed from the following menu items:

* {{< stroom-menu "Navigation" "Open Tab Session" >}}
* {{< stroom-menu "Navigation" "Save Tab Session" >}}
* {{< stroom-menu "Navigation" "Delete Tab Session" >}}


### Dashboard Tab Menu

The menu for a Dashboard tab is now also available from the settings icon on the tab.


## Pipelines

### Embedded Pipeline Documents

XSLT and Text Converter documents can now be embedded in a Pipeline rather than existing as separate documents in the {{< glossary "Explorer tree" >}}.
When setting the `xslt` or `textConverter` property of a pipeline element, choose a _Source_ of _Embedded_ to create a document that belongs to the Pipeline.
This is useful for translations that are specific to one pipeline and are not shared.


### Stepping Across Multiple Streams

The {{< glossary "Stepper" >}} can now step from one stream to the next.
When you reach the last record in a stream, stepping forward will move on to the first record of the next stream in the list (and stepping backward will move to the previous stream), so you no longer need to manually select each stream in turn.


### Choosing Which Changes to Save

When a Pipeline is saved and other documents it uses (e.g. XSLTs or Text Converters edited while stepping) have also been changed, a dialog now lists all the changed documents.
You can choose which of these documents you want to save.


### JSONParser Long String Handling

The [JSONParser]({{< relref "/docs/reference/pipeline-elements.md#jsonparser" >}}) pipeline element has been changed to protect Stroom from running out of memory when it encounters very long string values.
String values are now streamed to the downstream elements rather than being read into memory in one go, and the following properties have been added:

* `stringTruncateLength` (default `10000`) - String values are truncated to this length and a warning is logged.
* `maxStringLength` (default `100000000`) - String values longer than this result in an error.
* `maxDepth` (default `500`) - The maximum nesting depth of the JSON document; exceeding it results in an error.

Note that downstream XSLT/XPath functions may still read an entire string into memory.

Stroom now also uses version 3 of the Jackson JSON library, which has some differences in behaviour.
Pay particular attention to the output of the _JSONParser_ element after upgrading.
See [Upgrade Notes]({{< relref "upgrade-notes" >}}).


### S3Appender Properties

The [S3Appender]({{< relref "/docs/reference/pipeline-elements.md#s3appender" >}}) pipeline element has the following new properties for setting the corresponding attributes of the objects it writes:

* `cacheControl`
* `contentDisposition`
* `contentEncoding`
* `contentType`


## Stroom XSLT Functions

### `cosine-similarity(...)`

A new [`cosine-similarity`]({{< relref "/docs/reference/xslt-functions/maths-and-vectors.md#cosine-similarity" >}}) function has been added for computing the similarity of two numeric vectors, e.g. two embeddings.

```text
cosine-similarity(Number[] vectorA, Number[] vectorB)
```

It returns a value between `-1` and `1`.
The two vectors must have the same number of dimensions.


### `host-name(...)` & `host-address(...)`

The [`host-name`]({{< relref "/docs/reference/xslt-functions/networking-and-uri.md#host-name" >}}) and [`host-address`]({{< relref "/docs/reference/xslt-functions/networking-and-uri.md#host-address" >}}) functions now accept an optional boolean `ignoreWarnings` argument.
Setting it to `true` suppresses the warning that is logged when a DNS lookup fails.

```text
host-name(ipAddress, ignoreWarnings)
host-address(hostname, ignoreWarnings)
```


## Processing

### Pipeline Scheduling

Processing can now be scheduled so that a {{< glossary "Processor filter" >}} only runs on certain nodes and at certain times.
This is controlled using two new screens:

* {{< stroom-menu "Monitoring" "Node Groups" >}} - Define named groups of nodes.
* {{< stroom-menu "Monitoring" "Processor Profiles" >}} - Define profiles that combine a node group with one or more processing schedules.

Each processing schedule sets the active days, a start and end time and optional limits on the number of threads used on a single node and across the whole cluster.
A profile is applied to a processor filter using the _Processing Profile_ setting on the filter.

See [Processing profiles]({{< relref "/docs/concepts/processing/_index.md#processing-profiles" >}}) and [Node groups]({{< relref "/docs/operate/nodes-and-jobs.md#node-groups" >}}).


### Node Group Selection

Node selection when editing a [Node Group]({{< relref "/docs/operate/nodes-and-jobs.md#node-groups" >}}) has been improved to allow selecting all nodes and inverting the selection.
A node group also has a _Node Inclusion Behaviour_ of either _Include Selected_ or _Exclude Selected_.


## Data Generator

A new _Data Generator_ (`DataGen`) document type has been added for sending data into a {{< glossary "Feed" >}} on a schedule.
The _Settings_ tab holds the data to send and the destination feed.
The _Execution_ tab defines the schedule on which the data is written to the feed as a {{< glossary "Raw Events" >}} stream.

The _Data Generator_ job must be enabled for the schedules to run.
It is intended as a testing aid and is not needed on a production system.
See [Jobs]({{< relref "/docs/reference/jobs.md" >}}).


## Analytic Rules & Reports

### Level & Status

An Analytic Rule now has a _Level_ and a _Status_.

* _Level_ denotes the severity of the rule: _Low_, _Medium_, _High_ or _Critical_.
* _Status_ denotes how reliable the rule is: _Experimental_, _Testing_, _Stable_ or _Deprecated_.

Both values are written to every detection the rule produces and are available to notification email templates as `{{ level }}` and `{{ status }}`.
Detections now also include the name of the feed.


### Settings Tab

Analytic Rules and Reports have a new _Settings_ tab.
_Include Rule Documentation_ and _Feed For Errors_ have moved from the _Notifications_ tab to this tab, so the _Notifications_ tab now holds only notifications.
See [Analytic Rules]({{< relref "/docs/guides/detection/analytic-rules.md#settings" >}}).


### Hidden Columns

Reports now honour hidden columns.
The hidden state of a column is also now saved with Report and Analytic Rule documents.


## Documents

### Document Audit Trail

Stroom now keeps a full audit trail for each document, recording who created, updated, deleted, imported, exported, copied, moved or renamed it and when.
The audit history is shown in the _Info_ dialog for a document.
A snapshot of the document's content is also stored with each change to allow restoring previous versions in the future.

Deleted documents are now soft-deleted, and the new _Doc Store - Physical Delete_ job permanently removes them once they are older than `stroom.docstore.physicalDeleteAge` (default 30 days).


### Document Dependencies & Safe Delete

Dependencies between documents are now stored in the database, giving a more reliable picture of which documents use which.

This allows Stroom to warn you when you delete a document that other documents depend on.
The delete confirmation lists the dependent documents you have permission to see and tells you if there are others you cannot see.


### Folder Delete Confirmation

When deleting a folder, the confirmation dialog now shows the number and types of the items that will also be deleted, along with any items elsewhere that depend on them.
It also warns you if the folder contains items you do not have permission to delete.


## Annotations

### Standard Annotation Comments

Standard comments, that users can pick from when commenting on an [Annotation]({{< relref "/docs/guides/detection/annotations.md#statuses-labels-collections-and-standard-comments" >}}), are now managed in the user interface on the new _Annotation Comments_ screen, alongside annotation statuses, labels and collections.
Each standard comment has a name and the text of the comment.

Comments previously set in the `standardComments` property will need to be re-created as annotation comments.
See [Upgrade Notes]({{< relref "upgrade-notes" >}}).


### Grouped Annotation History

Related items in the [history]({{< relref "/docs/guides/detection/annotations.md#history" >}}) of an annotation are now grouped together and can be expanded to see the detail.


### Event Link Cache Limit

The new property `stroom.annotation.eventLinkCacheSizeLimit` (default `1000000`) protects Stroom from caching too many annotation to event links.
If the limit is exceeded the query will fail with an error.


## Security

### Session & Token Management

Administrators can now view the sessions and tokens of each user across the cluster from {{< stroom-menu "Security" "User Access" >}}.
From here an administrator can end a user's sessions and revoke their tokens.
Users can also end all of their own sessions, other than the current one, using {{< stroom-menu "User" "Sign Out Other Sessions" >}}.

See [Sessions and tokens]({{< relref "/docs/operate/users-and-permissions.md#sessions-and-tokens" >}}).


### Self-Service Account Unlocking

When using the internal identity provider, the following new properties allow users to recover their own accounts:

* `stroom.security.identity.reactivateInactiveAccountsOnLogin` - If `true`, an account that has been made inactive by the _Account Maintenance_ job is made active again when the user next signs in successfully.
* `stroom.security.identity.allowLockedAccountPasswordReset` - If `true`, a user whose account has been locked through too many failed sign-in attempts can unlock it by completing the _Forgot password_ flow.

Both default to `false`.
The _Forgot password_ reset page has also been rebuilt so that an emailed reset link can be completed.


### OpenID Authentication Request Parameters

The new property `stroom.security.authentication.openId.authenticationRequestExtraParams` allows provider specific parameters to be added to the OpenID Connect authentication request.
For example, Google requires `access_type: offline`, otherwise it does not issue a refresh token and the session cannot outlive the first access token.


### Authenticating Edge Proxies

Stroom can now be deployed behind an authenticating reverse proxy that is the OpenID Connect relying party, e.g. an AWS Application Load Balancer with Cognito or NGINX with oauth2-proxy.
This is enabled using the new `stroom.security.authentication.edgeAuthentication` configuration branch, which stops Stroom running its own OpenID Connect flow and supports logging out via the proxy.

CSRF checks are now also applied to requests authenticated by the proxy.
See [Behind an authenticating proxy]({{< relref "/docs/operate/security-setup.md#behind-an-authenticating-proxy" >}}) and [Upgrade Notes]({{< relref "upgrade-notes" >}}).


### Back End For Front End Support

The authentication flow of the Stroom user interface has been changed so that redirects are no longer required.
This allows the user interface to be served from another location via a Back End For Front End (BFF) proxy.


## Git Repositories

A [Git Repo]({{< relref "/docs/guides/content-management.md#git-backed-content" >}}) document now has a _Set Http Client Config_ button to configure how Stroom connects to the remote repository over HTTP(S), including TLS settings and which key stores to trust.
This is needed, for example, for Git servers that present a certificate from a private certificate authority.


## Elasticsearch & Vector Search

### Nested Fields

Searches on an {{< glossary "Elasticsearch" >}} index now support fields mapped with the `nested` type, including fields with multiple levels of nesting.


### Reranking

Dense vector fields on a Lucene index can now rerank their search results using an AI model.
The field settings include the reranking model, the rerank model type, the rerank batch size and a minimum rerank score.

Elastic Index rerank searches now support multiple `dense_vector` fields.
The new _Rerank score field suffix_ setting (default `.score`) names the field holding each result's rerank score, which can be used in dashboard expressions, e.g. `${Content.score}`.

See [Elasticsearch]({{< relref "/docs/guides/indexing/elasticsearch.md" >}}).


## Plan B

Stroom now retries sending Plan B data to a node when the send fails at the transport level, e.g. a DNS lookup failure during a network blip.
This is controlled by the new properties `stroom.planb.sendPartAttempts` (default `3`) and `stroom.planb.sendPartRetryDelay` (default `10s`).


## Administration

### Content Index Persistence

The content index (used for searching the contents of documents) no longer needs to be rebuilt on first use after a node is restarted.
The following properties have been added:

* `stroom.contentIndex.contentIndexDir` (default `content_index`) - The directory to store the index in.
* `stroom.contentIndex.storageType` (default `LOCAL`) - One of `TEMP`, `LOCAL` or `SHARED`.
* `stroom.contentIndex.minRebuildAge` (default `PT1M`) - The minimum age of the index before a rebuild can happen.

The index can therefore be stored locally on each node for better performance or on storage shared by all nodes.
If the storage type is `SHARED`, Stroom builds the index eagerly on boot.


### Admin Servlets Menu

A new System Info admin servlet has been added, along with a menu of all the admin servlets.
The menu is available at `<admin port>/<admin path>/menu`, e.g. `http://localhost:8081/stroomAdmin/menu`.
See [Health endpoints]({{< relref "/docs/operate/checking-it-works/health-endpoints.md" >}}).

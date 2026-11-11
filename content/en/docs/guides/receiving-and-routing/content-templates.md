---
title: "Content Templates"
linkTitle: "Content Templates"
weight: 20
date: 2026-11-11
tags:
  - feed
  - pipeline
description: >
  Creating the feed, pipeline, processor filter and user groups automatically when the first data for a new feed arrives.
pageKind: guide
verification: required
---

Normally a feed must exist before Stroom will accept data for it, and someone has to create the pipeline and processor filter that process it.
Content templates let Stroom do that itself.
When data arrives for a feed that does not exist, Stroom compares the request's headers with a list of templates.
If one matches, Stroom creates the feed and the content needed to process it, then accepts the data.

This suits estates where many systems send data in a few well-known formats, each needing its own feed but the same processing.
It is off by default.


## Where the settings live

The settings on this page are in two places, and the text says which each time it names one.

| Settings | Where to change them | Applies to |
|---|---|---|
| **System properties**, such as `stroom.autoContentCreation.enabled` and the folder and group name templates | **Administration** > **Properties**, or the YAML config file | All templates, across the whole cluster |
| **Template fields**, such as **Pipeline**, **Template Type** and **Expression** | **Administration** > **Content Templates** | One template |

System properties are written here the way the **Properties** screen shows them, starting `stroom.`.
In the YAML file the same property sits under `appConfig`, so `stroom.autoContentCreation.enabled` is `enabled` under `autoContentCreation` under `appConfig`.
A value set in the file overrides the **Properties** screen; see [Configuration properties]({{< relref "../../reference/configuration-properties.md#two-names-for-the-same-setting" >}}).
None of the `stroom.autoContentCreation` properties needs a restart.

Template fields are not system properties.
Stroom keeps the whole list of templates as a single document, and you can only change it on the **Content Templates** screen.


## What a matching template creates

When a template matches, Stroom does all of the following, in one step and under a cluster-wide lock, so two nodes receiving the first data at the same time do not create the feed twice:

1. **Folders.**
   It creates the destination folder from the system property `stroom.autoContentCreation.destinationExplorerPathTemplate`, by default `/Feeds/${accountid}`.
   If the template has its **Copy Pipeline Element Dependencies** field ticked (see below), it also creates the sub-folder named by the system property `stroom.autoContentCreation.destinationExplorerSubPathTemplate`, by default `dev`, inside it.
1. **User groups.**
   It creates a group named from the system property `stroom.autoContentCreation.groupTemplate`, by default `grp-${accountid}`, and adds it to the group named by `stroom.autoContentCreation.groupParentGroupName`, by default `Data Feed Reader`.
   If the template has **Copy Pipeline Element Dependencies** ticked, it also creates a second group from the system property `stroom.autoContentCreation.additionalGroupTemplate`, by default `grp-${accountid}-dev`, inside the group named by `stroom.autoContentCreation.additionalGroupParentGroupName`, by default `Data Feed Developer`.
   If the request was authenticated, the sending user is created in Stroom if necessary and added to these groups.
1. **The feed.**
   The feed is created in the destination folder with status **Receive**, and its settings are taken from the request headers:

   | Header | Feed setting |
   |---|---|
   | `Type` | Stream type, if it is one of the types in the system property `stroom.receive.metaTypes` |
   | `Encoding`, `ContextEncoding` | Encoding and context encoding, if Stroom supports the encoding; otherwise left blank |
   | `Format`, `ContextFormat` | Data format and context format; an unknown format becomes `TEXT` |
   | `Schema`, `SchemaVersion` | Schema and schema version |
   | `Classification` | Classification |

1. **Processing**, according to the template's **Template Type** field:
   * **`PROCESSOR_FILTER`** adds a processor filter for the new feed to the existing pipeline in the template's **Pipeline** field.
     No new pipeline is created.
   * **`INHERIT_PIPELINE`** creates a new pipeline, with the same name as the feed, in the destination folder.
     The new pipeline inherits from the pipeline in the template's **Pipeline** field, and gets a processor filter for the new feed.
1. **Permissions.**
   The first group gets **View** on the destination folder, the feed and any new pipeline.
   The second group, when there is one, gets **View** on the feed, the pipeline and the destination folder, and **Edit** on the sub-folder holding the copied dependencies, so its members can develop the translation without being able to change anything else.
   The first group also gets **View** on that sub-folder.
   If the system property `stroom.autoContentCreation.destinationExplorerSubPathTemplate` is blank there is no sub-folder, and the second group gets **Edit** on the destination folder instead.

The processor filter selects streams where **Feed** is the new feed and **Type** is the request's `Type` header, or `Raw Events` if there was none.
It is enabled, takes its priority and maximum concurrent tasks from the template's **Processor Priority** and **Processor Max Concurrent Tasks** fields, and runs as the user or group named by the system property `stroom.autoContentCreation.createAsSubjectId`.
The system property `stroom.autoContentCreation.createAsType` says whether that name is a `USER` or a `GROUP`.
All the content is created by that same user or group, by default the `Administrators` group, so it must have permission to create everything listed above.

If the feed already exists, none of this happens: Stroom does not look at the templates at all for a feed it already knows.


### Copying pipeline dependencies

An `INHERIT_PIPELINE` template can have its **Copy Pipeline Element Dependencies** field ticked, on the **Content Templates** screen.
Stroom then copies every XSLT and Text Converter that is set directly in the properties of the template's pipeline into the sub-folder (or into the destination folder if the system property `stroom.autoContentCreation.destinationExplorerSubPathTemplate` is blank), naming each copy `<feed name>-<element name>`, and points the new pipeline's properties at the copies.

This gives each new feed its own translation to refine, while the structure of the pipeline still comes from the parent.
Only XSLT and Text Converter documents are copied; references to feeds, indexes and other documents are left pointing at the originals.

{{< trap severity="silent" >}}
**Dependencies set on the template pipeline's own ancestors are not copied.**

Only properties set on the template pipeline itself are copied.
If the template pipeline inherits its XSLT from a pipeline further up, every new pipeline goes on sharing that one XSLT, and an edit made "for one feed" changes all of them.
Set the elements you want copied on the template pipeline itself.
{{< /trap >}}


## Before you start

* The headers that the templates and the path and group names use must be sent by the clients.
  The defaults rely on `AccountId`; [How data gets in]({{< relref "../sending-data/how-data-gets-in.md" >}}) describes the headers.
* The template's pipeline must exist and be correct.
  For `INHERIT_PIPELINE`, design it as a parent: the structure and any shared settings, with the parts that vary per feed left for the child or copied.
* You need the application permission **Manage Content Templates** to open the **Content Templates** screen, and **Manage Properties** to change system properties on the **Properties** screen.

{{< trap severity="silent" >}}
**A header that is missing becomes an empty string in every name built from it.**

If a client does not send `AccountId`, the default destination is `/Feeds/` and the group is `grp-`.
Every such feed lands in the same folder, and every such sender joins the same group and can see the others' feeds.
Match on `accountid` in the template's **Expression** field, so a request without it does not match the template at all.
{{< /trap >}}


## Switch it on

1. Open **Administration** > **Properties** and filter on `autoContentCreation`.
1. Set the system property `stroom.autoContentCreation.enabled` to `true`.
1. Check the other `stroom.autoContentCreation.` properties against your folder and group naming, and change any that do not fit.
   They control the folder, group and creator settings described above, and are all listed with their defaults in [Configuration properties]({{< relref "../../reference/configuration-properties.md#autocontentcreation" >}}).

If you set these in the YAML file instead, under `appConfig` > `autoContentCreation`, put any value containing `${accountid}` in single quotes so that it is not expanded when the file is loaded.

The system property `stroom.autoContentCreation.templateMatchFields` lists the headers a template's **Expression** field can use.
The default is `accountid`, `accountname`, `component`, `feed`, `format`, `schema` and `schemaversion`.
Stroom treats these names as lower case, and matches them against the request's header names without regard to case.

Feed creation from templates works with every receipt check mode, set by the system property `stroom.receive.receiptCheckMode`, except `REJECT_ALL` and `DROP_ALL`.
With `RECEIPT_POLICY`, the receipt rules are applied first, so data a rule rejects or drops never reaches the templates.
See [Controlling what is accepted]({{< relref "controlling-what-is-accepted.md" >}}).

When data comes through Stroom Proxy, the proxy's feed status check passes the request headers to Stroom, and Stroom creates the content.
Nothing needs configuring on the proxy for this: the `stroom.autoContentCreation` properties and the templates are all on Stroom.


## Create a template

1. Open **Administration** > **Content Templates**.
1. Select **Add Template Above** or **Add Template Below**.
1. Fill in the template:

   | Field | What it does |
   |---|---|
   | **Template Name** | Required, and unique among the templates. It appears in the server log when a template matches. |
   | **Template Description** | Optional notes. |
   | **Template Type** | `INHERIT_PIPELINE` (the default) or `PROCESSOR_FILTER`, as described above. |
   | **Copy Pipeline Element Dependencies** | `INHERIT_PIPELINE` only. Copy the pipeline's XSLT and Text Converter documents for each new feed. |
   | **Pipeline** | Required. The pipeline to inherit from, or to add the processor filter to. |
   | **Processor Priority** | The priority of the new processor filter. |
   | **Processor Max Concurrent Tasks** | The maximum concurrent tasks of the new processor filter. |
   | **Expression** | Required, with at least one term. The headers a request must have for this template to match. |

1. Select **OK**, then **Save Templates** on the toolbar.
   Changes are not applied until they are saved, and closing the tab with unsaved changes asks for confirmation.

Templates are tested in order of their template number, the order shown on the screen, and the **first** enabled template whose expression matches is used.
Use **Move Template Up** and **Move Template Down** to put narrow templates before broad ones.
Untick **Enabled** to take a template out of matching without deleting it.

For example, a template with the expression `format = XML AND schema = event-logging:3` and type `INHERIT_PIPELINE` gives every new system that sends Event Logging XML its own feed and pipeline, inheriting the standard event-logging processing.

{{< trap severity="silent" >}}
**Templates only act on feeds that do not exist yet.**

Changing or disabling a template does nothing to the feeds, pipelines and processor filters it has already created.
Deleting the content Stroom created does not undo it either: the next post for that feed creates it again, from whatever template matches then.
{{< /trap >}}

{{< trap severity="silent" >}}
**Data that matches no template is rejected as an unknown feed.**

The sender gets the same error as for any feed that does not exist, so nothing distinguishes "no template matched" from "auto-creation is switched off".
The server log says which, with a line saying the data matched a template or didn't match any active content templates, followed by the request's headers.
{{< /trap >}}

{{< timing mode="async" >}}
The feed and its content are created while the first request is being received, so they exist by the time that request returns.

A change to the system property `stroom.autoContentCreation.enabled` takes up to a minute to take effect, because Stroom rebuilds its receipt checks once a minute.
The stream is processed on the next run of the processor, so expect the first processed output a short time after the data arrives.
{{< /timing >}}


{{< verify >}}
Send one record for a feed name that does not exist yet, with the headers your template matches on.
Then, in the explorer tree, open the destination folder, by default `Feeds/<AccountId>`.

{{< golden >}}
**The new feed exists in the destination folder, and its Data tab holds the stream you sent.**

For an `INHERIT_PIPELINE` template, also open the new pipeline of the same name and check its **Processors** tab has an enabled filter for the feed.
That is what proves the data will be processed, rather than only received.
{{< /golden >}}

{{< not-proof >}}
**A `200` from the datafeed endpoint is not proof a template matched.**
It is also what a feed that already existed returns, and a feed you created by hand earlier for testing bypasses the templates entirely.
Use a feed name that has never been used.

**The feed existing is not proof the processing is right.**
A `PROCESSOR_FILTER` template creates no pipeline, so check the template pipeline's **Processors** tab for a filter naming the new feed.
{{< /not-proof >}}

{{< /verify >}}


{{< diagnose >}}
1. **Is the system property `stroom.autoContentCreation.enabled` true, and has a minute passed since it was set?**
   With it off, a new feed name is simply rejected.
   Check it on the **Properties** screen, which shows the effective value, including one set in the YAML file.
1. **Did the feed already exist?**
   Templates are never consulted for an existing feed, even one that is empty or in another folder.
1. **Is the template enabled and saved?**
   On the **Content Templates** screen, an unsaved template, or one with **Enabled** unticked, is not tested.
1. **Did an earlier template match first?**
   The first match wins, so a broad template above a narrow one takes its data.
   The server log names the template that matched.
1. **Does the template's Expression field use only headers in the system property `stroom.autoContentCreation.templateMatchFields`?**
   A term on any other header can never match.
1. **Did the client send the headers the expression needs?**
   Check the stream's meta attributes on one that did arrive, or the sender's request.
1. **Could the creator create everything?**
   Errors applying a template are logged on the receiving Stroom node with the template's details.
   The user or group named by the system property `stroom.autoContentCreation.createAsSubjectId` must exist and have permission to create folders, feeds, pipelines, processor filters and groups.
1. **Was the data rejected before reaching the templates?**
   With `RECEIPT_POLICY`, a receipt rule can reject or drop the data first.
   See [Controlling what is accepted]({{< relref "controlling-what-is-accepted.md" >}}).
{{< /diagnose >}}


## Related pages

* [Data receipt]({{< relref "../../concepts/data-receipt.md" >}}): the receipt checks that run before the templates.
* [Feeds]({{< relref "../../concepts/feed.md" >}}): the feed settings the templates fill in.
* [Pipelines]({{< relref "../../concepts/pipelines.md" >}}): pipeline inheritance, which `INHERIT_PIPELINE` relies on.
* [Configuration properties]({{< relref "../../reference/configuration-properties.md#autocontentcreation" >}}): every `autoContentCreation` system property and its default.

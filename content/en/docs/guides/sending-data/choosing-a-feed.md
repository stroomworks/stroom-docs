---
title: "Choosing a Feed"
linkTitle: "Choosing a Feed"
weight: 20
date: 2026-10-14
tags:
description: >
  Why the feed name is a security boundary, and the two naming mistakes that are expensive to undo.
pageKind: guide
verification: required
---

Every piece of data in Stroom belongs to exactly one [feed]({{< relref "../../concepts/feed.md" >}}), and the sender chooses which by setting the `Feed` header.
It looks like a label.
It is not.

**Receipt policies, permissions and retention all key off the feed.**
A mis-derived name does not merely file data in the wrong place: it can place it in the wrong *permission* domain, visible to people who should not see it and invisible to people who should.

That is worth ten minutes of thought before the first byte is sent, because renaming a feed later does not move the data already in it.


## Two rules

**Prefer a small number of stable, hand-chosen names.**
One per logical source or team.
Resist deriving a name per host, per pod or per container.

**Decide the name deliberately, not from an available field.**
A field that happens to be present is not the same as a field that means what you want the feed to mean.

A feed name must match `^[A-Z0-9_-]{3,}$`: upper case letters, digits, hyphens and underscores, at least three characters.
Stroom does not convert a name to fit.
The **New > Data Processing > Feed** dialog rejects one that does not match, and on receipt the `Feed` header is matched exactly, so `test-events` does not reach `TEST-EVENTS`.

A common convention is a hierarchical upper-case pattern, such as `SYSTEM-SUBSYSTEM-DATATYPE`: `FIREWALL-CISCO-TRAFFIC`, `WINDOWS-OS-SECURITY`.
Consistency pays off later, when [processor filters]({{< relref "../../concepts/processing/_index.md" >}}) can select whole families with a wildcard.

{{< trap severity="silent" >}}
**Generated feed names normalise, and unrelated sources can silently merge.**

This applies only when [feed name generation](#letting-stroom-generate-the-name) is switched on, which it is not by default.
A name the sender gives in the `Feed` header is used exactly as sent.

When Stroom generates the name from other headers, it upper-cases each header value and replaces any character other than a letter, digit or underscore with an underscore.
So header values `app.auth-prod` and `app_auth_prod` converge on the same feed, with no error and no warning.
Two unrelated sources end up in one feed, sharing its [permissions]({{< relref "../../operate/users-and-permissions.md" >}}) and [retention]({{< relref "../../concepts/streams/_index.md#data-retention" >}}), and the only symptom is data you did not expect.

Check for collisions when you choose the template and the values senders put in its headers.
{{< /trap >}}

{{< trap severity="destructive" >}}
**Feed cardinality is uncapped.**

Nothing stops you creating thousands of feeds.
With content auto-creation (`autoContentCreation.enabled`) switched on, deriving `Feed` from a pod name or a hostname produces one Feed document and one explorer tree node per distinct value, and an estate that nobody can administer.
With it off, the default, every new value is rejected until someone creates the feed.

It is not destructive of data, but it is destructive of a manageable system, and undoing it means re-sending or re-filing everything.
{{< /trap >}}


## Letting Stroom generate the name

A feed name can be omitted, if the instance has [feed name generation]({{< relref "../../concepts/data-receipt.md#creating-feeds-automatically" >}}) switched on.
It is off by default.
When enabled, Stroom builds a name from a template, and the sender must supply whatever headers that template requires: missing one is rejected.

The default template uses the account id, component, format and schema headers.

One limitation decides most cases.
**It is a single global template for the whole application**, so it cannot express "for syslog use the application name, for Kafka use the topic".
In a deployment with several different senders, an explicit `Feed` per sender is usually simpler and more predictable.

{{< timing mode="immediate" >}}
The feed is resolved as the data is received, so a wrong name is wrong immediately and permanently for that data.
{{< /timing >}}

{{< verify >}}
Send a test event and confirm it lands on the feed you intended, by opening that feed's **Data** tab rather than by searching.

{{< golden >}}
**The stream is on the feed you meant, and not on another one.**

Check the second half.
A collision puts data on a real feed, so the only way to notice is to look at where it went rather than whether it arrived.
{{< /golden >}}

{{< not-proof >}}
**A `200` does not tell you which feed the data landed on**, only that something accepted it.

**A feed existing with roughly the right name is not proof it is the one you created.**
With name generation on, normalisation may have merged it with another.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Did the post name a feed at all?**
   A missing `Feed` header is rejected with `406` and a `Stroom-Status` of `100`, `Feed must be specified`, unless name generation is enabled.
1. **Does the feed exist, and is it set to receive?**
   A name that matches no feed is rejected with `406` and a status of `110`, the same as a feed set to `Reject`.
   Check the case: a lower-case `Feed` header does not match an upper-case feed.
   A feed [set to drop]({{< relref "../../concepts/data-receipt.md#feed-status" >}}) returns `200` and discards.
1. **Did the name normalise into another feed?**
   Only if you rely on name generation.
   Compare the header values you sent against the feeds that exist, allowing for uppercasing and character replacement.
1. **Are the template's mandatory headers all present?**
   Only if you rely on name generation.
   Missing one is rejected with a specific status code.
1. **Are there more feeds than you expected?**
   That is cardinality: something is deriving the name from a per-host or per-instance value.
{{< /diagnose >}}

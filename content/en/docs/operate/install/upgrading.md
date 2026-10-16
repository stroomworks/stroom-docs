---
title: "Upgrading"
linkTitle: "Upgrading"
weight: 50
date: 2026-10-15
tags:
description: >
  What to change before upgrading to Stroom 7.14, and the changes that stop a node starting if you don't.
pageKind: operate
verification: required
aliases:
  - /docs/install-guide/upgrades/
  - /docs/install-guide/upgrades/upgrade-patch/
  - /docs/install-guide/upgrades/v5-to-v7/
  - /docs/install-guide/upgrades/v6-to-v7/
---

An upgrade replaces the application on every node, and Stroom migrates the database the next time it starts.
Most upgrade problems show up at that start: a configuration key that no longer exists, or data the migration will not accept, and the node does not come up.

This page lists those for 7.14.
If you are coming from 7.12 or earlier, the [7.13 changes](#if-you-are-coming-from-712-or-earlier) apply too.
The complete lists are `CHANGELOG.md` and `BREAKING_CHANGES.md` in the Stroom source.


## Stop the whole cluster

7.14 changes how Stroom recovers the processing tasks of a node that has died.
Each node now renews a heartbeat on the tasks it is running (the **Processor Task Heartbeat** job), and the **Processor Task Reaper** job, which replaces **Disown Dead Tasks**, hands any task whose heartbeat is older than `stroom.processor.taskLeaseTimeout` to another node.

Nodes older than 7.14 send no heartbeats, so in a mixed cluster their long-running tasks are reaped while they are still running.
**Do not roll the upgrade.**
Stop every node, upgrade them all, then start them.

For processing tasks, **Status Time** on the task screens now shows the time of the last heartbeat.


## Configuration that stops a node starting

Stroom refuses to start on a configuration key it does not recognise, or on a value it does not accept.
Remove or rename each of these in every node's configuration file before starting 7.14:

| In your configuration | Change it to | Since |
|---|---|---|
| `stroom.processor.disownDeadTasksAfter` | `stroom.processor.taskLeaseTimeout`, which defaults to 10 minutes | 7.14 |
| `visualisationAsset` and `visualisationAssetDb` under `appConfig` | `documentAsset` and `documentAssetDb`. The error names both spellings. Values set on the **Properties** screen are renamed for you | 7.14 |
| `passwordComplexityRegex` under `stroom.security.identity.passwordPolicy` | Remove it. Password strength is now checked on the server, against `minimumPasswordStrength` (0 to 4, default 3) | 7.13 |
| `allowPasswordResets` under `stroom.security.identity.email` | Remove it. It never did anything; `stroom.security.identity.passwordPolicy.allowPasswordResets` is the setting that controls password resets | 7.13 |
| `identityProviderType: TEST_CREDENTIALS` | `INTERNAL_IDP` or `EXTERNAL_IDP` for Stroom, `NO_IDP` or `EXTERNAL_IDP` for a proxy. See [Security setup]({{< relref "../security-setup.md#no-identity-provider" >}}) | 7.13 |


## If you are coming from 7.12 or earlier

These arrived in 7.13, so they apply to any upgrade from an earlier version.

**Duplicate account email addresses stop the migration.**
Account email addresses in the internal identity provider must now be unique.
If two accounts share one, the database migration stops with an error listing the addresses, and Stroom does not start.
Find them before upgrading, and give each account its own address or clear all but one:

```sql
SELECT email, COUNT(1), GROUP_CONCAT(user_id)
FROM account
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(1) > 1;
```

**An external identity provider needs three checks.**
The provider must list `https://<stroom-host>/api/auth/flow/v1/signin-oidc` as a valid redirect URI, or every sign-in fails with "invalid redirect_uri".
Tokens must now carry an audience (`aud`) that matches `allowedAudiences`, or `clientId` when that is empty, and Stroom will not start with neither set.
A provider whose access tokens carry no `aud` needs `audienceClaimRequired: false`.
See [Security setup]({{< relref "../security-setup.md#external" >}}).

**Some accounts become disabled.**
An administrator can no longer lock an account, only disable it.
On upgrade, an account that was locked with no expiry, which is how an administrator's lock was stored, and an account flagged as a processing account are both converted to **disabled**.
Review the accounts list afterwards and re-enable any that should not be.

**Failed-login locks now expire.**
An account locked by wrong passwords unlocks itself after `stroom.security.identity.failedLoginLockDuration`, 30 minutes by default.
Set it to `PT0S` to keep locks permanent until an administrator clears them.

**Account filter terms and API fields are renamed.**
In the accounts quick filter, `status:` is gone, replaced by `locked:true`, `enabled:true` and `inactive:true`.
In the REST API, `loginFailures` is now `failureCount`, and `failureLocked` is now `failureLockedMs`.
Update any saved filters or scripts that use the old names.

**`requestScopes` must include `openid`.**
If you set it to an empty list, sign-in through the internal identity provider now fails.


{{< timing mode="async" >}}
The first start of 7.14 runs every outstanding database migration before the application becomes available, which on a large database takes minutes rather than seconds.
Running [`migrate`]({{< relref "../../guides/automation/command-line.md#when-to-use-migrate" >}}) as its own step first lets you watch it and see any error before the nodes start.
{{< /timing >}}

{{< verify >}}
Start the nodes, then open **Monitoring** → **Nodes** and **Monitoring** → **Jobs**.

{{< golden >}}
**Every node shows the new build version, and Processor Task Heartbeat and Processor Task Reaper are enabled and advancing.**

The version proves each node came up on 7.14.
The two jobs are what recover tasks if a node fails, and nothing else tells you if they are off.
{{< /golden >}}

{{< not-proof >}}
**One node starting is not proof the others will.**
Each node reads its own configuration file, so an old key left on one node stops only that node.

**A sign-in as an administrator is not proof everyone can sign in.**
Accounts converted to disabled, and external provider tokens rejected for their audience, affect some users and not others.
{{< /not-proof >}}

{{< /verify >}}

{{< diagnose >}}
1. **Did the node log a configuration error at start?**
   An unknown property, a renamed key or a failed validation is named in the application log.
   Check it against the table above.
1. **Did the migration stop?**
   The migration log, `logs/migration/migration.log`, names the step that failed.
   Duplicate account email addresses are the most likely cause.
1. **Can nobody sign in through the external provider?**
   Check the redirect URI is registered, then the audience settings.
1. **Can one person not sign in?**
   Check whether their account was converted to disabled.
{{< /diagnose >}}

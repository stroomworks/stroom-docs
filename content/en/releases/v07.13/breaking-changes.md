---
title: "Breaking Changes"
linkTitle: "Breaking Changes"
weight: 30
date: 2026-09-03
tags: 
description: >
  Changes in Stroom version 7.13 that may break existing processing or ways of working.
---

{{% warning %}}
Please read this section carefully in case any of the changes affect you.
Most of the changes in v7.13 concern authentication and the internal identity provider.
{{% /warning %}}

If you are upgrading from v7.11, also read the [v7.12 breaking changes]({{< relref "../v07.12/breaking-changes" >}}), which change the data feed key files.


## Stroom

### Account Email Addresses Must Be Unique

Account email addresses must now be unique, so that the internal identity provider's *Forgot password* flow can identify an account from the email address the user gives it.
An account may still have no email address, in which case it cannot reset its password by email, and any number of accounts may have none.

**If two or more accounts currently share an email address, the database migration stops with an error listing the addresses concerned, and Stroom will not start.**
Before upgrading, give each account its own email address, or clear the email address of all but one of them.
This query finds them:

```sql
SELECT email, COUNT(1), GROUP_CONCAT(user_id)
FROM account
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(1) > 1;
```

Creating or updating an account with an email address that another account already uses is now rejected.
This only affects the internal identity provider.


### Password Complexity Regex Removed

The internal identity provider's password policy no longer supports a character-class complexity regex.
Password strength is now enforced on the server, using the same zxcvbn estimator the sign-in screen already shows, governed by `minimumPasswordStrength` (a score from 0 to 4, default 3).
Previously the strength policy was only checked in the browser, so the API accepted weak passwords.

**If your configuration sets `passwordComplexityRegex`, remove it**, as the property no longer exists.
If you relied on the regex to enforce a policy, review `minimumPasswordStrength` instead.


### Account Lockout Is Time-Limited by Default

An account locked by exceeding `failedLoginLockThreshold` failed sign-ins is now unlocked automatically after `stroom.security.identity.failedLoginLockDuration`, which defaults to **30 minutes**.
Previously it stayed locked until an administrator unlocked it, which meant a few failed sign-ins could lock any named user, including `admin`, out permanently.

**If you rely on lockouts being permanent**, set `failedLoginLockDuration` to zero (`"PT0S"`).

The duration governs locks that are already held, not just new ones, because it is applied when a lock is read.
Shortening it releases people who are already locked; setting it to zero makes every lock currently in force permanent until an administrator clears it.


### Administrators No Longer Lock Accounts

The internal identity provider's three account states now have one owner each:

* an administrator decides whether an account is **enabled**;
* the sign-in process **locks** an account after repeated wrong passwords;
* the **Account Maintenance** job marks an unused account **inactive**.

An administrator can still undo the last two, by unlocking an account or making it active again, but can no longer apply them.
**To stop an account being used, disable it.**
On the account edit screen, Locked and Inactive are no longer tick boxes: each shows what has happened and offers the one action an administrator can take.

**On upgrade, two kinds of account are converted to disabled:**

* an account that was locked with no expiry, which is how a lock applied by an administrator was stored;
* an account flagged as a *processing account*, a setting that has been removed.

Review the accounts list after upgrading and re-enable anything disabled in error.
If you run with `failedLoginLockDuration` set to zero, failure locks are also stored without an expiry, so those accounts will be disabled too.

A user who is locked out is now told that their account is locked, rather than that their credentials were wrong.


### Account Fields Renamed

The internal identity provider's account fields have been renamed in the REST API and in the accounts screen's quick filter:

| Was | Now |
| --- | --- |
| `loginFailures` | `failureCount` |
| `failureLocked` | `failureLockedMs` (when the lock was applied, rather than a flag) |
| `status:Locked`, `status:Enabled`, `status:Inactive`, `status:Disabled` | `locked:true`, `enabled:true`, `inactive:true` |

**Update any saved quick filters, dashboards or scripts that use `status:` or `loginFailures`.**
The `status` filter term has been removed rather than renamed, and the accounts list now has a column for each state.


### Internal Identity Provider Authorisation Requests Are Validated

The internal identity provider's authorisation endpoint, `/oauth2/v1/auth`, now requires `response_type=code`, a `nonce` and the `openid` scope, and rejects a request without them.
Stroom's own sign-in sends all three, so a normal deployment needs no change.

**If you have set `requestScopes` to an empty list**, Stroom omits the `scope` parameter and sign-in will fail.
Restore the default, or make sure the list contains `openid`.


### `email.allowPasswordResets` Removed

The unused `allowPasswordResets` property has been removed from the identity provider's `email` section.
Nothing read it: password reset emails were, and still are, governed by `allowPasswordResets` under `passwordPolicy`, which defaults to enabled.

**If your configuration sets `email.allowPasswordResets`, Stroom will fail to start** with an unknown property error.
Remove it.
If you set it to `false` believing that reset emails were switched off, they were not: set `passwordPolicy.allowPasswordResets: false` to disable them.

The same applies to every other property removed in this release; see [Upgrade Notes]({{< relref "upgrade-notes#removed-properties" >}}).


### Analytic Rules Need an Error Feed

An analytic rule with no error feed configured no longer executes.
Set **Feed For Errors** on the rule's **Settings** tab, or set a default, for every rule you want to keep running.
Scheduled executors are also now validated to make sure an execution node is set.


### HBase Statistics and the ScyllaDB State Store Removed

The HBase-backed statistics store (`StroomStatsStore`) and the ScyllaDB-backed state store have been removed, along with their configuration under `statistics.hbase` and `state`.
Use the SQL statistics store and [Plan B]({{< relref "/docs/concepts/planb.md" >}}) instead.


### Standard Annotation Comments

The `annotation.standardComments` property has been removed.
Standard comments are now managed as annotation comments in the user interface, under **Annotations** → **Annotation Comments**.
**Re-create any standard comments you had configured** before users need them.


### JSON Parsing

The **JSONParser** pipeline element now truncates very long string values, to stop them exhausting memory.
Three new element properties govern this:

* `stringTruncateLength`, default 10,000 characters: longer strings are truncated.
* `maxStringLength`, default 100,000,000 characters: a longer string is a fatal error.
* `maxDepth`, default 500: the deepest nesting allowed.

**If your data has string values longer than 10,000 characters that you need intact, raise `stringTruncateLength`** on the affected parsers.

Stroom also now uses version 3 of the Jackson JSON library for most of its JSON handling, which differs from v2 in some details of behaviour.
Check the output of your JSONParser pipelines after upgrading.


### S3 Appender Path Variables

The S3 appender now replaces time variables in its output paths using the current time, in line with the file appender, rather than the stream's create time.
If you depend on S3 object keys derived from the stream create time, check them after upgrading.


## Stroom-Proxy

No Stroom-Proxy specific breaking changes in v7.13.


## Stroom & Stroom-Proxy

### External Identity Provider Redirect URI

When Stroom uses an **external identity provider** (Keycloak, AWS Cognito, Google and so on), the client registered at that provider must now list Stroom's sign-in callback as an allowed redirect URI:

```
https://<stroom-host>/api/auth/flow/v1/signin-oidc
```

**A provider that does not have this exact value registered will reject the sign-in with an "invalid redirect_uri" error.**

If you also use provider-side logout, add the post-logout landing page to the client's valid post-logout redirect URIs:

```
https://<stroom-host>/
```

The internal identity provider needs no change.


### Token Audience Validated by Default

With an **external identity provider**, the audience (`aud`) claim of an inbound token is now validated by default.
Previously, if `allowedAudiences` was empty no audience validation was done at all, so a token issued for a different application at the same provider could be replayed against Stroom.
Now, when `allowedAudiences` is empty, the audience is validated against Stroom's `clientId`.

**If your provider issues tokens whose `aud` is not Stroom's `clientId`**, such as an API identifier, list the expected values in `allowedAudiences`:

```yaml
allowedAudiences:
  - "api://my-stroom-resource"
```

The `aud` claim is also now **mandatory by default**: `audienceClaimRequired` defaults to `true`.
**If your provider issues access tokens with no `aud` claim**, as some Cognito and Okta configurations do, set `audienceClaimRequired: false`.

With `identityProviderType: EXTERNAL_IDP` and `validateAudience: true` (the default), Stroom now **refuses to start** unless `allowedAudiences` or `clientId` is set.
Set one of them, or set `validateAudience: false` to disable audience validation deliberately (not recommended).

These apply to Stroom-Proxy's OpenID configuration too.


### `TEST_CREDENTIALS` Identity Provider Type Removed

The `TEST_CREDENTIALS` identity provider type has been removed, along with the publicly known credentials it shipped with.

**If your configuration sets `identityProviderType: TEST_CREDENTIALS`, Stroom and Stroom-Proxy will fail validation on start.**
Use `INTERNAL_IDP` (Stroom) or `NO_IDP` / `EXTERNAL_IDP` (Stroom-Proxy) instead.

Test and demonstration systems that still need a shared credential between Stroom and Stroom-Proxy can use an opt-in replacement, independent of `identityProviderType`.
It is off unless **both** of these are set as environment variables or system properties:

```
STROOM_ALLOW_INSECURE_TEST_CREDENTIALS=true
STROOM_INSECURE_TEST_CREDENTIAL=<a secret string of your choosing>
```

A request whose bearer token equals the secret is then authenticated as the processing user.
**Never set them in production.**


### Cross-Site Request Checks With an Edge Proxy

When `edgeAuthentication.enabled` is set, state-changing requests whose credential was added by an authenticating edge proxy are now subject to the same CSRF checks as session-cookie requests.
In-browser clients that attach their own bearer token must send `X-CSRF: 1` on state-changing requests.
Non-browser automation and traffic between nodes are unaffected.

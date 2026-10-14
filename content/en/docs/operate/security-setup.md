---
title: "Security Setup"
linkTitle: "Security Setup"
weight: 25
date: 2026-10-14
tags:
description: >
  Choosing an identity provider, wiring up an external one, and getting the claim mapping right before anyone signs in.
pageKind: operate
verification: required
aliases:
  - /docs/install-guide/setup/open-id/
  - /docs/install-guide/setup/open-id/accounts-users/
  - /docs/install-guide/setup/open-id/external-idp/
  - /docs/install-guide/setup/open-id/internal-idp/
  - /docs/install-guide/setup/open-id/test-credentials/
  - /docs/install-guide/setup/open-id/tokens-for-api/
  - /docs/install-guide/setup/securing-stroom/
  - /docs/user-guide/security/
  - /docs/user-guide/security/app-permissions/
  - /docs/user-guide/security/deployment/
  - /docs/user-guide/security/doc-permissions/
  - /docs/user-guide/security/user-accounts/
  - /docs/user-guide/security/users-and-groups/
---

Stroom authenticates with OpenID Connect.
Which provider it uses is a single setting, and it is worth getting right early, because the choice determines where accounts live and how people are matched to their permissions.

This page covers **authentication**: proving who someone is.
What they are then allowed to do is [Users and permissions]({{< relref "users-and-permissions.md" >}}).


## The three options

`stroom.security.authentication.openId.identityProviderType` takes one of:

| Value | Accounts live | Use for |
|---|---|---|
| `INTERNAL_IDP` | In Stroom | A standalone system, evaluation, or anywhere with no existing provider |
| `EXTERNAL_IDP` | In your provider | Any estate that already has one |
| `NO_IDP` | Nowhere | A remote proxy that only forwards onward |

**Stroom defaults to `INTERNAL_IDP`.**
Stroom Proxy defaults to `NO_IDP`, and `INTERNAL_IDP` is not valid for a proxy at all: a proxy has no accounts of its own.


## Internal

Stroom is its own identity provider.
It holds the accounts, the passwords and the password policy, and **Security** → **Manage Accounts** is where they are administered.

This is the right choice for a standalone system and for evaluation, and it is the only one that works with nothing else in place.
Its cost is that account recovery, password policy and any second factor are Stroom's rather than your organisation's, so it does not scale well to an estate that already solved those problems once.


## External

An existing provider holds the accounts, and Stroom redirects the browser to it.
Password policy, recovery and multi-factor authentication all become that provider's business, which is usually the reason to choose it.

Register Stroom as a client with your provider, then set:

* `openIdConfigurationEndpoint`: the provider's `.well-known/openid-configuration` URL.
  Setting this is much the easiest route, because Stroom reads the issuer, the authorisation, token and JWKS endpoints from it rather than you setting each one.
* `clientId` and `clientSecret`, as issued by the provider.

The individual endpoints can be set by hand instead, which is what the discovery document would have supplied.
Prefer discovery unless something prevents it: endpoints copied by hand are a standing opportunity for one of them to be wrong or to drift.


### Getting the claim mapping right

This is the part that is easy to get wrong and expensive to correct.

| Setting | Default | What it is for |
|---|---|---|
| `uniqueIdentityClaim` | `sub` | The claim that identifies the person. Stroom keys its user record on this |
| `userDisplayNameClaim` | None | A friendlier name to show. Need not be unique, and may change |
| `fullNameClaimTemplate` | `${name}` | The person's full name, for display |

When someone signs in for the first time, Stroom creates a user record keyed on the value of `uniqueIdentityClaim`.
Every later sign-in finds that same record, and the display and full names are refreshed from the claims each time.

So the identity claim must be **unique and permanent**.
The default, `sub`, is both by design.
An email address or a username is neither: people change both, and the provider may reissue them.

{{% warning %}}
**Decide the identity claim before anyone signs in.**
Changing it later, or choosing a claim whose value can change, means existing users are no longer found and new, empty ones are created in their place.
{{% /warning %}}


## No identity provider

`NO_IDP` is for a remote proxy with no access to OIDC infrastructure, which forwards to a downstream proxy or to Stroom rather than authenticating anyone itself.
Trust is established at the transport, by certificates.

It is not a way to switch authentication off on a Stroom instance.


## Behind an authenticating proxy

Where a reverse proxy already authenticates and passes Stroom a verified identity, that is configured separately, under `stroom.security.authentication.edgeAuthentication`.
Stroom then trusts what the edge tells it, which makes the edge part of your security boundary.

{{< timing mode="immediate" >}}
Authentication settings are read when a sign-in happens, so a change affects the next sign-in rather than sessions already running.
Someone already signed in stays signed in.

When testing a change, use a fresh private browser window.
Testing in the window you are already authenticated in will keep telling you the old configuration works.
{{< /timing >}}

{{< verify >}}
Sign in as a real user in a new private browser window, then check in **Security** → **Users** that the user record Stroom matched is the existing one, with its group memberships intact, rather than a new one.

{{< golden >}}
**An existing user signs in and lands on their own account, with the permissions they had before.**

The second half is the check.
Signing in successfully only proves authentication worked; it says nothing about whether Stroom matched the person to the right record, which is the thing claim mapping decides.
{{< /golden >}}

{{< not-proof >}}
**A successful sign-in is not proof the claim mapping is right.**
A wrong identity claim authenticates perfectly and creates a brand new user, which looks like a working sign-in to a new starter and like lost permissions to everyone else.

**Your own sign-in working is not proof the estate will.**
Administrators often have permissions granted directly as well as through groups, so they notice this least.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="destructive" >}}
**Changing the identity claim orphans every existing user.**

Stroom's user records are keyed on the claim's value.
Change which claim is used, and the next sign-in produces a value Stroom has never seen, so it creates a new user with no groups and no permissions.
The original user still exists and still owns everything.

There is no error, and to the person signing in it looks as though their content and access have disappeared.
Recovering means mapping old records to new ones by hand, or putting the setting back.

Treat the identity claim as something chosen once, before the first sign-in.
{{< /trap >}}

{{< trap severity="silent" >}}
**A display name claim that changes is harmless; an identity claim that changes is not.**

`userDisplayNameClaim` is explicitly allowed to change, and Stroom refreshes it on each sign-in.
It is tempting to use the same friendly claim for both, which quietly turns a cosmetic value into the key that permissions hang from.
{{< /trap >}}

{{< diagnose >}}
1. **Did a new user record appear at the moment someone signed in?**
   The signature of a claim mapping problem, and visible in **Security** → **Users**.
1. **Which claim is the identity claim?**
   Compare it against what the provider actually issues; the provider's own documentation and a decoded token settle it.
1. **Is the discovery endpoint reachable from the Stroom node?**
   It is fetched by the server, not the browser, so a URL that works from your desktop may not work from the node.
1. **Do the client ID and secret match the provider's registration?**
   A wrong secret fails at the token exchange, after the provider has already shown a login page, which makes it look like a Stroom fault rather than a configuration one.
1. **Is the redirect URI registered with the provider?**
   It must match what Stroom sends, exactly, including the scheme and any port.
1. **Is the user enabled in Stroom?**
   A disabled user is refused after authenticating successfully, so the provider's logs show success and Stroom shows a failure.
1. **Is it a proxy?**
   `INTERNAL_IDP` is not valid for Stroom Proxy.
   Use `NO_IDP`, or an external provider.
{{< /diagnose >}}

---
title: "Users, Groups and Permissions"
linkTitle: "Users, Groups and Permissions"
weight: 30
date: 2026-10-14
tags:
description: >
  How people sign in to Stroom, how users and groups are managed, and how application and document permissions control what each of them can do.
pageKind: concept
aliases:
  - /docs/howtos/authentication/
  - /docs/howtos/authentication/createuserhowto/
  - /docs/howtos/authentication/userloginhowto/
  - /docs/howtos/authentication/userlogouthowto/
---

Stroom separates two questions.
**Authentication** asks who you are, and is answered by an identity provider.
**Authorisation** asks what you may do, and is always answered by Stroom itself, using users, groups and permissions.


## Signing in

Stroom signs users in with OpenID Connect.
The identity provider is set by `stroom.security.authentication.openId.identityProviderType`:

* `INTERNAL_IDP` (the default): Stroom is its own identity provider and holds the accounts and passwords itself.
* `EXTERNAL_IDP`: an existing OpenID Connect provider holds the accounts, and Stroom sends the browser to it to sign in.
  Password policy and account recovery are then handled by that provider.

Stroom can also sit behind an authenticating reverse proxy that completes the sign-in itself and passes Stroom a verified identity.
This is configured under `stroom.security.authentication.edgeAuthentication`.

[Security setup]({{< relref "security-setup.md" >}}) covers choosing between them and wiring up an external provider, including the claim mapping, which decides how a person is matched to the user record holding their permissions.


### Accounts and users

An **account** is an identity in the internal identity provider: a user ID, a password and, optionally, an email address for password resets, which must be unique if set.
Passwords set in Stroom, and by `create_account`, must pass the policy under `stroom.security.identity.passwordPolicy`: at least `minimumPasswordLength` characters (8 by default) and an estimated strength of at least `minimumPasswordStrength`, on a scale of 0 to 4 (3 by default).
Accounts exist only when Stroom is its own identity provider, and are managed from **Security > Manage Accounts**.

A **user** is Stroom's record of a person (or a service), whichever identity provider is in use.
Users hold group memberships and permissions, and every audited action is attributed to one.

An account can be in three independent states, and any of them stops it signing in:

| State | Set by | Cleared by |
|---|---|---|
| **Disabled** | An administrator | An administrator |
| **Locked** | Stroom, after `stroom.security.identity.failedLoginLockThreshold` wrong passwords in a row (3 by default) | Time (`failedLoginLockDuration`, 30 minutes by default), a [password reset]({{< relref "resetting/reset-a-user-password.md" >}}) if allowed, or **Unlock** |
| **Inactive** | The **Account Maintenance** job, when an account has not been used for a configured period | A sign-in, if `reactivateInactiveAccountsOnLogin` is on, or **Reactivate** |


## Users and groups

Users are managed from **Security > Users** and groups from **Security > User Groups**.
Both need the **Manage Users** application permission.

A **group** is a set of users and other groups.
Groups can be nested: if a user is in **Team A** and **Team A** is in **Division 123**, the user holds every permission granted to either group.
Granting permissions to groups rather than to individuals means that when someone joins or leaves a team, you only change the group's membership.

Opening a user or group shows its **Application Permissions**, **Document Permissions** and **User Groups** on separate tabs.


### Disabling a user

Untick **Enabled** on a user to stop them using Stroom.
It takes effect immediately: their sessions on every node are ended, their tokens are revoked, and they are refused from then on, whether they sign in interactively or present a token.
This works with any identity provider.

{{% warning %}}
Disabling an **account** is not the same.
It stops the person signing in again, but a session they already have keeps working.
To stop someone at once, disable the user.
{{% /warning %}}


## Application permissions

Application permissions allow actions that are not tied to a single document, such as managing nodes or viewing raw data.
Grant them from **Security > Application Permissions**, or from the user's or group's own tab.
The key ones are:

| Permission | Allows |
|---|---|
| **Administrator** | Everything, including every document. |
| **Manage Users** | Managing users, groups and permissions, and other users' API keys. |
| **Manage API Keys** | Managing your own API keys. |
| **Manage Processors** | Managing processors and processor filters. |
| **Manage Jobs**, **Manage Nodes**, **Manage Properties** | The Jobs, Nodes and Properties screens. |
| **Manage Policies** | The Data Retention screen. |
| **Manage Volumes**, **Manage Index Shards** | Data and index storage. |
| **Data - View**, **Data - Import**, **Data - Export**, **Data - Delete** | Viewing, uploading, downloading and deleting stream data. |
| **Pipeline Stepping** | Stepping data through a pipeline. See [Pipeline debugging]({{< relref "../concepts/pipeline-debugging.md" >}}). |
| **Import Configuration**, **Export Configuration** | Importing and exporting content. |
| **Change Owner** | Making another user the owner of a document or folder. |
| **Annotations** | Creating and viewing [annotations]({{< relref "../guides/detection/annotations.md" >}}). |
| **Download Search Results** | Downloading results from a dashboard. |

There are a few more, such as **Manage Cache**, **Manage Tasks**, **Manage DB**, **Credentials** and the **Stroom Proxy** permission for proxy service accounts.
The screen describes each one.


## Document permissions

Document permissions control what a user or group can do with one document or folder.
There are five levels, and each includes every level below it:

| Permission | Allows |
|---|---|
| **Owner** | Everything **Delete** allows, plus changing the document's permissions. |
| **Delete** | Everything **Edit** allows, plus deleting it. |
| **Edit** | Everything **View** allows, plus editing, moving and renaming it. |
| **View** | Seeing it in the explorer tree, opening it read-only, copying and exporting it. |
| **Use** | Using it without seeing it, for example querying an index from a [dashboard]({{< relref "../concepts/dashboards.md" >}}). |

A user with no permissions and no groups sees an empty [explorer tree]({{< relref "../concepts/user-interface/_index.md" >}}) and can't create anything.
Holders of **Administrator** have every permission on every document.

To change a document's permissions you need **Owner** on it (or **Administrator**).
Right-click it and choose **Permissions**.
**Security > Document Permissions** lets you find and change permissions across many documents at once.


### Folders and create permissions

Permissions on a folder apply to the folder itself, not to what is inside it.
Each document has its own permissions.
A folder is still shown in the tree if you can see anything below it, though you can't open it without **View**.

A folder can also carry **create permissions**, one per document type.
A user who has only been given permission to create dashboards and queries in a folder can create those two types there and nothing else.


### How permissions are passed on

Stroom copies permissions rather than looking them up the tree:

* **Creating** a document: the **Permissions** option in the create dialog is **Destination** by default, which copies the folder's permissions to the new document.
  **None** doesn't.
  Either way, you become its owner.
* **Changing a folder's permissions**: you can apply the change to the folder alone or to all its descendants.
* **Moving or copying**: choose **None** (remove all permissions), **Source** (keep the current ones), **Destination** (replace them with the destination folder's) or **Combined** (keep the current ones and add the destination folder's).
  Every option except **Source** needs **Owner** on the item.

{{< image src="operate/users-and-permissions/StroomPermissions.png" alt="The permissions tab of a Stroom document, here an analytic rule. Permission visibility is set to show explicit permissions, and the users and groups table lists a single entry: the admin user, with Owner as both its explicit and its effective permission." >}}A document's Permissions tab. The two columns are the point: an explicit permission is one granted on this document, an effective one includes everything inherited from a folder or a group.{{< /image >}}


## API keys

Scripts and other systems call Stroom's API with an API key.
Create one from **Security > Manage API Keys**, choose the user it belongs to and set an expiry date (365 days by default, set by `stroom.security.identity.token.defaultApiKeyExpiration`).
Short expiry periods are safer if a key leaks.
The expiry date shows in red once a key is within 30 days of expiring, followed by `(EXPIRED)` once it has, and Stroom logs a warning whenever such a key is used.

The full key is shown once, when it is created.
Stroom stores only a hash of it, so copy it straight away.
Afterwards the key is recognisable by its prefix.
A key can be disabled or deleted at any time.

Send the key in an `Authorization: Bearer <key>` header.
The call runs with the permissions of the key's user, so give scripts a service user with only the permissions they need.

**Manage API Keys** lets you manage your own keys.
Managing other users' keys also needs **Manage Users**.


## Sessions and tokens

Signing in creates a session, and Stroom issues tokens to prove who a user is to Stroom and between nodes.

* **User > Sign Out Other Sessions** ends all of your sessions except the current one, on every device and every node.
* **Security > User Access** shows each user's sessions and tokens across the cluster.
  An administrator can end a user's sessions and revoke their tokens from here.

| Action | Ends sessions and tokens | Stops signing in again |
|---|---|---|
| End sessions and revoke tokens (**User Access**) | Yes | No |
| Disable the user (**Users**) | Yes | Yes |
| Disable the account (**Manage Accounts**) | No | Yes |

{{% warning %}}
With an external identity provider, revoking a user's Stroom sessions doesn't end their session with the provider, so they may be signed straight back in.
Disable the user in Stroom, at the provider, or both.
{{% /warning %}}

When Stroom is its own identity provider, token lifetimes are set under `stroom.security.identity.token`:

| Token | Property | Default |
|---|---|---|
| Access token | `accessTokenExpiration` | 60 minutes |
| Refresh token | `refreshTokenExpiration` | 30 days |
| Password reset link | `emailResetTokenExpiration` | 10 minutes |

A refresh token can be used only once.
If one is presented twice, which suggests it has been copied, Stroom withdraws it and every token issued from it.


## Related pages

* [Content management]({{< relref "../guides/content-management.md" >}}): the documents these permissions apply to.
* [Nodes, jobs and properties]({{< relref "nodes-and-jobs.md" >}}): where the properties named on this page are set.
* [User interface]({{< relref "../concepts/user-interface/_index.md" >}}): the explorer tree and menus.

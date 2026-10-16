---
title: "The First Administrator"
linkTitle: "The First Administrator"
weight: 20
date: 2026-10-14
tags:
description: >
  Giving a new installation somebody who can sign in, from the command line.
pageKind: operate
verification: required
---

A new Stroom installation has no administrator.
Until one exists nobody can sign in and set the system up, so for most installations this is a required step, done from the command line.


## Do you need to?

Not always.
You can skip it if an administrator already exists, or if you are using an external identity provider and have already granted the **Administrator** permission to a user or group that your provider will match someone to.

With the internal identity provider there is also a shortcut.
Setting `stroom.security.identity.autoCreateAdminAccountOnBoot: true` makes Stroom create an account called `admin` with the password `admin`, an `Administrators` group holding the **Administrator** permission, and put one in the other, when it starts.
It is off by default, and is meant for test and demonstration systems: anyone who knows Stroom knows that password.
If you use it on anything else, sign in and change the password straight away.

Otherwise, read on.


## Two commands

With the internal identity provider, the work is two commands:

* **`create_account`** makes the account that signs in: the user id, a password, and a name.
* **`manage_users`** makes Stroom's record of that person, creates a group holding the **Administrator** permission, and puts them in it.

Both are run against the same configuration file the application uses, so they reach the same database.


### Create the account

```bash
java -jar /path/to/stroom-app-all.jar create_account \
  --user johndoe \
  --firstName John \
  --lastName Doe \
  --password "correct horse battery staple" \
  /path/to/config.yml
```

The password must pass the internal identity provider's strength policy (`minimumPasswordLength` and `minimumPasswordStrength` under `stroom.security.identity.passwordPolicy`), or `create_account` rejects it.

By default Stroom requires this password to be changed at first sign-in.
Two things govern that, and both have to allow it for the change to be skipped:

* `--noPasswordChange` turns off the flag on this one account.
* `stroom.security.identity.passwordPolicy.forcePasswordChangeOnFirstLogin`, which is `true` by default, forces a change on any account whose password has never been changed, whatever its own flag says.

So `--noPasswordChange` on its own has no visible effect on a default configuration.


### Make them an administrator

```bash
java -jar /path/to/stroom-app-all.jar manage_users \
  --createUser johndoe \
  --createGroup Administrators \
  --addToGroup johndoe Administrators \
  --grantPermission Administrators "Administrator" \
  /path/to/config.yml
```

For several administrators, run `create_account` for each and pass the extra `--createUser` and `--addToGroup` arguments in a single `manage_users` call.


## With an external provider

There is no account to create, because your provider holds it.
You still need Stroom's record of the person and the permission, so the `manage_users` half applies, using the value of whatever claim you configured as the unique identity.

Get that claim right before doing this.
Stroom keys its user record on it, and a record created against the wrong value will not be the one the person is matched to when they sign in.
See [Security setup]({{< relref "../security-setup.md" >}}).

{{< timing mode="immediate" >}}
Both commands run against a stopped or running system and take seconds.
They change the database directly, so there is nothing to restart and nothing to wait for.
{{< /timing >}}

{{< verify >}}
Sign in as that user in a browser, open **Security** → **Users**, and confirm they are in the `Administrators` group and that the group holds the **Administrator** permission.

{{< golden >}}
**The user signs in, and the Users screen shows them in a group that holds the Administrator permission.**

Signing in alone is not enough.
The failure this page exists to prevent produces an account that signs in perfectly and can do nothing, which looks like a broken installation rather than a mistyped name.
{{< /golden >}}

{{< not-proof >}}
**The commands reporting success is not proof the two halves match.**
Each succeeds at exactly what it was told to do, including when it was told different names.

**An empty explorer tree is not proof of a permissions problem.**
A new installation has no content in it yet.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**The user id must match exactly across both commands.**

`--user` in `create_account`, and `--createUser` and `--addToGroup` in `manage_users`, all have to be the same string.
If they differ, both commands still succeed: you get an account that can sign in, and a separate Stroom user holding the permissions, and the person ends up as neither.

The symptom is someone who signs in and sees nothing, with no error anywhere.
Copy the name between commands rather than typing it twice.
{{< /trap >}}

{{< trap severity="destructive" >}}
**The password is in your shell history and the process list.**

Anything typed on a command line is visible to other users of that machine while it runs, and is written to the history file afterwards.
For a first administrator on a new system this is often acceptable; where it is not, let Stroom force a change at first sign-in and treat the initial password as throwaway.
{{< /trap >}}

{{< diagnose >}}
1. **Did both commands name the user identically?**
   The usual cause, and the fastest to check.
1. **Which configuration file did you pass?**
   It names the database.
   A command run with the wrong file succeeds, against the wrong system.
1. **Does the Users screen list the user at all?**
   If not, `manage_users` ran against a different database or a different name.
1. **Does the group hold the Administrator permission?**
   Being in a group with no permissions looks the same from the outside.
1. **External provider?**
   Then the user record must be keyed on the unique identity claim your provider issues, not on a friendly name.
1. **Is the account disabled or locked?**
   A new account can be neither, but a second attempt after failed sign-ins can lock it.
   See [Users and permissions]({{< relref "../users-and-permissions.md" >}}).
{{< /diagnose >}}

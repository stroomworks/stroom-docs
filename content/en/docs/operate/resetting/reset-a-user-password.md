---
title: "Reset a User's Password"
linkTitle: "Reset a User's Password"
weight: 70
date: 2026-10-14
tags:
description: >
  How to reset an account's password from the command line when nobody can sign in to do it from the UI.
pageKind: operate
verification: required
---

This is for the case where the UI is not available to you: the administrator account's password is lost, or internal authentication is misconfigured and nobody can get in to correct it.

It applies to Stroom's **internal** [identity provider]({{< relref "../users-and-permissions.md" >}}).
If the deployment authenticates against an external provider, passwords are not Stroom's to reset and this page does not apply: fix it where the accounts live.


## The procedure

Stroom's application jar carries a `reset_password` command.
It runs against the same configuration file the application uses, so run it on a node, as the user Stroom runs as.

```bash
java -jar stroom-app.jar reset_password /path/to/config.yml -u admin -p 'new-password'
```

The arguments are the account's user id and the new password.

{{< timing mode="immediate" >}}
The change takes effect as soon as the command completes.
There is no restart and no propagation delay: the password lives in the database, which every node shares.
{{< /timing >}}

{{< verify >}}
Sign in as that account, in a private browser window so an existing session does not answer the question for you.

{{< golden >}}
**A sign-in with the new password, in a fresh session.**

Nothing short of signing in proves it.
The command succeeding proves the command ran.
{{< /golden >}}

{{< not-proof >}}
**The command exiting zero is not proof you can sign in.**
The password may now be correct while the account is locked, disabled, or has no permissions.

**An existing browser session still working proves nothing**, because it was already authenticated.
Use a private window.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A password on a command line ends up in your shell history.**

It is also visible in the process list to anyone on the box while the command runs.
Treat the password as compromised from the moment you type it: set something temporary, sign in, and change it from the UI.

Prefix the command with a space where your shell is configured to skip such lines from history, and clear the history entry afterwards if not.
{{< /trap >}}

{{< diagnose >}}
1. **Did the command find its configuration?**
   It needs the same config file the application uses.
   A wrong path usually means it cannot reach the database, which it reports.
1. **Is the user id right?**
   It is the account's user id, not an email address or a display name, unless those happen to be the same.
1. **Is the account enabled?**
   A correct password on a disabled or locked account fails to sign in with no indication that the password was the part that worked.
1. **Is internal authentication actually in use?**
   If the deployment uses an external identity provider, resetting a Stroom password changes something nothing consults.
1. **Can the database be reached from this node?**
   The command writes to the same database the application uses, so it fails where the application would fail.
{{< /diagnose >}}

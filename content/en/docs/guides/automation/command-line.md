---
title: "Command Line Tools"
linkTitle: "Command Line Tools"
weight: 30
date: 2026-10-14
tags:
description: >
  The commands that run against a stopped system, for the jobs that cannot be done through the user interface.
pageKind: guide
verification: required
aliases:
  - /docs/user-guide/tools/
  - /docs/user-guide/tools/command-line/
  - /docs/user-guide/tools/stream-dump-tool/
---

A few things cannot be done through the user interface, usually because they are needed when nobody can log in.
Those are commands run on a node, against the same configuration file the application uses.

| Command | What it does |
|---|---|
| `migrate` | Applies outstanding database migrations without starting the application |
| `create_account` | Creates an account in the internal identity provider |
| `reset_password` | Resets an account's password |
| `manage_users` | Creates users and groups, and grants permissions |
| `create_api_key` | Creates an API key |

Between them these cover the two situations that matter: a first start on an empty database, and being locked out.


## Running one

Each command takes the configuration file, so it reads the same database as the application:

```bash
java -jar stroom-app-all.jar <command> path/to/config.yml
```

Run them as the same user that runs Stroom.
A command run as `root` can leave files the application cannot write afterwards, which produces failures later that look unrelated.


## When to use `migrate`

Normally the application migrates on start.
Running `migrate` separately is useful when you want the migration to be its own step: it can be run and checked before the application starts, which on a large database turns a long, silent startup into something you can watch and time.

It is also the safer shape for a cluster, because migrations should happen once rather than being raced for by several nodes starting together.

The distribution ships `migrate.sh`, which runs `migrate` with the right JVM options and `config/config.yml`, and tails the log until it completes.

{{< timing mode="async" >}}
A migration on a large database can take a long time, and the time is spent on whichever tables changed in that release.

Nothing else should be running against the database while it happens, and the application should be stopped on every node, not just the one you are using.
{{< /timing >}}

{{< verify >}}
After a migration, start one node and confirm it comes up and reports the expected version, then run a search over existing data.

{{< golden >}}
**One node starts cleanly and returns results from data that existed before the migration.**

Starting proves the schema matches the code.
Searching old data proves the migration kept what was there, which is the part a clean start does not test.
{{< /golden >}}

{{< not-proof >}}
**A command exiting with no error is not proof it did what you intended**, for the user and permission commands.
They succeed at doing exactly what was asked, including when what was asked was not what was meant.

**One node starting is not proof the cluster will.**
Other nodes may be on a different version or a different configuration file.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="destructive" >}}
**Migrations are not reversible.**

There is no down-migration.
Once a release's migrations have run, going back to the previous version means restoring the database from backup, so the backup has to be taken before the migration rather than after, and it has to be one you have restored before.
See [Backup and restore]({{< relref "../../operate/backup-and-restore.md" >}}).
{{< /trap >}}

{{< trap severity="silent" >}}
**A command pointed at the wrong configuration file works perfectly on the wrong system.**

The configuration file names the database.
Reset a password using a test system's configuration and the command reports success, having changed the password on the test system.
Check which file you are passing before running anything that changes state.
{{< /trap >}}

{{< diagnose >}}
1. **Which database did it touch?**
   Read the configuration file you passed, not the one you meant to pass.
1. **Is the application stopped?**
   Migrations expect exclusive access, and a running node can hold locks that make the command appear to hang.
1. **Did it run as the right user?**
   Files created by the wrong user cause failures later that do not mention permissions.
1. **Is the jar the version you think?**
   Running the previous release's jar applies the previous release's migrations.
1. **For user and permission commands, did the change appear?**
   Check in the user interface, since the command reports what it did rather than what was already true.
{{< /diagnose >}}

---
title: "Install for Evaluation"
linkTitle: "Install for Evaluation"
weight: 20
date: 2026-10-14
tags:
description: >
  Getting a single-node Stroom running in Docker, pre-loaded with content and already processing data.
pageKind: tutorial
verification: required
---

Running Stroom in Docker is the quickest way to see it work: no Java to install, no MySQL to configure, nothing to tune.
This is for evaluation only, and nothing on this page is production configuration.


## Which stack

Stroom ships several predefined Docker **stacks**, each a set of containers wired together.
For this walk-through use **`stroom_core_test`**.

It is the right one for two reasons.
It comes with an `admin` account already created, and it is pre-loaded with [content]({{< relref "../guides/content-management.md" >}}) and configured to start processing on boot, so there is real data to look at within minutes of starting it.

The other stacks create no accounts at all, and need an administrator to be created from the command line first.


## Install and start

```bash
bash <(curl -s https://gchq.github.io/stroom-resources/v7.14/get_stroom.sh)
cd stroom_core_test/stroom_core_test*
./start.sh
```

If piping a downloaded script into bash is not something you are willing to do, fetch the release archive yourself from the `gchq/stroom-resources` releases, extract it, and run `./start.sh` from the extracted directory.
Pick the version you want rather than the one the script chooses.

{{< timing mode="async" >}}
**Allow a few minutes on first run.**
Stroom builds its database schemas when it first starts, and nothing responds until that finishes.

`start.sh` prints the URLs it has set up when it is done.
{{< /timing >}}

{{< verify >}}
Open `https://localhost` in a browser and sign in with username `admin` and password `admin`.
You will have to accept the self-signed certificate.

Then, in the [explorer tree]({{< relref "../concepts/user-interface/_index.md" >}}) on the left, double-click **System** to see every [stream]({{< relref "../concepts/streams/_index.md" >}}) Stroom holds.
There should already be some: the stack runs a log sender that forwards Stroom's own application, user and request logs back into Stroom, and processing is on by default.

{{< golden >}}
**Streams are listed under System, with create times from the last few minutes.**

That one screen proves more than it looks: the database is up, the UI can reach it, data is being received, and processing is running.
If you see streams, the whole stack works.
{{< /golden >}}

{{< not-proof >}}
**The login page rendering is not proof the stack is up.**
Stroom will serve its UI while the database is still building its schemas, and the first thing you do will fail.

**An empty stream list is not necessarily a failure**, if you got there within a minute or two of starting.
Wait, then look again.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="destructive" >}}
**This stack is for evaluation, and the credentials are published.**

`admin`/`admin` is in every copy of these instructions, the certificate is self-signed, and the configuration is tuned for starting quickly rather than for keeping anything safe.

Do not put real data in it, and do not expose it beyond your own machine.
{{< /trap >}}

{{< diagnose >}}
1. **Is it still starting?**
   First run builds the database.
   Give it a few minutes before concluding anything.
1. **Did `start.sh` report errors?**
   Read its output.
   Port clashes on 443 are the usual cause, if something else on the machine is already serving HTTPS.
1. **Are the containers running?**
   `docker ps` should show several.
   One that keeps restarting is the one to look at, with `docker logs`.
1. **Is there enough disk and memory?**
   The stack runs Stroom, a proxy, a log sender, nginx and MySQL together, and MySQL in particular fails in confusing ways when it cannot write.
1. **Does the browser refuse the certificate outright?**
   Some browsers will not let you past a self-signed certificate on `localhost` without an explicit exception.
   Try another browser before assuming Stroom is down.
{{< /diagnose >}}


## Next

The stack is already processing its own logs.
Next, [send it something of your own]({{< relref "send-your-first-data.md" >}}).

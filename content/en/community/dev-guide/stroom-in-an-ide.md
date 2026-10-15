---
title: "Running Stroom in an IDE"
linkTitle: "Running Stroom in an IDE"
weight: 20
date: 2026-10-15
tags: 
description: >
  Building Stroom from source and running it on your own machine, with the database in Docker and the application in IntelliJ.

---

This page is for people changing Stroom itself.
It gets a single node running from source, backed by a database in Docker, reachable at `https://localhost`, then covers running the tests and checks.

Nothing here is how you run Stroom for real.
A development node relaxes security so the user interface can be debugged, and creates an `admin` account with the password `admin`.


## Prerequisites

* **Java 25**, the Eclipse Temurin distribution.
  The build is set to that version and will not compile with an older one.
  {{< external-link "SDKMAN!" "https://sdkman.io/install" >}} makes installing and switching JDKs straightforward.
* **Git**.
* **Docker**, with Docker Compose, for the database and Nginx.
* **IntelliJ IDEA**.
  Most Stroom developers use it, and the repository ships run configurations for it.
  Any IDE will do, but you would be setting those up yourself.
* **bash 4+**, plus **jq**, **GNU grep** and **GNU sed** for the helper scripts.
  We develop on Linux, so on a Mac you may have problems with some of the scripts.

You do not need Gradle installed.
The repository includes the Gradle wrapper, `./gradlew`, which fetches the right version on first use.


## Get the code

As a minimum you need two repositories: `stroom`, the application, and `stroom-resources`, which holds the Docker Compose stack it runs against.

Clone them next to each other, in the same parent directory.
The run configurations look for `stroom-resources` at `../stroom-resources` relative to `stroom`, for its development certificates.

{{< command-line "dev" "localhost" >}}
git clone https://github.com/gchq/stroom.git
git clone https://github.com/gchq/stroom-resources.git
{{</ command-line >}}

To clone all the Stroom repositories at once, use `stroom-resources/bin/cloneOrCheckStroomRepos.sh`, described in the {{< external-link "stroom-resources README" "https://github.com/gchq/stroom-resources/blob/master/README.md" >}}.


## Start the services

From `stroom-resources/bin`, run:

{{< command-line "dev" "localhost" >}}
./bounceIt.sh -y
{{</ command-line >}}

`bounceIt.sh` stops anything from the stack that is already running and starts it again; `-y` skips the confirmation prompt.

On first run it creates `stroom-resources/bin/local.env` from `local.default.env`.
That file is not under version control and is yours to edit.
Its `SERVICE_LIST` is a bash array of the containers to run, and the default is what a development node needs:

* **`stroom-all-dbs`**: MySQL, listening on `localhost:3307`, with the `stroom` database and user already created.
* **`nginx`**: serves `https://localhost` and passes requests through to Stroom on port 8080.
* **`scylladb`**.

Run it again whenever you want the stack restarted.
The data in the database survives a bounce.

Check that `docker ps` lists the `stroom-all-dbs` and `nginx` containers, running and not restarting.


## Create your local configuration

From the root of the `stroom` repository, run:

{{< command-line "dev" "localhost" >}}
./local.yml.sh
{{</ command-line >}}

This writes `local.yml`, using `stroom-app/dev.yml` as the template, and `local2.yml` and `local3.yml` for running a three-node cluster.
None of them are under version control, so change them as you like: log levels, [property values]({{< relref "/docs/operate/configuration.md" >}}), anything you are testing.

`local.yml` already points at the database on port 3307, and is the file every development run configuration starts Stroom with.


## Open it in IntelliJ

Open the root of the `stroom` repository, and let IntelliJ import it as a Gradle project.
The first import downloads all the dependencies and takes a while.

Then set the project SDK to your Java 25 install, in **File** → **Project Structure** → **Project**.

The shared run configurations in `.idea/runConfigurations` appear in the run configuration list without any setup.


## Build and run

Three steps, in this order:

1. **`clean`**, which removes anything left by an earlier build.
1. **`gwtDraftCompile`**, which compiles the user interface from Java into JavaScript.
   A draft compile is unoptimised and much quicker than the full `gwtCompile` a release uses.
1. **`Stroom Node 1 (GWT Super Dev)`**, which starts Stroom with `local.yml`.

The draft compile is the slow step, a few minutes.
You do not need to repeat it every time: run it again after pulling changes or switching branches, or when the user interface fails to load.


### In IntelliJ

Open the **Gradle** tool window and run the tasks from there by double-clicking them:

* **stroom** → **Tasks** → **build** → **clean**
* **stroom** → **stroom-app-gwt** → **Tasks** → **gwt** → **gwtDraftCompile**
* **stroom** → **stroom-app** → **Tasks** → **application** → **Stroom Node 1 (GWT Super Dev)**

There is also an IntelliJ run configuration called **Stroom Node 1 (GWT Super Dev)**, in the list at the top of the window.
It starts the same application, and starting it with **Debug** lets you set breakpoints in server code.

Both set the JVM argument `-DgwtSuperDevMode=true`, which relaxes the content security policy so the browser can load the user interface from the GWT code server (see [Changing the user interface](#changing-the-user-interface)).


### On the command line

From the root of the `stroom` repository:

{{< command-line "dev" "localhost" >}}
./gradlew clean
{{</ command-line >}}

{{< command-line "dev" "localhost" >}}
./gradlew :stroom-app-gwt:gwtDraftCompile
{{</ command-line >}}

{{< command-line "dev" "localhost" >}}
./gradlew ":stroom-app:Stroom Node 1 (GWT Super Dev)"
{{</ command-line >}}

The quotes on the last one matter, because the task name has spaces in it.
Add `--debug-jvm` to have it wait for a debugger to attach on port 5005.

`buildNoIntTestsDraftAppGwt.sh` in the root of the repository does a full build without tests or the full user interface compile, followed by the draft compile, in one go.


### Sign in

Watch the output until Stroom logs that it has started, and shows a large **super dev mode** banner, then go to:

**`https://localhost`**

The certificate is a development one that your browser will not trust, so accept the warning.

Sign in as `admin`, password `admin`.
`dev.yml` turns on `autoCreateAdminAccountOnBoot`, so on a new database the account is created for you.

You are asked to change the password on first sign-in.
To skip that, set this in `local.yml` before the first start:

```yaml
stroom:
  security:
    identity:
      passwordPolicy:
        forcePasswordChangeOnFirstLogin: false
```

Alternatively run the IntelliJ run configuration **Stroom Reset Admin Password**, which sets the password back to `admin` and stops further prompts to change it.

Stroom logging that it has started is not proof that it works.
The server starts happily without a compiled user interface, and only the browser shows you that one is missing.
You are up when you can sign in and the explorer tree on the left loads.

{{% note %}}
Stroom is developed and tested mostly in Chrome.
Behaviour in other browsers may vary; please let us know about any incompatibilities you find.
{{% /note %}}


## Sample data

Stroom starts empty.
`SetupSampleData` loads pre-defined content and data into the database and file system: feeds, XSLTs, pipelines, dashboards and data in those feeds.
It is the quickest way to have something to exercise in development.

Run the IntelliJ run configuration **SetupSampleData**, or `./gradlew setupSampleData`, against an empty database and before starting Stroom.
When Stroom next starts, it processes the data with the pre-defined pipelines.


## Changing the user interface

The user interface is written in Java and compiled to JavaScript with {{< external-link "GWT" "https://www.gwtproject.org/" >}}.

With only a draft compile, a change to user interface code means another draft compile and a browser refresh.
For a lot of interface work it is quicker to run the GWT code server alongside Stroom, which recompiles only what changed each time you refresh:

{{< command-line "dev" "localhost" >}}
./gradlew :stroom-app-gwt:gwtSuperDevMode
{{</ command-line >}}

In IntelliJ, this is the **gwtSuperDevMode** run configuration.

When it starts it prints instructions for setting up your browser.
Visit the code server it links to, and drag its **Dev Mode On** bookmark into your browser's bookmarks.
Then, on the Stroom page, click **Dev Mode On** to load the code server's output.

From then on, a change to code in a `-client` or `-shared` module is picked up by refreshing the browser.

If you have made larger changes, such as moving or renaming classes, GWT can get confused.
Run `./gradlew gwtClean`, then the draft compile, then start the code server again.


### Debugging user interface code

Breakpoints in IntelliJ have no effect on code in `-client` modules, because it runs in the browser as JavaScript.
Breakpoints in `-shared` modules only take effect when that code is running on the server.

Debug the user interface in Chrome Dev Tools (`shift+ctrl+i`) instead.
Super Dev Mode creates source maps that link the running JavaScript back to the Java source, so you can set breakpoints in the Java.

To find the Java source, open the **Sources** tab, then in the **Page** navigator on the left select:

**top** → **ui** → **stroom (ui)** → **127.0.0.1:9876** → **sourcemaps/stroom** → **stroom**

That folder contains all the Stroom Java packages.


### Right-click behaviour

Stroom replaces the browser's right-click menu with its own.
For interface work you often want the browser's menu back, for example to inspect an element.
Set this in `local.yml`:

```yaml
stroom:
  ui:
    oncontextmenu: null
```

Remove it, or set it to `"return false;"`, to go back to the default.


## Tests and checks

Tests that need a database use the `stroom-all-dbs` container, so keep the `stroom-resources` stack running while you test.

Run the tests for one module:

{{< command-line "dev" "localhost" >}}
./gradlew :stroom-index:stroom-index-impl:test
{{</ command-line >}}

Run one test class, or one method:

{{< command-line "dev" "localhost" >}}
./gradlew :stroom-index:stroom-index-impl:test --tests "stroom.index.impl.TestActiveShards"
{{</ command-line >}}

In IntelliJ, the green arrow beside a test class or method runs just that, and **Debug** works the same way as for the application.

Run every test:

{{< command-line "dev" "localhost" >}}
./gradlew test
{{</ command-line >}}

This takes a long time, well over twenty minutes, so most people run the modules they have changed and leave the full run to the CI build.

Check the code style against the rules in `config/checkstyle/checkstyle.xml`:

{{< command-line "dev" "localhost" >}}
./gradlew checkstyleMain checkstyleTest
{{</ command-line >}}

Checkstyle failures fail the build, so run this before pushing.

To run everything the CI build does, compile, tests, checkstyle and the full user interface compile together:

{{< command-line "dev" "localhost" >}}
./gradlew clean build
{{</ command-line >}}

Add `-x test` to skip the tests when all you want to know is that it compiles.
Some parts of the build run inside Docker containers, so the first build spends time building those images; later builds use the cached layers.


## When it goes wrong

* **Stroom will not start and the log mentions the database.**
  The stack is not up, or not on port 3307.
  Run `./bounceIt.sh -y` again and check `docker ps`.
* **`https://localhost` gives a 502 or will not connect.**
  Nginx is up but Stroom is not, or has not finished starting.
* **The page loads but the user interface does not appear, or behaves like an older version.**
  The draft compile is missing or stale.
  Run `gwtDraftCompile` again.
* **The build fails with a Java version error.**
  IntelliJ, or `JAVA_HOME` on the command line, is pointing at something other than Java 25.
* **Tests fail on database connections.**
  They need `stroom-all-dbs` running, the same as the application.


## Starting again from nothing

To work from a clean slate, run this from `stroom-resources/bin`:

{{% warning %}}
`clean.sh` stops and removes the stack's containers, and with them the database.
It matches containers by name, so any other container of yours with `nginx` or `kafka` in its name goes too, and it also removes unused Docker images and volumes.
Read the script before running it on a machine you use for anything else.

The `rm` commands delete all the Stroom state held on the file system, including the stream store and index shards.
{{% /warning %}}

{{< command-line "dev" "localhost" >}}
./clean.sh \
&& rm -rf ~/.stroom/v7 \
&& rm -rf /tmp/stroom/v7
{{</ command-line >}}

`~/.stroom/v7` and `/tmp/stroom/v7` are the home and temp directories set in `dev.yml`, one subdirectory per node.
Run `./bounceIt.sh -y` afterwards for a fresh, empty database.

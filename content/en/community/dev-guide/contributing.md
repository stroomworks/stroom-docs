---
title: "Contributing"
linkTitle: "Contributing"
weight: 40
date: 2026-10-15
tags: 
description: >
  How to make contributions to the Stroom GitHub repositories.

---

The rules for contributing are in {{< external-link "CONTRIBUTING.md" "https://github.com/gchq/stroom/blob/master/CONTRIBUTING.md" >}} in the Stroom repository, which is the version to follow if this page and it ever disagree.
This page summarises it.


## Before you start

* Look for an existing {{< external-link "GitHub issue" "https://github.com/gchq/stroom/issues" >}}, or raise one describing the change, with steps to reproduce and the Stroom version if it is a bug.
  If the change might be controversial, discuss it on the issue first.
* Fork the repository and clone your fork.
* Sign the {{< external-link "GCHQ Contributor Licence Agreement" "https://cla-assistant.io/gchq/stroom" >}}.


## Branches

Create a feature branch named after the issue, off `master` or the release branch the change is for:

```bash
git checkout -b gh-12345-my-contribution master
```

If the issue has a milestone, such as `7.13`, the pull request targets that release branch.
If it has none, it targets `master`.


## Making the change

* Reproduce the problem first if it is a bug.
  [Running Stroom in an IDE]({{< relref "stroom-in-an-ide.md" >}}) covers getting a development node running.
* Add or update unit and integration tests.
* Run a full build before raising the pull request:

  ```bash
  ./gradlew clean build
  ```

  This runs the tests, the Checkstyle checks, and the full compile of the user interface to JavaScript.
  Checkstyle failures fail the build.
* Write a {{< external-link "good commit message" "https://cbea.ms/git-commit/" >}}.


## Change log entries

Do not edit `CHANGELOG.md` directly.
Each change adds a change entry file with `log_change.sh`, and the entries are collected into the change log at release time:

```bash
./log_change.sh Bug 1234 "Fix nasty bug"
```

The category is one of `Bug`, `Feature`, `Refactor`, `Dependency` or `Build`.
The issue can be a number, `0` for none, `namespace/repo#n` for an issue in another repository, or `auto` to take it from the branch name.
Run it with no arguments to be prompted for everything, `./log_change.sh list` to see the unreleased entries, and `./log_change.sh edit` to change one.
See `./log_change.sh help` for the rest.


## Documentation

If the change is a new feature or changes what users see, document it in {{< external-link "stroom-docs" "https://github.com/gchq/stroom-docs" >}} and raise a pull request there too.
Make documentation changes on the stroom-docs branch matching the Stroom branch you changed, for example the `7.13` branch of stroom-docs for a change on Stroom's `7.13` branch.
See [Documentation]({{< relref "../documentation/_index.md" >}}) for how the docs are written and built.


## AI tools

AI-assisted contributions are welcome, on these terms:

* You open every pull request yourself; none may be opened by an AI agent or other automated tool acting on your behalf.
* You are responsible for everything submitted under your account, and must review it in full before submitting, especially anything an AI agent produced.

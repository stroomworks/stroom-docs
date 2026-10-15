---
title: "Releasing Stroom"
linkTitle: "Releasing Stroom"
#weight:
date: 2021-08-20
tags: 
description: >
  How to release a new version of Stroom

---

## Pre-requisites for a release

The follow need to be completed before a release is made.


### Logging changes

Stroom and its related repositories all have a `CHANGELOG.md` file for recording changes made between releases.
Before making a release you should ensure that all changes have been recorded in the _CHANGELOG_.
This is not done by directly editing the file but instead using the script `./log_change.sh`.

_log_change_ creates change entry files in the directory `./unreleased_changes/`.
This prevents merge conflicts that would happen with multiple people editing the _CHANGELOG_ file.

Usage is `./log_change.sh [command] [category] [github_issue] [change_text]`, where the category is one of `Bug`, `Feature`, `Refactor`, `Dependency` or `Build`.
The following examples show you how to use it.

{{< command-line "dev" "localhost" >}}
# Fully interactive: derives the issue from the branch name and the category from the GitHub issue
./log_change.sh
(out)
# Log a bug fix for the issue number in your current branch (e.g. branch: gh-1234-fix-dead-locks)
./log_change.sh Bug auto "Fix database dead locks during purge job"
(out)
# Log a change with no associated issue
./log_change.sh Bug 0 "Fix typo on about screen"
(out)
# Log a feature for issue #1234
./log_change.sh Feature 1234 "Add a new widget to the dashboard"
(out)
# Log a change for issue #1234, opening your default editor on the created skeleton change file
./log_change.sh 1234
(out)
# Log a change for an issue in a different repository
./log_change.sh Bug gchq/stroom#2424 "Fix database dead locks during purge job"
(out)
# List all unreleased changes
./log_change.sh list
(out)
# Edit an existing change entry
./log_change.sh edit
{{</ command-line >}}

Run `./log_change.sh help` for the full usage.


### Commit and push all changes

Before releasing all local changes that you want in the release should be committed and pushed.
Commits that you want in a release should be merged down to a release branch, e.g. `7.0` or `master`.
Once pushed and merged ensure that the branch passes the {{< external-link "CI build" "https://github.com/gchq/stroom/actions" >}}.


### Decide on the next version number

Stroom versioning follows {{< external-link "Semantic Versioning" "https://semver.org" >}}.

Given a version number _MAJOR_._MINOR_._PATCH_:

* _MAJOR_ is incremented when there are major or breaking changes.
* _MINOR_ is incremented when functionality is added in a backwards compatible manner.
* _PATCH_ is incremented when bugs are fixed.

Based on the changes since the last release establish if it is a major, minor or patch release to determine the next version number.


## Performing a named release of Stroom

Once all the above pre-requisites have been met you can trigger the release by running this command:

{{< command-line "dev" "localhost" >}}
./tag_release.sh
{{</ command-line >}}

You can also pass the version, e.g. `./tag_release.sh v7.14.0`, rather than being prompted for it.

This script will do the following:

* Adds the content of the unreleased change entry files (created by `log_change.sh`) to the _CHANGELOG_.
* Prompts for (and suggests) the next version based on the previous release.
* Adds a new version heading to _CHANGELOG_.
* Adds/updates the version compare links in the _CHANGELOG_.
* Commits and pushes the change log changes.
* Creates an annotated git tag using the release version number and change entries.

The tagged git commit will trigger a CI build that includes additional release elements such as:

* Pushing the built docker images to DockerHub.
* Creating a release for the git tag in GitHub with all the release artefacts.

Stroom does not currently publish any libraries to Sonatype or Maven Central; the publishing step in its CI build is disabled.


## Performing a named release of the docker stacks

Once the _Stroom_ release build has finished and the artefacts are available on {{< external-link "GitHub Releases" "https://github.com/gchq/stroom/releases" >}} and {{< external-link "DockerHub" "https://hub.docker.com/r/gchq/stroom/tags" >}} you can create an associated release of the Stroom docker stacks.

In the following examples we will assume that you have just released _Stroom_ `v7.14.1` on branch `7.14`, and the previous release was `v7.14.0`.

Checkout and pull the corresponding release branch in the _stroom-resources_ repository.

{{< command-line "dev" "localhost" >}}
cd stroom-resources
(out)
git checkout 7.14
(out)
git pull
{{</ command-line >}}

Now set the Stroom version in `bin/stack/container_versions.env` to the version you have just released.
The `uplift_stroom.sh` script in the root of _stroom-resources_ does this: it clears out any previous stack build, sets `STROOM_TAG`, shows you the change and, if you press `y`, commits and pushes it.

{{< command-line "dev" "localhost" >}}
./uplift_stroom.sh v7.14.1
{{</ command-line >}}

`STROOM_PROXY_TAG` follows `STROOM_TAG` by default.
If any of the other docker image versions need updating, edit `bin/stack/container_versions.env` by hand and commit and push that too.

Check the {{< external-link "CI build" "https://github.com/gchq/stroom-resources/actions" >}} is successful for the new Stroom image.

If the build is green then tag the stacks release as follows:

{{< command-line "dev" "localhost" >}}
pwd
(out)/home/dev/git_work/stroom-resources
(out)
# Clear out any previous build
rm -rf ./bin/stack/build
(out)
./tag_release-stroom-stacks.sh stroom-stacks-v7.14.1
{{</ command-line >}}

This script will build all the stack variants locally to ensure they will build successfully, though it does not test them.
If the local build is successful it will then create an annotated git tag which will trigger a release CI build.
The release CI build will create an archive for each stack variant and add them as a release artefacts.


## SNAPSHOT releases

SNAPSHOT versions should never be published publicly.
This mainly concerns the other Stroom repositories that do publish libraries.
If a development version of a library needs to be shared between projects then you can either use the Gradle task `publishToMavenLocal` to publish a `SNAPSHOT` version to your local Maven repository and change your dependency version to `SNAPSHOT`, or perform a named release along the lines of `vx.y.z-alpha.n`.


## Release Versioning conventions

Semantic versioning is used, and this should be adhered to, see {{< external-link "SemVer" "https://semver.org/" >}}. The following are examples of valid version names

* `SNAPSHOT` - Used only for local development, never to be published publicly.
* `v3.3.0` - Initial release of v3.3, with an associated `3.3` branch.
* `v3.3.1` - A patch release to v3.3 on the `3.3` branch.
* `v3.4.0-alpha.1` - An alpha release of v3.4, either on `master` or a `3.4` branch
* `v3.4.0-beta.1` - An beta release of v3.4, either on `master` or a `3.4` branch


## To Perform a Local Build

{{< command-line "dev" "localhost" >}}
# Full build:
./gradlew clean build
(out)
# Build without unit tests
./gradlew clean build -x test
(out)
# Build without any tests or GWT compilation (GWT compilation applies to stroom only)
./gradlew clean build -x test -x gwtCompile
{{</ command-line >}}







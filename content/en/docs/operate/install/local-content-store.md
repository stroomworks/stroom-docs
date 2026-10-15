---
title: "Hosting Your Own Content Store"
linkTitle: "Hosting Your Own Content Store"
weight: 40
date: 2026-10-14
tags:
description: >
  Mirroring the content packs into your own Git server and pointing Stroom at it, so content comes from somewhere you control.
pageKind: operate
verification: required
---

Stroom's content packs are not files it downloads.
Each pack **is a Git repository**, and the content store is a small manifest listing them: a name, an icon, a licence, and the Git URL, branch, path and commit to take the content from.

Installing a pack creates a Git Repo document in Stroom pointing at that repository.
That makes mirroring straightforward, because what you are mirroring is just Git.

Worth doing when the Stroom nodes have no route to the public internet, and worth doing anyway when you want content to come from somewhere you control, at versions you chose.


## What has to be mirrored

Three things, and the third is the one people miss:

1. **The Git repositories** behind the packs you want.
1. **A manifest**, served over HTTP, whose entries point at your copies.
1. **The icons**, if you want them to render.
   Stroom streams each icon from its `iconUrl` **on the server**, so an unreachable icon URL leaves a pack that installs perfectly and shows no picture.

All three are fetched by the Stroom node, not by the browser.
A URL that works from your desktop proves nothing about whether Stroom can reach it.


## Mirror the repositories

For each pack you want, take a mirror clone and push it to your own server:

```bash
git clone --mirror https://example.invalid/some-content-pack.git
cd some-content-pack.git
git push --mirror https://git.internal.example/stroom-content/some-content-pack.git
```

A mirror clone carries every branch and tag, which matters because the manifest names a branch and may pin a commit.

Decide now how these get refreshed.
A mirror taken once and never updated is a supply of content frozen at the day you took it, which is sometimes exactly what you want and should be a decision rather than an accident.


## Write the manifest

The manifest is YAML with two keys: `meta`, describing who publishes the store, and `contentPacks`.

```yaml
meta:
  ownerId: "example-internal"
  ownerName: "Example Internal Content Store"
  ownerUrl: "https://git.internal.example/stroom-content"
  ownerDescription: "Content packs mirrored for internal use."
  authContact: "platform-team@example.invalid"

contentPacks:
  - id: "core-xml-schemas"
    uiName: "Core XML Schemas"
    iconUrl: "https://intranet.example/icons/schemas.png"
    licenseName: "Apache 2.0"
    licenseUrl: "https://intranet.example/licences/apache-2.0.txt"
    stroomPath: "/XML Schemas"
    details: "Mirrored on 2026-10-14 from the public content store."
    gitRepoName: "Core XML Schemas"
    gitUrl: "https://git.internal.example/stroom-content/core-xml-schemas.git"
    gitBranch: "master"
    gitPath: ""
    gitCommit: ""
    gitNeedsAuth: false
```

A few of these decide more than they look:

| Field | What it decides |
|---|---|
| `id` | Identifies the pack within the store. Keep it stable, because it is how a pack is recognised later |
| `stroomPath` | The explorer folder the pack's Git Repo document is created in. The document itself is named by `gitRepoName`, so do not repeat that name in the path |
| `gitPath` | A subdirectory within the repository, when a repository holds more than one pack |
| `gitCommit` | Pins the content to one commit. Leave it empty to follow the branch |
| `gitNeedsAuth` | Whether Stroom asks for a credential when installing |

`meta.ownerId` and `meta.ownerName` are required.
A manifest missing them, or containing a field Stroom does not recognise, is not loaded at all rather than partially read.
Nothing in the user interface says why: the store just does not appear, and the reason is in the application log under `Cannot connect to App Store URL` or `Cannot parse App Store URL`.

Serve the file from any web server the Stroom nodes can reach.
It is a static file, so anything that serves static files will do, including the Git server itself if it can serve a raw file over HTTP.


## Point Stroom at it

Set `stroom.contentStore.urls` to your manifest URL.
It is a list, so you can offer several stores, and replacing the default entry is what takes the public one out of use.
It is read at startup, so the change needs a restart, and an empty list does not remove the public store: Stroom falls back to it.

On an isolated network, make sure the default entry is gone rather than merely joined by yours: leaving it in place means every load of the content store screen tries to reach the internet and waits for it to fail.


## Credentials for a private repository

If your Git server needs authentication, set `gitNeedsAuth: true` in the manifest and create a credential under **Security** → **Credentials Manager**.
Stroom supports a username and password, an access token, an SSH key, or a key store.

The Git Repo document then references the credential **by name** rather than holding the secret itself, so rotating it is a change in one place.

{{< timing mode="async" >}}
Installing a pack clones a repository, so how long it takes depends on the size of the repository and the speed of the link, not on anything in Stroom.

Afterwards the content is in Stroom and the Git Repo document remains, which is what later pulls or pushes work against.
See [Content management]({{< relref "../../guides/content-management.md" >}}).
{{< /timing >}}

{{< verify >}}
Open the content store screen in Stroom, confirm your packs are listed with their icons, then install one and find its content in the explorer tree at the `stroomPath` you set.

{{< golden >}}
**A pack from your own store installs and its content appears in the explorer tree.**

Listing is not enough: listing only proves the manifest was fetched and parsed.
Installing proves the Git URL in it is one the Stroom node can actually reach and authenticate to, which is the part that differs between your desktop and the server.
{{< /golden >}}

{{< not-proof >}}
**The manifest loading in your browser is not proof Stroom can read it.**
Stroom fetches it from the node, which may have different routing, proxy settings and certificate trust from your machine.

**Packs listed without icons is not proof the store is wrong.**
It usually means the icon URLs are unreachable from the node, and nothing else is affected.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**Leaving the public content store URL in the list makes every visit wait for it.**

`stroom.contentStore.urls` is a list, and Stroom tries each entry.
On a network with no route out, the default entry cannot be reached and the screen waits on it before showing anything, which reads as Stroom being slow rather than as a setting that should have been changed.

Replace the default entry rather than adding to it.
{{< /trap >}}

{{< trap severity="silent" >}}
**A mirror that is never refreshed quietly stops matching upstream.**

Nothing compares your copy against the original, and nothing says a newer version exists.
Content you believe is current can be a year behind, and the first sign is usually a translation that does not handle a format the upstream pack was updated for.

Record when each mirror was taken, which is what the `details` field is useful for, and decide who refreshes them.
{{< /trap >}}

{{< diagnose >}}
1. **Can the Stroom node fetch the manifest?**
   Not your browser, the node.
   This is the first thing to settle and the most common difference.
1. **Does the manifest have a `meta` section?**
   Without it the whole file is rejected, and the store appears empty rather than broken.
1. **Is it valid YAML, with `contentPacks` a list?**
   A parse failure is logged on the node rather than shown on the screen.
1. **Does the node trust your web server's certificate?**
   On an internal certificate authority this is a common cause of an empty store.
1. **Packs listed but installing fails?**
   The manifest is fine and the Git URL is the problem: reachability, branch name, or a credential that is missing or wrong.
1. **Icons missing only?**
   The `iconUrl` values are unreachable from the node.
   Harmless, and fixable by hosting the icons internally too.
1. **Is the old URL still in the list?**
   See the trap above.
{{< /diagnose >}}

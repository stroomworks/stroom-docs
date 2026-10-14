---
title: "Using the REST API"
linkTitle: "Using the REST API"
weight: 20
date: 2026-10-14
tags:
description: >
  Finding the endpoint you need, calling it, and knowing whether it did what you asked.
pageKind: guide
verification: required
aliases:
  - /docs/howtos/search/stroom-api/
  - /docs/user-guide/api/
  - /docs/user-guide/api/authentication-proxy/
  - /docs/user-guide/api/calling-api/
  - /docs/user-guide/api/explorer-api/
  - /docs/user-guide/api/export-api/
  - /docs/user-guide/api/feed-api/
  - /docs/user-guide/api/query-api/
  - /docs/user-guide/api/reference-data-api/
  - /docs/user-guide/api/specification/
---

Stroom's user interface is a client of its own REST API, which means almost anything you can do by clicking, you can do by calling.
The API is described by an OpenAPI specification that Stroom serves, so the authoritative list of endpoints is the one your own system is running rather than anything written down here.


## Finding the endpoint

Open the API documentation from Stroom itself.
Because it is generated from the running code, it matches your version exactly, including anything added or changed since.

The fastest way to find the call behind a screen is to watch what the user interface does: open the browser's network tools, perform the action once by hand, and read the request.
That gives you the path, the method and the exact body shape, which is quicker than searching the specification and is right by construction.


## Calling it

Authenticate with an API key as a bearer token:

```bash
curl -H "Authorization: Bearer $STROOM_API_KEY" \
     -H "Content-Type: application/json" \
     https://stroom.example.com/api/<path>
```

Keep the key out of the command line itself where you can: a key typed into a shell ends up in that shell's history and in the process list.
An environment variable or a file read at run time avoids both.


## Writing against it sensibly

* **Read before you write.**
  Fetch the thing you are about to change and confirm it is what you expect, rather than trusting an identifier assembled from somewhere else.
* **Expect the shape to be the whole object.**
  Many endpoints take a full document rather than a patch, so fetching, modifying and sending back is safer than building a body by hand and losing the fields you did not know about.
* **Treat it as a versioned interface.**
  It matches the version you are running, so an upgrade is a reason to re-test automation.

{{< timing mode="async" >}}
Some calls return as soon as the request is accepted rather than when the work is done.
Anything that starts processing, searching or importing is in that category.

So a `200` means the request was valid and accepted, not that the effect you wanted has happened.
Where that distinction matters, poll for the resulting state rather than assuming the next call will see it.
{{< /timing >}}

{{< verify >}}
Make the change through the API, then confirm it in the user interface, or by a separate `GET` that re-reads the thing you changed.

{{< golden >}}
**The change is visible when read back through a different route from the one that made it.**

Reading back through the same call that wrote it can return what you sent rather than what was stored.
A fresh read, or a look in the user interface, tests the thing you care about.
{{< /golden >}}

{{< not-proof >}}
**A `200` is not proof the work finished**, for anything asynchronous.
It is proof the request was accepted.

**An empty result is not proof nothing matched.**
The key's user sees only what they have permission to see, so an automation account with narrow permissions returns short answers rather than errors.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**The API applies the key user's permissions, and returns nothing rather than complaining.**

A script that works when you test it with your own key and returns empty lists in production is almost always a service account that cannot see the documents or feeds involved.
It looks like a logic bug and is a permissions one.
{{< /trap >}}

{{< trap severity="destructive" >}}
**Bulk operations do what you ask, immediately and across everything that matches.**

A filter that is wider than intended is the risk, and it is not obvious in a request body.
Run destructive calls against a test system first, or run the equivalent read first and count what comes back before changing anything.
{{< /trap >}}

{{< diagnose >}}
1. **Does the same call work in the user interface as that user?**
   Separates permissions from the request itself.
1. **Is it a `401` or a `403`?**
   The first is the key, the second is permissions.
   They get confused constantly.
1. **Is the body the whole object?**
   A partial body sent to an endpoint expecting a complete one silently drops fields.
1. **Did you re-read the result?**
   Asynchronous calls return before the effect lands.
1. **Has the version changed?**
   Automation that broke after an upgrade is usually a changed shape rather than a changed path.
1. **Is it reaching the right node?**
   Behind a load balancer, a call can land anywhere, which matters when you are chasing something node-specific.
{{< /diagnose >}}

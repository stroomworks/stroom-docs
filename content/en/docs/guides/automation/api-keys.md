---
title: "API Keys"
linkTitle: "API Keys"
weight: 10
date: 2026-10-14
tags:
description: >
  Creating a key, what it can do, and why you only get to see it once.
pageKind: guide
verification: required
---

An API key authenticates a request as a particular user.
It is created from the user interface, or from the command line when the user interface is not available.


## Creating one

1. Open **Security** → **Manage API Keys**.
1. Create a key, choosing the user it belongs to and when it expires.
1. **Copy the key now.**
   It is shown once.
1. Store it wherever the thing using it keeps its secrets.

Stroom keeps only a hash of the key and a short prefix.
The prefix is there so you can tell which key is which in the list; the hash is there so the key itself cannot be read back out, by you or by anyone who reaches the database.

That is the right design, and it has one consequence worth planning for: a key that was not copied at creation is gone, and the only remedy is to create another and delete the first.


## What a key can do

A key carries the permissions of the user it belongs to, with no reduction.
It is not scoped to particular endpoints or documents.

So the useful discipline is to create keys for **service accounts with only the permissions the task needs**, rather than for a person who happens to have broad access.
A key made from an administrator's account is an administrator, and it will outlive their involvement in whatever it was for.

Keys also expire, which is a feature rather than an obstacle.
An expiry that is too far away is the same as no expiry.


## Using it

Send it as a bearer token:

```text
Authorization: Bearer <your-api-key>
```

{{< verify >}}
Call a harmless endpoint with the key and confirm you get data back rather than an authentication error, then call one the key's user should **not** be allowed to use and confirm it is refused.

{{< golden >}}
**A permitted call succeeds and a forbidden call is refused, with the same key.**

The second half is what tells you the key is scoped to the user you meant.
A key that can do everything looks identical to a correctly scoped one until you test the boundary.
{{< /golden >}}

{{< not-proof >}}
**A successful call is not proof the key has limited permissions.**
It proves it has enough for that call.

**An authentication failure is not always the key.**
A disabled key, an expired key, a disabled user and a key sent with the wrong header shape all look similar from outside.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="immutable" >}}
**The key is shown once and cannot be recovered.**

Only a hash is stored.
If it was not copied, nothing can retrieve it, and the fix is to create a replacement and delete the original.
Worth knowing before the person who created it has moved on and something stops working.
{{< /trap >}}

{{< trap severity="silent" >}}
**An expiring key fails at whatever time it expires, not at a convenient one.**

Nothing warns the thing using it.
The automation simply starts getting authentication errors, often in the middle of the night, and often in something that does not report failures loudly.
Record expiry dates somewhere that is watched, and rotate before them.
{{< /trap >}}

{{< diagnose >}}
1. **Is the key enabled and unexpired?**
   Both are shown in the API Keys list, and both produce the same failure.
1. **Is the user enabled?**
   A key belonging to a disabled or deleted user does not work, whatever the key's own state.
1. **Is the header right?**
   `Authorization: Bearer <key>`, with one space and no quotes.
   A malformed header reads as no credentials at all.
1. **Is it a permission problem rather than authentication?**
   A refusal on one endpoint but not others is the user's permissions, not the key.
1. **Which key is it?**
   Match the prefix against the list rather than guessing, when several exist for the same user.
1. **Was it rotated?**
   The commonest cause of automation that worked for months and then stopped.
{{< /diagnose >}}

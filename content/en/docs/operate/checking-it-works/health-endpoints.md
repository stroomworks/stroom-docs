---
title: "Health Endpoints"
linkTitle: "Health Endpoints"
weight: 10
date: 2026-10-14
tags:
description: >
  The admin endpoints that say whether Stroom and Stroom Proxy are up, what they cover, and what they do not.
pageKind: operate
verification: required
---

Stroom and [Stroom Proxy]({{< relref "../../concepts/data-receipt.md" >}}) each expose their health checks on a separate **admin** port, away from the application.
That separation is deliberate: the admin port is for you and your monitoring, and it should not be reachable from wherever your data senders are.


## Where they are

Both applications take their ports and context paths from the `server:` block of their configuration file.
The defaults:

| | Application | Admin |
|---|---|---|
| **Stroom** | `8080` at `/` | `8081` at `/stroomAdmin` |
| **Stroom Proxy** | `8090` at `/` | `8091` at `/proxyAdmin` |

So, with the defaults, Stroom's health checks are at `http://localhost:8081/stroomAdmin/healthcheck`.

Your deployment may change either, for example through environment variables substituted into the configuration file.
Check your own configuration before assuming the defaults.


## The two endpoints

`/healthcheck` is the standard Dropwizard health check: every registered check, with its result.

`/filteredhealthcheck` is Stroom's own, and is the more useful of the two in practice.
It takes four query parameters:

| Parameter | Effect |
|---|---|
| `allow` | Comma-separated check names. Only these are run. |
| `deny` | Comma-separated check names. These are excluded. |
| `minimal=true` | Returns only `{"healthy": true\|false}`, with no detail. |
| `pretty=true` | Formats the JSON for reading. |

`minimal=true` is what a monitoring probe should use.
The full output is large, and a probe that parses it will break the first time a check is added.

{{< timing mode="immediate" >}}
Both endpoints answer immediately.
They report the state of the node **as it is now**, and they do not wait for anything.
{{< /timing >}}

{{< verify >}}
Ask for the minimal form and read the HTTP status, not the body:

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  'http://localhost:8081/stroomAdmin/filteredhealthcheck?minimal=true'
```

| Status | Meaning |
|---|---|
| `200` | Every registered check passed. |
| `500` | At least one check failed. Fetch the full output to see which. |
| `501` | **No health checks are registered at all.** |

{{< golden >}}
`200` from `/filteredhealthcheck?minimal=true` on **every node**, not just the one behind your load balancer.
A cluster where one node is unhealthy will still serve most requests successfully, so a single probe through the front door proves very little.
{{< /golden >}}

{{< not-proof >}}
**The application port answering is not a health check.**
Stroom's UI will load, and the login page will render, while the database is unreachable or a node is unable to process.
Probe the admin port.

**`/api/node/v1/ping/{nodeName}` is not a liveness probe either**, despite the name.
It is an authenticated inter-node call that the cluster uses to check its own members, so it needs credentials and it tells you about a *different* node than the one you asked.
{{< /not-proof >}}

{{< /verify >}}

{{< trap severity="silent" >}}
**A `501` means the health checks never registered, not that Stroom is healthy.**

The servlet returns `501 Not Implemented` when the registry is empty, which happens if it is initialised before the checks are registered.
A monitoring rule written as "alert when the status is 500" treats that as fine, and you will be watching an endpoint that can never fail.

Alert on "status is not 200" instead.
{{< /trap >}}

{{< diagnose >}}
1. **Does the admin port answer at all?**
   If the connection is refused, the application is not running, or is not listening where you think.
   Check the `server:` block of the configuration it actually started with, and the container's port mapping.
1. **Is the status `501`?**
   Nothing is registered.
   Treat this as a failure, not a pass, and look at the startup log for errors before the point where the checks register.
1. **Is the status `500`?**
   Fetch the full output and find the checks whose result is unhealthy:

   ```bash
   curl -s 'http://localhost:8081/stroomAdmin/filteredhealthcheck?pretty=true'
   ```

   The failing check names its own problem.
   Database and configuration checks are the usual ones.
1. **Is one node unhealthy but the cluster serving traffic?**
   Probe each node directly rather than through the load balancer.
   A node that cannot reach the database will still answer the application port.
1. **Is the check itself the problem?**
   Use `deny` to exclude a check you know is failing for a reason you accept, rather than ignoring the whole endpoint.
{{< /diagnose >}}


## What the health checks do not cover

A `200` says the application started correctly and its dependencies answer.
It does not say that data is arriving, that anything is being processed, or that a search will return results.
Those are separate questions, and they have their own pages: [Is data arriving?]({{< relref "is-data-arriving.md" >}}) and [Is data processing?]({{< relref "is-data-processing.md" >}}).

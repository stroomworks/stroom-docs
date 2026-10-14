---
title: "Automation"
linkTitle: "Automation"
weight: 120
date: 2026-10-14
tags:
description: >
  Driving Stroom from outside the user interface: API keys, the REST API, and the commands that run against a stopped system.
pageKind: concept
---

Most of what the user interface does, it does by calling Stroom's own REST API.
That API is available to you as well, which is how content is promoted between environments, how dashboards are driven from elsewhere, and how routine administration stops being somebody's weekly click-through.

There are three ways in, and they suit different jobs:

* **The REST API**, authenticated with an API key, for anything you would otherwise do in the user interface.
  See [Using the REST API]({{< relref "rest-api.md" >}}).
* **The command line**, run on a node, for the few things that have to work when nobody can log in.
  See [Command line tools]({{< relref "command-line.md" >}}).
* **Content import and export**, for moving pipelines, XSLTs and dashboards between systems.
  See [Content management]({{< relref "../content-management.md" >}}).

[API keys]({{< relref "api-keys.md" >}}) comes first, because the API needs one and because a key is a durable credential that carries someone's permissions.


## What automation is good for here

* **Promoting content.**
  Build and test in one environment, export, import into another.
  This is the most common reason to automate Stroom and the one with the clearest payoff.
* **Checking health from your own monitoring.**
  See [Monitoring]({{< relref "../../operate/monitoring.md" >}}).
* **Bulk administration.**
  Creating users, assigning permissions, or creating feeds in numbers that make the user interface the wrong tool.
* **Running searches on a schedule** and sending the results somewhere else.


## What to be careful with

An API key is a person's permissions in a string.
Anything holding it can do what that person can do, without their involvement and without a second factor.
That is the point of it, and the reason it deserves the same handling as a password.

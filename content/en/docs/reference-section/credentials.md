---
title: "Credentials"
linkTitle: "Credentials"
weight: 10
date: 2026-01-16
tags:
description: >
  Authentication against other systems.
---

Sometimes Stroom needs to connect to other systems:

- Git repositories
- TBD

The Credentials module is intended to centralise the management of these
credentials within Stroom.


## Accessing Credentials Manager

The Credentials Manager can be accessed via the Stroom Menu {{< stroom-icon "menu.svg" >}} Security / Credentials Manager.


## Types of Credentials

Stroom supports different types of credentials:

 
### Username / Password

The username and password are passed to the server unchanged.


### Access Token

This is a variation of username / password authentication. 
Stroom will pass the token in place of the password.


### Key Pair

This is used when connecting to SSH servers. 
SSH authentication is not intuitive, thus the basics are explained here.

The user generates a key pair. 
The public part of the key pair is given to the SSH server, via the command line `ssh-copy-id` command or via an application-specific web user-interface. 
The private part is stored on the user's machine and is secured via a pass-phrase.
The pass-phrase ensures that if an attacker gains access to the user's file they cannot access the private key.

Thus Stroom needs to know the private key and the pass-phrase.

There is one more key pair involved. 
It is important that the client is confident that they are connecting to the correct SSH server.
Otherwise, an attacker might trick the user into connecting to the wrong server.
This is secured by the server's key pair. 
The server has a private key and allows the client to download the server's public key.

Stroom can optionally check the server's key, if the server's public key is provided. 
If no key is provided then Stroom will accept any server. 
This can be useful when getting things working but is not recommended for production use.


### Key Store

TBD

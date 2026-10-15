---
title: "Software Stack"
linkTitle: "Software Stack"
weight: 10
date: 2026-10-15
tags: 
description: >
  The software stack used by the Stroom family of products.

---

## Stroom and Stroom Proxy

Stroom and Stroom Proxy live in the same repository, share some common code and are built by the same Gradle build.

Versions change with every release.
The definitive list is `gradle/libs.versions.toml` in the Stroom repository; the major versions below are a guide.


### Languages and key frameworks

* **Java 25**, the Eclipse Temurin distribution: the language for the whole application, server and user interface.
  * {{< external-link "Dropwizard" "https://www.dropwizard.io/" >}} 5: the RESTful application framework, with embedded Jetty and Jersey.
  * Guice 7: dependency injection.
  * {{< external-link "GWT" "https://www.gwtproject.org/" >}} 2.13: compiles the Java user interface code into JavaScript.
    The client modules talk to the server through REST resources.
  * Jackson 3: JSON serialisation, with Jackson 2 still used in a few places that need it, such as YAML configuration.
  * jOOQ: generates Java code for type safe SQL.
  * Flyway: database migrations.
  * HikariCP: database connection pooling.
  * {{< external-link "Apache Lucene" "https://lucene.apache.org" >}}: the search library used by Stroom's indexes.
    Shaded copies of older Lucene versions are kept so that index shards written by earlier Stroom versions can still be read.
  * Saxon HE: XSLT and XPath processing in pipelines.
  * {{< external-link "LMDB" "http://www.lmdb.tech/doc/" >}}, through lmdbjava: memory mapped stores for reference data, Plan B and search results.
  * Elasticsearch Java client: Elasticsearch indexes.
  * LangChain4j and the OpenAI Java client: the AI features.
  * AWS SDK: S3 storage and SQS.
  * JUnit 5 and Mockito: testing.
  * SLF4J and Logback: logging.


### Build and development tools

* Gradle, through the wrapper in the repository: builds the application and orchestrates related sub-builds.
* GitHub Actions: the CI build and release.
* Bash: utility shell scripts.
* Docker: builds the Stroom and Stroom Proxy images, and provides consistent build environments for parts of the build, such as PlantUML diagrams.
* Docker Compose: runs the development and test stacks in `stroom-resources`.
* IntelliJ IDEA: used by most developers; the repository includes shared run configurations.
  See [Running Stroom in an IDE]({{< relref "stroom-in-an-ide.md" >}}).


### Services

* MySQL 8: the database Stroom keeps its state in.
  Stroom Proxy needs no database.
* Nginx: SSL termination, load balancing and reverse proxying in front of Stroom and Stroom Proxy.

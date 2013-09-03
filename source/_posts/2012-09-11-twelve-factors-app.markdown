---
layout: post
title: "Twelve factors app"
date: 2012-09-11 12:33
comments: true
categories: programming
---

The Twelve Factors App is a methodology that a web application should follow to be able to easily deploy and scale on today's SAAS platform like Heroku. This methodolgy is announced by the Heroku Founder Adam Wiggins. The content is the based on their experience of deploying millions of applications.

When I first saw this declaration, I just feel that this might be extract from rails and herokus best practices, but actually this declaration is more then practices but a methodology to improve the maintainbility and scalability of web application. so I like to share Heroku engineer's slide about 12 factors app:

<!-- more -->

<script async class="speakerdeck-embed" data-id="50254cb6af597c0002005bf3"
  data-ratio="1.3333333333333333" src="//speakerdeck.com/assets/embed.js"></script>

##[The Twelve-Factor App](http://www.12factor.net/)

### I. Codebase

> One codebase tracked in revision control, many deploys

### II. Dependencies

> Explicitly declare and isolate dependencies

### III. Config

> Store config in the environment

### IV. Backing Services

> Treat backing services as attacked resources

### V. Build, release, run

> Strictly separate build and run stages

### VI. Processes

> Execute the app as one or more stateless processes

### VII. Port binding

> Export services via port binding

### Concurrency

> Scale out via the process model

### IX. Disposability

> Maximize robustness with fast startup and graceful shutdown

### X. Dev/prod parity

> Keep development, staging, and production as similar as possible

### XI. Logs

> Treat logs as event streams

### XII. Admin processes

> Run admin/management tasks as one-off processes

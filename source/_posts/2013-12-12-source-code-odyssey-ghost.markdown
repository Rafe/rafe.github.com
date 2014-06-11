---
layout: post
title: "source code odyssey: Ghost"
date: 2013-12-12 19:55
comments: true
published: false
categories: programming, javascript
---

## Packages

+ express
+ express-hbs => template
+ connect-slashes => handle trailing slash
+ node-polyglot => intenalization library
+ moment => time format
+ showdown => compile markdown
+ sqlite3 => db
+ bookshelf => orm for mysql and postgres and sqlite3
+ knex => query builder for node
+ when => promise library
+ node-uuid => RFC4122 implementation => generate UUID
+ bcrypt-nodejs => navive implementation of bcrypt
+ colors => node.js console color
+ semver => semantic version parser
+ fs-extra => do something like mkdir -p, cp -r and rm -rf
+ downsize => tag-safe truncation for HTML and XML.
+ validator => date and time validation
+ rss
+ nodemailer

### def packages

+ mocha
+ sinon
+ should
+ matchdep => filter npm module dependencies by name
+ grunt
+ grunt-jslint
+ grunt-shell
+ grunt-mocha-cli => run mocha
+ grunt-express-server
+ grunt-open => open urls and files from task

### front-end libraries

+ backbone.js
+ handlebar
+ code-mirror
+ showdown => markdown compiler
+ chart.js
+ jquery
+ fastclick.js => move out delay of touch UI
+ hammer.js => multi touch libraries
+ packery.pkgd.js => masonary.js UI
+ shortcuts => create keyboard shortcuts
+ to_title_case => change word to title => 'This Is a Small but Good Title'
+ validator_client => client validator

## structures

/content
  /data => sqlite3 dat
  /images
  /plugins
  /themes
    /assets/
    default.hbs
    index.hbs
    post.hbs
/core
  /built => built javascripts
  /client 
    /assets
      /vendor
    /helpers => helpers function
    /models => backbone models
    /tpl
    /views
    init.js
    markdown-actions.js
    router.js => router
    toggle.js => toggle

## Datamodels

## Backbone multi view

## controller and APIHandler
    
## csrf handle

## code mirror

## mobile interaction

## Permissions

## tests

+ functional: CasperTest
+ integration: testing with features

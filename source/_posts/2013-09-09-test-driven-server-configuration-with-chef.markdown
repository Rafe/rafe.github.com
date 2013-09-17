---
layout: post
title: "Test driven server configuration with chef"
date: 2013-09-09 22:12
comments: true
categories: ruby, devops
published: false
---

## Chef!

Chef is a system configuration dsl.
For the software devloper who used to domain specific language,
chef turns system infrustracture into a software language that can develop and manage by source control

+ idempotent
+ script replacement
+ unittest
+ integration test

## install knife with chef server

## manage and use community cookbooks with Berkshelf

## build a redis / unicorn and nginx / postgres

+ write recipes with chef_spec, minitest-handler, test-kitchen and kitchen-vagrant
+ build 3 server cookbook, redis_server, web_server, database_server
+ attach web, redis and database role
+ why not put into role? cookbook is easier to track, version controller and set default value
+ also set roles to binding configuration

+ use chefspec to unittest cookbook
+ use minispec handler to verified server work
+ use serverspec to verified server works correctlly

+ use role to connect rails, redis and database server
+ use databag to store server
+ add capistrano spec to deploy

## deploy to amazon ec2!!

+ use knife-ec2 to create node
+ follow learnnode instruction
+ run serverspec according to the role

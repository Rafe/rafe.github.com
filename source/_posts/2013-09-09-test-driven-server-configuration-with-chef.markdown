---
layout: post
title: "Test driven server configuration with chef"
date: 2013-09-09 22:12
comments: true
categories: ruby, devops
published: false
---

I haven't update my the blog for almost 5 months.
Part of the reason is because I am switching between Jobs.
I the new job I am currently working in the devops team. 
mosting working on chef script and system admin.

## Chef!

Chef is a system configuration dsl.
For the software devloper who used to domain specific language,
chef turns system infrustracture into a software language that can develop and manage by source control

{% codeblock lang:ruby %}

package('git')

{% endcodeblock %}

## idempotent

Chef is like unittest/spec for infrustracture

## install knife with chef server

## manage and use community cookbooks with Berkshelf

## testing recipes with test-kitchen and kitchen-vagrant

## converging your node on AWS

#part2

## Unit test your reciep by Chef spec, foodcritic and strainer
unit test

## Collect tests from cookbooks and run minitest at end of converge by minitest-handler
integration test

## Testing your server by serverspec
functional test

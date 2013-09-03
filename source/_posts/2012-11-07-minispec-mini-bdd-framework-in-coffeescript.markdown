---
layout: post
title: "Minispec : mini BDD framework in coffeescript"
date: 2012-11-07 15:16
comments: true
categories: coffee-script test
---

##Just another test framework

During the catastrophe of Sandy storm, my place have no electricity and water, so I stay in my friends place for whole week.
And I need to find something to do except eating, surfing internet and boardgame.
So I just wrote another test framework.

Inspired by Zach Holoman's [gist](https://gist.github.com/1806986)
I try to host the framework in the gist form. Because every gist is also a git repository.

[gist source](https://gist.github.com/4033566)

<!-- more -->
## Spec

The README.md file is also a runnable spec in coffeescript.
run
    npm test

in project can execute the spec

{% gist 4033566 README.md %}

## Global delegation

One of the problem is the format of syntax.
Because I want to write syntax without extra `this` keyword, so instead of calling the test block with 'call',
I have to declare test syntax globally.

    #Instead this
    describe = (title, block)->
      @it = (desc, fn)->
        #add test to test suite
      block.call(@)

    describe "syntax", ->
      @it "have this keyword", ->

    #Got to do it Globally
    global.it = (desc, fn)->
      #add test to test suite
    describe = (title, block)->
      block()

    describe "syntax", ->
      it "have no this keyword", ->

But there's 2 problem of declaring global, one is the confrontation of global keywords, which is a tradeoff for simpler syntax.
Another problem is when implementing nested block, test need to be delegated into right suite.
Using a stack to track the current suite can solve this problem.

    suites = []
    global.it = (desc, fn)-> 
      suites[0].tests.push title: desc, fn: fn

    describe = (title, block)->
      suite = new Suite(title)
      suites.unshift(suite)
      block()
      suites.shift()

So the global `it` will always add test to the top of stack, which is the current test suite.

## Hook and run

For the before/after function, I use the EventEmitter to trigger the hooks, and delegate event to the parent suite:

    class Suite extends EventEmitter
      constructor: (@title, @parent)->
        ...
        @delegate ['before', 'after']
        @on 'result', @reportResult
        @on 'end', @reportSummary

      delegate: (events)->
        events.forEach (event)=>
          @on event, => @parent?.emit event

      run: ->
        @emit 'start'
        @tests.forEach (test)->
          try
            @emit 'before'
            test.fn()
            @emit 'result', test
            @emit 'after'
          catch err
            @emit 'result', test, err
        @emit 'end'

## Async

For testing the async callback, `it` also provide a done callback for the async function.
And I use [async](https://github.com/caolan/async) module to handle the test execution sequence.
It will detect the function param, if there is a specific callback param in function, execute in async mode.

## Source

{% gist 4033566 minispec.coffee %}

## Summary

Credit to VisionMedia's [mocha](https://github.com/visionmedia/mocha) framework, lots of solution is comming from there.

But still this is an intersting small project to do in the storm days.

And I am so happy to back to the normal life.

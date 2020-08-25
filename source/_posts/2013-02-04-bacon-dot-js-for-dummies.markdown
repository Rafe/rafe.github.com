title: "Bacon.js for dummies"
date: 2013-02-04 16:25
tags: javascript
---

Bacon.js is an FRP module for events on javascript. Which can transform 
your event listener/handler to a functional event stream. After servey a few blogs and example project,
I found it is a really interesting concept and can make event handling speghetti code into clear functional logics.

### Event stream

First, what is event stream?
Actually it is nothing special, it is just an event listener that listen to specific event.

For example,

    $("#clickme").on('click', function(event){ alert(event.target)})

Can transfer to event stream by Bacon.js's asEventStream helper:

    clicked = $("#clickme").asEventStream('click')

And add handler to event stream, listen to click event:

    clicked.onValue(function(event){ alert(event.target) })

<!-- more -->

### So what's the different?

Remember what I said in the beginning, event stream is functional.
Which means it provide functional interface to manipulate events:

    clicked
      .map(function(event) { return event.target })
      .onValue(function(element) { alert(element) })
    // will map the event to event.target

    clicked.skip(1).take(4).onValue(function(event) { alert(event.target) })
    // will only take the 2-5 click event.

    clicked
      .filter(function(event) { return event.type == 'click' })
      .onValue(function(event) { alert(event.target)})
    // will only take 'click' event on event stream

### Merge

A powerful feature of event stream is it can merge with multiple stream.
For example, if we want to listen 2 click event with enable and disable state, you can merge the stream:

    enable = $('#enable').asEventStream('click').map(true)
    disable = $('#disable').asEventStream('click').map(false)
    enable.merge(disable).onValue(function(state) { alert(state) })

### Property

Moreover, it provide property: an event stream with state.
What property different with event stream is it will remember the state of stream,
which is the event object or mapped value.

    buttonState = enable.merge(disable).toProperty(false)
    // with initial state false
    buttonState.onValue(function(state) {
      $('#button').toggleClass('enable', state)
    })

Also, it provide scan and assign helper to provide advance usage.

### Message Queue

We can also use the event stream as message queue.

    messageQueue = new Bacon.Bus()
    messageQueue.plug(enable.map({type: 'enable'}))
    messageQueue.plug(disable.map({type: 'disable'}))
    //plug event stream to queue

    messageQueue.onValue(function(event){ alert(event.type)})
    // listen and alert event state

    messageQueue.push({ type: 'disable'})
    // push event manually, alert event


The project [worzone](https://github.com/raimohanska/worzone) provide a more detailed implementation example for messageQueue

### Ajax

You can use the .ajax() helper to pass stream params to .ajax(params) and listen the promise object as event stream

    response = enable.map({url: '/enable', method: 'post' }).ajax()
    response.onValue(function(data) {
      alert(data)
    })

## So what is it trying to solve?

FRP, functional reactive programming on events.
Which reduce the duplicated part of event handling, and make code more looks like pure logic and functions.

I recommand to read the example of [Bacon.js tutorial](http://nullzzz.blogspot.fi/2012/11/baconjs-tutorial-part-i-hacking-with.html), 
and [todomvc example](https://github.com/raimohanska/todomvc) with Bacon.js.
It shows how the functional declarative can simplify codes.

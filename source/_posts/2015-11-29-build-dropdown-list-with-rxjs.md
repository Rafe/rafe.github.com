title: Build dropdown list with RxJS
date: 2015-11-29 17:30:00
tags: javascript
---

Dropdown list is one of the most common web UI component, but yet one of the most difficult to implement.

Recently I was working on a navigation dropdown list with animation. But this time, I implemented it with RxJS, which makes the code so much cleaner than usual javascript implementation.

So this article is going to talk about how to use RxJS to implement a dropdown list, what is RxJS in general and dropdown list example.

## RxJS

RxJS is a library called Reactive Extension in Javascript. This library enable [Function Reactive Programming](https://en.wikipedia.org/wiki/Functional_reactive_programming) in Javascript. Which let user can manage data or events as functional stream, and provide a series of funcational methods to manupulate stream.

It is easy to understand how function interact with streams from [RxMarble](http://rxmarbles.com/) or [RxVision](http://jaredforsyth.com/rxvision/examples/playground/)

For Example:

```javascript
var source = Rx.Observable.range(1, 5)

source
  .map( (x) => { return x * 2 })
  .filter( (x) => { return x % 3 !== 0 })
  .subscribe( (x) => {
    console.log(x)
  })

// 1
// 4
// 8
// 10
```

The code above provide a stream of data from 1 to 5. We can apply map function to mutate the stream to double the value, and filter out unwanted values.
`subscribe` method let us register listener to listen and react when receiving data from stream and print out the numbers.

## Start with marble diagram

The reason why dropdown list is hard is because it involves interaction between events and states.

Let me show a basic use case for dropdown list:

1. mouse enter item
2. display dropdown
3. mouse leave item
4. wait for n seconds before closing dropdown
5. mouse move into dropdown 
6. check the mouse is inside dropdown, keep dropdown open
7. mouse leave dropdown
8. wait for n seconds before closing dropdown
9. check the mouse is not inside item or dropdown, close dropdown

Usually when mouse enter item, we record the current state as 'inside item', and keep track of the state.
If mouse leave item but enter dropdown in some amount of time, we have to keep dropdown open, else user can never click any items on dropdown. After mouse enter dropdown, we will usually check the mouse state again to make sure we needs to keep dropdown open. Adding animation will makes this interaction more complicate.

So, how can RxJS solve this problem?

Before we implement anything, it's better to draw the marble diagram to understand the interaction:

```
                                   |check          |check
                              open |   |keep open  |   |close dropdown
Mouseenter item          -----O---------------------------

Mouseleave item          ----------O----------------------

Mouseenter dropdown      ------------O--------------------

Mouseleave dropdown      --------------------------O------

```

So first event is mouse enter item, when mouse enter item, it opens dropdown, and will not be effected or delay by other events.
Second event is mouse leave item, which trigger close dropdown check, if mouse does not move into dropdown, than close the dropdown.
Third is mouse enter dropdown, it will be triggered before dropdown closed, keeps dropdown open. And last is mouse leave dropdown. After mouse leave, dropdown will be closed.

We can find that the mouse enter and mouse leave events are actually a pair of actions both effect the state of mouse inside/outside item.
So we can actually merge the events into this:

```
                                   |check          |check
                              open |   |keep open  |   |close dropdown
Mouseenter item          ---  |    |   |           |   |
                           |  |    |   |           |   |
Mouseleave item          -----A----B----------------------
                                                   |   |
Mouseenter dropdown      ---                       |   |
                           |                       |   |
Mouseleave dropdown      ------------1-------------2------

A: enter, B: leave
1: enter, 2: leave

```

A and B present the state change. We can combine the state and action triggered to a table:

State |  1   |   2   |
------|------|-------|
 A    |  X   | open  |
 B    | open | close |


So if we merge the event into single stream and combine the latest state, the events become state changes:

```
                                   |check          |check
                              open |   |keep open  |   |close dropdown
                              |    |   |           |   |
State                    -----A2---B2--B1----------B2------

```

So with this diagram, we can start to implement dropdown in RxJs

## Implement in RxJS

First, we generate event stream from `mouseenter` `mouseleave` events

```javascript
var $ = require('jquery')
var Rx = require('rx')

var fromEvent = Rx.Observable.fromEvent;

var navItems = $('#nav-tray-links li');
var navTrays = $('.nav-tray');

var mouseEnterMenuItem = fromEvent(navItems, 'mouseenter');
var mouseLeaveMenuItem = fromEvent(navItems, 'mouseleave');
var mouseEnterTray = fromEvent(navTrays, 'mouseenter');
var mouseLeaveTray = fromEvent(navTrays, 'mouseleave');
```

Then, we can map the event to return true and false to present the state inside and outside, and merge mouseenter and mouseleave event into a single stream.

```javascript
var inMenu = mouseEnterMenuItem.map( () => { return true })
  .merge(mouseLeaveMenuItem.map( () => { return false }))

var inTray = mouseEnterTray.map( () => { return true } )
  .merge(mouseLeaveTray.map( () => {return false })).startWith(false)
```

And the next part is to combine those 2 event stream and transform them into a single state by `combineLatest`, when event happened, return with both latest value from both stream.
[combineLatest](http://rxmarbles.com/#combineLatest)

Also the inTray stream needs to start with false since the `combineLatest` does not work without all the streams have values.

```javascript
var state = Rx.Observable.combineLatest(inMenu, inTray)

// handle state A2: open dropdown
state.filter( (args) => { return args[0]})
  .subscribe(openTray)

// handle state B2: close dropdown
state.filter( (args) => { return !args[0] && !args[1] })
  .subscribe(closeTray)
```

## Manipulate event stream

So we get a pretty simple and clean dropdown list now, but we did not consider the case when mouse move in and move out in short periods of time,
we want to keep dropdown open when mouse move from item to dropdown, or move from dropdown to item.

We can use [debounce](http://rxmarbles.com/#debounce) to only trigger event that does not change in certain amount of time.
when mouse enter and leave item, the debounce can filter out the enter event, only capture the last event in certain time range.

```javascript
var state = Rx.Observable.combineLatest(inMenu, inTray)
  .debounce(200)
  .subscribe(openTray)
```

With debounce method, we can easily create and control the event stream without any `timeout` call in javascript. And also easy to modify and change.

[Throttle](http://rxmarbles.com/#throttle) can also be used here to make sure the animation dropdown can be finished without other event interuption.

### Souce Code & Demo

[source](http://www.github.com/rafe/rxjs-menu)
[demo](http://neethack.com/rxjs-menu)

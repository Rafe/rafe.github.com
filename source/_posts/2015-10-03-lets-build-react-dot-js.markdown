---
title: "Let's build react.js"
date: 2015-10-03 11:11
comments: true
categories: react.js javascript
---

Recently React is growing to become the de facto standard for web components. And it is also pretty straight forward to learn and use React.

I recommand to start with the [official website](https://facebook.github.io/react/) for documentations, also some examples on [github](https://github.com/facebook/react/tree/master/examples) and [Todomvc](http://todomvc.com/examples/react)

However, for people already know how to write React, they might still wondering why React is built in a certain way, like React DOM, state, how React update and manipulate the DOM elements.

For those who is curious, this article is going to rebuild React from scratch and create a workable basic React-like framework, by going through the logics in React source code. I hope you can understand how React works after go through this post.

I recommand you can also checkout the [code example]() from github, each section is tagged by step 1-10, you can follow the code example to see how the code evolves, and also with test cases.

## Let's write React component!

First, let's create a simple react example:

{% jsfiddle a81h610a result,js,html %}

In this component, We create the virtual DOM with ReactDOM but not jsx, render the DOM into container, and handle a click event to update the text and state with current timestamp.

Right now, we are going to take out the React framework, and write some code to make this work.

So... *Let's Build React.js!!* (React.jsを作ってみましょう!!)

## Let's build React Element!

Before building element, we need to understand the difference between React Element and React Component

React Element is data. Includes content type, property and child elements. Content type includes React DOM or React Class, React DOM is usually what we can find in render() method, React Class is the custom class that we wrote for application logic.

React Component is an instance. It contains element, render React DOM element to to html, handle events, manage state and update DOM when state changes.

```javascript
var ReactElement = function(type, props) {
  this.type = type
  this.props = props
}

var createElement = function(type, config, children) {
  var props = {}
  for (propName in config) {
    props[propName] = config[propName]
  }
  props.children = children

  return new ReactElement(type, props)
}
```

We create a simple ReactElement that holds the element type and properties. Also a createElement method that creates element by the type, properties and children.

With this createElement method, we can start to build ReactDOM.

## Let's build React DOM!

React DOM is a ReactElement with tag name as type, for example, a div element has 'div' as element type. We can create a DOM factory using javascript's bind method:

```javascript
var DOM = {};
['div', 'a', 'h1', 'p'].forEach(function() {
  DOM[type] = createElement.bind(null, type)
})

var React = {
  createElement: createElement,
  DOM: DOM
}
```

With React.DOM, we can build DOM tree with those factory methods:

```javascript
DOM.div(null, [
  DOM.h1({ className: 'title'}, 'This is title')
])

// <div>
//   <h1 class="title">This is title</h1>
// </div>
```

React DOM is the virtual DOM that represent the structure of DOM elements, because of the Virtual DOM, React can update only neccessary part when the structure or data changed on application.

Next we will create React Components to manage those Virtual DOM.

## Let's build React Component!

React has 3 kinds of Components (basically) :

+ TextComponent: render text content.
+ DOMComponent: render tag and it's child elements.
+ CompositeComponent: custom react component with React Class, which includes all application logics. It is the component we saw in example.

Each kind of component holds different element. A factory method 'instantiateReactComponent' will take element and create component by element types:

```javascript
var ReactDOMTextComponent = function(text) {
  this._currentElement = text
}

var ReactCompositeComponent = function(element) {
  this._currentElement = element
}

var ReactDOMComponent = function(element) {
  this._currentElement = element
}

function instantiateReactComponent(node) {
  if(typeof node === 'object') {
    if (typeof node.type === 'string') {
      return new ReactDOMComponent(node)
    } else if (typeof node.type === 'function') {
      return new ReactCompositeComponent(node)
    }
  } else if (typeof node === 'string' || typeof node === 'number') {
    return new ReactDOMTextComponent(node)
  }
}
```

## Let's create React Class!

Class is the building block for React. A class define an interface for CompositeComponent to interact with application logics.
includes methods like `render`, `setState`, `render`, `getInitialState` and other custom methods. Also holds the state of the component.

```javascript
function createClass(spec) {
  var Constructor = function(props, updater) {
    this.props = props
    this.state = this.getInitialState ? this.getInitialState() : null
    this.updater = updater

    var self = this

    // set state and trigger update
    this.setState = function(states) {
      for (name in states) {
        self.state[name] = states[name]
      }

      self.updater.receiveComponent(self.render())
    }
  }
  Constructor.prototype = spec

  return Constructor
}
```

In here, `createClass` method returns constructor function for class, includes get initial states and set setState method, also inherit methods from spec object.

The class instance will be created as ReactCompositeComponent when it got instantiated by `React.render()` method.

Also, the class takes an updater as attribute, which is a ReactUpdateQueue object in Real React that quque DOM update actions, detect difference and update DOM.

After we have class, elements and components, we can start to implement 'mount' function on component, which creates rendered element for React to mount on container.

## Let's mount React Component!

For text component, mount method is simple:

```javascript
ReactDOMTextComponent.prototype.mountComponent = function(rootID) {
  this._rootID = rootID
  return ('<span data-reactid="' + rootID + '">' + this._currentElement + '</span>')
}
```

We wrap the content with `<span>` tag for text element, put rootID as a data attribute `data-reactid` which will be pretty important when we try to update it.

For composite element, we initialize the element class, call `render()` to get DOM tree, than mount the returned DOM.

```javascript
ReactCompositeComponent.prototype.mountComponent = function(rootID) {
  this._rootID = rootID

  var instance = new this._currentElement.type(this._currentElement.props, this)

  var renderedElement = instance.render()

  this._renderedComponent = instantiateReactComponent(renderedElement)

  return this._renderedComponent.mountComponent(rootID)
}
```

Mounting the DOM component is a complex one. First we generate element tag, attach property like class name, then iterate all child elements, instantiate and mount child components and pass along react ID to keep track the index of elements.

```javascript
ReactDOMComponent.prototype.mountComponent = function(rootID) {
  this._rootID = rootID

  var props = this._currentElement.props

  //creates tag and add attributes
  var tagOpen = '<' +
    this._currentElement.type +
    this.createMarkupForStyles(props) +
    ' data-reactid="' + this._rootID + '"' +
    '>'

  //creates close tag
  var tagClose = '</' + this._currentElement.type + '>'

  //iterate through child elements
  if(props.children) {
    // instantiate all the child components
    this._renderedComponents = props.children.map(function(element){
      return instantiateReactComponent(element)
    })

    // render child components, passing rootID to keep track element position
    // ex: reactid 0.1.2 means it is at the third layer from top of the container,
    // and is third element from it's parent
    var subIndex = 0
    var tagContent = this._renderedComponents.map(function(component) {
      var nextID = rootID + '.' + subIndex++
      return component.mountComponent(nextID)
    }).join('')
  } else {
    var tagContent = ''
  }

  return tagOpen + tagContent + tagClose
}

ReactDOMComponent.prototype.createMarkupForStyles = function(props) {
  if(props.className) {
    return ' class="' + props.className + '"'
  } else {
    return ''
  }
}
```

And `mountComponent` method returns rendered html from virtual DOM.

## Let's render React Component!

After we get all component rendered, we can put generated DOM onto the browser by calling `React.render` method.

In render method we take the top level element, create components, render and mount html to container.

```
function render(element, container) {

  var topComponent = instantiateReactComponent(element)

  // get initial reactid, usually is '.0'
  var reactRootID = registerComponent(topComponent, container)

  container.innerHTML = topComponent.mountComponent(reactRootID)
}

// in example:
var start = new Date().getTime()
React.render(
  React.createElement(App, { start: start }),
  document.getElementById('container')
)
```

Now we have the rendered components display on screen, next step is to handle update and events.

## Let's getNode by ReactID!

Before we go to next step, we need to understand how ReactID works.

`data-reactid` is a custom data attribute that exists on every react generated DOM elements. usually in the form of '.0.1.2'. The dot is seperator, and number is the index of the element under parent

For example:

```html
<article>
  <div></div>
  <div>
    <p>Test1</p>
    <p>Test2</p>
    <p>Test3</p>
  </div>
</div>
```

We set the article element with reactid .0, the next 2 div will inherit parant id .0 and have the subfix to present it's index.
the first div under article element will have id .0.0, second div will have id .0.1. So the element Test3 will have id .0.1.2, which means is on the second layer from top element, 2nd element on first layer and 3rd element on second layer.

As the example with reactid:

```
<article data-reactid=".0">
  <div data-reactid=".0.0"></div>
  <div data-reactid=".0.1">
    <p data-reactid=".0.1.0">Test1</p>
    <p data-reactid=".0.1.1">Test2</p>
    <p data-reactid=".0.1.2">Test3</p>
  </div>
</div>
```

But what are those id for? React component actually does not hold the reference of generated DOM, so when the component state changed, we need to find the DOM element by `getNode` function with ReactID.

So let's implement the getNode function:

```javascript
function getNode(targetID) {
  // get the array of ids
  var sequenceID = targetID.split('.')
  sequenceID.shift()

  // get the top level element, which registered when you call render at top level.
  var child = containersByReactRootID[targetID.slice(0, 2)]
  while(child) {
    var id = child.getAttribute('data-reactid')
    if (id === targetID) {
      return child
    } else if(child.children){
      // get the child element by index, with HTML DOM children property
      child = child.children[sequenceID.shift()]
    } else {
      child = null
    }
  }
}
```

With the `getNode` function, the component can link to the mounted DOM element, update and detect event by reactid.

## Let's capture event!

So let's talk about event

![Event](react_event.png)

This is the architecture for React events. Basicaly react capture the bubbled event on top level, get the reactid from event target to identify which event listener to call.
This a a centralize structure to handle events. So there is no event attached to child DOM element, all listener are attached at top level. So we react update, it does not needs to keep tracks of event listeners.
And the EventPluginHub allow plugin to handle all propagated events.

So let's start with ReactEventEmitter:

```javascript
var ReactEventEmitter = {
  listenerBank: {},

  // put listener to listener bank, takes id, event name and listener function
  putListener: function putListener(id, registrationName, listener) {
    var bankForRegistrationName =
      this.listenerBank[registrationName] || (this.listenerBank[registrationName] = {})

    bankForRegistrationName[id] = listener
  },

  getListener: function getListener(id, registrationName) {
    return this.listenerBank[registrationName][id]
  },

  // add an event dispatcher on top level element
  trapBubbledEvent: function trapBubbledEvent(topLevelEventType, element) {
    // handle different event name
    var eventMap = {
      'onClick': 'click'
    }
    var baseEventType = eventMap[topLevelEventType]
    element.addEventListener(baseEventType, this.dispatchEvent.bind(this, topLevelEventType))
  },

  // call registered event listener by react id and event name
  dispatchEvent: function dispatchEvent(eventType, event) {
    event.preventDefault()
    var id = event.target.getAttribute('data-reactid')
    var listener = this.getListener(id, eventType)
    if(listener) {
      listener(event)
    }
  }
}
```

This is a simplified version of event emitter, we can add the hook to React.render function to trap event at top level:

```javascript

function render(element, container) {

  var topComponent = instantiateReactComponent(element)

  var reactRootID = registerComponent(topComponent, container)

  // trap onClick event on top level
  ReactEventEmitter.trapBubbledEvent('onClick', container)

  container.innerHTML = topComponent.mountComponent(reactRootID)
}
```

With this centralize event structure, React can manage all event listeners at one place, allow EventPlugin to plug and handle events.

## Let's update React Component!

Update component is triggered by receiveComponent function, which take another element (data) and component will rerender with minimal DOM manipulation.
When the component receive element, it will compare the element is different or not, if it is different, rerender element and child elements, mount new DOM html to replace old html on browser DOM tree.

On text component, it is pretty simple, the component will compare new element, which is text. If text is changed, find Node by reactid, and update itself to new text.

```javascript
ReactDOMTextComponent.prototype.receiveComponent = function(nextText) {
  if(this._currentElement != nextText) {
    var node = React.getNode(this._rootID)
    node.innerHTML = nextText
  }
}
```

On CompositeComponent, it will just call the child component with new element, which delegate to top level DOM component on virtual DOM.

```javascript
ReactCompositeComponent.prototype.receiveComponent = function(nextElement) {
  this._renderedComponent.receiveComponent(nextElement)
}
```

For DOM component, it will check all child components to see if any element changed, if so, then rerender the child elements.
DOM component compare element by shouldUpdateReactComponent function.
In this example we only compare the types, and only expect TextComponent to update itself. But in React it check the DOM structure change and remount the changed elements.

```javascript
ReactDOMComponent.prototype.receiveComponent = function(nextElement) {
  this._currentElement = nextElement

  var nextChildren = nextElement.props.children || []

  // iternate through every children
  for(var i = 0; nextChildren.length > i; i++) {
    var childElement = nextChildren[i]
    var childComponent = this._renderedComponents[i]
    // check and update children
    if (shouldUpdateReactComponent(childComponent._currentElement, childElement)) {
      childComponent.receiveComponent(childElement)
    }
  }
}

function shouldUpdateReactComponent(prevElement, nextElement) {
  if (prevElement != null && nextElement != null) {
    var prevType = typeof prevElement
    var nextType = typeof nextElement
    if (prevType == 'string' || prevType === 'number') {
      return nextType === 'string' || nextType === 'number'
    } else {
      return (
        nextType === 'object' &&
        prevElement.type === nextElement.type
      )
    }
    return false
  }
}
```

Here is the finished example:

{% jsfiddle 05szbnbw result,js,html %}

This example simplified most of the complex logic in React, so if you are interested, go check the source code.

There is a lot of details about how React queue up DOM updates for performence. But I hope this example is enough to show the basics of how React works.

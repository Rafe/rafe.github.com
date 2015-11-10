---
layout: post
title: "Learn jQuery from jqLite"
date: 2014-06-10 22:31
comments: true
categories: javascript
---

## JQuery

Jquery is a great library, it makes manipulating DOM element and browser really simple and easy.
As a web developer, jQuery is our day to day tool. However, sometimes it just too convenience that
we forget how to make web page without it. It is important to go back to see how jQuery handle and wrap
the DOM api and provide the simple interface for us.

## JQLite

[JQLite](https://github.com/angular/angular.js/blob/master/src/jqLite.js)

Angular.js comes with a simple compatible implementation of jQuery, called JQLite.
JQLite is used internally for angular.element if user doesn't include jQuery, as a
replacement for jQuery. It only have 1000 lines of code with lots comments,
So it's a good starting point to understand how jQuery works.

<!-- more -->

## initialize element

jQuery wrap the html DOM with jQuery object, as in JQLite:

{% codeblock lang:js %}
function JQLite(element) {
  // if element is jquery object, return element
  if (element instanceof JQLite) {
    return element;
  }
  // if element is string, trim it
  if (isString(element)) {
    element = trim(element);
  }
  // and if element is html tag, create new jquery object with it.
  if (!(this instanceof JQLite)) {
    if (isString(element) && element.charAt(0) != '<') {
      throw jqLiteMinErr('nosel', 'Looking up elements via selectors is not supported by JQLite! See: http://docs.angularjs.org/api/angular.element');
    }
    return new JQLite(element);
  }
  // wrap element with jquery interface
  if (isString(element)) {
    jqLiteAddNodes(this, jqLiteParseHTML(element));
  } else {
    jqLiteAddNodes(this, element);
  }
}

function jqLiteAddNodes(root, elements) {
  if (elements) {
    elements = (!elements.nodeName && isDefined(elements.length) && !isWindow(elements))
      ? elements
      : [ elements ];
    // push element to jqLite object
    for(var i=0; i < elements.length; i++) {
      // push function is borrowed from Array object
      root.push(elements[i]);
    }
  }
}
{% endcodeblock %}

After initialize, we get a new JQLite object with html DOM inside. then we can call
the jquery api to manipulate to inside element.

## ready

One thing jquery provide is $.ready, which will execute the block inside only when
dom is ready

{% codeblock lang:js %}
JQLite.prototype.ready: function(fn) {
  var fired = false;

  function trigger() {
    if (fired) return;
    fired = true;
    fn();
  }

  // check if document already is loaded
  if (document.readyState === 'complete'){
    setTimeout(trigger);
  } else {
    this.on('DOMContentLoaded', trigger); // works for modern browsers and IE9
    // we can not use JQLite since we are not done loading and jQuery could be loaded later.
    // jshint -W064
    JQLite(window).on('load', trigger); // fallback to window.onload for others
    // jshint +W064
  }
}

{% endcodeblock %}

From the source, we can know jquery check the document.readyState,
DOMContentLoaded event and window.onload event for the ready function.

## attributes

jquery provides good api to set the attributes of DOM element, include css,
attr, prop. lets take css as example:

{% codeblock lang:js %}
// removed ie hacks...
css: function(element, name, value) {
  name = camelCase(name);

  if (isDefined(value)) {
    element.style[name] = value;
  } else {
    return element.style[name];
  }
}
{% endcodeblock %}

One reason that jquery interface is easy to use is, it provides single function
for both getter and setter. If we pass value, css function is a setter,
otherwise it returns css value of name.

Also, jquery object may include multiple elements, so inside the jquery object,
the css function is wrapped to execute on multiple elements:

{% codeblock lang:js %}
JQLite.prototpype[name] = function(arg1, arg2) {
  ...
  if (...) {
    // we are a read, so read the first child.
    var value = fn.$dv;
    // Only if we have $dv do we iterate over all, otherwise it is just the first element.
    var jj = (value === undefined) ? Math.min(this.length, 1) : this.length;
    for (var j = 0; j < jj; j++) {
      var nodeValue = fn(this[j], arg1, arg2);
      value = value ? value + nodeValue : nodeValue;
    }
    return value;
  } else {
    // write, apply to all children
    for (i = 0; i < this.length; i++) {
      fn(this[i], arg1, arg2);
    }
    // return self for chaining
    return this;
  }
  ...
}

{% endcodeblock %}

jQuery object provide both setter and getter on same function, multiple assignment,
short function name and also chaining. It is a really sophisticate api.

## events

One thing jquery handled is event, in the time before jquery, people need to
handle different event api between IE and others. Lets see how JQLite handle this:

{% codeblock lang:js %}
// mapping addEventListener (not IE) and attachEvent (IE) events api.
var addEventListenerFn = (window.document.addEventListener
    ? function(element, type, fn) { element.addEventListener(type, fn, false);}
    : function(element, type, fn) { element.attachEvent('on' + type, fn);};

on: function onFn(element, type, fn) {
  var events = jqLiteExpandoStore(element, 'events');
  // handler will stop propagation and default events
  var handle = createEventHandler(element, events);
  var eventFns = events[type];

  if (!eventFns) {  
    addEventListenerFn(element, type, handle);
    eventFns = [];
  }
  eventFns.push(fn);
}

{% endcodeblock %}

## conclusion

After review the JQLite source, we can better understand the jQuery API
and how jquery works. And why you can do things such as combine getter and setter,
chaining and multi element assign. Learning those skills can also help us to design better API.

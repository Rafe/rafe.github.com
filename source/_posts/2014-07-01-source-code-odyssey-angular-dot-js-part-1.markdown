---
layout: post
title: "source code odyssey: angular.js part 1"
date: 2014-10-01 23:05
comments: true
categories: javascript
---

## Angular.js

[Angular.js](https://angularjs.org/)

Angular.js is a great

## dependencie injection

<!-- more -->

{% codeblock lang:js %}

var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

function annotate(fn) {
  var $inject = [];
  
  var fnText = fn.toString().replace(STRIP_COMMENTS);

  var argDecl = fnText.match(FN_ARGS);

  argDecl[1].split(FN_ARG_SPLIT).forEach(function(arg){
    arg.replace(FN_ARG, function(all, underscore, name) {
      $inject.push(name);
    });
  });

  fn.$inject = $inject;

  return $inject;
}

var args = annotate(function($http, $form) {
  return true;
});

console.log(args); // [ '$http', '$form']

function inject(fn, locals) {
  var args = [];

  locals.forEach(function(key){
    args.push(locals[key]);
  });

  fn.apply(this, args);
}

{% endcodeblock %}

## links

1. Dependencie injection (this)
1. Scope
1. Template
1. Router
1. Directive
1. Module
1. Testing

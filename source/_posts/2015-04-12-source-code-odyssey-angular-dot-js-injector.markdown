---
layout: post
title: "source code odyssey: angular.js injector"
date: 2015-04-12 23:05
comments: true
categories: javascript
---

## [Angular.js](https://angularjs.org/)

Angular.js is a fasnating framework that including a lots of interesting features.
One of the unique feature in Angular.js is dependency injection,
instead of requiring and injecting the dependencies, Angular.js creates a special component to find the dependencies according to parameter names and pass it through the function:

{% codeblock lang:js %}

var injector = angular.injector();

injector.invoke(function($http) {
  //get http service from service providers
  $http.ping('http://angularjs.org');
});

{% endcodeblock %}

<!-- more -->

Pretty cool right? In Angular, injector handle all the dependencies in controller and components in every function calls.
you can name the parameter and get the what you want.

But how does Angular do it?

Turns out there is a small core file that handle the injection In angular source:

[src/auto/injector.js](https://github.com/angular/angular.js/blob/master/src/auto/injector.js)

## Mini Injector

I created a simplified version of injector to demostrate how the injector works:

{% gist 33cf0fb9728d0753ac39 mini-injector.js %}

The process for inject dependencies can seperate to three steps:

1. get list of parameter names
1. get the service/componenet from list
1. call the function with service/components

For getting the list of parameter names, angular use Function.toString() to get the function text,
parse the parameter text and returns the list of parameter names:

{% codeblock lang:js %}

annotate(function(a, b, c) {});
// returns parameter names ['a', 'b', 'c']

{% endcodeblock%}

For getting the actual service, Angular have providers to instantiate the service, register in cache and return the service with same name.
In the mini-injector, we just pass in the plain hash providers. and injector call the function with the value from provider hash

{% codeblock lang:js %}

function createInjector(providers) {
  return function injector(fn, self) {
    var args = [],
        // get the param names from function
        $inject = annotate(fn);

    // get service from provider cache, push it to argument list.
    $inject.forEach(function(arg) {
      args.push(providers[arg]);
    });

    // call the function with argumenets
    return fn.apply(self, args);
  }
}

// create an injector with serviceA and serviceB
var injector = createInjector({
  serviceA: 'hello',
  serviceB: 'world',
});

// inject the serviceA and serviceB to function
injector(function(serviceA, serviceB) {
  console.log(serviceA, serviceB); // hello world
});

{% endcodeblock%}

After understand how injector works, we can dive into more details about angular injector:

## Annotate

In angular, you can invoke the function with an array of parameter names to avoid minifier/compiler rename the params of functions.

    ['serviceA', 'serviceB', function(serviceA, serviceB) {}]

Also, after the function got annotated, we can get the parameter names from Function.$inject:

    var fn = function(serviceA, serviceB) {}
    injector.annotated(fn);
    fn.$inject // ['serviceA', 'serviceB']

## Provider

In Angular, it provides three ways to register provider:

+ $provide.provider

$provider.provider takes a factory constractor, which includes a $get method to create actual service instance:

{% codeblock lang:js %}

$provide.provider('service', function ServiceFactory() {
  this.$get = function() {
    return {
      hello: function() {
        console.log('world');
      }
    }
  }
});

$injector.invoke(function(service) {
  service.hello(); // world
});

{% endcodeblock %}

+ $provide.factory

Similar to provider, but instead passing factory constractor, it takes factory method $get directly:

{% codeblock lang:js %}

$provide.factory('service', function getService() {
  return {
    hello: function() {
      console.log('world');
    }
  }
});

$injector.invoke(function(service) {
  service.hello(); // world
});

{% endcodeblock %}

+ $provide.service take a constractor method and instantiate:

{% codeblock lang:js %}

$provider.service('service', function Service() {
  this.hello = function() {
    console.log('world');
  }
});

$injector.invoke(function(service) {
  service.hello(); // world
});

{% endcodeblock %}

Inside $provide.provider, it take an object or constactor function,
create a factory object with $get method and put into providerCache:

{% codeblock lang:js %}

function provider(name, provider_) {
  assertNotHasOwnProperty(name, 'service');
  // instantiate factory object if provider is constructor
  if (isFunction(provider_) || isArray(provider_)) {
    provider_ = providerInjector.instantiate(provider_);
  }
  // raise error if object does not have $get method
  if (!provider_.$get) {
    throw $injectorMinErr('pget', "Provider '{0}' must define $get factory method.", name);
  }
  // save provider in providerCache
  return providerCache[name + providerSuffix] = provider_;
}

// factory method pass function as $get method in factory object
function factory(name, factoryFn) { return provider({ $get: factoryFn }) });

// service method build the object, pass it to factory as an $get function
function service(name, constructor) {
  return factory(name, ['$injector', function($injector) {
    return $injector.instantiate(constructor);
  }]);
  // equal:
  // provider({
  //   $get: function() {
  //     new constructor();
  //   }
  // })
}

{% endcodeblock %}

## Injector

Injector invoke the function with objects from providers:

{% codeblock lang:js %}

// simplified for read:
function invoke (fn, self, locals, serviceName) {
  var args = [],
      $inject = annotate(fn, strictDi, serviceName);
      length, i, key;

  for(i = 0; length = $inject.length; i < length; i++) {
    key = $inject[i];
    // getService method create service by invoke .$get method on providerCache
    args.push(
      locals && locals.hasOwnProperty(key)
      ? locals[key]
      : getService(key)
    );
  }
  return fn.apply(self, args);
}

{% endcodeblock %}

## Conclusion

Dependencie injection in angular is handle by this injector pretty elegantly,
it takes the most advantage of meta programming by the flexibility of javascript.
I will continue to dig into more cool pieces in angular to write the next code odyssey article, stay tune...

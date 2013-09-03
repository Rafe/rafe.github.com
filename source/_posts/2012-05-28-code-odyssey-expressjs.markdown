---
layout: post
title: "Code odyssey : Express"
date: 2012-05-28 20:21
comments: true
categories: javascript, programming
---

Recently I was looking for web frameworks on Node.js. There are [Tower.js](http://towerjs.org/), [Railway](http://railwayjs.com/), [GeddyJS](http://geddyjs.org/), [SocektStream](http://socketstream.com/), [Meteor](https://github.com/meteor/meteor) and lots of cool framework on Node.js. However, Express, which created in the beginning of Node.js era, is still a very stable and easy to use framework with the most plugin and community support. Therefore, I think it is a good candidate as my 2nd source code review project.

Express.js is developed by [TJ Holowaychuk](https://github.com/visionmedia), who rebuild the web development on Node.js with express, [jade](http://jade-lang.com/), [mocha](https://github.com/visionmedia/mocha), [stylus](https://github.com/learnboost/stylus) and more. Express is inspired by the simple of [Sinatra](http://www.sinatrarb.com/) provide a simple and elegant interface for http request, also with connect middle support that let user can easily extend the framework. 

<!--more-->

##Usage

Here's the hello world sample of express. It assign a callback for get request on root '/', and start the server to listen port 3000. More example can be found on [express/examples](https://github.com/visionmedia/express/tree/master/examples) and [Documentation of express](http://expressjs.com).

{% codeblock lang:js %}

var express = require('express');

var app = express.createServer();

app.get('/', function(req, res){
  res.send('Hello World');
});

app.listen(3000);
console.log('Express started on port 3000');

{% endcodeblock %}

##Connect

Express is using the [Connect](http://www.senchalabs.org/connect/) Middleware. But What is connect? From the configuation function of Express:

{% codeblock lang:js %}

app.defaultConfiguration = function(){
  var self = this;

  // default settings
  this.set('env', process.env.NODE_ENV || 'development');
  debug('booting in %s mode', this.get('env'));

  // implicit middleware
  this.use(connect.query());
  this.use(middleware.init(this));

  ...
  // router
  this._router = new Router(this);
  this.routes = this._router.map;
  ...
};

{% endcodeblock %}

We can see that express call the use method with connect.query(), the query() parse the query string and attach to the request object req.query.

In the source of connect.query():

{% codeblock lang:js %}

module.exports = function query(options){
  return function query(req, res, next){
    req.query = ~req.url.indexOf('?')
      ? qs.parse(parse(req.url).query, options)
      : {};
    next();
  };
};

{% endcodeblock %}

The next() method invoke the next method on the process chain.
We can see that it return a method that parse the req.url with qs.parse function and return to req.query. So we can get the query string from req.query in our application.

So we can see the middleware as a function that execute before the request and add functionality to (req, res) object. So we can easily use a function as middleware. In example, we can refactor the hello world as middleware:

{% codeblock lang:js %}

var express = require('express');

var app = express.createServer();

app.use(function(req, res, next){
  req.message = 'Hello world';
  next();
});

app.get('/', function(req, res){
  res.send(req.message);
});

app.listen(3000);
console.log('Express started on port 3000');

{% endcodeblock %}

In more advance usage, we can build a **flash** message using middleware:

{% codeblock lang:js %}

app.use(function(req, res, next){
  res.locals.flash = req.session.flash || "";
  req.session.flash = "";
  next();
});

{% endcodeblock %}

Also, there is another kind middleware called param callback. which will only be executed when the route have the param key:

{% codeblock lang:js %}

app.param('user_id', function(req, res, next, id){
  User.find(id, function(err, user){
    if (err) {
      next(err);
    } else if (user) {
      req.user = user;
      next();
    } else {
      next(new Error('failed to load user'));
    }
  });
});

{% endcodeblock %}

Will be invoked when route params have 'user_id':

{% codeblock lang:js %}

app.get('/:user_id', function(req, res){
  send('User name is' + req.user.name );
});

{% endcodeblock %}

##Application

The main application is on lib/express.js. It produce express app by **createApplication** function. First, the application merge with **connect**, set request and response object, than call the initialize function of application defined in lib/application.js

{% codeblock lang:js %}

var connect = require('connect')
  , proto = require('./application')
  , req = require('./request')
  , res = require('./response')
  
…
…

function createApplication() {
  var app = connect();
  utils.merge(app, proto);
  app.request = { __proto__: req };
  app.response = { __proto__: res };
  app.init();
  return app;
}

{% endcodeblock %}

In application.js, the **init** function initialize the settings and default configuration of express, and also load the Router to route the Http requests. 

Also an important part, some of the settings is depend on **process.env**, like cache. Which can be enabled by exports NODE_ENV=production.

	this.set('env', process.env.NODE_ENV || 'development');


##Router

Lets step into the router, basically, the router provide *route* method to assign function to route, and *matchRequest* to return route.

In *route*

{% codeblock lang:js %}
/**
 * Route `method`, `path`, and one or more callbacks.
 *
 * @param {String} method
 * @param {String} path
 * @param {Function} callback...
 * @return {Router} for chaining
 * @api private
 */

Router.prototype.route = function(method, path, callbacks){
  var method = method.toLowerCase()
    , callbacks = utils.flatten([].slice.call(arguments, 2));

  // ensure path was given
  if (!path) throw new Error('Router#' + method + '() requires a path');

  // create the route
  debug('defined %s %s', method, path);
  var route = new Route(method, path, callbacks, {
      sensitive: this.caseSensitive
    , strict: this.strict
  });

  // add it
  (this.map[method] = this.map[method] || []).push(route);
  return this;
};

{% endcodeblock %}

The route function take the Http method (like 'get'), path and callback. normalize them and create Route object. add to the **map[method]** array in Router.

Also, it use the meta programming skill to generate public helper for user, so we can call the **app.get** or **app.post** method to assign route.

In application.js
{% codeblock lang:js %}
var methods = require('methods')

…

/**
 * Delegate `.VERB(...)` calls to `.route(VERB, ...)`.
 */

methods.forEach(function(method){
  app[method] = function(path){
    if ('get' == method && 1 == arguments.length) return this.set(path); 
    var args = [method].concat([].slice.call(arguments));
    if (!this._usedRoutnner) this.use(this.router);
    return this._router.route.apply(this._router, args);
  }
});

{% endcodeblock %}

But after the route is set, how do express invoke the handle function? We can see the usage from the test case:

{% codeblock lang:js %}
  describe('.middleware', function(){
    it('should dispatch', function(done){
      router.route('get', '/foo', function(req, res){
        res.send('foo');
      });

      app.use(router.middleware);

      request(app)
      .get('/foo')
      .expect('foo', done);
    })
  })
{% endcodeblock %}

In the test case we can see the **app.use(router.middleware)** mount the routes to the application. In **router.middleware**, it call the **_dispatch(req, res, next)** function,
it call the **route.matchRequest** method to get the matched route, handle param callback and execute the callback chain:

{% codeblock lang:js %}

Router.prototype._dispatch = function(req, res, next){
  var params = this.params
    , self = this;

  debug('dispatching %s %s (%s)', req.method, req.url, req.originalUrl);

  // route dispatch
  (function pass(i, err){
    
    ...
    
    // match next route
    function nextRoute(err) {
      pass(req._route_index + 1, err);
    }

    // match route
    req.route = route = self.matchRequest(req, i);

	…
	
    // we have a route
    // start at param 0
    req.params = route.params;
    keys = route.keys;
    i = 0;

    // param callbacks
    function param(err) {
    … // execute param callbacks and execute route callbacks(err) in the end.
    
	}
    
    param(err);

    // invoke route callbacks
    function callbacks(err) {
      var fn = route.callbacks[i++];
      try {
        if ('route' == err) {
          nextRoute();
        } else if (err && fn) {
          if (fn.length < 4) return callbacks(err);
          fn(err, req, res, callbacks);
        } else if (fn) {
          fn(req, res, callbacks);
        } else {
          nextRoute(err);
        }
      } catch (err) {
        callbacks(err);
      }
    }
  })(0);
};

{% endcodeblock %}

##Request / Response

Request and Response object in express is inheritate http.IncomingMessage and http.ServerResponse from node. Request provide helpers for http header, content-type, URL and param parsing. 

Response is providing helpers for status and results too. Also provide the send function from 'response-send' module. Which detect response type and set corresponding content-type.

##View

In the **lib/view.js**, the main functions is **render** and **lookup**, which find the template and call the render function on engine. The **render** function on app initialize new View, the view set the **lookup(name)** to **path**, and call the **view.render** method to return result:

{% codeblock lang:js %}

View.prototype.lookup = function(path){
  var ext = this.ext;

  // <path>.<engine>
  if (!utils.isAbsolute(path)) path = join(this.root, path);
  if (exists(path)) return path;

  // <path>/index.<engine>
  path = join(dirname(path), basename(path, ext), 'index' + ext);
  if (exists(path)) return path;
};
…

View.prototype.render = function(options, fn){
  this.engine(this.path, options, fn);
};

{% endcodeblock %}

in the app.render:

{% codeblock lang:js %}

app.render = function(name, options, fn){
  var self = this
    , opts = {}
    , cache = this.cache
    , engines = this.engines
    , view;

  …
  
  // primed cache
  if (opts.cache) view = cache[name];

  // view
  if (!view) {
    view = new View(name, {
        defaultEngine: this.get('view engine')
      , root: this.get('views') || process.cwd() + '/views'
      , engines: engines
    });

    if (!view.path) {
      var err = new Error('Failed to lookup view "' + name + '"');
      err.view = view;
      return fn(err);
    }

    // prime the cache
    if (opts.cache) cache[name] = view;
  }

  // render
  try {
    view.render(opts, fn);
  } catch (err) {
    fn(err);
  }
};

{% endcodeblock %}

##MVC example

In the examples/mvc directory, it shows you how to structure a mvc style application in express.

{% codeblock lang:js %}

controllers/
  main/
  pet/
  user-pet/
  user/
views/
public/
lib/
  boot.js
db.js
index.js

{% endcodeblock %}

The followed structure is a sample of mvc in express, the index.js load the boot.js, which mount all the routes under controllers/ in a RESTful style. And set the views path and static path.

There are no restriction on how to build the structure of express application. The [Railway](http://railwayjs.com) is one of the example that it extend express to be a Rails like Mvc application.

##Conclusion

Express is a lightweight web framework and it is a good entry point to know how to build a web framework in Node.js. Hope this walkthrough can help you understand how express work. And can be more comfortable with new framework like meteor.

Also it is a well styled and documented project, so when you find some problem in developing express application, don't be hesitate to use the source code (luke!) and the Guide of [Express](http://expressjs.com/)


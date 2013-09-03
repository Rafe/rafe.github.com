---
layout: post
title: "Code Odyssey : Sinatra"
date: 2012-02-22 00:09
comments: true
categories: [Odyssey, ruby]
---

In 2012, I am planning to start contribute and participate more on opensource projects.
The target of this series is to read through the source of open source projects that I am interested with,
and explain the structure and interesting pieces that I found in the source.

##[Sinatra](http://www.sinatrarb.com)

[Sinatra](http://www.sinatrarb.com) is a rack-base , lightweight web framework implemented in ruby.
Written and desinged by [Blake Mizerany](https://github.com/bmizerany). Famous for it's dsl syntax and simpliness.

<!--more-->

##Source structure

    examples/
    lib/
      sinatra/
        base.rb   #all codes are in here
        main.rb   #Application class, extends Base class in base.rb
        showException.rb #output exception and trace message as Html error page
      sinatra.rb  
    test/
    Rakefile
    Gemfile.gem

## base.rb 

Main Sinatra application, includes:

1.Rack Module :  
  Implement Rack:Request and Rack:Response

2.Helper Module :
  Helper methods that available in routes, filters and views ,
  handle tasks like redirect, status code, url, html header, session, mime type, http stearming... etc 

3.Template Module : 
  Handle multiple template engines using [tilt](https://github.com/rtomayko/tilt)

4.Base class:  
  The main class that include all modules above. Handling routes and invoke correspond code blocks and filters.

5.Application class:
  Inherit Base class, the run instance of Sinatra application.

6.Delegator module:  
  Delegate DSL methods in Top-level file to Sinatra Application. 

## main.rb

Patch Sinatra::Application class, set the hooks to run application at exit and Parse option. Also it includes the delegator to send all methods on Top-level to application.

## Dependencies

Sinatra source seperate the declaration of external ,stdlib and project depedencies.
Which is pretty clean and easy to understand:

{%codeblock lang:ruby%}

# external dependencies
require 'rack'
require 'tilt'
require "rack/protection"

# stdlib dependencies
require 'thread'
require 'time'
require 'uri'

# other files we need
require 'sinatra/showexceptions'
require 'sinatra/version'
{%endcodeblock%}

## Delegator 

Delegator is an interesting part in Sinatra, since it creates a really simple API that user can just write method with HTTP verb in Top level file, without creating any class.  
For example:

{%codeblock lang:ruby%}
#myapp.rb
require 'sinatra'

get '/' do
  'Hello world!'
end
{%endcodeblock%}

Execute this file will run Sinatra application handle route "/" with GET request.
But how do Sinatra do this?  

Take a look at the source of Delegator:
{%codeblock base.rb%}

# Sinatra delegation mixin. Mixing this module into an object causes all
# methods to be delegated to the Sinatra::Application class. Used primarily
# at the top-level.
module Delegator #:nodoc:
  def self.delegate(*methods)
    methods.each do |method_name|
      define_method(method_name) do |*args, &block|
        return super(*args, &block) if respond_to? method_name
        Delegator.target.send(method_name, *args, &block)
      end
      private method_name
    end
  end

  delegate :get, :patch, :put, :post, :delete, :head, :options, :template, :layout,
           :before, :after, :error, :not_found, :configure, :set, :mime_type,
           :enable, :disable, :use, :development?, :test?, :production?,
           :helpers, :settings

  class << self
    attr_accessor :target
  end

  self.target = Application
end

{%endcodeblock%}

First, if we want to delegate method to another class, we can include the methods in files :

{%codeblock lang:ruby %}

module Delegator
  self.target = Application

  def get(*args,&block)
    target.get(*args, &block)
  end
end

include Delegator 

#then we can call 'get' method in file and delegate to target 
get '/' do 
  "Hello delegator!!"
end
  
{%endcodeblock%}

But how would we do if we have lots of method to delegate? In Sinatra, it has lots of methods and Http verbs to be delegated. The code will be pretty ugly if we have to implement all these repeated methods. 
The answer here is metaprogramming: We can use ruby's ability of metaprogramming to create repeated methods in a few lines of code:

{%codeblock lang:ruby %}

module Delegator
  def self.delegate(method_name)
    define_method(method_name) do |*args, &block|
      Delegator.target.send(method_name, *args, &block)
    end
    private method_name
  end

  delegate :get

  self.target = Application
end

{%endcodeblock%}

In ruby, we can use "define_method" to create method programmically, and use "send(method_name, *args, &block)" To call the target method by the method_name. This makes the code a lot cleaner in Sinatra

## Routes

In sinatra, after user call the dsl methods(like get, post) in file,
the HTTP verbs ,path and code block will be registered in application,
And will be executed when receiving matched request.

When the dsl method get called, the Application will generate a Proc with the name of
HttpVerb and path (like "get /") save the Proc, url path (include the keys, pattern and conditions on paths, like "/:id" ) in @routes. 

Here's the simplify version of routes :

{%codeblock lang:ruby%}

class App

  class << self
    attr_reader :routes 

    def get(path, options={}, &block)
      route("GET", path, options, &block)
    end

    def route(verb, path, options, &block)
      @routes ||= {}
      signature = compile!(verb, path, block, options)
      @routes[verb] ||= []
      @routes[verb] << signature
    end

    def compile!(verb, path, block, options)
      unbound_method = generate_method("#{verb} #{path}",&block)

      [path, proc {|base| unbinded_method.bind(base).call() } ]
    end

    def generate_method(method_name, &block)
      define_method(method_name, &block)
      method = instance_method method_name
      remove_method method_name
      method
    end
  end
end

App.get "/" do 
  "Hello world"
end

base = App.new

App.routes["GET"][0][1].call(base)
#print:: "Hello world"

{%endcodeblock %}

In here, sinatra generates the code block as an [unbound_method](http://www.ruby-doc.org/core-1.9.3/UnboundMethod.html), it is a kind of instance method that you can bind it to any other instance dynamically before call. Sinatra use this to bind Application instance with Proc on runtime. 

##Route call

After register the code block, sinatra wait for request and invoke correspond routes to handle request.
The entry point of all request is the [rack call interface](http://chneukirchen.org/blog/archive/2007/02/introducing-rack.html). All rack application must implement the interface.

Overall, the request execution stack is:
  call => call! => invoke => dispatch! => route! => route_eval

{%codeblock base.rb%}

def call(env)
  dup.call!(env)
end

def call!(env)
  @env = env
  @request = Request.new(env)
  @response = Response.new 
  @params = indifferent_params(@request.params)
  template_cache.clear if settings.reload_templates
  force_encoding(@params)

  @response['Content-Type'] = nil 
  invoke { dispatch!}
  invoke { error_block!(response.status) }

  unless @response['Content-Type']
    if Array === body and body[0].respond_to? :content_type
      content_type body[0].content_type
    else
      content_type :html
    end

    @response.finish
  end
end

{%endcodeblock %}

The code above is the first part of how Sinatra handle incoming requests.
First, as a Rack application, all request will invoke the call(env) function
Sinatra application will duplicate an instance, invoke the call!(env) on new instance (because HTTP is stateless)
in the call! function, sinatra will new the Rack::Request and Rack::Response object by env, than set the params.

After all object is set, it will start to invoke the routes by "invoke{ dispatch! }", the result will be store
on @response, and return to user by call the @response.finish

{% codeblock base.rb %}
  # Run the block with 'throw :halt' support and apply result to the response.
  def invoke
    res = catch(:halt) { yield }
    res = [res] if Fixnum === res or String === res
    if Array === res and Fixnum === res.first
      status(res.shift)
      body(res.pop)
      headers(*res)
    elsif res.respond_to? :each
      body res
    end
    nil # avoid double setting the same response tuple twice
  end
{% endcodeblock %}

The invoke function wrap and execute the handler codeblock ,catch the :halt 
(which throw by route! as interrupt signal), and than set status, header and result to @response.

for example, when you execute the code wrapped by invoke, you can set the @response by throw :halt and Array response:

    invoke do 
      #do something...
      throw :halt ,[200,"Hello world!"] #this will go to @response
    end

With the structure like this, error_block or other function can also throw :halt with result and return to user.

{% codeblock base.rb %}

# Dispatch a request with error handling.
def dispatch!
  invoke do
    static! if settings.static? && (request.get? || request.head?)
    filter! :before
    route!
  end
rescue ::Exception => boom
  invoke { handle_exception!(boom) }
ensure
  filter! :after unless env['sinatra.static_file']
end

{% endcodeblock%}

In dispatch function, it check the static file first, than execute before filter, then execute the route! function follow by the after filter.

{%codeblock base.rb%}

def route!(base = settings, pass_block=nil)
  if routes = base.routes[@request.request_method]
    routes.each do |pattern, keys, conditions, block|
      pass_block = process_route(pattern, keys, conditions) do |*args|
        route_eval { block[*args] }
      end
    end
  end

  # Run routes defined in superclass.
  if base.superclass.respond_to?(:routes)
    return route!(base.superclass, pass_block)
  end

  route_eval(&pass_block) if pass_block
  route_missing
end

# Run a route block and throw :halt with the result.
def route_eval
  throw :halt, yield
end

{%endcodeblock%}

At the bottom of execution stack, the route! function check the registered routes with request path and params.
If it find correct route, execute the codeblock and throw :halt with result. the invoke function will catch the :halt,
than set the result to @response.

If no route is executed, route_missing will be called and return not_found page. 

## Template

Sinatra is compatible with a lots of different templates, from erb, haml, markdown to sass, less... 
almost any kind of templates that you can find, but how do Sinatra handle all of these different format?
It turns out using [Tilt](https://github.com/rtomayko/tilt) gem that includes all kinds of template engines.

For example, with Tilt, we can compile an erb template like this:

{%codeblock base.rb%}

require "tilt"

template = Tilt[:erb]
# => Tilt::ErubisTemplate 

# pass the file path or pass content body
compiled_template = template.new("path/to/file") { "hello world" }
# => <Tilt::ErubisTemplate: ... @path="path/to/file" @data = "hello world">

compiled_template.render()
# => "hello world"

{%endcodeblock%}

In application, we can call "erb" method to render erb template:

    get "/" do
      #render erb template in views/index.html.erb
      erb :index
    end

under the hood in Template module:

{%codeblock base.rb%}

def erb(template, options={}, locals={})
  render :erb, template, options, locals
end

...

def render(engine, data, options={}, locals={}, &block)
  # merge app-level options
  ...

  # compile and render template
  begin
    layout_was      = @default_layout
    @default_layout = false
    template        = compile_template(engine, data, options, views)
    output          = template.render(scope, locals, &block)
  ensure
    @default_layout = layout_was
  end

  # render layout
  ...

  output
end

def compile_template(engine, data, options, views)
  eat_errors = options.delete :eat_errors
  template_cache.fetch engine, data, options do
    template = Tilt[engine]
    raise "Template engine not found: #{engine}" if template.nil?

    case data
    when Symbol
      body, path, line = settings.templates[data]
      if body
        body = body.call if body.respond_to?(:call)
        template.new(path, line.to_i, options) { body }
      else
        found = false
        @preferred_extension = engine.to_s
        find_template(views, data, template) do |file|
          path ||= file # keep the initial path rather than the last one
          if found = File.exists?(file)
            path = file
            break
          end
        end
        throw :layout_missing if eat_errors and not found
        template.new(path, 1, options)
      end
    when Proc, String
      body = data.is_a?(String) ? Proc.new { data } : data
      path, line = settings.caller_locations.first
      template.new(path, line.to_i, options, &body)
    else
      raise ArgumentError, "Sorry, don't know how to render #{data.inspect}."
    end
  end
end

{%endcodeblock%}

First, the helper method will call the render method with format,
and render method compile the template and return output, than output will be catch by invoke method (in previous section)
and set to @response.

In compile_template, the Tilt engine will be called and return correct Tilt::Template instance.
here's the digest version:

{%codeblock base.rb %}

def compile_template(engine, data, options, views)
  template_cache.fetch engine, data, options do
    template = Tilt[engine]

    body, path, line = settings.templates[data]
    body = body.call if body.respond_to?(:call)
    template.new(path, line.to_i, options) { body }

  end
end
{%endcodeblock%}

The template_cache is an instance of Tilt::Cache, is a very simple hash implementation of cache:

    class Cache
        def initialize
          @cache = {}
        end

        def fetch(*key)
          @cache[key] ||= yield
        end

        def clear
          @cache = {}
        end
      end
    end

## Streaming

Stream is another interesting part in Sinatra, and probally one of the most complex part.
It use the [EventMachine](http://rubyeventmachine.com/) to implement streaming APIs that let you able to keep 
sending data asynchronize without I/O blocking.
For example,

    get '/' do
      stream :keep_open do |out|
        out << "hello "
        EventMachine.defer do 
          #something slow...
          sleep(3)
          out << "world"
        end
      end
    end

will output the responses chunk to user while the content is ready, and keep the connection open.
For doing that, it use the EventMachine.defer , EventMachine.schedule to create threads to avoid i/o blocking while generating result.

{%codeblock base.rb%}

# Allows to start sending data to the client even though later parts of
# the response body have not yet been generated.
#
# The close parameter specifies whether Stream#close should be called
# after the block has been executed. This is only relevant for evented
# servers like Thin or Rainbows.
def stream(keep_open = false)
  scheduler = env['async.callback'] ? EventMachine : Stream
  current   = @params.dup

  block     = proc do |out|
    begin
      original, @params = @params, current
      yield(out)
    ensure
      @params = original if original
    end
  end

  out = Stream.new(scheduler, keep_open, &block)
  ...
  body out
end

{%endcodeblock%}

What stream method do is, first it detect the Server is support streamming or not. If so, use EventMachine.
And it wrap the code block with params, create a Stream instance than send it to body helper.
and body helper will send stream to Rack::Response.

{% codeblock base.rb %}
  
class Stream
  ...
  def initialize(scheduler = self.class, keep_open = false, &back)
    @back, @scheduler, @keep_open = back.to_proc, scheduler, keep_open
    @callbacks, @closed = [], false
  end
  ...
  def each(&front)
    @front = front
    @scheduler.defer do
      begin
        @back.call(self)
      rescue Exception => e
        @scheduler.schedule { raise e }
      end
      close unless @keep_open
    end
  end

  def <<(data)
    @scheduler.schedule { @front.call(data.to_s) }
    self
  end
  ...
end

{% endcodeblock %}

According to Rack interface, the response body need to respond to "each" method. 
The each method will be called with &front block, which can sent result to user.
Stream class use the EventMachine.schedule to call codeblock asynchronizly,
and the << method will sent data to @front with EventMachine.schedule.

## Configure

In sinatra, we can set configuration by "set" or "configure" method.

    set :server , :thin 

    #or 
    configure do 
      set :server, :thin
    end

what configure do here is just call yield self, and act as a place for all settings. 
And also those 2 methods are delegated methods. 

What set doing here is a little different with normal setting methods:
It use the metaprogramming skills again.

while we call the set method, 
it will generate getter and setter methods for self.server

    configure do |app|
        set :server, :thin 

        app.server # => :thin
        app.server = :unicorn # Application.server => :unicorn
    end

{%codeblock base.rb %}

# Sets an option to the given value.  If the value is a proc,
# the proc will be called every time the option is accessed.
def self.set(option, value = (not_set = true), ignore_setter = false, &block)
  ...
  setter = proc { |val| set option, val, true }
  getter = proc { value }

  case value
  ...
  when Symbol, Fixnum, FalseClass, TrueClass, NilClass
    # we have a lot of enable and disable calls, let's optimize those
    class_eval "def self.#{option}() #{value.inspect} end"
    getter = nil
  ...
  end

  (class << self; self; end).class_eval do
    define_method("#{option}=", &setter) if setter
    define_method(option,       &getter) if getter
    unless method_defined? "#{option}?"
      class_eval "def #{option}?() !!#{option} end"
    end
  end
  self
end

{%endcodeblock%}

## Conclusion  

Sinatra is a very simple and delegate web framework. It takes lots of advantage on ruby's metaprogramming feature
to make code more digest and clean. Also with decent features support.(Template, Streaming, Filter, Route...)

The dsl syntax and delegator makes learning Sinatra application become very easy. 
It will be great for implement api service or small website when you don't need the heavy stacks like Rails.

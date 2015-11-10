---
layout: post
title: "Rails circular dependency"
date: 2015-04-28 22:35
comments: true
categories: ruby rails
---

## Circular dependency

Recently, I encountered a circular dependency problem that happened in rails,
When the parent model is dependent on child model, it returns Runtime Error for Circular dependency.
However, there is 2 child model that have circular dependency on parent model, but only one will fail on loading:

{% codeblock lang:ruby %}

# ./app/models/alpha_product
class AlphaProduct < BaseProduct
end

# ./app/models/base_product.rb
class BaseProduct
  PRODUCTS = [AlphaProduct, Product]
  # this works
  # PRODUCTS = [Product]
end

# ./app/models/product.rb
class Product < BaseProduct
end

# test file:
require 'spec_helper'

it 'does something' do
  AlphaProduct.do_things # RuntimeError: Circular dependency detected while autoloading constant AlphaProduct
end

{% endcodeblock %}

But when we remove the dependency on AlphaProduct, the application works fine. Why is that?

<!-- more -->

## Rails autoload

To understand this, first we need to know how rails autoload works.
First, rails provide a mechanism to let user does not to require every dependency in application files.

If we call any unloaded constant in rails, rails will try to find the file in load path and require the file by
lookup the file in load paths.

For example, a constant call `Product`, will lookup the product.rb file in app/models, app/controllers, lib/ and other load paths.
Rails achieve this by extend the ruby `const_missing?` method.

{% codeblock lang:ruby %}

# in active_support/dependencies.rb
def const_missing(const_name)
  from_mod = anonymous? ? guess_for_anonymous(const_name) : self
  Dependencies.load_missing_constant(from_mod, const_name)
end

{% endcodeblock %}

In `Dependencies.load_missing_constant` method

{% codeblock lang:ruby %}

#lib/active_support/dependencies.rb:477
expanded = File.expand_path(file_path)
expanded.sub!(/\.rb\z/, '')

if loading.include?(expanded)
  raise "Circular dependency detected while autoloading constant #{qualified_name}"
end

{% endcodeblock %}

So when rails require or autoload the files, it will record the files that loaded through it,
and raise error when loading the same file. So when loading the alpha_product.rb,
it autoload the base_product.rb and raise error when it autoload the dependency of alpha_product.

However, when we try to load the base_product first, it creates BaseProduct class, and autoload the child class.
When the child class's dependency for BaseProduct is called, the class is already required so it won't trigger autoload.
Therefore it will not raise the error.

## Eager loading

So that shows how the circular dependency happen,
but why it only fail when running test with circular dependency in alpha product?
It turns out it's the load sequence and eager loading's problem.

I the test environment, we set the `config.eager_loading = true` which will preload all files under eager loading paths.

from railties/lib/rails/engine.rb eager_load! method:

{% codeblock lang:ruby %}

# Eager load the application by loading all ruby
# files inside eager_load paths.
def eager_load!
  config.eager_load_paths.each do |load_path|
    matcher = /\A#{Regexp.escape(load_path.to_s)}\/(.*)\.rb\Z/
    Dir.glob("#{load_path}/**/*.rb").sort.each do |file|
      require_dependency file.sub(matcher, '\1')
    end
  end
end

{% endcodeblock %}

We can see when eager_load is set to true, rails will run `require_dependency` for each file in eager load paths with sorted order.
Under the `require_dependency` call, it use the same `require_or_load` as in autoload, so it will also record the loaded files.
So alpha_product.rb will always be loaded before base_product.rb, therefore cause the circular dependency.

However in product.rb, it loads after base_product.rb.
So the file will be loaded by autoload when loading base_product.rb. And it already have the reference of base_product.
So it won't cause circular dependency. here's the timeline of what happened:

### For alpha product:
1. loading AlphaProduct
2. detected const missing for BaseProduct, before AlphaProduct declare
3. autoload BaseProduct
4. detected const missing for AlphaProduct
5. autoload AlphaProduct
6. detected circular dependency

### For product:
1. loading BaseProduct
2. detected const missing for Product, after BaseProduct declare
3. autoload Product with dependency of BaseProduct

## Conclusion

Rails autoloading is a really convience feature, but it also generate some tricky problems when handling dependencies.
To avoid this kind of problems, it's still better to call `require_dependency` before inherit or use other class in rails.

## Reference

+ [rails autoloading hell](http://urbanautomaton.com/blog/2013/08/27/rails-autoloading-hell/)  
+ [everything you ever wanted to know about constant lookup in Ruby](http://cirw.in/blog/constant-lookup.html)

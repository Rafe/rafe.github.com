---
layout: post
title: "Dig into the rails errors"
date: 2015-04-24 23:38
comments: true
categories: rails, ruby
---

## Errors

Rails errors is handling by ActiveModel::Errors, which generate error messages with attribute name and error type.
Recently I am working on some feature related to rails error messages, so it is a good time to go over how the rails errors works.

## It's just a hash

ActiveModel::Errors actually is a wrapper for error messages hash, which include the attribute names and error messages for attributes.  

<!-- more -->

So we can start with understand what does this wrapper do, ActiveModel::Errors provides 3 basic functionality:

1. Provides 'add' method that takes attribute name and error type
2. Translate error types to error messages by Rails i18n module.
3. Provides Enumerable Api like each for traversing.

Lets take those and make a minimun implementation:


{% codeblock lang:ruby %}

class Errors
  attr_reader :messages

  # errors take target model as base
  def initialize(base)
    @base = base
    # messages value is the array of error messages: { name: ['is invalid', 'is too short'] }
    @messages = Hash.new([])
  end

  def add(attribute, error_type)
    @messages[attribute] = generate_message(attribute, error_type)
  end

  # iterate each attributes and errors
  def each
    messages.each_key do |attribute|
      messages[attribute].each { |error| yield attribute, error }
    end
  end

  # return error messages array with attribute name: => ['name is invalid', 'name is too short']
  def full_messages
    messages.map do |attribute, error_messages|
      error_messages.map { |message| "#{attribute} #{message}" }
    end.flatten
  end

  private

  # lookup error messages in rails I18N module, 
  def generate_message(attribute, type)
    key = "errors.models.#{base.class.model_name}.attributes.#{attribute}.#{type}"
    I18N.translate(key)
  end
end

class Model
  # initialize errors
  def errors
    @errors ||= Errors.new(self)
  end
end

model = Model.new
model.errors.add(:name, :invalid)

# assume we have message in config file
puts model.errors.full_messages
# => ['name is invalid']

{% endcodeblock %}

## How does ActiveModel::Errors generate the error message?

The most confusing part in ActiveRecord::Errors is how the error message got generated and how to customize it.
When generating the message, it creates keys with attribute name and error type,
pass the attribute, value and keys to I18N.translate. When translation is missing,
I18n will lookup the next possible key in keys provided.

Here is the code from ActiveModel::Errors

{% codeblock lang:ruby %}

def generate_message(attribute, type = :invalid, options = {})
  type = options.delete(:message) if options[:message].is_a?(Symbol)

  # build up the default keys like:
  # 'en.errors.models.user.attributes.name.invalid' :
  # 'en.errors.models.user.invalid'
  # I18N will lookup the keys in config files.
  if @base.class.respond_to?(:i18n_scope)
    defaults = @base.class.lookup_ancestors.map do |klass|
      [ :"#{@base.class.i18n_scope}.errors.models.#{klass.model_name.i18n_key}.attributes.#{attribute}.#{type}",
        :"#{@base.class.i18n_scope}.errors.models.#{klass.model_name.i18n_key}.#{type}" ]
    end
  else
    defaults = []
  end

  defaults << options.delete(:message)
  defaults << :"#{@base.class.i18n_scope}.errors.messages.#{type}" if @base.class.respond_to?(:i18n_scope)
  defaults << :"errors.attributes.#{attribute}.#{type}"
  defaults << :"errors.messages.#{type}"

  defaults.compact!
  defaults.flatten!

  key = defaults.shift
  value = (attribute != :base ? @base.send(:read_attribute_for_validation, attribute) : nil)

  # passing extra parameter to generate error message so the message can be:
  # "#{value} is invalid for #{model}"
  options = {
    default: defaults,
    model: @base.model_name.human,
    attribute: @base.class.human_attribute_name(attribute),
    value: value
  }.merge!(options)

  I18n.translate(key, options)
end
{% endcodeblock %}

## Details for the win - in Rails 5

However, the previous implementaion is hard to customize when you need something like links in the error message.
In rails 5, it provide an API called 'details' which return the errors hash, but with original error type but not generated message:  
[Pull Request](https://github.com/rails/rails/pull/18322)

    model = User.first
    errors = ActiveModel::Errors.new(model)
    errors.add(:name, :invalid)
    errors.messages
    # => {name: ['is invalid']}
    errors.details
    # => {name: [:invalid]}

Let user can generate different error message in different context.
Right now we can install the [gem](https://github.com/cowbell/active_model-errors_details) to get the backported feature in Rails 4.x:

    # in gemfile
    gem 'active_model-errors_details'

With this gem, we can finally generate custom error message in different places without complex structure.

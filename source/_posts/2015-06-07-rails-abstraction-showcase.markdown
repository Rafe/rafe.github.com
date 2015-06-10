---
layout: post
title: "Rails abstraction showcase"
date: 2015-06-07 21:02
comments: true
categories: rails ruby
public: false
---

[Abstraction showcase](https://github.com/Rafe/rails-abstraction-showcase)

Maintaining large application is always a pain for rails developer.
Because the MVC scructure encourage developer to write business logics in controller and model.
Therefore when application become bigger, usually it will result in Fat controller or All mighty model that have lots of business logics crumble all over the places.
Extract those logic to another place is one of the solution, but how do we extract and where to extract is another problem.

<!-- more -->

Fortunately, Rails community already tried to solve this problem.
There are lots of frameworks that provide an abstraction layer to hold the extracted business logics,
Each one have different approach and different feature, choosing a framework that fulfill the needs is really hard.
Therefore I created a sample application that used all the abstraction framework, to let everyone can compare and choose the abstraction framework easier.


## [ActiveInteraction](https://github.com/orgsync/active_interaction)

Active Interaction is created by orgsync. inc, it provides an abstraction layer for business logic.
Also with the feature like validation, filter, composition and error handling.

{% codeblock lang:ruby %}

class ProceedOrder < ActiveInteraction::Base
  integer :id
  hash :order_params, strip: false

  def execute
    order = Order.find(id)
    order.assign_attributes(order_params)
    order.state = Order::COMPLETED
    order.save
  end
end

outcome = ProceedOrder.run!(id: params[:id], order_params: order_params)

{% endcodeblock %}

## [Decent Exposure](https://github.com/hashrocket/decent_exposure)

Decent exposure is created by hashrocket, rather than provide an abstraction layer, it is focus on simplify
controller CRUD actions. It provides an `expose` helper for controller that can find, create and update model.

{% codeblock lang:ruby %}

class OrderController < ApplicationController
  before_action :authenticate_user!
  expose(:order, attributes: :order_params)
  ...
  def proceed

    # # find and update order by expose call:
    # order = Order.find(params[:id])
    # order.assign_attributes(item_params)

    order.state = Order::COMPLETED
    if order.save
      session[:order_id] = nil
      flash[:notice] = t('order.proceed')
      redirect_to root_path
    else
      render :checkout
    end
  end

  ...
end

{% endcodeblock %}

## [Interactor](https://github.com/collectiveidea/interactor)

Interactor is created by collectiveidea, which provides an abstraction layer for business logics.
It does not validate and filter paramter, everything is assign to context.
It also has composition and callbacks features.

{% codeblock lang:ruby %}

class ProceedOrder
  include Interactor::Organizer

  organize FindOrder, UpdateOrder
end

class FindOrder
  include Interactor

  def call
    context.order = Order.find(context.id)
  end
end

class UpdateOrder
  include Interactor

  def call
    order = context.order
    order.assign_attributes(context.params)
    order.state = Order::COMPLETED
    order.save
  end
end

result = ProceedOrder.call(id: params[:id], params: order_params)

{% endcodeblock %}

## [Light Service](https://github.com/adomokos/light-service)

Light service is created by adomokos, as it's name, is a lightweight service layer that provides composition, validation and also with rollback.

{% codeblock lang:ruby %}

class ProceedOrder
  include LightService::Organizer

  def self.proceed(params)
    with(params: params).reduce(
      FindOrderAction,
      UpdateOrderAction
    )
  end
end

class FindOrderAction
  include LightService::Action

  expects :params
  promises :order

  executed do |context|
    context.order = Order.find(context.params[:id])
  end
end

class UpdateOrderAction
  include LightService::Action
  expects :order, :params
  promises :success

  executed do |context|
    order = context.order
    order.assign_attributes(order_params(context))
    order.state = Order::COMPLETED
    context.success = order.save
  end

  def self.order_params(context)
    context.params.require(:order).permit([
      :address,
      :card_number,
      :card_code,
      :card_month,
      :card_year
    ])
  end
end

ProceedOrder.proceed(params).success

{% endcodeblock %}

## [Mutation](https://github.com/cypriss/mutations)

Mutations is provided by cypriss, provides validation and optional attributes.

{% codeblock lang:ruby %}

class ProceedOrder < Mutations::Command
  required do
    integer :id
    hash :order_params do
      string :address
      string :card_number
      string :card_code
      string :card_month
      string :card_year
    end
  end

  def execute
    order = Order.find(id)
    order.assign_attributes(order_params)
    order.state = Order::COMPLETED
    order.save
  end
end

outcome = ProceedOrder.run(id: params[:id], order_params: order_params)

{% endcodeblock %}

## [Surrunded](https://github.com/saturnflyer/surrounded)

Surrounded is created by saturnflyer, it provide the abstraction based on the role.
It take parameter object and extend the objects with context specific methods,
it's an interesting approach.

{% codeblock lang:ruby %}

class ProceedOrder
  extend Surrounded::Context

  initialize_without_keywords :params

  role :params do
    def order
      Order.find(params[:id])
    end

    def update
      order.assign_attributes(order_params)
      order.state = ::Order::COMPLETED
      order.save
    end

    def order_params
      params.require(:order).permit([
        :address,
        :card_number,
        :card_code,
        :card_month,
        :card_year
      ])
    end
  end

  trigger :run do
    params.update
  end
end

ProceedOrder.new(params).run

{% endcodeblock %}

## [Trialblazer](https://github.com/apotonick/trailblazer)

Trialblazer is created by apotonick, it's an ambitious framework that combine view layer abstraction: cell
and model/controller layer abstraction: operation. It is the hardest one because in creates too many magic under the framework.
and setting the framework is also problematic. But it provide a complete solution that include cell, which is a good view logic solution.

{% codeblock lang:ruby %}
class Order < ActiveRecord::Base
  class Proceed < Trailblazer::Operation
    include CRUD

    model Order, :update

    contract do
      property :address
      property :card_number
      property :card_code
      property :card_month
      property :card_year
      property :state

      validates :address, presence: true, allow_blank: false
      validates :card_number, presence: true, allow_blank: false
      validates :card_code, presence: true, allow_blank: false
      validates :card_year, presence: true, allow_blank: false
      validates :card_month, presence: true, allow_blank: false
    end

    def process(params)
      validate(params[:order]) do |f|
        f.state = Order::COMPLETED
        f.save
      end
    end
  end
end

class OrderController < ApplicationController
  def proceed
    run Order::Proceed do |op|
      session[:order_id] = nil
      flash[:notice] = t('order.proceed')
      return redirect_to root_path
    end

    render :checkout
  end
end
{% endcodeblock %}

## [wisper](https://github.com/krisleech/wisper)

Wisper is created by krisleech, is a micro service layer that provide an event trigger/subscribe model to
extract interaction and business logics.

{% codeblock %}

class ProceedOrder
  include Wisper::Publisher

  def call(params)
    order = Order.find(params[:id])
    order.assign_attributes(order_params(params))
    order.state = Order::COMPLETED
    if order.save
      publish(:proceed_order_successful)
    else
      publish(:proceed_order_failed)
    end
  end

  def order_params(params)
    params.require(:order).permit([
      :address,
      :card_number,
      :card_code,
      :card_month,
      :card_year
    ])
  end
end

class OrdersController < ApplicationController
  ...

  def proceed
    proceed_order = ProceedOrder.new

    proceed_order.on(:proceed_order_successful) do
      session[:order_id] = nil
      flash[:notice] = t('order.proceed')
      redirect_to root_path
    end

    proceed_order.on(:proceed_order_failed) do
      render :checkout
    end

    proceed_order.call(params)
  end
end

{% endcodeblock %}

## Comparison

| Features | ActiveInteraction | Decent Exposure | Interactor | Mutation | Light service | Surrunded | Trailblazer | Wisper 
| -------- | ----------------- | --------------- | ---------- | -------- | --------- | ----------- | ------ |  -----------
| abstraction layer|    x      |                 |     x      |     x    |     x     |     x       |    x   |      x      
| validate input   |    x      |                 |            |     x    |     x     |             |    x   |             
| validate output  |           |                 |            |          |     x     |             |        |             
| composition      |           |                 |     x      |          |     x     |             |        |             
| event notification|          |                 |            |          |           |             |        |     x       
| simplify crud    |           |        x        |            |          |           |             |    x   |             
| view layer       |           |                 |            |          |           |             |    x   |             

Hope this can help everyone find their abstraction framework.

My personal preference is Active Interaction (easy), Light service ( features ) or Surrounded (interesting)
Trailblazer is hard to implement and understand the whole concept, but it is interesting too.

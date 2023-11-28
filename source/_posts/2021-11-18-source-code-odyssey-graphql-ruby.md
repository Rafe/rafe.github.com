title: 'Source code odyssey: GraphQL Ruby'
tags: ruby
date: 2021-11-18
---

![cover image](cover.png)

Recently I am working with GraphQL on a day-to-day basis. The more I work with it, the more I like the GraphQL API compared to the traditional Restful API. And it is an interesting project, this article is going to do a deep dive on the ruby implementation of [GraphQL](https://graphql-ruby.org/) and share some discoveries along the way.

GraphQL is developed by Facebook (Now Meta), during the development of the new version of Facebook, they found a problem in Restful API that the API can not adapt to the rapid change of client, either it fetches too much data that the client does not need, or it does not have the data it needs for rendering. Therefore they have the idea to create an API specific scripting language to describe what API can provide, what the client wants and execute to give the exact data the client needed in a declarative way, for example:

```
query {
  user(id: 1) {
    id
    name
    email

    cartItems {
      id
      name
      price
    }
  }
}
```

The GraphQL query start from a query root, and declare the data `fields` it needs from query root, in this example we query the `user` field with argument `id:1`, and after the field we can select more fields that we want to query from the return type, and it can be nested like a graph. The API provides a schema so you know what is the valid fields for each types.

```graphql
schema {
  query: QueryRoot
}

type QueryRoot {
  user(id: ID!): User
}

type User {
  id: ID!
  name: String!

  cartItems: [CartItem!]!
}

type CartItem {
  id: ID!
  name: String!
  price: Int!
}
```

This defines the types and data that the API provides. So the user can fabricate the query to fetch exactly the data they need for the client. 

So how is the GraphQL query executed in the backend? It is similar to how interpreters run scripting language since GraphQL is a mini scripting language itself.
## Lifecycle

As a scripting language, the query is passed to the API by a POST request, and executed in the backend in following sequence:

1. Tokenize: `GraphQL::Language::Lexer` splits the string into a stream of tokens
2. Parse: `GraphQL::Language::Parser` builds an abstract syntax tree (AST) out of the stream of tokens
3. Validate: `GraphQL::StaticValidation::Validator` validates the incoming AST as a valid query for the schema
4. Analyze: If there are any query analyzers, they are run with `GraphQL::Analysis.analyze_query`
5. Execute: The query is traversed, `resolve` functions are called and the response is built
6. Respond: The response is returned as a Hash

## Tokenize and Parse

Like every programming language. Before we execute the GraphQL query, we need to parse it to create an Abstract Syntax Tree. In GraphQL-Ruby, the parser is implemented by [racc](https://github.com/ruby/racc). Which provides a syntax to generate Ruby compiler to parse another language.

In GraphQL ruby, the entry point is `GraphQL.parse(query)` which invoke the `GraphQL::Language::Parser.parse`, which generated by [parser.y]("https://github.com/rmosolgo/graphql-ruby/blob/master/lib/graphql/language/parser.y")

`parser.y` define the GraphQL grammer rules, tokenize the query by `GraphQL::Language::Lexer.tokenize(graphql_string)` and implement `make_node` method to create AST:

```ruby
def make_node(node_name, assigns)
  assigns.each do |key, value|
    if key != :position_source && value.is_a?(GraphQL::Language::Token)
      assigns[key] = value.to_s
    end
  end

  assigns[:filename] = @filename

  GraphQL::Language::Nodes.const_get(node_name).new(assigns)
end
```

This method is the main action to execute in the parser, which creates nodes and Abstract Syntax Tree by `node_name`. `node_name` is defined in the rule, includes `Field`, `OperationDefinition`, `TypeName`, `Argument`, etc... For example, from the query in the example we can create the AST like this:

```ruby
>> GraphQL.parse(query)
=> # <GraphQL::Language::Nodes::Document:0x00007fcd9c4dea10
 @definitions=
  [#<GraphQL::Language::Nodes::OperationDefinition:0x00007fcd9c4deb28
    @operation_type="query",
    @selections=
     [#<GraphQL::Language::Nodes::Field:0x00007fcd9c4dec68
       @arguments=
        [#<GraphQL::Language::Nodes::Argument:0x00007fcd9c4df870
          @name="id",
          @value=1>],
       @name="user",
       @selections=
        [#<GraphQL::Language::Nodes::Field:0x00007fcd9c4df690
          @arguments=[],
          @directives=[],
          @name="id",
          @selections=[]>,
         ...,
         #<GraphQL::Language::Nodes::Field:0x00007fcd9c4deda8
          @arguments=[],
          @directives=[],
          @name="cartItems",
          @selections=
           [...,
            #<GraphQL::Language::Nodes::Field:0x00007fcd9c4deee8
             @arguments=[],
             @directives=[],
             @name="price",
             @selections=[]>]>]>],
    @variables=[]>],
 >
```

From the output we can see the basic layout of the AST, each node has a set of `children_methods` that differ by type of nodes. For `Field`, it is `arguments`, `name`, `directives`, and `selections`, and can call `Field#children` to retrieve them for recursion. Also, the node has a `#scalar_methods` method for comparison and `#merge` for manipulating nodes. 

For more details about programming language in general, includes Tokenize and Parsing. I suggest the ebook: [create your programming language](http://createyourproglang.com/) or the [MAL](https://github.com/kanaka/mal) project.

## Validate and Analyze

After we have the AST and save it in the `GraphQL::Query` object, the next step is to validate the AST is valid for the schema, and analyze the complexity and information of the AST.

We call `GraphQL::StaticValidation::Validator#validate` with the Query object, and call the visitor `GraphQL::StaticValidation::BaseVisitor` which is a depth-first traversal visitor that include the rules in `GraphQL::StaticValidation::ALL_RULES` that defines all validation rules like: `FieldsAreDefinedOnType`, `FragmentNamesAreUnique`. The visitor will traverse the AST, when it visits a node, it will run the corresponding method like `on_field`, `on_argument` that is defined in rules, and return the Query is valid or not in the end.

After validation, we run the `query_analyzer` defined in the Schema and use the `GraphQL::Analysis::AST::Visitor` to analyze the query AST. Basically, it works similar to `GraphQL::StaticValidation::BaseVisitor` but it can carry analyzers and call the analyzer methods when visiting nodes. For example, the `QueryDepth` analyzer looks like this:

```ruby
class QueryDepth < Analyzer
  def initialize(query)
    @max_depth = 0
    @current_depth = 0
    super
  end

  def on_enter_field(node, parent, visitor)
    return if visitor.skipping? || visitor.visiting_fragment_definition?

    @current_depth += 1
  end

  def on_leave_field(node, parent, visitor)
    return if visitor.skipping? || visitor.visiting_fragment_definition?

    if @max_depth < @current_depth
      @max_depth = @current_depth
    end
    @current_depth -= 1
  end

  def result
    @max_depth
  end
end
```

Which is called by `GraphQL::Analysis::AST.analyze_query` to return the results. By default it only records errors, but we can extend the analyzer to log the result.
## Schema and Types

After analyzing the query, we can start executing the query on the schema we defined. But before that, we need to explain how the schema is defined in the graphql-ruby gem. There are 3 main classes in the schema: `GraphQL::Schema`, `GraphQL::Schema::Object` and `GraphQL::Schema::Field`. 

`GraphQL::Schema` is the root of the schema, it provides an interface to execute the query, contains the root types for exposing the application, query analyzers, and execution strategies. There are 3 root types for `query`, `mutation`, and `subscription` queries.

The type is a `GraphQL::Schema::Object` class that contains `GraphQL::Schema::Field` that describes the interface for selecting the data, like field name, data type, arguments, and also contain `resolve_proc` or `resolver` that holds the logic for how to resolve the field.

From the initialize method of `GraphQL::Schema::Object`:

```ruby
def initialize(object, context)
  @object = object
  @context = context
end
```

A type object instance has an inner object, the type acts like a proxy. When resolving the field, it will first check if the field has a resolver, then check the type has the method same as the field name defined, if not, then delegate the call to the inner object, if the inner object is hash, use hash fetch method instead.

The object value is the result of the parent field call, or for the root type like `query` or `mutation`, it is specified as `root_value` and passed when executing the query.

The schema for the example above looks like this:

```ruby
class MySchema < GraphQL::Schema
  query QueryRoot
end

class QueryRoot < GraphQL::Schema::Object
  field :user, UserType, null: true do
    argument :id, ID, required: true
  end 

  # read the root_value and return matched user
  def user(id:)
    object.find { |u| u[:id] == id }
  end
end

class UserType < GraphQL::Schema::Object
  field :id, ID, null: false
  field :name, String, null: false
  field :email, String, null: false
  field :cartItems, [CartItemType], null: false
end

class CartItemType < CartItemType
  field :id, ID, null: false
  field :name, String, null: false
  field :price, Int, null: false
end

users = [{
  id: "1",
  name: "John Doe",
  email: "jd@example.com",
  cartItems: [{
    id: "2",
    name: "Pragmatic graphQL - edition 2",
    price: 60
  }]
}]

MySchema.execute(query, {
  context: {},
  root_value: users
})
# => get the values defined in the example query
```

Each type of object has an attribute called `own_fields`. When we declare `field :name, String, null: false` in type, we add a field instance with the options to the class. The field store the type information and how to resolve the query selection from type. We can get the field instance by `get_field` method.

```ruby
> User.fields
=> # {"id"=> #<GraphQL::Schema::Field ...>, "name"=> ...}
> User.get_field("name")
=> # <GraphQL::Schema::Field ...>
```

And you can resolve the field by calling the `#resolve` method on field

```ruby
> context = OpenStruct.new({ schema: MySchema })
> user = User.send(:new, users.first, context) # skip authorized?
> field = User.get_field("name")
> field.resolve(user, {}, context)
=> "John Doe"
```

The `resolve` method will find any resolver class or proc then check the method with field name on type, and fallback to object. If the object is a hash, it will use the field name as a key instead. A simplified version looks like this:

```ruby
def resolve(object, args, ctx)
  application_object = object.object
  Schmea::Validator.validate!(validators, application_object, ctx, args)

  # check if the field is authorized
  if self.authorized?(application_object, args, ctx)
    public_send_field(object, args, ctx)
  else
    ...
  end
end

def public_send_field(object, args, ctx)
  if @resolver_class
    object = @resolver_class.new(object: object, context: ctx, field: self)
  end

  if object.respond_to?(@method_name)
    object.public_send(@method_name, **args)
  elsif object.object.is_a?(Hash)
    object.object[@method_name]
  elsif object.object.respond_to?(@method_name)
    object.object.public_send(@method_name, **args)
  else
    raise "..."
  end
end
```
## Execute

After we understand the structure of schema and query AST, the execute part should just match those 2 together... which I would like to say but it is actually much more complicated than this. Part of this is because there are a lot of cases and features that need to be handled, like multiplex, directives, fragments... etc, but also I wouldn't say the algorithm is optimized in the execution logic.

From the entry point: `GraphQL::Schema.execute`, it will trigger the `query_execution_strategy`, which is `GraphQL::Execution::Interpreter` for GraphQL 2.0.

From here, we call `GraphQL::Execution::Interpreter#evaluate`, it calls  `GraphQL::Execution::Interpreter::Runtime#run_eager`, which is the actual class that execute query.

First, we fetch the root operation type (query, mutation, subscription) and root type, and initialize root type by calling the `authorized_new` method which calls `#authorized?` method on type to make sure the object is accessible.

After the params and type is set, it gathers the root selections from the query, and resolve the directives by calling `resolve_with_directives`, then gather selections, evaluates the selections by `evaluate_selection_with_args`, It gets the field definition from type, call `field#resolve` with arguments. After the field is resolved, if the result values, then set the result, else continue on the return type and pass the next selections fields on result for iterate. It resolves query as depth search first and merges the result of the fields to GraphQL result. 

With the simplified version, it looks like this (not runnable code, just extract details from [source](https://github.com/rmosolgo/graphql-ruby/blob/master/lib/graphql/execution/interpreter/runtime.rb)) to demonstrate how the execution run:

```ruby
class GraphQL::Execution::Interpreter::Runtime
  def run_eager
    # retrieve query root intormation
    root_operation = query.selected_operation
    root_op_type = root_operation.operation_type || "query"
    root_type = schema.root_type_for_operation(root_op_type)

    selection_response = GraphQLResultHash.new(nil, nil)

    # create instance of type object, the #authorized_new method checks
    # the authorized? method before initialize object
    object = authorized_new(root_type, query.root_value, context)

    # gather selections from query
    gathered_selections = gather_selections(object, root_type, root_operation.selections)

    evaluate_selections(context.scoped_context, object, root_type, gathered_selections, selection_response)

    selection_response
  end

  def evaluate_selections(scoped_context, owner_object, owner_type, gathered_selections, results)
    gathered_selections.each do |selection, ast_node|
      # collect field informations from query ast
      field_name = ast_node.name
      field = owner_type.get_field(field_name)
      return_type = field.type

      # load arguments from query
      @query.arguments_cache.dataload_for(ast_node, field, object) do |resolved_arguments|
        # collect field information for next selections
        return_type = field.type
        next_selections = ast_node.selections
        directives = ast_node.directives

        field_result = resolve_with_directives(object, directives) do
          field.resolve(object, arguments, context)
        end
        # handle nested selections
        continue_field(owner_type, field_result, field, return_type, next_selections, object, selection, results)

        set_result(results, field_name, field_result)
      end
    end
  end

  def continue_field(owner_type, value, field, current_type, next_selections, owner_object, arguments, selection, results)
    # if return type is not graphql type, set result and return, else continue on selections
    case current_type.kind.name
    when "SCALAR", "ENUM"
      set_result(results, selection, value)
    when "OBJECT"
      object = authorized_new(current_type, value, context)
      gathered_selections = gather_selections(value, current_type, next_selections)
      this_result = GraphQLResultHash.new(selection, results)
      evaluate_selections(context.scoped_context, object, current_type, gathered_selections, this_result)
    end
  end
end
```

Afterward, the query response will be sent to the client and end the lifecycle.
## Conclusion

Hope this step by steps introduction can help you understand how GraphQL works underhood in general. Creating a DSL for API is a pretty complicated and aggressive idea. But Facebook executes it pretty well and I think more and more GraphQL API will come out and might become the de-facto standard of Web API, just like React. I think we can learn from this and try to find more problems that can be solved by an elegant DSL.
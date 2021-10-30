title: 'Source code odyssey: graphql-ruby'
date: 2021-10-21 15:59:04
tags: ruby graphql
---

## About graphql

Graphql is a mini scripting language
It parse the query, tokenized it, creates AST
the execution runtime traverse the AST and run the mapping fields in schema
so learning how it works is pretty useful for creating similar DSL

it can be done by providing the json object actually, but the DSL give it a nicer syntax

A little history about graphql, developed by FB, originally used to solve the problem that
a query fetch too little or too much code.
Adapted by other developers to create open source version for other languages, including node and ruby
## Lifecycle
- query
Tokenize: GraphQL::Language::Lexer splits the query string into tokens
Parse: GraphQL::Language::Parser builds an abstract syntax tree (AST) out of the stream of tokens

- schema and types
Validate: GraphQL::StaticValidation::Validator validates the incoming AST as a valid query for the schema
  - GraphQL::StaticValidation::ALL_RULES is the visitor rules
  - GraphQL::Language::Visotor - Depth first traversal visitor
    - make_visitor_methods
    - on_abstract_node is the main visit method
#### deprecated: Rewrite: GraphQL::InternalRepresentation::Rewrite builds a tree of GraphQL::InternalRepresentation::Nodes which express the query in a simpler way than the AST
- Execution
Analyze: If there are any query analyzers, they are run with GraphQL::Analysis.analyze_query
Execute: The query is traversed, resolve functions are called and the response is built
Respond: The response is returned as a Hash
## Query

- query AST
  - GraphQL.parse(query) => parsed into @document
    - Graphql::Language::Nodes::AbstractNode
      - children, defined by children_methods
      - scalars, defined by scalar_methods
        return [Integer/Float/StringBoolean/Array] values for comparison
         meta! [@method1, @method2, @method3]
         for example: Argument#scaler = [@name, @value]
                      Field#scaler = [@name, @alias]
      - to_query_string => print ast
    - Graphql::Language::Nodes::Argument
    - Graphql::Language::Nodes::Field
      - children_methods({
          arguments: GraphQL::Language::Node::Argument
          selections: GraphQL::Language::Nodes::Field
          directives: GraphQL::Language::Nodes::Directive
        })
        - add a reader for there children
          - .arguments
          - .selections
        - add a update method to add a child
          - def merge_arguments ...
          - def merge_selection ...
          - def merge_directives(params) ...
            - merge(directives: directives + [GraphQL::Language::Nodes::Directive.new(params)])
        - generate a #children method
          - all subtypes joins
    - Graphql::Language::Nodes::Directive
    - Graphql::Language::Nodes::Document
    - Graphql::Language::Nodes::FragmentDefinition
      - fragment definitions
    - Graphql::Language::Nodes::OperationDefinition
      - query, mutation or subscription
    - Graphql::Language::SchemaDefinition
- mutation
- field

## Schema, Type and Field

- schema object
  - types for exposing your application
  - query analyzers for assessing incoming queries ( max depth & max complexity )
  - execution strategies (single/multiplex)
  - root types
    - query
    - mutation
    - subscription
  - after types added => add_type_and_traverse
  - schema.types
  - query stragegy
    - query_execution_strategy
    - mutation_execution_strategy
    - subscription_execution_strategy

  - schema object
    - collection of GraphQL Types
    - to_graphql => GraphQL::ObjectType
    - name
    - description
    - context
    - object -> wrapping an application object
      - dataloader?
      - have an object and context
        - take object and context to initialize
      - implements => specify interface
      - fields
        - HasFields
          - def field
          - field_class.from_options
          - field_class = GraphQL::Schema::Field

## Execution

GraphQL::Query object:
  schema, query string, query, context, variables
  GraphQL::Tracing::Traceable => can trace with tracer, stack tracers
    inherit tracers from schema and context:
      @tracers = schema.tracers + (context ? context.fetch(:tracers, []) : [])

"selection" concept => equals to Field
"selected_operation"

# entry point:
Graphql::Execution::Interpreter

- irep_nodes
- new intepreter to avoid irep_nodes and consume AST directly

GraphQL::Execution::Multiplex.run_all

GraphQL::Execution::Execute.use(schema_class)
GraphQL::Execution::Execute.execute(ast, root_type, query)
  
## Other

Directives? => @skip and @include annotation
  - implement feature flag https://graphql-ruby.org/api-doc/1.12.16/GraphQL/Schema/Directive/Feature
  - implement upcase transform

Introspection: output the structure of the schema and __typename as GDL
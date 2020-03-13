title: 'Source code odyssey: graphql-ruby'
date: 2019-06-23 15:59:04
tags: ruby graphql
---

## Why?

Graphql is a mini scripting language

## About graphql

## Phases of Execution

Tokenize: GraphQL::Language::Lexer splits the string into a stream of tokens
Parse: GraphQL::Language::Parser builds an abstract syntax tree (AST) out of the stream of tokens
Validate: GraphQL::StaticValidation::Validator validates the incoming AST as a valid query for the schema
Rewrite: GraphQL::InternalRepresentation::Rewrite builds a tree of GraphQL::InternalRepresentation::Nodes which express the query in a simpler way than the AST
Analyze: If there are any query analyzers, they are run with GraphQL::Analysis.analyze_query
Execute: The query is traversed, resolve functions are called and the response is built
Respond: The response is returned as a Hash

## Query, Schema and Context

## Schema

- schema object
- query
- mutation
- field

## Resolve

## hooks

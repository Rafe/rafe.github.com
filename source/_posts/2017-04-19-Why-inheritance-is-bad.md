title: Why inheritance is bad?
date: 2017-04-19 22:14:20
tags: programming
---

It's been a while ago, when I first study programming in college. I remember the moment when professor introduce us object oriented programming by the classic dog and cat example:

> Dog is an animal, Cat is an animal, therefore, they can both share the behaviors of an animal.

It is a really fascinate example that it links the program behavior to real world object hierarchy. It makes so much sense that we all learned to use inheritance when we can create a hierarchy in our code. Make the code more 'object oriented'.

However, after couple years of experience in writing code. Lots of the most complex, hard to read code is often introduced by the use of inheritance. So we learned to avoid inheritance, 'prefer composition over inheritance'. But deep in my heart, there is always a young college student asking: Why the inheritance is bad? We use inheritance since the first day of learning object oriented programming!

So this article is about to answer that question.

## Misconception

When we first taught object oriented programming, we usually introduced the classic inheritance example.

Nonetheless, when Alan Kay created Smalltalks, the inheritance is never the main concept of it. The main concept is messaging, which is you can send message to object and object encapsulate the data and logic in it, and we can change behavior by using different object, which actually is, composition. But the concept of inheritance is too popular that eventually overshadow composition. I think part of the reason is inheritance introduce an abstract layer from real world to explain object's relation, which can make the code really easy to understand if we use it properly.

[Alan Kay on the misunderstanding of OOP](http://lists.squeakfoundation.org/pipermail/squeak-dev/1998-October/017019.html)

## Problems of inheritance

There are mainly 3 reasons of inheritance:

##### 1. Code reuse

The main reason of inheritance is to reduce duplicated code, the child class can share the implementation from parent class.

##### 2. Declare interface

The child class shares the same interface as parent class and can interact as parent class, also called 'Liskov substitution principle'

##### 3. Introduce abstract class concept for hierarchy

This is a extra benefit that, if the class hierarchy defined well, can help to make system easy to understand.

The problem of inheritance is, although it gets the job done, it sometimes do it pretty badly.

Take an example from real life:

```rb
module Configuration
  def connection
    @connection ||= Connection.new
  end
end

class ServiceBase
  extend Configuration

  def service_url
    connection.to_url
  end

  def send_request
    connection.send(service_url)
  end

  def status
    if response.code == "200"
      :success
    else
      :error
    end
  end
end

class MyService < ServiceBase
  def service_url
    "#{connection.to_url}.xml"
  end

  def get_response
    @response = send_request
  end
end
```

Above code is a web service that send request to an endpoint and retrieve response. Because there are multiple services, we extract the common code into `ServiceBase` to reduce duplication.

So what is the problem in the above code?

##### 1. Yo-Yo problem

First is the readability problem, when we open the file `MyService` and try to understand what it does, it is pretty hard to understand what it does without opening up it's parent class. So when reading method `get_response`, we'll have to open ServiceBase, and then figure out connection is coming from configuration module. And then go to `send_request` in `ServiceBase` and than go to `service_url` method in `MyService`.

The behavior of jumping back and forth from parent and child classes, we called it Yo-Yo problem.

This problem occur because of the following problem:

##### 2. Break encapsulation

Inheritance creates dependency between child and parent, when a class inherit another class, we include all methods and attributes from parent class and expose to the child class, therefore we break the encapsulation, the child object can access all the methods in parent object and overwrite them. That creates a tightly coupled relation between child and parent class, also against the idea of object oriented, which is hide the complexity in the object and interact by interface.

In example, MyService overwrite service_url, which is used in ServiceBase and use the `connection` class from `Configuration` class, creates a circular logic that is hard to track without open all the files. Also when we read the child class, we needs to understand the implementation details of the parent class because it expose the complexity to child class, verses hiding it in the object.

##### 3. Inheritance unnecessary methods

Inheritance, by the rule of substitution, needs to inherit all the methods and properties from parent class, even if it is not used or not needed in the child class, that creates more complexity than the child class needs to.

##### 4. Flexibility

Because we can only inheritance from one class, if we extract all the code into `ServiceBase`, it is hard to reuse just part of the code without includes all the methods in `ServiceBase`.

This problem can be solved if we break ServiceBase into smaller module, like the Configuration module is an example, that if we want to use `connection` we can include the module to use it without including `ServiceBase`

##### 5. Is-a relation

For object oriented, we create a class name imply the relationship between parent and child object. In this case, `Service` and `ServiceBase` which actually does not make sense. By inherit ServiceBase, MyService is a ServiceBase, But ServiceBase in here does not have any logical meaning in hierarchy, in here we just trying to reuse the code by introduce the abstract class. However in object oriented we also enforce an is-a relationship between parent and child, which sometime does not reflect object's real relationships.

Another example is EventEmitter, in javascript we often inheritance EventEmitter on things that needs an event api.

```js
class Service extends EventEmitter {
}
```

But service is not an EventEmitter here, we just want to reuse the code and interface but accidentally introduce a is-a relation.

## Prefer composition over inheritance

In conclusion, by using inheritance to reuse the code here, we also introduce a tightly couple, non-flexible, redundant, complex and does not make sense object.

By contract we can just do this:

```
class MyService
  def initialize
    @service = Service.new(format: :xml)
  end

  def get_response
    @service.send_request
  end
end
```

So we got all the benefits of reuse the code, encapsulate the complexity behind Service class and create loose coupled object that we can easily swap to change behavior of the object.

## Conclusion

This example pretty well explain why we should prefer composition over inheritance in most of the cases. There are exceptions, one is the system objects, when we have a clear hierarchy of objects and definition of interfaces, inheritance actually works well. But in most of the cases, it does not. Imagine in real example that each file is around 400-500 lines of codes, the interaction between child and parent will become overly complex and those complexity can be avoided by composition.

Programming paradigms is often changing, and there is no universal solution on everything. Inheritance is an example, once a good concept is now proved to introduce more harm than help. I hope this article can help people understand more about why inheritance is bad. And also answer my question from my college time:

  > Inheritance is not the core of object oriented programming,
  > and it is commonly overrated because it creates more harm than help and should only used in certain situations.

## Reference

[Why inheritance is bad: Code Reuse](http://blogs.perl.org/users/sid_burn/2014/03/inheritance-is-bad-code-reuse-part-1.html)
[Is inheritance bad practive in OOP](https://www.quora.com/Is-inheritance-bad-practice-in-OOP)
[Why should I prefer composition over inheritance](https://softwareengineering.stackexchange.com/questions/134097/why-should-i-prefer-composition-over-inheritance)

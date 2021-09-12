title: Source code odyssey - Rake
tags: ruby
date: 2019-06-02 11:49:00
---

## Why?

Recently I have a chance to work on mass among of rake tasks in the code base. During the work I found Rake is somewhat confusing but also an interesting framework. I would like to talk about some of the good and bad practices I found in Rake.

## History and purpose of rake

Rake was originally developed By [Jim Weirich](https://en.wikipedia.org/wiki/Jim_Weirich), who passed away in 2014 (you can check his last commit [here](https://github.com/jimweirich/wyriki/commit/d28fac7f18aeacb00d8ad3460a0a5a901617c2d4)), and it is the major task runner for all ruby projects. It inherits some taste of the build tool "make" in the way of syntax, like the "file" task which mainly used for compiling but not used often in ruby project. There are some legacy and practices that can only be found in the early stage of ruby project and a implicit DSL approach which sometimes confusing.

Before we talk about them, let's start from how Rake invokes the tasks. You can open the source code of [Rake](https://github.com/ruby/rake) for details of the source code and references.

## How Rake load when you call it

```rb
# lib/rake/application.rb
module Rake
  class Application
    def run(argv = ARGV)
      standard_exception_handling do
        init "rake", argv
        load_rakefile
        top_level
      end
    end
  end
end
```

When we call `rake` in the command line, it starts by parsing the params and application name. Then load the Rakefile under the current directory and `*.rake` task files from library directory, that is why the tasks we put under `lib/tasks/` in Rails will be available in rake. And then run the tasks by the param or run the top level tasks. ex: `rake db:migrate db:test:prepare` will push those tasks into the queue and invoke them.

But how do Rake find the task we want to invoke? That responsibility goes to the task manager:

```rb
#lib/rake/task_manager.rb
module Rake
  module TaskManager
    def define_task(task_class, *args, &block)
      task_name, arg_names, deps = resolve_args(args)

      ...

      task_name = task_class.scope_name(@scope, task_name)
      ...
      task = find_or_create_task_by_class_and_name(task_class, task_name)
      ...
      task.enhance(deps, &block)
      ...
    end

    def find_or_create_task_by_class_and_name(task_class, task_name)
      @tasks[task_name.to_s] ||= task_class.new(task_name, self)
    end
  end
end
```

Task manager is included by the application, which is accessible from `Rake.application` singleton instance. Basically, all the tasks is available from `Rake.application.tasks` you can invoke it directly in the test. So actually Rake task is pretty testable. The `enhance` call append the task block into one of the lambdas in `task#actions` that will be called when we invoke the task.

Other than `Task`, we also have `Rule`, `FileTask` and `Scope` concept in Rake, we can revisit them later.

## DSL for task 

Now we understand how a task is loaded in Rake, but it is different than the Rakefile or `*.rake` file we usually see. That is because we define those tasks by the Rake DSL:

```rb
#lib/rake/dsl_definition.rb
module Rake
  module DSL
    def task(*args, &block) # :doc:
      Rake.application.define_task(self, *args, &block)
    end

    def desc
      Rake.application.last_description = description
    end

    def namespace(name=nil, &block)
      ...
      Rake.application.in_namespace(name, &block)
    end

    ...
  end
end

self.extend Rake::DSL
```

At the end of DSL block, it extends the syntax to the top level, which is one of the problems of `Rake` because it pollutes the namespace implicitly. However, the DSL basically forward the call to create tasks and namespaces into the `Rake.application` instance.

## How Task, params, and prerequisite works

A rake task holds a list of prerequisites, actions to execute and the scope of the task. We can invoke the task by calling `Rake.aplication.tasks[:task_name].invoke(params)` or `Rake::Task[:task_name].invoke(params)` (which is confusing)

```rb
# lib/rake/task.rb
module Rake
  class Task
    def invoke(*args)
      task_args = TaskArguments.new(arg_names, args)
      invoke_with_call_chain(task_args, InvocationChain::EMPTY)
    end

    def invoke_with_call_chain(task_args, invocation_chain)
      new_chain = Rake::InvocationChain.append(self, invocation_chain)

      return if @already_invoked
      @already_invoked = true

      invoke_prerequisites(task_args, new_chain)
      execute(task_args)
    end

    def invoke_prerequisties(task_args, invocation_chain)
      prerequisite_tasks.each { |p|
        prereq_args = task_args.new_scope(p.arg_names)
        p.invoke_with_call_chain(prereq_args, invocation_chain)
      }
    end

    def execute(args)
      @actions.each { |act| act.call(self, args) }
    end
  end
end
```

The process of invoking a task is:
1. load arguments
2. create invocation chain to log the errors when failed
3. mark the task already run
4. invoke prerequisties tasks with invocation chain
5. execute actions with arguments

It is pretty straight forward, isn't it? But one of the confusing part for me is the DSL syntax for the arguments and prerequisties.

Usually the DSL is `task :task_name`, when we want to pass the prerequisites, we pass it as the last argument in hash form: `task task_name: :prerequisite` but it become further complicated after we introduce task arguments: `task task_name, [:arg1, :arg2] => :prerequisite`. This is pretty confusing that I don't understand why you have to design in this way? Last's check the source:

```rb
# lib/rake/task_manager.rb
def resolve_args(args)
  if args.last.is_a?(Hash)
    deps = args.pop
    resolve_args_with_dependencies(args, deps)
  else
    resolve_args_without_dependencies(args)
  end
end
```

Basically, we check the arguments includes a Hash or not, if hash exists, we extract the hash as dependencies and hash key as task name or argument names. In this way, we don't have to specify the type of args but can depend on hash exist or not for prerequisite. If we don't use this, the task api will be like this: `task :task_name, nil, [:dep1, :dep2]` or `task :task_name, dependencies: [:dep1]`. I feel this is not concise but more readable than implicit hash.

## Other stuffs: Null object pattern, LinkedList, Scope and File task

One of the interesting patterns in Rake is the use or Null object pattern, there are `EMPTY_TASK_ARGS`, `EmptyScope` and `EmptyInvocationChain` used in the code base to detect the nil and empty values. In this way, it is better than nil check because nil might represent multiple conditions and with an object, it is less likely to blow up the code if the object/argument is empty.

Another is the use of LinkedList, it has it's own LinkedList implementation for Scope and InvocationChain, although I think the array, hash and set now can fulfill all the performance requirements for them but it is interesting that it used custom data structure.

The file task is a kind of task that implements the timestamp comparison in `needed?` call. Which compare the file timestamp in all dependencies is updated, if not it will recompile the task to keep files up to date:

The usage is often like this:

```rb
file "index.html" => "index.md" do
  generate_html("index.md")
end
```

It will check all the filetask in the prerequisite list and check the timestamp is updated or not.

```rb
# lib/rake/file_task.rb
def out_of_date?(stamp)
  all_prerequisite_tasks.any? { |prereq|
    prereq_task = application[prereq, @scope]
    if prereq_task.instance_of?(Rake::FileTask)
      prereq_task.timestamp > stamp || @application.options.build_all
    else
      true
    end
  }
end
```

When you don't have a "file" task defined in the prerequisite, it will automatically define one in lookup to track the timestamp:

```rb
# lib/rake/task_manager.rb
def [](task_name, scopes=nil)
  task_name = task_name.to_s
  self.lookup(task_name, scopes) or
    enhance_with_matching_rule(task_name) or
    synthesize_file_task(task_name) or
    fail generate_message_for_undefined_task(task_name)
end

def synthesize_file_task(task_name) # :nodoc:
  return nil unless File.exist?(task_name) # check file exist and create file task
  define_task(Rake::FileTask, task_name)
end
```

## Conclusion

After spending some time the source code of Rake, it is actually a pretty simple and minimalist framework for running the tasks, and it is surprisingly testable. However it is an old framework, it inherits some bad practices like polluting global namespace, overwrite operator, creates helper method everywhere and use a hash to decide the type of arguments, but other than those, it is still good task runner that get the job done well.

There are replacement frameworks like [Thor](https://github.com/erikhuda/thor) which solves those problems, but I still recommend the `Rake` because it fulfills most of the use cases and is the de-facto standard for ruby projects, also as testable as `Thor`. Unless you want to use the template generator syntax provided by `Thor` or want to invoke the task method in codebase.
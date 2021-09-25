title: Abstraction and essential complexity
date: 2020-10-04 13:50:20
tags: programming
---

![cover image](top.png)

> TLDR: Inline abstractions and simplify logic to write better code.

Programmer's work today is based on different levels of abstractions in the form of APIs and modules, they hide large amounts of implementation details so we can build features and products without understanding every details. However, abstractions also increase the complexity of our code. Lots of time I struggle with overly complex code and try to fix those pieces by removing unnecessary abstractions. But how can we tell the abstraction is good or bad? How much abstraction in the code is too much? This article will be focusing on some of my views about abstraction and complexity in programming.

## Power of abstraction

Abstraction is the building block of programmer today, it free programmer from massive details of complexity, without it we will still be writing machine code, for examples: 

- Python and Ruby is an abstraction layer running on C interpreter
- C is a layer on instruction set.
- Rails provide multiple abstraction layers like MVC (model-view-controller), ORM (ActiveRecord, object-relation mapping)
- React hide DOM updates into declarative components and state.

In those examples, the abstractions provide a huge benefit by encapsulating details and provide a high level syntax or API to let people understand and use it.

## Essential and accidental complexity

Although abstraction is a really powerful tool, it also has its limitation.

In the paper "[No Silver Bullet](http://worrydream.com/refs/Brooks-NoSilverBullet.pdf)", it defines the software complexity into 2 parts. Essential complexity and accidental complexity.

Essential complexity is the complexity inherent from the problem domain. Including the mutation of state, condition, the order of procedure, and messaging. All other complexities from the language, framework, or stack are accidental. The line between those 2 complexities might vary, but basically, you can solve the problem with different languages, different framework, but the essential - the algorithm and logic to solve the problem - can not be reduced. For example, you can write the quicksort in C, python, Haskell, or even pseudo-code. The essential complexity of quicksort still stays the same. Therefore no matter how much the technology of tooling improves, there is still no silver bullet to solve the essential complexity issue to increase the productivity of programmers.

## Problem of abstraction

Abstraction is a useful tool to reduce accidental complexity, but it also has several drawbacks:

1. It can not reduce essential complexity. 

Although abstraction can largely reduce accidental complexity, make the code closer to the problem domain by providing higher-level syntax and API. However, the problem domain still inherits the complexity from the real world. Abstraction can not make it simpler. 

2. It increases accidental complexity.

This is a tricky part because abstraction is not essential for solving the problem. Any extra abstractions are increasing accidental complexity. But then how the abstraction decrease complexity? By enough usage of it. A higher-level abstraction can represent multiple lower-level concept together. So with more usage, it can encapsulate more details and make the code focus on essential complexity but not accidental. So with the growth of the problem domain, the complexity with abstraction will grow like this: ![pic1](pic1.png). 

At the beginning of the graph, it will increase more complexity. For example, we can create the acronym "ECAC" to represent those 2 types of complexity. If I only use this acronym once in this post, it only makes this more complicated because the acronym is not essential. However, if this article got widely accepted, we might be able to call our colleague "you should look at the ECAC for your code" Then it make the conversation simpler.

3. It might be wrong or misleading.

Abstractions are not essential, so in the worst case, it might not be correct and misleading. This graph shows how complexity grows with wrong abstractions. ![pic2](pic2.png)

If an abstraction does not have enough usage to cover the extra complexity introduced. It only makes the code more complicated. Or the abstraction might not be able to successfully hide lower-level details, and users even have to bypass the abstraction. Both of those cases make the abstraction increase accidental complexity rather than decrease it.

## Reduce complexity

Then how can we properly reduce the complexity of our code? Here's a couple of suggestions:

1. Make reducing essential complexity the priority

Because unlike abstractions, a better algorithm is basically, better.

The way I use to estimate is by inline most of the abstractions in our problem domain to see procedures, conditions, messaging, and state mutations. And try to make those steps simpler, like removing redundant steps, changing the order to remove conditions, and remove unnecessary states. 

2. Always evaluate multiple solutions

Sometimes it is really hard to evaluate the changes are worth it or not, Therefore evaluate multiple solutions is a good guideline. We can find what is essential in different solutions, And follow Occam's Razor principle: the simplest solution usually is the best solution.

3. Reorganize, inline, and rename code

With those methods we can reduce extra abstractions and reduce accidental complexity, Also help you understand the logic and find a better algorithm.

4. Rule of three

A basic rule to introduce abstraction is to wait until you have 3 usages. It might vary but that is the least case for the abstraction to be useful.

## Example

Here I am going to reuse the example in Sandi Matz's talk: [Polly want a message](https://youtu.be/XXi_FBrZQiU), In this talk, Sandi explains how object-oriented and abstraction can simplify a project that read a file and print line numbers, here is the source:

```rb
class Listing
  attr_reader :filename, :line_numbers, :left_just, :repository, :tag, :git

  def initialize(filename:, line_numbers: nil, left_just: nil, repository: nil, tag: nil, git_cmd: nil)
    @filename = filename
    @line_numbers = line_numbers
    @repository = repository
    @left_just = left_just
    @tag = tag
    @git_cmd = git_cmd
  end

  def lines
    all_lines = if git_cmd
                  git_lines
                else
                  file_lines
                end

    subset = if line_numbers
               lines_to_print(all_lines)
             else
               all_lines
             end

    if left_just
      return justify(subset)
    end

    subset
  end

  private
  def git_lines
    git_cmd.repository = repository
    git_cmd.tagname = tag
    git_cmd.filename = filename
    git_cmd.show.split("\n")
  end

  def file_lines
    File.read(filename).split("\n")
  end

  def lines_to_print(all_lines)
    specs = line_numbers.gsub(/['|']/, '').gsub(/ /, '').split(',')
    specs.collect do |spec|
      if spec.include?('#')
        num_spaces = spec.delete('#').to_i
        (' ' * num_spaces) + '# ...'
      else
        edges = spec.split('-').collect(&:to_i)
        individual_numbers = (edges.min.to_i..edges.max.to_i).to_a
        individual_numbers.collect { |i| all_lines[i - 1] }.compact
      end
    end.flatten.compact
  end

  def justify(lines)
    lines.map { |line| line.slice(num_leading_space_to_remove(lines)..-1) || '' }
  end

  def num_leading_space_to_remove(lines)
    @num ||= 
      lines.reduce(999_999) { |current_min, line|
        line.empty? ? current_min : [current_min, num_leading_spaces(line)].min
      }
  end

  def num_leading_spaces(line)
    line[/\A */].size
  end
end

class GitCmd
  attr_accessor :repository, :tagname, :filename

  def show
    `git #{git_dir} show #{tagname}:#{filename}`
  end

  private
  def git_dir
    %(--git-dir="#{repository}")
  end
end
```

And Sandi shows how to use object-oriented to refactored previous source, I will ignore the progress and only show result here. It is to better follow the talk for details:

```rb
class Listing
  attr_reader :source, :subsetter, :justifier

  def initialize(source:, subsetter:, justifier:)
    @source = source
    @subsetter = subsetter
    @justifier = justifier
  end

  def lines
    justifier.justify(subsetter.lines(source.lines))
  end
end

module Source
  class File
    attr_reader :filename

    def initialize(filename:)
      @filename = filename
    end

    def lines
      ::File.read(filename).split("\n")
    end
  end

  class GitTag
    def self.git_cmd
      GitCmd.new
    end

    attr_reader :filename, :tagname, :repository, :git_cmd

    def initialize(filename:, repository:, tag:, git_cmd: self.class.git_cmd)
      @git_cmd = git_cmd
      git_cmd.repository = repository
      git_cmd.tagname = tag
      git_cmd.filename = filename
    end

    def lines
      git_cmd.show.split("\n")
    end
  end

  class GitCmd
    attr_accessor :repository, :tagname, :filename

    def show
      `git #{git_dir} show #{tagname}:#{filename}`
    end

    def git_dir
      %Q[--git-dir="#{repository}"]
    end
  end
end

module Subset
  class Everything
    def lines(everything)
      everything
    end
  end
  class LineNumber
    attr_reader :line_numbers
    def initialize(line_numbers:)
      @line_numbers = line_numbers
    end

    def lines(possibilities)
      clump_specs.collect { |spec| clump_for(spec, possibilities) }.flatten.compact
    end

    def clump_specs
      line_numbers.gsub(/['|']/, '').gsub(/ /, '').split(',')
    end

    def clump_for(spec, possibilities)
      Clump.lines(spec: spec, possibilties: possibilities)
    end
  end
end

class Clump
  def self.lines(spec:, possibilities: [])
    self.for(spec: spec, possibilities: possibilities).lines
  end

  def self.for(spec:, possibilities: [])
    if spec.include?('#')
      Clump::Comment
    else
      Clump::LineNumber
    end.new(spec: spec, input: possibilities)
  end

  attr_reader :spec, :input
  def initialize(spec:, input: [])
    @spec = spec
    @input = input
  end

  class LineNumber < Clump
    def lines
      expand_clump(spec).contact { |i| input[i - 1] }.compact
    end

    def expand_clump(spec)
      edges = spec.split('-').collect(&:to_i)
      (edges.min.to_i..edges.max.to_i).to_a
    end
  end

  class Comment < Clump
    def lines
      num_spaces = spec.delete('#').to_i
      (' ' * num_spaces) + '# ...'
    end
  end
end

module Justification
  class None
    def self.justify(lines)
      lines
    end
  end

  class BlockLeft
    def self.justify(lines)
      new(lines).justify
    end

    attr_reader :lines
    def initialize(lines)
      @lines = lines
    end

    def justify
      lines.map { |line| line.slice(num_leading_space_to_remove(lines)..-1) || '' }
    end

    private
    def num_leading_space_to_remove(lines)
      @num_leading_space_to_remove ||= lines.reduce(999_999) do |current_min, line|
        line.empty? ? current_min : [current_min, num_leading_spaces(line)].min
      end
    end

    def num_leading_spaces(line)
      line[/\A */].size
    end
  end
end
```

compare those 2 versions, I think people have different opinions about them. Some say the object-oriented version is way more complicated than the original one. Others say it provides more flexibility and encapsulates complex logic in objects. But how do we know which way is better? Here comes the essential complexity. When we compare the original code and refactored code. They are essentially doing the same things, no duplicated code removed from refactoring, but only introduced more abstractions, which increase accidental complexity. So these refactor make the code more complicated in exchange for object-oriented and flexibility, but the goal of refactoring is not to make the code more object-oriented, but to reduce complexity, therefore this refactor is a failure from the complexity standpoint. 

But from the standpoint of object-oriented, it is better because it fits all perspective of object-oriented. Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency Injection. But object-oriented is a programming method, not the goal of programming. Refactor to code like this is mistaking the methodology as a goal. And it will seem like a great refactor (done by top OO consultant!) until the next person comes in to try to modify this mud of objects.

So what is the alternative if refactor into abstractions only makes things more complicated? Leave the code as it is?

The answer is no, we can still improve the original code, but instead of thinking in objects, we have to think in algorithm and logics. We need to find places to reduce essential and accidental complexity. First, we need to find what is the problem in the original code? I think there are a couple of candidates for refactoring:

1. Setup git_cmd object is not necessary.
2. Naming is confusing in `lines_to_print`, it introduced specs, edges, individual numbers. Those variable names introduce more confusion about what they are doing.
3. Algorithm for justifying space is bad, it runs `reduce` with a large number which can be avoided by calling #min.

So let's try to solve them one by one

- For the git_cmd, we can easily inline it as a method
- For the lines_to_print, we can rename specs to parsed_line_numbers, edges to range
- For justify spaces, we can use `min` instead of calling `reduce`
- we can move the conditions check into methods to make the workflow looks better

So the refactored version is:

```rb
class Listing
  attr_reader :filename, :line_numbers, :left_just, :repository, :tag, :git

  def initialize(filename:, line_numbers: nil, left_just: nil, repository: nil, tag: nil, git: false)
    @filename = filename
    @line_numbers = line_numbers
    @repository = repository
    @left_just = left_just
    @tag = tag
    @git = git
  end

  def lines
    justify_spaces(lines_to_print(read_lines))
  end

  private

  def read_lines
    if git
      `git --git-dir=#{repository} show #{tag}:#{filename}`
    else
      File.read(filename)
    end.split("\n")
  end

  def lines_to_print(lines)
    return all_lines unless line_numbers

    parsed_line_numbers = line_numbers.gsub(' ', '').split(',')
    parsed_line_numbers.collect do |line_number|
      if line_number.include?('#')
        spaces = ' ' * line_number.delete('#').to_i
        "#{spaces}# ..."
      else
        range = line_number.split('-').collect { |n| n.to_i - 1 }
        all_lines.slice(*range)
      end
    end.flatten.compact
  end

  def justify_spaces(all_lines)
    return all_lines unless just_left

    leading_spaces_to_remove = all_lines.reject(&:empty?).min do |line|
      line[/\A */].size
    end

    all_lines.map do |line|
      line.slice(leading_spaces_to_remove..-1)
    end
  end
end
```
Generally, I think this version is better than the previous two versions. But how do we know which one is better? After all, this refactor doesn't change code much, it is still doing a lot of things in one object, doesn't fit the SOLID principle. but compared to the original code, the essential and accidental complexity both decreased, mainly by improving justify the logic and some minor improvement for `lines_to_print` and `read_lines`. Make the program size from 86 lines to 53 lines. So if we want to introduce abstractions at this point, the code will still be simpler. We can of course introduce more abstractions, but abstractions also increase accidental complexity, `read_lines`, `lines_to_print` and `justify_spaces` can all be extracted to separate module, but without any usage, those abstractions can not reduce complexity, therefore it is better to wait until there are other usages in the codebase.

# Conclusion

When writing code, we need to carefully estimate the essential complexity and accidental complexity, understand the goal is to reduce them, but not implement any patterns or abstractions itself. When we see the opportunity to introduce abstractions, start from a simple one and make sure there are enough usages. Also, be ready to remove it when it becomes unnecessary. Last but not least figure out how to reduce essential complexity and replace it with a better algorithm to solve the problem domain.

## References

- https://medium.com/ni-tech-talk/caught-in-a-bad-abstraction-55bfe6634b83
- https://en.wikipedia.org/wiki/Essential_complexity
- http://worrydream.com/refs/Brooks-NoSilverBullet.pdf
- https://www.youtube.com/watch?v=IRTfhkiAqPw object oriented programming is embarrassing
- https://www.youtube.com/watch?v=vG8WpLr6y_U&list=PLPxbbTqCLbGHPxZpw4xj_Wwg8-fdNxJRh&index=16 lets program like it's 1999 
- http://blog.spinthemoose.com/2012/12/17/solid-as-an-antipattern/
- https://speakerdeck.com/tastapod/why-every-element-of-solid-is-wrong
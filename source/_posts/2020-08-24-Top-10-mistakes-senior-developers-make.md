title: Top 10 mistakes senior developers make
tags: programming
date: 2020-08-24 21:51:43
---


![cover image](cover.png)

There is a lot of article talking about mistakes made by junior developers. But as the experience goes, people encounter different problems and make different mistakes. Here I am talking about some of the mistakes I made often, or what I observed from other experienced developers.

## What is seniority in programming? 

First, we need to make a definition for senior developers before we talk about the mistakes. The definition is a various by companies and people of course, as people have various backgrounds. And the years of experience doesn't necessarily represent the seniority: 

Maybe someone is coming from another industry and go through Bootcamp in their 30s, someone starts coding around 12, Someone has experience in a young startup and get a senior title in 2 years. So generally the years of experience and title is only one aspect of it. The more important is what the developer does and acts while working.

Overall several traits show in a senior developer:

* teaching people

Every team has one or two really knowledgeable people that when teammate stuck, the first thing they do is to ask the opinion from them. It shows the experience a person has, from the team's perspective, it's also the reason why we need senior developers on the team.

* understand the development cycle

This includes the design, development, testing, deploy, DevOps, and support. With enough experience and curiosity, a senior developer should be able to understand the full development cycle and be able to help when there is a problem. Which means the person has a wide range of knowledge.

* advance programming knowledge

Some developers have more knowledge on a specific part of the stack. Like frontend, database, machine learning, frameworks, or deep understanding of how the programming language and compiler work and Programming concept like design pattern and functional programming, Also practical skills like logging, security, caching, and performance tweaking... etc. 

* contribute critical opinion for decision

Making decisions is one of the most important things as a leader. Opinion and experience from past failures can contribute a lot to avoid possible failures for the team. Even the opinion is always not taken, the developer still need to make the logic clear and review it afterward to improve the decision making.

* soft skills

Include the work attitude, self-management, communication, and team relationship. Those soft skills are critical to the career but are often based on personality, which takes time to improve.

Not every traits can be observed on senior developers, but those are the aspect that can distinguish an experienced developer and an inexperienced one.

### 10. Extract too many layers

As a famous quote goes: 
> All problems in computer science can be solved by another level of indirection... except for the problem of too many layers of indirection"

Extracting layer is a powerful tool that it doesn't matter what the algorithm is, we can create an indirection layer to hide all the details and make the code clean.

Without any indirection, we probably will be still writing assembly code today. But too much indirection, or wrong abstraction, is a problem on its own that usually be ignored.

A developer wants to write short and clean code, and create indirection is the fastest way to give you short and clean code... but it does not improve the algorithm but only transfers it into a different problem, too many experience developers fall into this trap, they break up logics that are not reusable and should be together in one file, just to achieving the "clean code" that we saw in the example of the book. The rule of 3 is a good check to prevent this mistake that only extracts methods when it is used in 3 different places, and only extracts logic when you see a clear boundary in code but not just for the sake of extracting them.

### 9. Don't write documentation, or write it badly.

Some developer doesn't like to write documentation, as the experience increase, people realized those documents are easily out of sync with the code, and sometimes even confusing and hard to understand. So instead of writing a bunch of documentation that no one likes to read, why not just make the code simple and read the code?

I think there is truth in it but also missing some points. First, not everyone would like to read the code. Second, documentation can capture more things that are not in the code, like context, screenshot, or background. Some problem of documentation is coming from bad practice. Like bad writing skills, writing too much, can't clearly express the logic, or did not store the documentation in a centralized place.

### 8. Overconfidence about your code

> "What could be wrong? it's just a refactor that move this method to another place." 
>
> ~ Every on-call engineer at 4:00 AM fixing production issue.

Most developers are overconfident about their code. The root reason is humans have a conscious bias that they have more confidence for the thing they are in control of. Like people usually think driving a car is safer than taking an airplane because they are in control of the steering wheel. But by statistic driving is far more dangerous than taking an airplane. Especially for a long time driver they feel more confident but ignore in the reality many factors are without people's control. Sometimes we don't manual test the code because it's just a small bug, believe the test suite can cover all the possible problems, and rely on code review or QA to catch problems. Those are a bad habit that experience develops should try to avoid.

### 7. Misuse inheritance

I wrote a blog about this topic already: [Why inheritance is bad](http://neethack.com/2017/04/Why-inheritance-is-bad/)

In general, people should consider composition first because inheritance will:

1. break encapsulation.
2. Make code hard to reuse outside inherited class.
3. Introduce unnecessary methods for subclasses.
4. create dependencies between classes.

So it should be used carefully. But every book teaching object-oriented programming will never talk about those problems. Which causes a lot of improper usage of inheritance.

### 6. Underestimate algorithm

Usually, developers think of an algorithm as those Leetcode questions that you only study when you want to move to the FAAMG. And people always say you don't need to know algorithms to be a developer, That's true. But I think of algorithms as the process of solving problems. I often saw developers writing complex solutions for simple problems. Unlike Leetcode, it is hard to evaluate what is the best algorithm for a complex problem, so those overly complex solutions are often delivered and become a problem for the future. There are many problem-solving skills from solving Leetcode problems that can be used in solving real problems. Like estimate complexity, optimize algorithm by remove unnecessary steps, and split the problem into smaller problems. Often people underestimate those problem-solving skills.  

### 5. Lack of coding

This happens when people have more management responsibility, they tend to code less and slowly become rusty in their coding skills. As the age grows people have family, they have more responsibility and don't have the passion to study new things or read code as junior developers. When those developers give the direction of a project or design system, the rustiness sometime becomes a burden of the team and it's hard to point out that because by position-wise they should be the best developers in the room. And they are confident about their solution because in the past they were the best developers so they got promoted. I think senior developers need to acknowledge this problem, ask more questions about what they don't know, and learn from junior developers to keep their skills sharpened.

### 4. Not communicate enough

Some developers often got feedback that they are not communicating enough with their boss and coworker, or having poor communication skills. Things become complicated when they also have good programming skills, because from their standpoint they are getting things done. Telling managers what they are doing, checking with them whenever something happens, it's not productive. Also, why don't they spend 10 minutes to read the code if they want to know what is happening? Moreover, nobody communicates everything to everyone, so you can always find some cases to prove that you are communicating, or at least the same as other people.

But people reduce all problems to communication problems, so when people complain about communication, it is not the communication problem but more likely to be a relationship problem. You probably not spending enough time talking to people and helping them, Or maybe piss off team members when discussing stuff, Or so stubborn that insist to do everything your way. There is no absolute right or wrong in a relationship problem, it is more about ego and human feeling. Of course, be more responsive to things and notify people, but also improving human management skills which are often missed by some senior developers.

### 3. Don't ask for help

When the developer gets more experience, they don't ask questions on the slack channel. I think this is because they know more and like to solve problems by themselves, which is good. But often when they got stuck, it becomes harder for them to ask questions. So how to ask questions at right time is a critical skill usually forgot by senior developers.

### 2. Not able to take criticism

People don't like to take criticism, but with more knowledge and experience, they tend to be more defensive about criticism. When you are a junior developer, you will probably just take it as it is. But with more experience you can see that other people's criticism is not always correct, it makes people harder and harder to take criticism. And become "uncoachable", because you have opinions on every people who think they can give you advice. Therefore as people become senior, they need to learn from junior developers to be humble, ignore ego, and absorb criticism. Because that is the way to continuous growing.

### 1. Believe in dogmatic rules

At last, here comes the biggest problem of senior developers, dogmatic rules. The dogmatic rules here means any programming paradigm, language, architecture, or best practices that people attach to them so much that they can not see it objectively anymore.

Programming is an area that changing pretty fast. Any best practice that people consider established, is not that long if you compare to other areas. For example, design patterns appeared in 1994 and test-driven development rediscovered in 2003. It feels long but compares to math or physics, those are still brand new ideas. So we need to carefully consider the pros and cons of those ideas when we try to use them. But as developers grow, they become attached to those best practices due to the pass experience. This is not a bad thing, but sometimes people blindly follow those rules without considering it over the current context and creates a self-reinforcing loop. When the project success, it is definitely because we made the rule right, when the project failed, it is because we do not follow the rule correctly. Also when the new best practices comes out, people try to write books to sell those ideas as a silver bullet without talking about the cons. Because it is new, there are not much discussion about the cons and it is easy to get buy-in of those ideas until you realize things are not as good as they claim to be. 

For solving this problem, people need to keep doubt on things, either new ideas or established ones, be realism and keep radical transparency in the team, to discuss ideas openly so we don't fall into the dogmatic rule problem.
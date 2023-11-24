title: "Announcing Code-Warrior"
date: 2013-04-18 11:38
tags: javascript
---

Recently I am preparing the interview with some companies in West Coast.  
One of the problem I have during the preparation, which is because I am a vim user,
It is uncomfortable to practice algorithm questions on TopCoder, so I think it would be great if I have a npm tool that can
download algorithm problems and provide some skeleton test case for practice.
Therefore I created [Code-Warrior](http://code-warrior.herokuapp.com)

<!-- more -->

## Features

Code warrior provide some basic algorithm questions like quicksort, tree traversal, with some more advence questions too.
The questions is all open source, so it can accept new algorithm questions on community.  

[Code-Warrior questions](http://github.com/Rafe/code-warrior-questions)

Code warrior also provide a web interface for people to check their status,
get score by solving questions and share the code by Github:gist.

## How to use?

First, you can install the code-warrior cli by npm:

    npm install -g code-warrior

After that, you can create a directory for practice, init project on that directory:

    war init


Code warrior will require your github username and password for authenticate.  
Your local directory should be like this after init:

    arena/
    history/
    node_modules/
    package.json
    .config.json

You can check the questions by command:

    war list

And download question to the `arena` folder by

    war -l [level] -s [id]

Or ignore the id, Code-Warrior will return first unanswered question.

Each question include a readme file, a test case and file to implement.

Implement the question in index.js, and pass the test cases.  
you can test question by

    war

or just use mocha

    mocha arena

Then, commit the question on Code-Warrior:

    war commit

If the test cases passed on both local and server, you can gain score according to the level of question.
Check your status on site by:

    war status

Or login with Github on Code-Warrior site.

## More

Right now it only provide javascript for writing the question.
But I will try to add ruby and python as language options.  

Also, another secret command `war legend`,
which can download custom question for interviewing people, is working in progress.  

You can contact me by daizenga [at] gmail.com if you have any suggestion on it.

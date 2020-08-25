title: "Command-t.vim crash on yosemite"
date: 2014-12-08 04:35
tags: programming
---

## The bug

Today I updraged my mac osx to 10.10 yosemite,
However, the command-t.vim plugin does not work correctly with new os.

I saw the `command-t.vim could not load the C extension` message from vim.

<!-- more -->

## The solution

First I update my xcode version and install newer command-line tool from xcode  
Then I got a different error from vim  
After google on internet  
I figure out because the system ruby version is updated on yosemite  
The command-t plugin might not compiled with new system ruby.  
So I have to recompile it with system ruby then link it.  
So the solusion with rbenv is:  

```
cd ~/.vim/bundle/command-t/ruby/command-t/
rbenv local system
ruby extconf.rb
make clean # remember to clean old ruby file before recompile
make
```

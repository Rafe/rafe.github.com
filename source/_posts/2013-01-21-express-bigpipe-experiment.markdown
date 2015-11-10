---
layout: post
title: "express bigpipe experiment"
date: 2013-01-21 15:28
comments: true
categories: javascript
---

## Bigpipe

Bigpipe is an unique frontend technique used by Facebook to increase their page rendering speed.

When I read the article talk about [bigpipe on facebook](https://www.facebook.com/note.php?note_id=389414033919), I was pretty shocked about how facebook implements those unique ideas to
increase their page rendering speed.

Recently I am using node.js for web development, I think the async structure of node is a perfect environment to use this technique, so I wrote a small experiments app with express:

<!--more-->

## Streaming

The technique behind Bigpipe is actually pretty simple,
what Bigpipe do is using http streaming to load the page seperatly.
When the page load, Facebook will return basic layout, css and assets manager(bootLoader) to user first.
Then other slower content like news feeds, notification will returned later on the same request as Pagelet.
A pagelet contain it's own css, javascripts and contents,
after pagelet loaded, it will render itself to page,
and resources dependencies is managed by bootLoader so it won't load duplicated resources.

The adventage of this approach is that the slower part of the request won't block the whole page rendering.
User can get response for the completed part first, than receive the slower part.

## experiments on express

In this example, I use express as web framework, async for async rendering and jQuery for render content to layout.

you can clone the gist and run it on local:

    git clone https://gist.github.com/4589002.git
    cd 4589002
    npm install
    npm start

{% gist 4589002 %}

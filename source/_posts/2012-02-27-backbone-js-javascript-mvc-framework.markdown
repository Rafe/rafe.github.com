---
layout: post
title: "backbone-js javascript MVC Framework"
date: 2012-02-27 11:20
comments: true
categories: javascript, backbone.js
---

##What is Backbone.js?

Backbone is a framework for front-end JavaScript, unlike jQuery focus on easier DOM manipulation and event binding, backbone provide a structure for separating data model and DOM, just like a MVC framework separate model, view and controller. Make heavy JavaScript application easier to develop and maintain.

##Why Backbone?

<!-- more -->

In jQuery, we will write a sequence of chain selector for assign data model to DOM element like:

{% codeblock lang:js %}

var article = {
  author:"Joe",
  content: "testing"
};

$('#article').click(function(event){
  $(this).find('.content').text(article.content);
});

{%endcodeblock%}

For backbone, it provide the Model class and View class, which is the main two element of backbone.

{% codeblock lang:js %}

var Article = Backbone.Model;


var ArticleView = Backbone.View.extend({

  el: $('#article'),

  initialize: function(){
    this.model.bind('change',this.updateContent, this);
  },

  events: {
    "click .content" : "updateContent"
  },

  updateContent: function(){
    this.$('.content').text(this.model.get("content"));
  }

});

var article = new Article({
  author:"Joe",
  content: "testing"
});

var articleView = new ArticleView({model:article});

{% endcodeblock %}

OK, it's seen like a completely overwork, that's my first thought when I saw a clientside MVC framework too, but we have to dig further to understand why people create it.

##Event Binding

First, it separate the data model and view - which include event handle and DOM element, we can easily bind data model in view like:

    this.model.bind('change', this.updateContent, this);

It means when the data model change, the view will be automatically updated to DOM element.

Also, backbone provide literal event binding:

    events:{
      "click .content": "updateContent"
    }

which bind the "click" event to ".content" class, trigger "updateContent" function in current view.
It's useful when binding multiple events.

##Restful synchronization

Furthermore, the backbone provide a RESTful format API for synchronize data model with server.
every model class in backbone have a corresponding url for synchronize, and when the "model.save" or "model.fetch" method is called, the model will make an Ajax request to update data with server.
For example:

    article.save({author:"John"});

will first find article.sync method, if undefined, call Backbone.sync.
The sync method will make an ajax request to server, and update model, trigger event and update to view.

the url of model is defined by RESTful API:

* create -> POST /model
* read   -> GET /model[/id]
* update -> PUT /model/id
* delete -> DELETE /model/id

and we can also change it by overwrite url parameter

##Dependency

backbone.js depend on underscore.js and jQuery/Zepto library, since it is only a 5k framework focus on the structure of JavaScript application.

##Collection and Router

Backbone provide Collection, which is the collection of Backbone.Model, and provide manipulation on underscore.js

{% codeblock lang:js %}
var Article = Backbone.Model;

var Articles = Backbone.Collection.extend({
  model: Article
});

var articles = new Articles();

articles.add([{
  author:"Joe",
  content: "testing"
},{
  author:"John",
  content: "developing"
}]);

articles.each(function(article){
  console.log(article.get("author"));
});
{% endcodeblock %}

the Router in backbone is like the route map in MVC framework, it provide clientside fragment url routing, eg. route "/#article/12" to match method "article(id)". So the url can be recorded and bookmarked by browser.

##Template

In Backbone, we can create template in view.
In that way we can add and remove multiple view and render with template.
The underscore.js provide template engine or we can use other engine too.

In view:

{% codeblock lang:js %}
render:function(){

    var template = "<%=content %>;

    $el.html(
        this.template(this.model.toJSON())
    );

    return this;
}
{% endcodeblock %}

##Conclusion

JavaScript MVC framework is good for rich client application and also can keep your javascript cleaner.
But whether to use it depend on how much script in your application, for small page, the MVC is total overhead, but it is good for large scale page like Mail or Desktop like application.

##More

[Backbone](http://documentcloud.github.com/backbone/)  
[Sample todo application](http://documentcloud.github.com/backbone/docs/todos.html)  
[Annotated source](http://documentcloud.github.com/backbone/docs/backbone.html) 

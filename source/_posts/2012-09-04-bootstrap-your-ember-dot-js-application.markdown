---
layout: post
title: "Bootstrap your Ember.js application"
date: 2012-09-04 18:06
comments: true
categories: javascript, ember.js
---

[Ember.js](http://emberjs.com) is a javascript MVC framework developed by Rails
core team member [Yehuda Katz](http://yehudakatz.com), [ Tom Dale ](http://tomdale.net/) and Charles Jolley. Compare to other javascript MVC framework, Ember.js not only provide a MVC framework for seperation of logics, but also focusing on some common problems when developing complex javascript application.

##Binding

One common problem of javascript application is how to manipulate DOM element and insert data into DOM, for example, a jQuery app retrive user data and show on screen will look like this:

<!-- more -->

{% codeblock lang:js %}

$.get('/user', function(data){
  $('#username').text(data['name']);
});

{% endcodeblock %}

When the application growth, the code of updating data onto dom will become huge repeating logic, for solving this problem, Ember.js use the handlebar template and binding, for example, a handlebar template will look like this:

{% codeblock lang:xml %}

<script type="text/x-handlebars">
  Hello, { { App.user.name }}
</script>

{% endcodeblock%}

And binding with a Ember.js Object:

{% codeblock lang:js %}

App.user = Ember.Object.create({
  name: null

  getName: function(){
    var self = this;
    $.get('/user', function(data){
      self.set('name', data['name']);
    });
  }
});

App.user.getName(1);

{% endcodeblock %}

Behind the scene, handlebar will compile template with script tags:

    Hello <script id="metamorph-0-start" type="text/x-placeholder"></script>
    Jimmy
    <script id="metamorph-0-end" type="text/x-placeholder"></script>

And handlebar will auto update the value between tags. So the data and dom will always be synced.
This save lots of work for updating data.

Also, Ember can calculate the compounded values and update it automatically, for example, we can change the name attribute that combine the firstName and LastName value together:

{% codeblock lang:js %}

App.user = Ember.Object.create({
  firstName: "Jimmy",
  lastName: "Chao",
  name: function(){
    return this.get('firstName') + this.get('lastName');
  }.property('firstName', 'lastName')
});

{% endcodeblock %}

The template will automatically updated when firstName and lastName value changed.
We can also bind other object with property binding:

{% codeblock lang:js %}

App.profile = Ember.Object.create({
  usernameBinding: 'App.user.name'
});

App.profile.get('username'); // "Jimmy Chao"

{% endcodeblock %}

The attribute and template will also automatic updated when value changed

## View

In Ember.js, view is in charge of handling events and present data. We know the data is autobinding on template, but what about events? It turns out Ember.js will populate event all the way to parent view to handle, and event can be bound on template for specific element:

{% codeblock lang:js %}

App.userView = Ember.View.create({
  templateName: 'user-view',
  name: "Bob",
  click: function(){
    alert('clicked');
  },
  sayHello: function(){
    alert('hello!');
  }
});

App.userView.appendTo(App.rootElement); //append view to the application

{% endcodeblock %}

And define the event in action helper:

{% codeblock %}

<script type="text/x-handlebars" data-template-name='user-view'>
  Hello, {{view.name}} <br />
  <a href="#" {{action sayHello target="this"}}>Say Hello</a>
</script>

{% endcodeblock %}

Then when user click link, it will trigger both 'click' and 'sayHello' event.
The view template and view is connected together and will always be sync, so we don't have to rerender or trigger change event when value changed. this is the different of Ember.js view and other view templates. But the cons is you can only use handlebar.js to have autoupdate template.

##Combounded View

Another problem for javascript application is the view structure. When application grow, it will generate main view and sub views under the main. For solving this problem, Ember.js provide ContainerView that can define childView in it.

{% codeblock lang:js %}

App.mainView = Ember.ContainerView.create({
  childViews: ['navigationView', 'mainView','footerView'],
  navigationView: App.View.create({
    templateName: "nav-view"
  }),
  outletView: App.View.create({
    template: Ember.Handlebars.compile( '{ {outlet}}' )
  }),
  footerView: App.View.create({
    templateName: "footer-view"
  })
});

App.MainView.appendTo(App.rootElement);

{% endcodeblock %}

With this ContainerView, we can define any numbers of sub view and append them to application.

And for displaying multiple elements, Ember.js also provide CollectionView, which can render view for each items in content:

{% codeblock lang:js %}

var HelloView = Ember.View.extend({
  template: Ember.Handlebars.compile('Hello { {view.content}}')
});

App.usersView = Ember.CollectionView.create({
  content: ["Jimmy", "Bob", "Jack"],
  itemViewClass: HelloView
});

App.usersView.appendTo(App.rootElement);

//Append:
//<div class='ember-view'> Hello Jimmy</div>
//<div class='ember-view'> Hello Bob</div>
//<div class='ember-view'> Hello Jack</div>

{% endcodeblock %}

This will display 3 hello view and append to rootElement, the content will also automatic binding with views.

##Objects

Ember.js provide a series of extend methods for Object, all Ember.js Object is inherited those methods, include Event, Observer, toString ,getter, setter and more, most common use case is Ember.Object.create() and Ember.Object.extend(). extend is defining new Object Class and create is create a instance of class. Also, we have some convenience method. Like reopen and reopenClass can do the monkey patch, which is directlly modify the defined object class.

{% codeblock lang:js %}

var User = Ember.Object.extend({
  firstName: null,
  lastName: null
});

User.reopen({
  name: function(){
    return this.firstName + " " + this.lastName;
  }.property('firstName','lastName')
});

var user = User.create({ firstName: "John", lastName: "Doe"});

console.log(user.get('name')); //John Doe

{% endcodeblock %}

Another is Mixin, which is like module in ruby, abstract class and interface in java. Can extend parameter and function to class, which make the object cleaner.

{% codeblock lang:js %}

var Admin = Ember.Mixin.create({
  isAdmin : true
});

var User = Ember.Object.extend(Admin,{
  name: null
});

var user = User.create();
console.log(user.isAdmin);  // true

{% endcodeblock %}

##Application

Here is what magic happened, and is the most confusing part of Ember.js when I started learning. Because the documentation and Guide doesn't mention lots of things on controller and router. But the code document is great. Strongly recommend to read the source code of Ember.js.

Application, inherit Ember.Namespace, is the starting point of every Ember.js application.

Each application start with a creation of namespace:

    window.App = Ember.Application.create();

All classes should be attached to the application namespace and application should be the only global varible.

    App.UserView = Ember.View.extend();
    App.UserController = Ember.Controller.extend()

After classes loaded. We can call `App.initilize()` to start the application. What initilize do here is, first, it bind the application with `rootElement`(default to body). Also enable the event deligation, application object will also be the event hub of all other classes. And the important one is, it will load the ApplicationController, App.ApplicationView and App.Router. Create and attach all controller instance to router. For example, App.UserController will have an instance App.router.userController after application initialized. Also, router will trigger state and start the corresponding action after intialized.

##Controller

In Ember.js, controller is the place to put model manipulation codes and binding model with views. We can call the 'connectOutlet' function to application controller and pass the name and content to invoke corresponding controllers and views to `{ {outlet}}` in ApplicationView. Like Rails, Ember.js have naming convention on Controllers and Views, the UsersController and UsersView will automatically bind together when calling connectOutlet. Controller will be avaliable in view by property 'controller'.

{% codeblock lang:js %}

users = ['Jimmy', 'Bob', 'John'];
App.router.applicationController.connectOutlet('users', users);
//invote the UsersController and UsersView instance with content users.
//Render UsersView to the { {outlet}} position of ApplicationView template.

{% endcodeblock %}

##Router

Router is inherited from Ember.StateMachine that represent each route as a state of Ember application.
Each route will have route url and connectOutlets function. connectOutlets will be called with router instance,
Which we can access all controller instance form it, and call the connectOutlet method to set the view and controller to mainView.

{% codeblock lang:js %}

App.Router = Ember.Router({
  root: Ember.Route.extend({
    index: Ember.Route.extend({
      route: '/',
      connectOutlets: function(router){
        //get the application controller
        var controller = router.get('applicationController');
        //get the model, using fixed data here
        var users = ['Jimmy', 'Bob', 'John'];
        //connect the UsersController, UsersView, users to ApplicationView
        controller.connectOutlet('users', users);
      }
    })
  });
});

{% endcodeblock %}

Each route is also a state of application, so the route can have specific transition in certain state
For example, when viewing a single post, user can edit the post. When can represent this use case as:

{% codeblock lang:js %}

App.Router = Ember.Router.extend({
  root: Ember.Route.extend({
    posts: Ember.Route.extend({
      route: '/posts/:id',
      connectOutlets: loadPost,

      showEdit: Ember.Route.transitionTo('edit'),
      edit: Ember.Route.extend({
        route: '/edit'
        connectOutlets: loadPostForEdit
      });
    })
  });
});

{% raw %}
//with action helper in template:
//<script type="text/x-handlerbars" data-template-name='post-view'>
// ...
// <a href="#" {{action showEdit }}> Edit</a>
//</script>
//will transit url to /posts/:id/edit
{% endraw %}

{% endcodeblock %}

So that only in posts state, user can transit into the edit state.

##Todos App example:

For understand the Ember.js Application More, I am starting with the [TodoMvc](https://github.com/addyosmani/todomvc) example of Ember.js. Lets go through a view classes to of the todo exmaple to understand more how Ember.js works:

{% codeblock lang:js %}

//app.js
window.Todos = Ember.Application.create({
  VERSION: '1.0',
  // binding root element with id='todoapp'
  rootElement: '#todoapp',
  // used as localstroage namespace
  storeNamespace: 'todos-emberjs',
  // Extend to inherit outlet support
  ApplicationController: Ember.Controller.extend(),
  ready: function() {
    //initialize router, controller and views
    this.initialize();
  }
});

//router.js
Todos.Router = Ember.Router.extend({
  root: Ember.Route.extend({
    showAll: Ember.Route.transitionTo('index'),

    index: Ember.Route.extend({
      route: '/',
      connectOutlets: function(router){
        var controller = router.get('applicationController');

        // Get the models, in this example is entriesController
        // Which is an instance of ArrayProxy
        var context = Todos.entriesController;
        context.set( 'filterBy', '');

        // Connect todosController and todosView with context to applicationView.{{outlet}}
        controller.connectOutlet('todos', context);
      }
    });
  })
});

//controllers/todos.js
Todos.TodosController = Ember.ArrayProxy.extend({
  entries: function(){
    var filter = this.getPath('content.filterBy');

    if(Ember.empty(filter)){
      //content will be injected by router
      return this.get('content');
    }
    ...
  }.property( 'content.remaining', 'content.filterBy')
});

//views/todos.js
Todos.TodosView = Ember.CollectionView.extend({
  //binding content to todosController.entries
  contentBinding: 'controller.entries'
  ...
  //view class for each todos item
  itemViewClass: Ember.View.extend({
    ...
    doubleClick: function() {
      this.get('content').set('editing', true);
    },
    ...
    //innerview for editing item
    ItemEditorView: Ember.TextField.extend({
      valueBinding: 'content.title',
      ...
      change: function(){
        if(Ember.empty(this.getPath('content.title'))){
          //if no value, remove object from todosController.content
          this.getPath('controller.content').removeObject(
            this.get('content');
          );
        } else {
          //if not, update the content
          this.get('content').set('title',
            this.getPath('content.title').trim());
        }
      },
      whenDone: function(){
        this.get('content').set('editing', flase);
      },
      ...
    });
  })
});

{% raw %}
//todosView:
//<script id="todosTemplate" type="text/x-handlebars">
//{{#unless view.content.editing}}
//  {{view Ember.Checkbox checkedBinding="view.content.completed" class="toggle"}}
//  <label>{{view.content.title}}</label>
//  <button {{action removeItem target="this"}} class="destroy" ></button>
//{{else}}
//  {{view view.ItemEditorView contentBinding="view.content"}}
//{{/unless}}
{% endraw %}

{% endcodeblock %}

You can see [http://todomvc.com/architecture-examples/emberjs/](http://todomvc.com/architecture-examples/emberjs/)
for demostration.

##Conclusion

After reading this article, I hope you can have a common understanding of Ember.js and what problem it is trying to solve.
Ember.js, unlike Backbone concentrate on simple and minimal code, it is a very opinion framework. Therefore it has steeper learning curve than Backbone. Also the document can't cover all topics of Ember.js. So read the comment in codes is actually a very useful way to understand how Ember.js work.

Comparing these 2 frameworks. Backbone.js is simple, easy to use and Integrate RESTful Api by model. But when codes grow. You have to be careful about the repeating code and logics. Also might need some plugin like layoutManager to maitain better structure.

On the other hand, Ember is harder to use. But it have better build-in structure for large scale application. Some automatic binding for controllers and views, state machine router, and solve some common problem like syncing and updating. But you can only use handlebar for the template. Also have lesser plugins and resources than Backbone. Such as the module for server data: Ember-data is still in development stage.

Overall, those 2 framework is both ready for production use. At the source code level, I like the structure of Ember.js, It is very moduler and have some suger syntax like mixin and reopen on object level. Also with very good code documentation. I will like to use Ember in my next project to compare with backbone.

##Reference:

+ [Ember.js](https://github.com/emberjs/ember.js)
+ [TodoMvc example in ember.js]([http://todomvc.com/architecture-examples/emberjs/](http://todomvc.com/architecture-examples/emberjs/)
+ [What is Ember?](https://speakerdeck.com/u/wycats/p/backboneconf-emberjs)  
+ [Ember routing](http://tomdale.net/2012/05/ember-routing/)  
+ [parisjs-app](http://tchak.net/parisjs-app/)  
+ [webapp-codelab](http://petelepage.com/webapp-codelab/)  

title: "Understand event loops"
date: 2013-01-09 18:02
tags: javascript
---

Event loop is the core feature in node.js, 
and is also the reason why it is better on handling requests and realtime communication like long polling.

## The Obstacle of IO

The reason is on this is because the I/O is expensive:

<!--more-->

+ L1/cache: 3 cycles
+ L2/cache: 14 cycles
+ RAM: 250 cycles
+ Disk: 41,000,000 cycles
+ Network: 240,000,000 cycles

In the case like web application, every request is not computing heavy but require lots of access on database and disk.
So the most time-costing task in a request is waiting database or disk to response.

To solve this problems, the application servers running multiprocess or multithread
to make it able to handle more request at same time.
however, the new process solution will cost large among of memory because the each fork will copy the memory data to new process.
Thread solution is more kindly on memory but still cost more memory.

## What is event loops?

So the event loops become the solution of this.

### Asynchronous I/O aka Evented I/O

The problem of I/O obstacle, is because I/O can run concurrently, but your code is not,
So while the code is accessing the I/O, the process can only idle and wait for the response:

Sync I/O in node.js:

    fs = require('fs')

    var data = fs.readFileSync('file.txt')
    // wait for IO to return content
    console.log(data)

But with event loop, the program don't need to wait for the I/O but can handle next task directly.

    fs = require('fs')

    fs.readFile('file.txt', function(err, data){
      // Called when data is ready
      console.log(data)
    });
    // returns

The node.js event loop is using [libuv](https://github.com/joyent/libuv) to handle the I/O multiplex
in the core function of libuv:

    //src/unix/core.c
    int uv_run2(uv_loop_t* loop, uv_run_mode mode) {
      int r;

      if (!uv__loop_alive(loop))
        return 0;

      do {
        uv__update_time(loop);
        uv__run_timers(loop);
        uv__run_idle(loop);
        uv__run_prepare(loop);
        uv__run_pending(loop);
        uv__io_poll(loop, (mode & UV_RUN_NOWAIT ? 0 : uv_backend_timeout(loop)));
        uv__run_check(loop);
        uv__run_closing_handles(loop);
        r = uv__loop_alive(loop);
      } while (r && !(mode & (UV_RUN_ONCE | UV_RUN_NOWAIT)));

      return r;
    }

We can know the event loop is just a while loop, what it do is keep polling I/O for avalible fd([file descriptor](http://en.wikipedia.org/wiki/File_descriptor))
and trigger event callback while the fd is ready.

in unix, there's multiple way to polling fd:

+ select
+ poll
+ epoll (linux)
+ kqueue (BSD, unix, osx)

node.js is using kqueue on mac os/unix.

## Reactor pattern

![Reactor Pattern](reactor-pattern.png)

In javascript, function can be passed as first class object,
so the code on node.js is heavily using callback and event to make efficient async I/O.

example a db query:

    db.posts.find(function(err, posts){
      console.log(posts);
    });

could pass a function as callback to event loop, trigger it when the data is available.
and process can handle other tasks during response.

Also, the process.nextTick can also pass function to event loop, execute the function when the process is avaliable for task.

    //Blocked:

    // some time consuming task
    for(var i=0;i < 10000000000; i++){}
    console.log('done');

    console.log('return')
    //>> done
    //>> return

    //Async:

    process.nextTick(function(){
      // some time consuming task
      for(var i=0;i < 10000000000; i++){}
      console.log('done');
    });

    console.log('return')
    //>> return
    //>> done

## reference

+ [The truth about event loops online masterclass](http://truthabouteventloops.com/)
+ [Understanding process.nextTick()](http://howtonode.org/61f361ddb1696aee4afedaf356430cdd768b1d73/understanding-process-next-tick)
+ [Understanding the node.js event loop](http://blog.mixu.net/2011/02/01/understanding-the-node-js-event-loop/)
+ [Integration of GLib Main Event Loop and Node.js (chinese) ](http://fred-zone.blogspot.com/2012/09/glib-main-event-loop-nodejs-libuv.html)

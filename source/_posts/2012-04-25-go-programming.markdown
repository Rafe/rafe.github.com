---
layout: post
title: "Go Programming Example"
date: 2012-04-25 23:26
comments: true
categories: Programming
---

##GO v1

Recently, the Go language release it's version 1.0, which have a more constant api that aiming on
attracting enterprise developers to use go as part of their solution.

I read the tutorial when it's first release. At that time, Go was positioned as a new system language, Like C or C++. But right now it become more powerful that can be use on any general programming topic that require efficiency and concurrency.

As a language, Go has pretty weird syntax such as postfix type decleration and interface oriented. But other then that, Go is more like a compiled version scripting language. Which is pretty easy to write, and focusing on making threading easier through It's Go routine.

<!--more-->

##Install go

On OSX you can use homebrew:

	brew install go

##Concurrent

One main feature of Go is go routine:

{% codeblock lang:go %}
package main

import (
	"fmt"
	"runtime"
)

func HelloGo() {
	fmt.Println("Hello Go!")
}

func main(){
	for i := 0; i < 10; i++ {
		go HelloGo()
	}
}
{% endcodeblock %}

It's equivalent to Java:

{% codeblock lang:java %}

public class HelloRunnable implements Runnable {

    public void run() {
        System.out.println("Hello Go!");
    }

    public static void main(String args[]) {
    	for(int i = 0; i < 10; i++){
	    	(new Thread(new HelloRunnable())).start();
    	}
    }
}

{% endcodeblock %}

While using go routine, the function will fork to run on different thread. Which won't block the main process and can be efficient on multicore.

Although there are other framework that can make threading easy too, but Go provide language level support and another useful feature: Channel

In Java, if we want to implement a multithread program, a big problem is how to passing data between Threads. One solution is using shared memory. For example:

{%codeblock lang:java %}
public class Counter{
	private int counter = 0;
	//synchronized access for multithreads
	public synchronized void increment() {
        counter++;
    }
    public int getCounter(){ 
    	return counter;
    }
    
    public static void main(){
    	final Counter counter = new Counter();
    	for (int i = 0; i < 2; i++){
    		new Thread(new Runnable() { 
        		public void run() { 
              		for(int i = 0; i < 100000000; i++)
                  		counter.increment();
        		} 
        	}).start();
    	}
    	
        try{
        	//wait for thread finish
        	Thread.sleep(10000);
        }catch (InterruptedException e){
        	System.out.println(e.getMessage());
        }
        System.out.println(counter.getCounter());
        // 200000000
    }
}
{%endcodeblock %}

In this example, There are 2 thread both increasing the counter, if without the synchronzed keyword, the counter will not be 200000000 in the end because when thread 1 and 2 accessing counter at same time, result will be overwritten by other thread and only increase by 1. The synronized keyword enable deadlock to prevent this happened. But even with lock protection, the communication between threads is still a problem that reduce performence and make the parallel computation harder. Therefore the Go language make a new approach: channel, to solve this problem:

{% codeblock lang:go %}

package main

import "fmt"

func counter(id int, channel chan int, closer bool) {
  for i := 0; i < 10000000; i++ {
    // send count data to channel
    fmt.Println("process", id," send", i)
    channel <- 1
  }
  if closer { close(channel ) }
}

func main() {
  channel := make(chan int)
  go counter(1, channel, false)
  go counter(2, channel, true)

  x := 0
  // receiving data from channel
  for i := range channel {
    fmt.Println("receiving")
    x += i
  }

  fmt.Println(x)
}

{% endcodeblock %}

This version of counter send the data through go channel.
There are 2 counter routine running in thread, invoke by go counter(channel, closer).
In the main process, the for loop wait to read the channel until it is closed.

What happened here is the cpu core will switch between threads, and main process can be run when there's data in channel, if not, switch to other threads. Until the channel is closed.

Example in 5 count:

	Thread 1 send 0
	Thread 2 send 0
	Thread 1 send 1
	receiving
	receiving
	Thread 2 send 1
	receiving
	Thread 1 send 2
	receiving
	Thread 2 send 2
	receiving
	Thread 1 send 3
	receiving
	Thread 2 send 3
	receiving
	Thread 1 send 4
	receiving
	Thread 2 send 4
	receiving
	receiving
	
Moreover, we can increase the channel buffer to optimize threads, for example:
	
	channel := make(chan int, 10)
	
Increase buffer to 10 will make the execute sequence different:

	Thread 1 send 0
	Thread 2 send 0
	Thread 1 send 1
	Thread 2 send 1
	receiving
	Thread 1 send 2
	Thread 2 send 2
	receiving
	Thread 1 send 3
	Thread 2 send 3
	receiving
	Thread 1 send 4
	Thread 2 send 4
	receiving
	receiving
	receiving
	receiving
	receiving
	receiving
	receiving

By the channel model, thread can easily wait and receive data but not exchange data by shared memory. Making parallel programming more easy and natural.

However, accessing channel is still a heavy job. If we tweak the counter program above to only send back the result:

	func counter(id int, channel chan int, closer bool) {
	  x := 0
  	  for i := 0; i < 10000000; i++ {
    	x++;
      }
      channel <- x
 	}
 	
The execution time can be pretty different:
 
 	//count to 200000000
 	//channel count:
 	real	0m32.650s
 	//result only:
 	real	0m0.359s
  
##Interface Oriented

In Go, there is no Class. Go take a lightweight approach that the data and function are seperate.
And we can attach function to data as receiver.
{% codeblock lang:go %}

//define datatype Name is string
type Name string

//define name.print() that type Name can receive function call "print()"
func (name Name) print() {
	fmt.Println(name)
}

func main() {
  name := Name("John")
  name.print() // John
}
{% endcodeblock %}

On the other hand, interface is the collection of methods. That describe the behavior of a type.
Go is using ducktype approach, as long as the type have all method defined in interface, it can be treat as the interface type:

{% codeblock lang:go %}

package main

import (
	"fmt"
)

//define interface Runner which can Run
type Runner interface{
	Run()
}

type Person string

//A person can Run => p.Run()
func (p Person) Run() {
	fmt.Println(p, "is running")
}

type Dog struct{
	Name string
	Type string
}

//A dog can Run => d.Run()
func (d Dog) Run() {
	fmt.Println("A" ,d.Type, "dog is running")
}

//A runner can start running
func Start(r Runner) {
	r.Run()
}

func main() {
	p := Person("John")
	Start(p) // "John is running"
	d := Dog{"Johnny","Husky"}
	Start(d) // "A Husky dog is running"
}

{% endcodeblock %}

##Map Reduce

Map Reduce is a programming model that distribute the calculation and collect the results.
The most famous example is Google. When Google build the index of web pages. Because the calculation is too big. They need to distribute the task to different server, and run as parallel as possible. The result is that they use the map reduce structure, each server received some amount of web page. Parse and count the words of that page, and the result index will be collected and added to the main index.

Here is the structure of Map Reduce by Go, from [Dan Bravender](http://dan.bravender.us/2009/11/24/MapReduce_for_Go.html) 

{% codeblock lang:go %}

package main

import (
  "fmt"
  "math/rand"
)

type Object interface {}

func MapReduce(input chan Object,
               mapper func(Object, chan Object),
               reducer func(chan Object) Object,
               pool_size int) Object {

    worker_outputs := make(chan chan Object, pool_size)
    go func() {
      //read input, assign input to mapper(item, output)
      for item := range input {
          worker_output := make(chan Object)
          worker_outputs <- worker_output
          go mapper(item, worker_output)
      }
      close(worker_outputs)
    }()

    reduce_input := make(chan Object)
    go func() {
      //listening worker_outputs as reduce_input
      for worker := range worker_outputs {
          reduce_input <- (<-worker)
      }
      close(reduce_input)
    }()

    return reducer(reduce_input)
}

{% endcodeblock %}

I use the type "Object" to reference an empty interface. Because the Go don't have generic type.

The first section send input to mapper, and receive worker_outputs as the collection of each worker's result channel. Afterward, second section of the code send worker_output to reducer. Reducer return the result of calculation.

For example, we can try to calculate PI by some amounts of random points. Assume there's a circle with radius 1. we get a random point on the square of 1. The PI will be the number of points in circle / total points. That the more points we collect, the more accurate the result will be.

For example, we can distribute the calculate of 2000 points to 2000 worker, and the PI will be equal to the result / total points

{% codeblock lang:go %}

func CalculatePI(n Object, c chan Object) {
  sum := 0
  for i := 0; i < n.(int); i++ {
    x := rand.Float64()
    y := rand.Float64()
    if (x * x + y * y ) <= 1.0 {
      sum += 1
    }
  }
  c <- sum
  close(c)
}

func CollectPI(in chan Object) Object {
  sum := 0
  for i := range in {
    sum += i.(int)
  }
  return sum
}

func main() {
  input := make(chan Object)
  go func(){
    for i := 0; i < 2000; i++ {
      input <- 2000
    }
    close(input)
  }()
  points_in_circle := MapReduce(input, CalculatePI, CollectPI, 10).(int)
  result := float64(points_in_circle) * 4 / (2000 * 2000)
  fmt.Println(result)
}
//output: 3.141711
//output on 20000 * 20000 points: 3.14156549

{% endcodeblock %}

##Unittest

Go provide a unittest package and a buildin command for testing:

	go test
	
Will execute all *_test.go files as test cases.

Let's write some test for the MapReduce mapper and reducer we have:

{% codeblock lang:go %}

package main

import (
  "testing"
)

func TestCalculatePI(t *testing.T ) {
  result := make(chan Object)
  go CalculatePI(2000, result)
  sum := <-result
  PI := float64(sum.(int)) * 4 / 2000
  if PI > 3.5 {
    t.Error("Calculation Error!!")
  }
}
func buildChannel(in chan Object, a int, b int) {
  for i := 0; i < b; i++ {
    in <- a
  }
  close(in)
}

func TestCollectPI(t *testing.T){
  result := make(chan Object)
  go buildChannel(result, 10, 10)
  sum := CollectPI(result).(int)
  if sum != 100 {
    t.Error("Calculation Error!!")
  }
}

{% endcodeblock %}

The go testing framework passing a pointer for test case. 
There is no extra syntax like assert to learn. Just use simple ==, != to check the results is correct or not. If Error happened, call testcase.Error for report error. Else the case will be mark as passed.

##Conclusion

Go is a very interesting language. On the first hand, it might be awkward because of it's syntax and no object oriented support. But once you know the simplicity and concurrency of Go. It would be a handy tool for the need fast calculation. However, we're still waiting for a more complete eco system for developer and successful usecase for Go language.
title: "Understand node stream (what I learned when fixing Aws sdk bug)"
date: 2013-12-08 21:34
tags: javascript
---

## Node.js stream

Node.js provides asynchronous I/O base on event loop.
When reading and writing from filesystem or sending http request,
Node.js can process other events when waiting for response, which we called it non-blocking I/O.
Stream is an extend of this concept, it provides an event base I/O interface to
save memory buffers and bandwidth.

<!-- more -->

## Event Based I/O

When reading from filesystem, node provides non-blocking method with callback:

{% codeblock lang:js %}
var require('fs');
fs.readFile('./test.json', function(err, err){
  if (err) {
    return console.log(err);
  }

  console.log('test file is loaded:\n', data);
});
{% endcodeblock %}

However, for large file we may want to do something before the file is completely
loaded to save memory buffer. This is where stream comes in:

{% codeblock lang:js %}
var fs = require('fs');
var stream = fs.createReadStream('./test.mp4');

stream.on('data', function(data) {
  console.log('loaded part of the file');
});

stream.on('end', fucntion() {
  console.log('all parts is loaded');
});

stream.on('error', function(err) {
  console.log('something is wrong :( ');
});
{% endcodeblock %}

Basically a read stream is an EventEmitter with 'data', 'end' and 'error' event.

'data' event return the part of file,  
'end' event is called when read finished.  
'error' event is called when error happened  

So we can write or process part of the file, but no need to wait until the whole file is loaded.
For example, when we request a file from internet:

{% codeblock lang:js %}
var fs = require('fs');
var request = require('request');

var stream = request('http://i.imgur.com/dmetFjf.jpg');
var writeStream = fs.createWriteStream('test.jpg')

stream.on('data', function(data) {
  writeStream.write(data)
});

stream.on('end', fucntion() {
  writeStream.end();
});

stream.on('error', function(err) {
  console.log('something is wrong :( ');
  writeStream.close();
});
{% endcodeblock %}

This will write the data to file when it receive part of the data.

## Pipe

Pipe is another concept that can let you redirect input to output.
The above download file code can be present with pipe:

{% codeblock lang:js %}
var fs = require('fs');
var request = require('request');

var stream = request('http://i.imgur.com/dmetFjf.jpg');
var writeStream = fs.createWriteStream('./testimg.jpg');

stream.pipe(writeStream);
{% endcodeblock %}

What pipe function do is, it connect the read and write events between streams,
and return another pipe. So we can even chaining multiple pipes together:

{% codeblock lang:js %}
var fs = require('fs');
var request = require('request');
var gzip = require('zlib').createGzip();

var stream = request('http://i.imgur.com/dmetFjf.jpg');
var writeStream = fs.createWriteStream('./testimg.jpg');

// write gzipped image file
stream.pipe(gzip).pipe(writeStream);

{% endcodeblock %}

## Stream2 (Readable and Writable stream)

One problem of the 'data' event based stream is the stream consumer can't control the timimg of read
and how much data to read each times.
When data event is triggered,
handler function need to store the data into buffer or write it to disk right away.
That becomes a problem when we have slow or limited write I/O.

Therefore, in node.js v0.10. It introduce the new stream interface, called stream2.

It provides 2 new stream classes:

### Readable Stream

Readable stream extend the old stream interface with new 'readable' event,
which let the consumer control the timing of read and how many bytes to read.

{% codeblock lang:js %}

// node.js >= v0.10
var fs = require('fs');
var stream = fs.createReadStream('./testimg.jpg');
var writeStream = fs.createWriteStream('./output.jpg');

stream.on('readable', function() {
  // stream is ready to read
  var data = stream.read();
  writeStream.write(data);
});

stream.on('end', function() {
  writeStream.end();
});

{% endcodeblock %}

So when readable event is triggered, the consumer control to call the `stream.read()` to read the data.
if the data is not read, readable event will be throwed back to eventloop and be triggered later.

The Readable stream is also backward competable, so when 'data' event is listened.
Stream will not use readable event but downgrade to old stream behavior.

### Writable Stream

Writable stream added new 'drain' event, which will be triggered when all data in buffer is written.
So we can control the timing to write when the buffer is empty.

{% codeblock lang:js %}
// node.js >= v0.10
var fs = require('fs');

var stream = fs.createReadStream('./input.mp4');
var writeStream = fs.createWriteStream('./output.mp4');

var writable = true;
var doRead = function() {
  var data = stream.read();
  // when writable return false, it means the buffer is full.
  writable = writeStream.write(data);
}

stream.on('readable', function() {
  if(writable) {
    doRead()
  } else {
    // wait for drain event if stream buffer is full
    writeStream.removeAllListeners('drain');
    writeStream.once('drain', doRead)
  }
});

stream.on('end', function() {
  writeStream.end();
});
{% endcodeblock %}

## AWS sdk bug (How to implement readable stream)

[issue link](https://github.com/aws/aws-sdk-js/pull/109)

So when I was using AWS sdk to download image from S3 with stream.
I found out it only download part of the image.

After dig into the source of [readable stream](https://github.com/isaacs/readable-stream).
I found out the mechanism of readable stream and what happened durning download.

For implementing Readable stream, we can overwrite the `_read` method of Readable stream.
As the spec said, the `_read` method should read the data from source and `push` the data into read buffer

In AWS js sdk:

{% codeblock lang:js %}
stream._read = function() {
  var data;
  while (data = httpStream.read()) {
    stream.push(data);
  }
};
{% endcodeblock %}

It looks fine. The `_read` function consume data from http stream and push back to stream.
However, in the source of readable stream,
It is actually implementented with a event pull method,
The stream will try to read the data first, if read got null value.
it put the read event back to eventloop, wait until it to be triggered again.
However, when the _read method is called, it set a reading flag to block 
further read event to avoid race condition.
And a `push` method call set the reading flag to false and unblock stream read.

Therefore when the httpStream.read() return null, the stream.push will not be called.
And block any following read events.

The solution is to remember to unblock the stream when reading:

{% codeblock lang:js %}
stream._read = function() {
  var data = httpStream.read();
  do {
    stream.push(data);
  } while(data = httpStream.read());
};

{% endcodeblock %}

## Further reading

+ [John Resig's stream playground](http://nodestreams.com/)
+ [Substack's stream handbook](https://github.com/substack/stream-handbook)
+ [Readable stream implementation](https://github.com/isaacs/readable-stream)
+ [Official announcement of stream2](http://blog.nodejs.org/2012/12/20/streams2/)

---
layout: post
title: "Understand node stream (what I learned when fixing Aws sdk bug)"
date: 2013-12-08 21:34
comments: true
categories: programming, javascript
---

## Node.js stream

Node.js provide asynchronous I/O based on it's event loop.  
When reading and writing with file system or http request,
Node.js can process other event when waiting for response, which we called Non-block I/O.
Stream is an extend of this concept, provide an event base I/O interface to
save the memory buffer, bandwidth and processor.

## Event Based I/O

When reading from filesystem, node provide non-blocking method with callback:

```
var require('fs');
fs.readFile('./test.json', function(data, err){
  if (err) {
    return console.log(err);
  }

  console.log('test file is loaded:\n', data);
});
```

However, for large file we may want to do something before the file is completely
loaded to save memory buffer. This is where stream comes in:

```

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
```

Basically a read stream is an EventEmitter with 'data', 'end' and 'error' event.

'data' event return the part of file,  
'end' event is called when read finished  
'error' event is called when error happened  

So we can write or process part of the file, but no need to wait until the whole file is loaded.
For example, when we request a file from internet:

```
var fs = require('fs');
var request = require('request');
var buffer = [];

var stream = request('http://i.imgur.com/dmetFjf.jpg');

stream.on('data', function(data) {
  buffer.push(data)
});

stream.on('end', fucntion() {
  fs.writeFile('./testimg.jpg', new Buffer(buffer), function() {
    console.log('file saved');
  });
});

stream.on('error', function(err) {
  console.log('something is wrong :( ');
});
```

This will store data to buffer and write out the result to file in the end.

## Pipe

Pipe is another concept that can let you direct stream input to output

```

var fs = require('fs');
var request = require('request');

var stream = request('http://i.imgur.com/dmetFjf.jpg');
var writeStream = fs.createWriteStream('./testimg.jpg');

stream.pipe(writeStream);

```

## Stream2 (Readable and Writable stream)

## AWS bug (How readable and writable stream works)

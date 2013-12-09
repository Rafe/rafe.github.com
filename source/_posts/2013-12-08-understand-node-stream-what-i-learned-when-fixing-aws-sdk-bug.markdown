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
```

This will write the data to file when receive the parts of data.

## Pipe

Pipe is another concept that can let you direct input to output
Above file download and writing code can be present as pipe:

```

var fs = require('fs');
var request = require('request');

var stream = request('http://i.imgur.com/dmetFjf.jpg');
var writeStream = fs.createWriteStream('./testimg.jpg');

stream.pipe(writeStream);

```

Which equal to the code above.
What pipe function do is, it automatically connect the read and write events between streams.

## Stream2 (Readable and Writable stream)

## AWS bug (How readable and writable stream works)

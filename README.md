# filewatcher

[![Build Status](https://travis-ci.org/fgnass/filewatcher.png?branch=master)](https://travis-ci.org/fgnass/filewatcher)

Simple wrapper around `fs.watch` that falls back to `fs.watchFile` when it runs
out of file handles.

This module is used by [node-dev](https://npmjs.org/package/node-dev)
and [instant](https://npmjs.org/package/instant).

### Usage

```js
var filewatcher = require('filewatcher')

// the default options
var opts = {
  interval: 1000,  // if we need to poll, do it every 1000ms
  persistent: true // don't end the process while files are watched
}

var watcher = filewatcher(opts)

// watch a file
watcher.add(file)

watcher.on('change', function(file, mtime) {
  console.log('File modified: %s', file)
  if (mtime == -1) console.log('deleted')
})

watcher.on('fallback', function(limit) {
  console.log('Ran out of file handles after watching %s files.', limit)
  console.log('Falling back to polling which uses more CPU.')
  console.log('Run ulimit -n 10000 to increase the limit for open files.')
})

watcher.remove(file)
watcher.removeAll()
```

### The MIT License (MIT)

Copyright (c) 2013 Felix Gnass

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


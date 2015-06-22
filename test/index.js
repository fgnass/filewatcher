var fs = require('fs')
var path = require('path')

var filewatcher = require('..')
var rimraf = require('rimraf')
var tap = require('tap')

var dir = path.join(__dirname, 'tmp')

function suite(polling) {

  var i = 0
  function createFile() {
    var n = path.join(dir, 'tmp00' + (i++))
    fs.writeFileSync(n, Date.now())
    return n
  }

  function createDir() {
    var d = path.join(dir, 'dir00' + (i++))
    var f = path.join(d, 'file')
    fs.mkdirSync(d)
    fs.writeFileSync(f, Date.now())
    return f
  }

  function touch(f) {
    setTimeout(function() { fs.writeFileSync(f, Date.now()) }, 1000)
  }

  function del(f) {
    setTimeout(function() { fs.unlinkSync(f) }, 1000)
  }

  var w // the watcher

  function test(name, conf, cb) {
    w = filewatcher({ forcePolling: polling })
    name += polling ? ' (fs.watchFile)' : ' (fs.watch)'
    return tap
      .test(name, conf, cb)
      .once('end', function() {
        w.removeAll()
        w.removeAllListeners()
      })
  }

  test('prep', function(t) {
    rimraf.sync(dir)
    fs.mkdirSync(dir)
    t.end()
  })

  test('change', function(t) {
    t.plan(3)
    w.on('change', function(file, stat) {
      t.equal(file, f)
      t.ok(stat.mtime > 0, 'mtime > 0')
    })
    w.on('error', function(err) { t.fail(err) })

    var f = createFile()
    w.add(f)

    t.equivalent(w.list(), [f])
    touch(f)
  })

  test('delete', function(t) {
    t.plan(2)
    var f = createFile()
    w.on('change', function(file, stat) {
      t.equal(file, f)
      t.ok(stat.deleted, 'stat.deleted')
    })
    w.add(f)
    del(f)
  })

  test('add to dir', function(t) {
    t.plan(2)
    w.once('change', function(file, stat) {
      t.equal(file, dir)
    })
    w.add(dir)
    t.equivalent(w.list(), [dir])
    setTimeout(createFile, 1000)
  })

  test('fire more than once', function(t) {
    t.plan(2)
    var f = createFile()
    w.on('change', function(file, stat) {
      t.equal(file, f)
      if (!stat.deleted) del(f)
    })
    w.add(f)
    touch(f)
  })

  test('remove listener', { timeout: 4000 }, function(t) {
    var f = createFile()
    w.on('change', function(file, stat) {
      t.equal(file, f)
      t.notOk(stat.deleted, 'not deleted')
      w.remove(file)
      del(f)
      setTimeout(function() { t.end() }, 1000)
    })
    w.add(f)
    touch(f)
  })

  if (!polling && process.platform != 'linux') {
    test('fallback', function(t) {
      var ulimit = parseInt(process.env.ULIMIT)
      if (!ulimit) {
        console.log('Set the ULIMIT env var to `ulimit -n` to test the fallback')
        return t.end()
      }
      if (ulimit > 4000) {
        console.log('reduce ulimit < 4000 to test the polling fallback')
        return t.end()
      }

      var files = new Array(ulimit).join().split(',').map(createDir)
      var last = files[files.length-1]

      w.on('fallback', function(limit) {
        t.ok(limit > 0, 'fallback')
        touch(last)
      })
      w.on('change', function(file) {
        t.equal(file, last)
        t.equivalent(w.list(), files)
      })
      w.on('error', function(err) {
        t.fail(err)
      })

      t.plan(3)
      files.forEach(w.add, w)
    })
  }
}

suite()
suite(true)

process.on('exit', function() {
  rimraf.sync(dir)
})

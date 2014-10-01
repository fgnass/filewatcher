/* global describe, it, before, after, afterEach */

var filewatcher = require('..')
  , fs = require('fs')
  , rimraf = require('rimraf')
  , should = require('should')
  , posix = require('posix')

var dir = __dirname + '/tmp'

function suite(opts) {

  var w = filewatcher(opts)

  before(function() {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir)
  })

  afterEach(function() {
    w.removeAllListeners('change')
    w.removeAll()
  })

  after(function() {
    rimraf.sync(dir)
  })

  it('should fire on write', function(done) {
    var f = createFile()
    w.on('change', function(file, mtime) {
      file.should.equal(f)
      mtime.should.be.above(0)
      done()
    })
    w.on('error', done)
    w.add(f)

    w.list().should.eql([f])
    touch(f)
  })

  it('should fire on delete', function(done) {
    var f = createFile()
    w.on('change', function(file, mtime) {
      file.should.equal(f)
       mtime.should.equal(-1)
       done()
    })
    w.add(f)
    del(f)
  })

  it('should fire more than once', function(done) {
    var f = createFile()
    w.on('change', function(file, mtime) {
      file.should.equal(f)
      if (mtime == -1) return done()
      touch(f)
    })
    w.add(f)
    del(f)
  })

  it('should fire when files are added', function(done) {
    w.once('change', function(file, mtime) {
      file.should.equal(dir)
      done()
    })
    w.add(dir)
    var f = createFile()
  })

  it('should not fire when removed', function(done) {
    this.timeout(4000)
    var f = createFile()
    w.on('change', function(file, mtime) {
      file.should.equal(f)
      if (mtime == -1) throw Error('must not be called')
      w.remove(file)
      del(f)
      setTimeout(done, 1000)
    })
    w.add(f)
    touch(f)
  })

  it('should fallback to polling', function(done) {
    if (w.polling) return done()
    this.timeout(4000)
    w.on('fallback', function(files) {
      done()
    })
    var ulimit = posix.getrlimit('nofile').soft
    ulimit.should.be.above(0)
    if (ulimit > 4000) return done()
    var files = new Array(ulimit).join().split(',').map(createFile)
    files.forEach(w.add, w)
  })

}

describe('fs.watch', function() {
  suite()
})

describe('fs.watchFile', function() {
  suite({ polling: true, interval: 200 })
})

var i = 0
function createFile() {
  var n = dir + '/tmp00' + (i++)
  fs.writeFileSync(n, Date.now())
  return n
}

function touch(f) {
  setTimeout(function() { fs.writeFileSync(f, Date.now()) }, 1000)
}

function del(f) {
  setTimeout(function() { fs.unlinkSync(f) }, 1000)
}

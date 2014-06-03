
var N = require('./util').N
var pull = require('pull-stream')
var cat = require('pull-cat')
var fork = require('../')
var interleave = require('interleavings')
var assert = require('assert')

function error (err) {
  return function (abort, cb) {
    cb(err)
  }
}

;interleave.test
(function h(async) {

  var n = 2
  var err = new Error('closes both streams')

  var aborted1, aborted2, ended, seen = []
  pull(
    pull.values([1,2,3,5,7]),
    async.through(),
    function (read) {
      return function (abort, cb) {
        read(abort, function (end, data) {
          if(data) seen.push(data)
          console.log('DATA', data)
          if(end) ended = end
          cb(end, data)
        })
      }
    },
    fork([
      pull(
        async.through(),
        function (read) {
          read(null, function (err, data) {
            console.log('abort1')
            read(true, function () {
              //abort should wait until all the streams have ended
              //before calling back.
              aborted1 = ended
              done()
            })
          })
        }),
      pull(
        async.through(),
        function (read) {
          read(null, function (err, data) {
            console.log('abort2')
            read(true, function () {
              //abort should wait until all the streams have ended
              //before calling back.
              aborted2 = ended
              done()
            })
          })
        })
      ],
      function (e) { return (e+1)%2 }
    )
  )

  function done(err, ary) {
    if(--n) return
    console.log('***********************88')
    console.log(aborted2, aborted1)
    //since each sink aborts after 1
    //item, we should have only read the first two items
    console.log(seen)
    assert.deepEqual(seen, [1, 2])
    assert.ok(ended)
    if(!aborted1 || !aborted2)
      throw new Error('test failed')

    async.done()
  }

})//(interleave(1))

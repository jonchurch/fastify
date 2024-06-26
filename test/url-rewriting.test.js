'use strict'

const t = require('tap')
const test = t.test
const Fastify = require('..')
const sget = require('simple-get').concat

test('Should rewrite url', t => {
  t.plan(5)
  const fastify = Fastify({
    rewriteUrl (req) {
      t.equal(req.url, '/this-would-404-without-url-rewrite')
      this.log.info('rewriting url')
      return '/'
    }
  })

  fastify.route({
    method: 'GET',
    url: '/',
    handler: (req, reply) => {
      reply.send({ hello: 'world' })
    }
  })

  fastify.listen({ port: 0 }, function (err) {
    t.error(err)

    sget({
      method: 'GET',
      url: 'http://localhost:' + fastify.server.address().port + '/this-would-404-without-url-rewrite'
    }, (err, response, body) => {
      t.error(err)
      t.same(JSON.parse(body), { hello: 'world' })
      t.equal(response.statusCode, 200)
    })
  })

  t.teardown(() => fastify.close())
})

test('Should not rewrite if the url is the same', t => {
  t.plan(4)
  const fastify = Fastify({
    rewriteUrl (req) {
      t.equal(req.url, '/this-would-404-without-url-rewrite')
      this.log.info('rewriting url')
      return req.url
    }
  })

  fastify.route({
    method: 'GET',
    url: '/',
    handler: (req, reply) => {
      reply.send({ hello: 'world' })
    }
  })

  fastify.listen({ port: 0 }, function (err) {
    t.error(err)

    sget({
      method: 'GET',
      url: 'http://localhost:' + fastify.server.address().port + '/this-would-404-without-url-rewrite'
    }, (err, response, body) => {
      t.error(err)
      t.equal(response.statusCode, 404)
    })
  })

  t.teardown(() => fastify.close())
})
test('Should throw an error', t => {
  t.plan(5)
  const fastify = Fastify({
    rewriteUrl (req) {
      t.equal(req.url, '/this-would-404-without-url-rewrite')
      this.log.info('rewriting url')
      return undefined
    }
  })

  fastify.route({
    method: 'GET',
    url: '/',
    handler: (req, reply) => {
      reply.send({ hello: 'world' })
    }
  })

  fastify.listen({ port: 0 }, function (err) {
    t.error(err)

    sget({
      method: 'GET',
      url: 'http://localhost:' + fastify.server.address().port + '/this-would-404-without-url-rewrite'
    }, (err, response, body) => {
      t.equal(err.code, 'ECONNRESET')
      t.equal(response, undefined)
      t.equal(body, undefined)
    })
  })

  t.teardown(() => fastify.close())
})

test('Should rewrite url but keep originalUrl unchanged', t => {
  t.plan(7)
  const fastify = Fastify({
    rewriteUrl (req) {
      t.equal(req.url, '/this-would-404-without-url-rewrite')
      t.equal(req.originalUrl, '/this-would-404-without-url-rewrite')
      return '/'
    }
  })

  fastify.route({
    method: 'GET',
    url: '/',
    handler: (req, reply) => {
      reply.send({ hello: 'world', hostname: req.hostname, port: req.port })
      t.equal(req.originalUrl, '/this-would-404-without-url-rewrite')
    }
  })

  fastify.listen({ port: 0 }, function (err) {
    t.error(err)

    sget({
      method: 'GET',
      url: 'http://localhost:' + fastify.server.address().port + '/this-would-404-without-url-rewrite'
    }, (err, response, body) => {
      t.error(err)
      const parsedBody = JSON.parse(body)
      t.same(parsedBody, { hello: 'world', hostname: 'localhost', port: fastify.server.address().port })
      t.equal(response.statusCode, 200)
    })
  })

  t.teardown(() => fastify.close())
})

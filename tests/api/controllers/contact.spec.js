var request = require('supertest')
var app = require('../../../app').app
var chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()

var dbUtils = require('../../db_utils')

describe('controllers', function () {
  beforeEach(() => dbUtils.clearDb())
  describe('contact', function () {
    it('should fail when not logged in and omitting sender', (done) => {
      request(app)
        .post('/api/contact')
        .send({message: 'foo', subject: 'bar'})
        .expect(400)
        .end((err, res) => {
          if (err) return done(err)
          res.body.should.deep.equal({message: 'Name is required'})
          done()
        })
    })
    it('should fail when not logged in and omitting sender 2', (done) => {
      request(app)
        .post('/api/contact')
        .send({message: 'foo', subject: 'bar', name: 'Bob'})
        .expect(400)
        .end((err, res) => {
          if (err) return done(err)
          res.body.should.deep.equal({message: 'E-mail is required'})
          done()
        })
    })
    it('should succeed', (done) => {
      request(app)
        .post('/api/contact')
        .send({message: 'foo', subject: 'bar', name: 'Bob', email: 'a@example.com'})
        .expect(204)
        .end((err) => done(err))
    })
  })
})

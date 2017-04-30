const request = require('supertest-as-promised')
const app = require('../../../../test_target/app').app
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.use(require('chai-things'))
chai.should()

const dbUtils = require('../../../db_utils')

describe('controllers', function () {
  this.timeout(10000)
  beforeEach(() => dbUtils.clearDb())
  describe('contact', () => {
    it('should fail when not logged in and omitting sender', () =>
      request(app)
        .post('/api/contact')
        .send({message: 'foo', subject: 'bar'})
        .expect(400)
        .then(res => res.body.should.deep.equal({message: 'Name is required'})))

    it('should fail when not logged in and omitting sender 2', () =>
      request(app)
        .post('/api/contact')
        .send({message: 'foo', subject: 'bar', name: 'Bob'})
        .expect(400)
        .then(res => res.body.should.deep.equal({message: 'E-mail is required'})))

    it('should succeed', () =>
      request(app)
        .post('/api/contact')
        .send({message: 'foo', subject: 'bar', name: 'Bob', email: 'a@example.com'})
        .expect(204))

    it('should when logged in and omitting sender', () =>
      dbUtils.populateTokens(1)
        .then(({user, token}) =>
          request(app)
            .post('/api/contact')
            .auth(user.model.id, token.secret)
            .send({message: 'foo', subject: 'bar'})
            .expect(204)))
  })
})

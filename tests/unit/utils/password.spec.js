/**
 * Created by budde on 06/05/16.
 */

const password = require('../../../utils').password

const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

const clearPassword = 'password1234'

describe('utils', () => {
  describe('password', () => {
    describe('hashPassword', () => {
      it('should hash', () => password.hashPassword(clearPassword, 1).should.eventually.not.be.undefined)
    })
    describe('comparePassword', () => {
      it('should match', () => password.hashPassword(clearPassword, 2)
        .then((hash) => password.comparePassword(clearPassword, hash)).should.eventually.be.true)
    })
    describe('generateToken', () => {
      it('should generate hex string', () => password.generateToken().should.eventually.match(/^[a-f0-9]{40}$/))
    })
  })
})

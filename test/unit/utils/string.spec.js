/**
 * Created by budde on 06/07/16.
 */
const {string} = require('../../../test_target/utils')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

describe('utils', () => {
  describe('string', () => {
    it('should match', () => {
      string.shortName('foo bar baz 123').should.equal('FBB123')
      string.shortName(' foo bar baz 123').should.equal('FBB123')
      string.shortName(' foo    bar baz 123').should.equal('FBB123')
      string.shortName(' foo    bar baz 1  23').should.equal('FBB123')
      string.shortName(' fOo    bar baz 1  23').should.equal('FBB123')
    })
  })
})

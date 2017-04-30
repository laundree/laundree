/**
 * Created by budde on 11/09/16.
 */

const array = require('../../../test_target/utils/array')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

describe('utils', () => {
  describe('array', () => {
    describe('range', () => {
      it('should generate array with single argument', () => {
        array.range(10).should.deep.equal([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      })
      it('should generate array with two arguments', () => {
        array.range(1, 4).should.deep.equal([1, 2, 3])
      })
    })
    describe('union', () => {
      it('should unite', () => {
        array.union([1, 2, 3], [4, 5, 6]).should.deep.equal([1, 2, 3, 4, 5, 6])
      })
      it('should overwrite', () => {
        array.union([1, 2, 3], [3, 4, 5]).should.deep.equal([1, 2, 3, 4, 5])
      })
    })
  })
})

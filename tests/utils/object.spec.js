/**
 * Created by budde on 11/09/16.
 */

const {assignImmutable} = require('../../utils/object')
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

describe('utils', () => {
  describe('object', () => {
    describe('assignImmutable', () => {
      it('should assign to new object', () => {
        const o = {'foo': 1}
        const o2 = assignImmutable(o, 'bar', 2)
        o.should.not.equal(o2)
      })
    })
  })
})

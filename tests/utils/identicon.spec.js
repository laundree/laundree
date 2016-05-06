/**
 * Created by budde on 07/05/16.
 */

var identicon = require('../../utils').identicon

var chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

describe('utils', () => {
  describe('identicon', () => {
    describe('generateIdenticonUrl', () => {
      it('should generate', () => identicon.generateIdenticonUrl('someId', 10).should.eventually.match(/^data:image\/png;base64,[a-zA-Z0-9\/+=]+$/))
      it('should generate same', () => Promise.all([identicon.generateIdenticonUrl('someId', 10), identicon.generateIdenticonUrl('someId', 10)]).then((results) => {
        var [r1, r2] = results
        r1.should.be.equal(r2)
      }))
      it('should generate different', () => Promise.all([identicon.generateIdenticonUrl('someId', 10), identicon.generateIdenticonUrl('otherId', 10)]).then((results) => {
        var [r1, r2] = results
        r1.should.not.be.equal(r2)
      }))
      it('should generate larger', () => Promise.all([identicon.generateIdenticonUrl('someId', 10), identicon.generateIdenticonUrl('someId', 11)]).then((results) => {
        var [r1, r2] = results
        r1.length.should.be.below(r2.length)
      }))
    })
  })
})

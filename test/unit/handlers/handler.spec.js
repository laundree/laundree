/**
 * Created by budde on 02/10/16.
 */

const chai = require('chai')
chai.should()
const {Handler} = require('../../../test_target/handlers/handler')

describe('handlers', () => {
  describe('Handler', () => {
    describe('updateDocument', () => {
      it('should do nothing with no actions', () => {
        const handler = new Handler({id: 1, docVersion: 0})
        return handler
          .updateDocument()
          .then(h2 => {
            h2.should.deep.equal(handler)
          })
      })
      it('should update document', () => {
        const handler = new Handler({id: 1, docVersion: 0})
        handler.updateActions = [
          (h) => {
            h.model.id = 2
            h.model.docVersion = 1
            return Promise.resolve(h)
          }
        ]
        return handler
          .updateDocument()
          .then(h2 => {
            h2.model.id.should.equal(2)
            h2.model.docVersion.should.equal(1)
          })
      })
    })
  })
})

// @flow

import assert from 'assert'
import { Handler } from '../../../test_target/handlers/handler'

describe('handlers', () => {
  describe('Handler', () => {
    describe('updateDocument', () => {
      it('should do nothing with no actions', async () => {
        // $FlowFixMe This is fine
        const handler = new Handler({id: 1, docVersion: 0})
        const h2 = await handler.updateDocument()
        assert.deepEqual(h2, handler)
      })
      it('should update document', async () => {
        // $FlowFixMe This is fine
        const handler = new Handler({id: 1, docVersion: 0})
        handler.updateActions = [
          (h) => {
            h.model.id = 2
            h.model.docVersion = 1
            return Promise.resolve(h)
          }
        ]
        const h2 = await handler.updateDocument()
        assert(h2.model.id === 2)
        assert(h2.model.docVersion === 1)
      })
    })
  })
})

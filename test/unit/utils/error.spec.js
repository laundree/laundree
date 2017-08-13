// @flow
import assert from 'assert'
import * as error from '../../../test_target/utils/error'
import sinon from 'sinon'

describe('utils', () => {
  describe('error', () => {
    describe('logError', () => {
      beforeEach(() => sinon.stub(console, 'error'))

      afterEach(() => console.error.restore())

      it('Succeed', () => {
        error.logError(new Error('Test error, please ignore'))
        assert(console.error.called)
      })
    })
  })
})

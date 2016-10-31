/**
 * Created by budde on 11/09/16.
 */

const error = require('../../../utils/error')
const chai = require('chai')
chai.use(require('sinon-chai'))
chai.should()
const sinon = require('sinon')

describe('utils', () => {
  describe('error', () => {
    describe('logError', () => {
      beforeEach(() => sinon.stub(console, 'error'))

      afterEach(() => console.error.restore())

      it('Succeed', () => {
        error.logError(new Error('Test error, please ignore'))
        console.error.should.be.called
      })
    })
  })
})

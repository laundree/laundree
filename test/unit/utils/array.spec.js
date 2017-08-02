// @flow

import * as array from '../../../test_target/utils/array'
import assert from 'assert'

describe('utils', () => {
  describe('array', () => {
    describe('range', () => {
      it('should generate array with single argument', () => {
        assert.deepEqual(array.range(10), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      })
      it('should generate array with two arguments', () => {
        assert.deepEqual(array.range(1, 4), [1, 2, 3])
      })
    })
    describe('union', () => {
      it('should unite', () => {
        assert.deepEqual(array.union([1, 2, 3], [4, 5, 6]), [1, 2, 3, 4, 5, 6])
      })
      it('should overwrite', () => {
        assert.deepEqual(array.union([1, 2, 3], [3, 4, 5]), [1, 2, 3, 4, 5])
      })
    })
  })
})

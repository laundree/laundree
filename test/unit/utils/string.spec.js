// @flow
import * as string from '../../../test_target/utils/string'
import assert from 'assert'

describe('utils', () => {
  describe('string', () => {
    it('should match', () => {
      assert(string.shortName('foo bar baz 123') === 'FBB123')
      assert(string.shortName(' foo bar baz 123') === 'FBB123')
      assert(string.shortName(' foo    bar baz 123') === 'FBB123')
      assert(string.shortName(' foo    bar baz 1  23') === 'FBB123')
      assert(string.shortName(' fOo    bar baz 1  23') === 'FBB123')
    })
  })
})

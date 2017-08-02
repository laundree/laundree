// @flow

import * as password from '../../../test_target/utils/password'
import assert from 'assert'

const clearPassword = 'password1234'

describe('utils', () => {
  describe('password', () => {
    describe('hashPassword', () => {
      it('should hash', async () => {
        assert(await password.hashPassword(clearPassword, 1))
      })
    })
    describe('comparePassword', () => {
      it('should match', async () => {
        const hash = await password.hashPassword(clearPassword, 2)
        assert(password.comparePassword(clearPassword, hash))
      })
    })
    describe('generateToken', () => {
      it('should generate hex string', async () => {
        assert((await password.generateToken()).match(/^[a-f0-9]{40}$/))
      })
    })
  })
})

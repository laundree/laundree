// @flow

import { clearDb } from '../../db_utils'
import UserModel from '../../../test_target/db/models/user'
import assert from 'assert'

describe('models', () => {
  describe('UserModel', function () {
    this.timeout(20000)
    let user
    beforeEach(async () => {
      await clearDb()
      user = await new UserModel({
        latestProvider: 'facebook',
        explicitVerifiedEmails: 'alice@example.com',
        profiles: [
          {
            provider: 'google',
            emails: [{value: 'bob1@a.dk'}, {value: 'bob3@a.dk'}],
            photos: [{value: 'photo1'}, {value: 'photo2'}]
          },
          {
            provider: 'facebook',
            emails: [{value: 'bob1@a.dk'}, {value: 'bob2@a.dk'}],
            photos: [{value: 'photo3'}, {value: 'photo4'}]
          }
        ]
      }).save()
    })
    describe('emails', () => {
      it('should merge emails', () => {
        assert.deepEqual(user.emails, ['bob1@a.dk', 'bob3@a.dk', 'bob2@a.dk'])
      })
    })
    describe('implicitVerifiedEmails', () => {
      it('should merge implicit verified emails', async () => {
        assert.deepEqual(user.implicitVerifiedEmails, ['bob1@a.dk', 'bob3@a.dk', 'bob2@a.dk'])
      })
    })
    describe('verifiedEmails', () => {
      it('should merge verified emails', async () => {
        assert.deepEqual(user.verifiedEmails, ['alice@example.com', 'bob1@a.dk', 'bob3@a.dk', 'bob2@a.dk'])
      })
    })
    describe('photo', () => {
      it('should find right photo', async () => {
        assert(user.photo === 'photo3')
      })
    })
  })
})

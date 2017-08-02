// @flow
import * as mail from '../../../test_target/utils/mail'
import assert from 'assert'

describe('utils', () => {
  describe('mail', () => {
    describe('sendEmail', () => {
      it('should render reset email correctly', async () => {
        const info = await mail
          .sendEmail({
            user: {id: 'someFancyUserId', displayName: 'Bob Bobbesen'},
            token: 'token123'
          }, 'password-reset', 'test@example.com', {})
        const message = info.toString()
        assert(message.match(/https:\/\/laundree\.io\/auth\/reset\?user=someFancyUserId&token=token123/))
        assert(message.match(/Bob Bobbesen/))
        assert(message.match(/someFancyUserId/))
      })
      it('should render verify email correctly', async () => {
        const info = await mail
          .sendEmail({
            user: {id: 'someFancyUserId', displayName: 'Bob Bobbesen'},
            email: 'bob@bobbesen.dk',
            token: 'token123'
          }, 'verify-email', 'test@example.com')
        const message = info.toString().replace(/(?:=\r\n|\r|\n)/g, '')
        assert(message.match(/bob/))
        assert(message.match(/Bob Bobbesen/))
        assert(message.match(/bob@bobbesen\.dk/))
        assert(message.match(/token123/))
        assert(message.match(/someFancyUserId/))
      })
      it('should render invite email correctly', async () => {
        const info = await mail
          .sendEmail({
            user: {
              id: 'bob',
              name: {firstName: 'Bob', lastName: 'Bobbesen', middleName: 'Sun'},
              displayName: 'Kurt Ravn'
            },
            laundry: {name: 'Bobs Laundry'}
          }, 'invite-user', 'test@example.com')
        const message = info.toString().replace(/(?:=\r\n|\r|\n)/g, '')
        assert(message.match(/Hi Kurt Ravn/g))
        assert(message.match(/join "Bobs Laundry"/g))
        assert(message.match(/join <b>Bobs Laundry<\/b>/g))
      })
    })
  })
})

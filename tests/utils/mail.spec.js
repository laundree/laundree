/**
 * Created by budde on 15/05/16.
 */

const mail = require('../../utils').mail
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

describe('utils', () => {
  describe('mail', () => {
    describe('sendEmail', () => {
      it('should render reset email correctly', () =>
        mail
          .sendEmail({
            user: {id: 'bob'},
            token: 'token123'
          }, 'password-reset', 'test@example.com')
          .then((info) => {
            var message = info.response.toString()
            message.should.match(/https:\/\/laundree\.io\/auth\/reset\?user=bob&token=token123/)
            message.should.match(/test@example\.com/)
          }))
      it('should render verify email correctly', () => mail
        .sendEmail({
          user: {id: 'bob'},
          email: 'bob@bobbesen.dk',
          token: 'token123'
        }, 'verify-email', 'test@example.com')
        .then((info) => {
          var message = info.response.toString()
          message.should.match(/bob/)
          message.should.match(/bob@bobbesen\.dk/)
          message.should.match(/token123/)
          message.should.match(/test@example\.com/)
        }))
      it('should render invite email correctly', () => mail
        .sendEmail({
          user: {
            id: 'bob',
            name: {firstName: 'Bob', lastName: 'Bobbesen', middleName: 'Sun'},
            displayName: 'Kurt Ravn'
          },
          laundry: {name: 'Bobs Laundry'}
        }, 'invite-user', 'test@example.com')
        .then((info) => {
          var message = info.response.toString()
          message.match(/Hi Kurt Ravn/g).should.have.length(2)
          message.match(/join "Bobs Laundry"/g).should.have.length(1)
          message.match(/join <b>Bobs Laundry<\/b>/g).should.have.length(1)
        }))
    })
  })
})

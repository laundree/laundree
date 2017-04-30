/**
 * Created by budde on 15/05/16.
 */

const mail = require('../../../test_target/utils').mail
const chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()
require('../../../test_target/app')
describe('utils', () => {
  describe('mail', () => {
    describe('sendEmail', () => {
      it('should render reset email correctly', () =>
        mail
          .sendEmail({
            user: {id: 'someFancyUserId', displayName: 'Bob Bobbesen'},
            token: 'token123'
          }, 'password-reset', 'test@example.com', {})
          .then((info) => {
            const message = info.response.toString()
            message.should.match(/https:\/\/laundree\.io\/auth\/reset\?user=someFancyUserId&token=token123/)
            message.should.match(/test@example\.com/)
            message.should.match(/Bob Bobbesen/)
            message.should.match(/someFancyUserId/)
            message.should.match(/logo body/)
          }))
      it('should render verify email correctly', () => mail
        .sendEmail({
          user: {id: 'someFancyUserId', displayName: 'Bob Bobbesen'},
          email: 'bob@bobbesen.dk',
          token: 'token123'
        }, 'verify-email', 'test@example.com')
        .then(info => {
          const message = info.response.toString().replace(/(?:=\r\n|\r|\n)/g, '')
          message.should.match(/bob/)
          message.should.match(/Bob Bobbesen/)
          message.should.match(/bob@bobbesen\.dk/)
          message.should.match(/token123/)
          message.should.match(/someFancyUserId/)
          message.should.match(/test@example\.com/)
          message.should.match(/logo body/)
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
          const message = info.response.toString().replace(/(?:=\r\n|\r|\n)/g, '')
          message.should.match(/Hi Kurt Ravn/g)
          message.should.match(/join "Bobs Laundry"/g)
          message.should.match(/join <b>Bobs Laundry<\/b>/g)
          message.should.match(/logo body/)
        }))
      it('should render invite email correctly wrt. locale', () => mail
        .sendEmail({
          user: {
            id: 'bob',
            name: {firstName: 'Bob', lastName: 'Bobbesen', middleName: 'Sun'},
            displayName: 'Kurt Ravn'
          },
          laundry: {name: 'Bobs Laundry'}
        }, 'invite-user', 'test@example.com', {locale: 'da'})
        .then((info) => {
          // TODO add this
          // const message = info.response.toString()
          // message.match(/Hej Kurt Ravn/g).should.have.length(2)
          // message.match(/tilmeld dig "Bobs Laundry"/g).should.have.length(1)
          // message.match(/tilmeld dig <b>Bobs Laundry<\/b>/g).should.have.length(1)
        }))
    })
  })
})

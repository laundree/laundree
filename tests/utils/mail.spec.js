/**
 * Created by budde on 15/05/16.
 */

var mail = require('../../utils').mail
var nodemailer = require('nodemailer')
var stubTransport = require('nodemailer-stub-transport')
var chai = require('chai')
chai.use(require('chai-as-promised'))
chai.should()

mail.transporter = nodemailer.createTransport(stubTransport())

describe('utils', () => {
  describe('mail', () => {
    describe('sendEmail', () => {
      it('should render reset email correctly', () => mail.sendEmail({
        user: {id: 'bob'},
        token: 'token123'
      }, 'password-reset', 'test@example.com').then((info) => {
        var message = info.response.toString()
        message.should.match(/https:\/\/laundree\.io\/auth\/reset\?user=bob&token=token123/)
        message.should.match(/test@example\.com/)
      }))
      it('should render verify email correctly', () => mail.sendEmail({
        user: {id: 'bob'},
        email: 'bob@bobbesen.dk',
        token: 'token123'
      }, 'verify-email', 'test@example.com').then((info) => {
        var message = info.response.toString()
        message.should.match(/bob/)
        message.should.match(/bob@bobbesen\.dk/)
        message.should.match(/token123/)
        message.should.match(/test@example\.com/)
      }))
    })
  })
})

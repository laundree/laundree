/**
 * Created by budde on 06/05/16.
 */

import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {clearDb} from '../../db_utils'
import UserModel from '../../../test_target/models/user'

chai.use(chaiAsPromised)
chai.should()

describe('models', () => {
  describe('UserModel', function () {
    this.timeout(20000)
    let user
    beforeEach(() => clearDb().then(() => new UserModel({
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
    }).save()).then((u) => {
      user = u
    }))
    describe('emails', () => {
      it('should merge emails', () => user.emails.should.deep.equal(['bob1@a.dk', 'bob3@a.dk', 'bob2@a.dk']))
    })
    describe('implicitVerifiedEmails', () => {
      it('should merge implicit verified emails', () => user.implicitVerifiedEmails.should.deep.equal(['bob1@a.dk', 'bob3@a.dk', 'bob2@a.dk']))
    })
    describe('verifiedEmails', () => {
      it('should merge verified emails', () => user.verifiedEmails.should.deep.equal(['alice@example.com', 'bob1@a.dk', 'bob3@a.dk', 'bob2@a.dk']))
    })
    describe('photo', () => {
      it('should find right photo', () => user.photo.should.equal('photo3'))
    })
  })
})

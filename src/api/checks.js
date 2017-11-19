// @flow
import LaundryHandler from '../handlers/laundry'
import UserHandler from '../handlers/user'
import { StatusError } from '../utils/error'

export async function checkLaundryCreate ({name, googlePlaceId}: { name: string, googlePlaceId: string }) {
  const timezone = await LaundryHandler
    .lib
    .timeZoneFromGooglePlaceId(googlePlaceId)
  if (!timezone) {
    throw new StatusError('Invalid place-id', 400)
  }
  const [l] = await LaundryHandler
    .lib
    .find({name: name.trim()})

  if (l) {
    throw new StatusError('Laundry already exists', 409, {Location: l.restUrl})
  }
  return {timezone}
}

export async function checkUserCreate ({email}: { email: string }) {
  const user = await UserHandler.lib.findFromEmail(email)
  if (user) {
    throw new StatusError('Email address already exists.', 409, {Location: user.restUrl})
  }
}

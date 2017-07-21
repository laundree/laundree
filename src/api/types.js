// @flow
import type { Request as Req, Response as Res, Application as App, Router as R } from 'express'
import type { DateTimeObject } from '../handlers/laundry'
import type { LocaleType } from '../locales'
import type { MachineType } from '../db/models/machine'
import type {Profile} from '../db/models/user'

type Param<T> = { value: T }

export type CreateBookingBody = { from: DateTimeObject, to: DateTimeObject }

export type UpdateBookingBody = { from?: DateTimeObject, to?: DateTimeObject }

export type ContactBody = { message: string, subject: string, name?: string, email?: string, locale?: LocaleType }

export type CreateLaundryBody = { name: string, googlePlaceId: string }

export type InviteUserByEmailBody = { email: string, locale?: LocaleType }

export type UpdateLaundryBody = {
  name?: string,
  googlePlaceId?: string,
  rules?: {
    limit?: number,
    dailyLimit?: number,
    timeLimit?: {
      from: { hour: number, minute: number },
      to: { hour: number, minute: number }
    }
  }
}

export type AddUserFromCodeBody = { key: string }

export type CreateMachineBody = { broken: boolean, type: MachineType, name: string }

export type UpdateMachineBody = { broken?: boolean, type?: MachineType, name?: string }

export type CreateTokenBody = { name: string }

export type CreateTokenFromEmailPasswordBody = { name: string, email: string, password: string }

export type StartPasswordResetBody = { locale?: LocaleType }

export type PasswordResetBody = { token: string, password: string }

export type StartEmailVerificationBody = { email: string, locale?: LocaleType }

export type VerifyEmailBody = { email: string, token: string }

export type UpdateUserBody = { name?: string }

export type ChangeUserPasswordBody = { currentPassword: string, newPassword: string }

export type AddOneSignalPlayerIdBody = { playerId: string }

export type ValidateCredentialsBody = {email: string, password: string}

export type Params = {
  page_size?: Param<number>,
  userId?: Param<string>,
  bookingId?: Param<string>,
  laundryId?: Param<string>,
  tokenId?: Param<string>,
  inviteId?: Param<string>,
  machineId?: Param<string>,
  since?: Param<string>,
  from?: Param<number>,
  to?: Param<number>,
  email?: Param<string>,
  displayName?: Param<string>,
  password?: Param<string>,
  createBookingBody?: Param<CreateBookingBody>,
  updateBookingBody?: Param<UpdateBookingBody>,
  contactBody?: Param<ContactBody>,
  createLaundryBody?: Param<CreateLaundryBody>,
  updateLaundryBody?: Param<UpdateLaundryBody>,
  inviteUserByEmailBody?: Param<InviteUserByEmailBody>,
  addUserFromCodeBody?: Param<AddUserFromCodeBody>,
  createMachineBody?: Param<CreateMachineBody>,
  updateMachineBody?: Param<UpdateMachineBody>,
  createTokenBody?: Param<CreateTokenBody>,
  createTokenFromEmailPasswordBody?: Param<CreateTokenFromEmailPasswordBody>,
  startPasswordResetBody?: Param<StartPasswordResetBody>,
  passwordResetBody?: Param<PasswordResetBody>,
  startEmailVerificationBody?: Param<StartEmailVerificationBody>,
  verifyEmailBody?: Param<VerifyEmailBody>,
  updateUserBody?: Param<UpdateUserBody>,
  changeUserPasswordBody?: Param<ChangeUserPasswordBody>,
  addOneSignalPlayerIdBody?: Param<AddOneSignalPlayerIdBody>,
  validateCredentialsBody?: Param<ValidateCredentialsBody>,
  createUserFromProfileBody?: Param<Profile>
}

export type ParsedParams = {
  page_size?: number,
  userId?: string,
  bookingId?: string,
  laundryId?: string,
  tokenId?: string,
  inviteId?: string,
  machineId?: string,
  since?: string,
  from?: number,
  to?: number,
  email?: string,
  displayName?: string,
  password?: string,
  createBookingBody?: CreateBookingBody,
  updateBookingBody?: UpdateBookingBody,
  contactBody?: ContactBody,
  createLaundryBody?: CreateLaundryBody,
  updateLaundryBody?: UpdateLaundryBody,
  inviteUserByEmailBody?: InviteUserByEmailBody,
  addUserFromCodeBody?: AddUserFromCodeBody,
  createMachineBody?: CreateMachineBody,
  updateMachineBody?: UpdateMachineBody,
  createTokenBody?: CreateTokenBody,
  createTokenFromEmailPasswordBody?: CreateTokenFromEmailPasswordBody,
  startPasswordResetBody?: StartPasswordResetBody,
  passwordResetBody?: PasswordResetBody,
  startEmailVerificationBody?: StartEmailVerificationBody,
  verifyEmailBody?: VerifyEmailBody,
  updateUserBody?: UpdateUserBody,
  changeUserPasswordBody?: ChangeUserPasswordBody,
  addOneSignalPlayerIdBody?: AddOneSignalPlayerIdBody,
  validateCredentialsBody?: ValidateCredentialsBody,
  createUserFromProfileBody?: Profile
}

type CustomRequestAddendum = {
  jwt?: {
    userId?: string
  },
  swagger: {
    apiPath: string,
    params: Params
  }
}

type CustomResponseAddendum = {
  renderHb: (file: string, options: Object) => void
}

export type Request = Req<CustomRequestAddendum, CustomResponseAddendum> & CustomRequestAddendum

export type Response = Res<CustomRequestAddendum, CustomResponseAddendum> & CustomResponseAddendum

export type Application = App<CustomRequestAddendum, CustomResponseAddendum>

export type Router = R<CustomRequestAddendum, CustomResponseAddendum>

export function parseParams (p: Params): ParsedParams {
  // $FlowFixMe this is right...
  return Object.keys(p).reduce((acc, key) => ({...acc, [key]: p[key].value}), {})
}

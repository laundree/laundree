// @flow
import type { Request as Req, Response as Res, Application as App, Router as R } from 'express'
import type {
  CreateUserBody,
  CreateBookingBody,
  UpdateBookingBody,
  ContactBody,
  CreateLaundryBody,
  UpdateLaundryBody,
  InviteUserByEmailBody,
  AddUserFromCodeBody,
  CreateMachineBody,
  UpdateMachineBody,
  CreateTokenBody,
  CreateTokenFromEmailPasswordBody,
  StartPasswordResetBody,
  PasswordResetBody,
  StartEmailVerificationBody,
  VerifyEmailBody,
  UpdateUserBody,
  ChangeUserPasswordBody,
  AddOneSignalPlayerIdBody,
  ValidateCredentialsBody,
  CreateUserFromProfileBody,
  VerifyInviteCodeBody
} from 'laundree-sdk/lib/sdk'

type Param<T> = { value: T }

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
  createUserBody?: Param<CreateUserBody>,
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
  createUserFromProfileBody?: Param<CreateUserFromProfileBody>,
  verifyInviteCodeBody?: Param<VerifyInviteCodeBody>
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
  createUserFromProfileBody?: CreateUserFromProfileBody,
  createUserBody?: CreateUserBody,
  verifyInviteCodeBody?: VerifyInviteCodeBody
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

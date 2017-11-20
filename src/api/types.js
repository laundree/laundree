// @flow
import type { Request as Req, Response as Res, Application as App, Router as R } from 'express'
import type {
  CreateUserBody,
  CreateBookingBody,
  UpdateBookingBody,
  ContactBody,
  ContactSupportBody,
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
  CreateUserWithLaundryBody,
  VerifyInviteCodeBody,
  VerifyTokenBody
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
  contactSupportBody?: Param<ContactSupportBody>,
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
  createUserWithLaundryBody?: Param<CreateUserWithLaundryBody>,
  createUserFromProfileBody?: Param<CreateUserFromProfileBody>,
  verifyInviteCodeBody?: Param<VerifyInviteCodeBody>,
  verifyTokenBody?: Param<VerifyTokenBody>
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
  contactSupportBody?: ContactSupportBody,
  createLaundryBody?: CreateLaundryBody,
  updateLaundryBody?: UpdateLaundryBody,
  inviteUserByEmailBody?: InviteUserByEmailBody,
  addUserFromCodeBody?: AddUserFromCodeBody,
  createMachineBody?: CreateMachineBody,
  updateMachineBody?: UpdateMachineBody,
  createTokenBody?: CreateTokenBody,
  verifyTokenBody?: VerifyTokenBody,
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
  createUserWithLaundryBody?: CreateUserWithLaundryBody,
  verifyInviteCodeBody?: VerifyInviteCodeBody
}

type ApiRequestAddendum = {
  userId?: string,
  subject?: 'app' | 'user',
  swagger: {
    apiPath: string,
    params: Params
  }
}

type ApiResponseAddendum = {}

export type Request = Req<ApiRequestAddendum, ApiResponseAddendum> & ApiRequestAddendum

export type Response = Res<ApiRequestAddendum, ApiResponseAddendum> & ApiResponseAddendum

export type ApiApp = App<ApiRequestAddendum, ApiResponseAddendum>

export type Router = R<ApiRequestAddendum, ApiResponseAddendum>

export function parseParams (p: Params): ParsedParams {
  // $FlowFixMe this is right...
  return Object.keys(p).reduce((acc, key) => ({...acc, [key]: p[key].value}), {})
}

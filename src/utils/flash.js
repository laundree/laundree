// @flow

export const USER_NOT_VERIFIED = 'auth.error.not-verified'
export const INVALID_EMAIL_PASSWORD_COMBINATION = 'auth.error.invalid-email-password-combination'
export const INVALID_VERIFICATION_LINK = 'auth.error.invalid-verification-link'
export const EMAIL_VERIFIED = 'auth.success.email-verified'

export type FlashType = 'auth.error.not-verified'
  | 'auth.error.user-not-found'
  | 'auth.error.invalid-email-password-combination'
  | 'auth.error.user-does-not-exists'
  | 'auth.error.invalid-verification-link'
  | 'auth.success.email-verified'

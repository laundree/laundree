// @flow

export const nonEmpty = /./
export const email = /.+@.+\.(.+){2,}/
export const password = /([a-z].{5,}|.[a-z].{4,}|.{2,}[a-z].{3,}|.{3,}[a-z].{2,}|.{4,}[a-z].|.{5,}[a-z])/i
export const mongoDbId = /^(.{12}|[a-f0-9]{24})$/

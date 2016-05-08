/**
 * Created by budde on 22/04/16.
 */

module.exports = {
  nonEmpty: /./,
  email: /.+@.+\.(.+){2,}/,
  password: /([a-z].{5,}|.[a-z].{4,}|.{2,}[a-z].{3,}|.{3,}[a-z].{2,}|.{4,}[a-z].|.{5,}[a-z])/i
}

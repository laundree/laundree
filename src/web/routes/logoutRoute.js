// @flow
import type { Response, Request } from '../types'

export default (req: Request, res: Response) => {
  req.logout()
  req.session.token = undefined
  res.redirect('/')
}

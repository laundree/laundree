import type {Document as Doc} from 'mongoose'

export class Document extends Doc {
  docVersion: ?number
}

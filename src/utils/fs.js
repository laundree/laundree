// @flow
import fs from 'fs'

export function readFile (path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, {encoding: 'utf8'}, (err, data: string) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

export function readdir (path: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(path, (err, data) => {
      if (err) reject(err)
      else resolve(data)
    })
  })
}

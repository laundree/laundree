// @flow
import express from 'express'
import type { Request, Response } from '../types'
import config from 'config'
import sm from 'sitemap'
import { supported } from '../../locales'

const router = express.Router()
const hostname = `${config.get('web.protocol')}://${config.get('web.host')}`
router.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain')
  res.send(`User-agent: *\nAllow: /\nSitemap: ${hostname}/sitemap.xml`)
})

const urlTemplates = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1
  },
  {
    url: '/auth',
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    url: '/auth/forgot',
    changefreq: 'weekly',
    priority: 0.3
  },
  {
    url: '/auth/sign-up',
    changefreq: 'weekly',
    priority: 0.7
  }
]

const urls = urlTemplates
  .reduce((acc, t) => acc.concat(supported.map(lang => (
    {
      ...t,
      url: `/${lang}${t.url}`,
      links: supported.map(lang => ({
        lang,
        url: `${hostname}/${lang}${t.url}`
      }))
    }
  ))), [])
const sitemap = sm.createSitemap({
  hostname,
  urls
})

const sitemapXml = new Promise((resolve, reject) => {
  sitemap.toXML((err, xml) => {
    if (err) {
      return reject(err)
    }
    resolve(xml)
  })
})

router.get('/sitemap.xml', async (req: Request, res: Response, next) => {
  try {
    const xml = await sitemapXml
    res.header('Content-Type', 'application/xml')
    res.send(xml)
  } catch (err) {
    next(err)
  }
})

export default router

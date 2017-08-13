// @flow
import type { LocaleType } from '../locales'
import qr from 'qr-image'
import {locales} from '../locales'
import PdfDocument from 'pdfkit'
import path from 'path'

export async function createInvitePdf (laundryId: string, code: string, locale: LocaleType) {
  const doc = new PdfDocument({size: [2 * 240, 2 * 320]})
  const link = `https://laundree.io/s/${laundryId}/${code}`
  const logoWidth = 150
  const logoX = (doc.page.width - logoWidth) / 2
  doc
    .image(path.join(__dirname, '..', '..', 'public', 'images', 'logo.png'), logoX, 40, {width: logoWidth})
    .fontSize(13)
    .moveDown(6)
    .text(locales[locale]['pdf.invite.text.1'], {align: 'justify'})
    .moveDown()
    .text(locales[locale]['pdf.invite.text.2'])
  const svgOrigWith = 87.8
  const newWidth = 175
  const translateX = (doc.page.width - newWidth) / 2
  const qrImage = qr.svgObject(link)
  doc
    .save()
    .translate(translateX, 250)
    .scale(newWidth / svgOrigWith)
    .path('M0,20.3v83.8h87.8V20.3H0z M76.9,92.9c0,0.9-0.7,1.6-1.6,1.6H12.5c-0.9,0-1.6-0.7-1.6-1.6 V31.6c0-0.9,0.7-1.6,1.6-1.6h62.7c0.9,0,1.6,0.7,1.6,1.6V92.9z')
    .path('M82,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C80.9,12.7,82,13.8,82,15.2L82,15.2z M82,15.2')
    .path('M82,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C80.9,12.7,82,13.8,82,15.2L82,15.2z M82,15.2')
    .path('M73.8,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C72.7,12.7,73.8,13.8,73.8,15.2L73.8,15.2z M73.8,15.2')
    .path('M10.9,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C9.7,12.7,10.9,13.8,10.9,15.2L10.9,15.2z M10.9,15.2')
    .rect(0, 0, 87.8, 9)
    .fill('#4388a3')
    .translate(12, 30.5)
    .scale(64 / qrImage.size)
    .path(qrImage.path)
    .fill('#4388a3')
    .restore()
    .moveDown(18)
    .text(locales[locale]['pdf.invite.text.3'])
    .end()
  return doc
}


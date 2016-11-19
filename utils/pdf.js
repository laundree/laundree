const PdfDocument = require('pdfkit')
const qr = require('qr-image')

function createInvitePdf (laundryId, id) {
  const doc = new PdfDocument({size: [2 * 240, 2 * 320]})
  const link = `https://laundree.io/s/${laundryId}/${id}`
  doc
    .font('Helvetica', 24)
    .text('Laundree.io', {align: 'center'})
    .fontSize(13)
    .moveDown(2)
    .text('You can book these machines at laundree.io. Just scan the QR code below and follow the guide online.', {align: 'justify'})
    .moveDown()
    .text('Simple as that!')
  const svgOrigWith = 87.8
  const newWidth = 175
  const translateX = (doc.page.width - newWidth) / 2
  const qrImage = qr.svgObject(link)
  doc
    .save()
    .translate(translateX, 280)
    .scale(newWidth / svgOrigWith)
    .path('M0,20.3v83.8h87.8V20.3H0z M76.9,92.9c0,0.9-0.7,1.6-1.6,1.6H12.5c-0.9,0-1.6-0.7-1.6-1.6 V31.6c0-0.9,0.7-1.6,1.6-1.6h62.7c0.9,0,1.6,0.7,1.6,1.6V92.9z')
    .path('M82,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C80.9,12.7,82,13.8,82,15.2L82,15.2z M82,15.2')
    .path('M82,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C80.9,12.7,82,13.8,82,15.2L82,15.2z M82,15.2')
    .path('M73.8,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C72.7,12.7,73.8,13.8,73.8,15.2L73.8,15.2z M73.8,15.2')
    .path('M10.9,15.2c0,1.4-1.1,2.6-2.6,2.6c-1.4,0-2.6-1.1-2.6-2.6c0-1.4,1.1-2.6,2.6-2.6 C9.7,12.7,10.9,13.8,10.9,15.2L10.9,15.2z M10.9,15.2')
    .rect(0, 0, 87.8, 9)
    .fill('#E55564')
    .translate(12, 30.5)
    .scale(64 / qrImage.size)
    .path(qrImage.path)
    .fill('#E55564')
    .restore()
    .end()

  return doc
}

module.exports = {createInvitePdf}

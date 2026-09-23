import { renderSVG } from 'uqr'
import { createTwqrString, qrImageFilename, type Account } from '~~/engine/twqr'

/** QR 標準建議四格 quiet zone，印出嚟都掃得到。 */
const QUIET_ZONE_MODULES = 4
const PNG_SIZE_PX = 1024

export const renderTwqrSvg = (account: Account, amount: string) =>
  renderSVG(createTwqrString(account.bankCode, account.accountNumber, amount), { border: QUIET_ZONE_MODULES })

/** SVG 要有明確寬高，Firefox 先肯畫落 canvas，Safari 先唔會糊。 */
export const downloadTwqrPng = async (account: Account, amount: string) => {
  const sizedSvg = renderTwqrSvg(account, amount).replace('<svg ', `<svg width="${PNG_SIZE_PX}" height="${PNG_SIZE_PX}" `)
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sizedSvg)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = PNG_SIZE_PX
  canvas.height = PNG_SIZE_PX
  canvas.getContext('2d')!.drawImage(image, 0, 0)

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = qrImageFilename(account, amount)
  link.click()
}

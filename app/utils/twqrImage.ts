import { renderSVG } from 'uqr'
import { createTwqrString, qrImageFilename, type Account } from '~~/engine/twqr'

/** QR 標準建議四格 quiet zone，印出嚟都掃得到。 */
const QUIET_ZONE_MODULES = 4
const PNG_SIZE_PX = 1024
const PNG_TYPE = 'image/png'
/** 用戶自己閂咗分享面板，唔算出錯。 */
const SHARE_CANCELLED = 'AbortError'

export const renderTwqrSvg = (account: Account, amount: string) =>
  renderSVG(createTwqrString(account.bankCode, account.accountNumber, amount), { border: QUIET_ZONE_MODULES })

/** SVG 要有明確寬高，Firefox 先肯畫落 canvas，Safari 先唔會糊。 */
export const renderTwqrPng = async (account: Account, amount: string) => {
  const sizedSvg = renderTwqrSvg(account, amount).replace('<svg ', `<svg width="${PNG_SIZE_PX}" height="${PNG_SIZE_PX}" `)
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sizedSvg)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = PNG_SIZE_PX
  canvas.height = PNG_SIZE_PX
  canvas.getContext('2d')!.drawImage(image, 0, 0)
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, PNG_TYPE))
  return new File([blob!], qrImageFilename(account, amount), { type: PNG_TYPE })
}

export const downloadFile = (file: File) => {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(file)
  link.download = file.name
  link.click()
  URL.revokeObjectURL(link.href)
}

export const canShareFile = (file: File) => 'canShare' in navigator && navigator.canShare({ files: [file] })

/** 一定要喺撳掣嗰下同步呼叫，前面唔可以 await，否則 Safari 會當冇 user gesture 拒絕。 */
export const shareFile = (file: File, text: string) =>
  navigator.share({ files: [file], text }).catch((error: DOMException) => {
    if (error.name === SHARE_CANCELLED) return
    throw error
  })

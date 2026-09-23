import banks from './banks.json'

export interface Bank {
  code: string
  name: string
  shortName: string
}

export interface Account {
  id: string
  nickname: string
  bankCode: string
  accountNumber: string
}

/** 財金公司 TWQR 個人轉帳格式，照 payme 嘅 builder（D5 行庫、D6 帳號、D1 金額、D10 幣別）。 */
const TWQR_BASE_PATH = 'TWQRP://個人轉帳/158/02/V1'
const ACCOUNT_NUMBER_FIELD_LENGTH = 16
const NEW_TAIWAN_DOLLAR = '901'
const CENTS_PER_DOLLAR = 100

const BANK_CODE_PATTERN = /^\d{3}$/
const ACCOUNT_NUMBER_PATTERN = /^\d{10,16}$/
const MAX_AMOUNT_DIGITS = 6
const NON_DIGITS = /\D/g
const LEADING_ZEROS = /^0+(?=\d)/
const ZERO_AMOUNT = '0'
const VISIBLE_DIGITS = 4
const LATIN_OR_DIGIT = /[A-Za-z0-9]/

export const BANKS: Bank[] = banks

export const findBank = (code: string): Bank | undefined => BANKS.find(bank => bank.code === code)

export const isValidBankCode = (code: string) => BANK_CODE_PATTERN.test(code)

export const isValidAccountNumber = (accountNumber: string) => ACCOUNT_NUMBER_PATTERN.test(accountNumber)

export const isAccountComplete = (account: Account) =>
  isValidBankCode(account.bankCode) && isValidAccountNumber(account.accountNumber)

/** 金額只留數字、去前導零、最多 6 位（上限 999,999），貼上「1,000」都得。 */
export const normalizeAmountInput = (text: string) =>
  text.replace(NON_DIGITS, '').replace(LEADING_ZEROS, '').slice(0, MAX_AMOUNT_DIGITS)

/** 金額選填；經 normalizeAmountInput 之後唯一唔合格嘅係 0。 */
export const isValidAmount = (amount: string) => amount !== ZERO_AMOUNT

export const formatAmount = (amount: string) => `NT$ ${Number(amount).toLocaleString('zh-TW')}`

/** QR 內容係成條 URI 再 encodeURIComponent，銀行 App 認呢個格式。D1 單位係分。 */
export const createTwqrString = (bankCode: string, accountNumber: string, amount = '') => {
  const fields = [`D5=${bankCode}`, `D6=${accountNumber.padStart(ACCOUNT_NUMBER_FIELD_LENGTH, '0')}`]
  if (amount) fields.push(`D1=${Number(amount) * CENTS_PER_DOLLAR}`)
  fields.push(`D10=${NEW_TAIWAN_DOLLAR}`)
  return encodeURIComponent(`${TWQR_BASE_PATH}?${fields.join('&')}`)
}

const lastDigits = (accountNumber: string) => accountNumber.slice(-VISIBLE_DIGITS)

/** 有暱稱就淨係暱稱，冇就「簡稱 ****1234」。 */
export const accountLabel = (account: Account) => {
  if (account.nickname) return account.nickname
  const bankName = findBank(account.bankCode)?.shortName ?? account.bankCode
  const maskedNumber = account.accountNumber && `****${lastDigits(account.accountNumber)}`
  return [bankName, maskedNumber].filter(Boolean).join(' ') || '未填寫'
}

export const qrImageFilename = (account: Account, amount = '') => {
  const parts = ['twqr', account.nickname || account.bankCode, lastDigits(account.accountNumber), amount]
  return `${parts.filter(Boolean).join('-')}.png`
}

/** 中文同英文、數字之間加空格（中文文案排版指北），例如「我的 iPassMoney 帳戶」。 */
const joinWithSpacing = (...parts: string[]) =>
  parts.filter(Boolean).reduce((text, part) =>
    LATIN_OR_DIGIT.test(text.at(-1)!) === LATIN_OR_DIGIT.test(part[0]!) ? `${text}${part}` : `${text} ${part}`)

/** 分享畀付款人嘅文字，唔包暱稱（暱稱係自己用嘅標籤）。清單有電子支付機構，所以寫「帳戶」同「機構代碼」。 */
export const shareText = (account: Account, amount = '') => {
  const total = amount ? `總共是 ${formatAmount(amount)}，` : ''
  const destination = joinWithSpacing('我的', findBank(account.bankCode)?.shortName ?? '', '帳戶')
  return `嗨，${total}您可以轉帳至${destination}（機構代碼 ${account.bankCode}），帳號 ${account.accountNumber}，也可以直接掃描附圖的 QR Code 付款，感謝。`
}

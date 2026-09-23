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

/** 財金公司 TWQR 個人轉帳格式，照 payme 嘅 builder（D5 行庫、D6 帳號、D10 幣別）。 */
const TWQR_BASE_PATH = 'TWQRP://個人轉帳/158/02/V1'
const ACCOUNT_NUMBER_FIELD_LENGTH = 16
const NEW_TAIWAN_DOLLAR = '901'

const BANK_CODE_PATTERN = /^\d{3}$/
const ACCOUNT_NUMBER_PATTERN = /^\d{10,16}$/
const VISIBLE_DIGITS = 4

export const BANKS: Bank[] = banks

export const findBank = (code: string): Bank | undefined => BANKS.find(bank => bank.code === code)

export const isValidBankCode = (code: string) => BANK_CODE_PATTERN.test(code)

export const isValidAccountNumber = (accountNumber: string) => ACCOUNT_NUMBER_PATTERN.test(accountNumber)

export const isAccountComplete = (account: Account) =>
  isValidBankCode(account.bankCode) && isValidAccountNumber(account.accountNumber)

/** QR 內容係成條 URI 再 encodeURIComponent，銀行 App 認呢個格式。 */
export const createTwqrString = (bankCode: string, accountNumber: string) => {
  const paddedAccountNumber = accountNumber.padStart(ACCOUNT_NUMBER_FIELD_LENGTH, '0')
  return encodeURIComponent(`${TWQR_BASE_PATH}?D5=${bankCode}&D6=${paddedAccountNumber}&D10=${NEW_TAIWAN_DOLLAR}`)
}

const lastDigits = (accountNumber: string) => accountNumber.slice(-VISIBLE_DIGITS)

/** 「暱稱（簡稱 ****1234）」，冇暱稱就淨係括號入面嗰段。 */
export const accountLabel = (account: Account) => {
  const bankName = findBank(account.bankCode)?.shortName ?? account.bankCode
  const maskedNumber = account.accountNumber && `****${lastDigits(account.accountNumber)}`
  const detail = [bankName, maskedNumber].filter(Boolean).join(' ') || '未填寫'
  if (!account.nickname) return detail
  return `${account.nickname}（${detail}）`
}

export const qrImageFilename = (account: Account) =>
  `twqr-${account.nickname || account.bankCode}-${lastDigits(account.accountNumber)}.png`

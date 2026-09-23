import { describe, expect, test } from 'bun:test'
import {
  accountLabel,
  createTwqrString,
  findBank,
  formatAmount,
  isAccountComplete,
  isValidAmount,
  normalizeAmountInput,
  qrImageFilename,
  type Account,
} from './twqr'

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 'a',
  nickname: '',
  bankCode: '822',
  accountNumber: '1234567890',
  ...overrides,
})

describe('createTwqrString', () => {
  test('pads the account number to 16 digits and encodes the whole URI', () => {
    expect(createTwqrString('822', '1234567890')).toBe(
      encodeURIComponent('TWQRP://個人轉帳/158/02/V1?D5=822&D6=0000001234567890&D10=901'),
    )
  })

  test('a 16-digit account number is left as is', () => {
    expect(decodeURIComponent(createTwqrString('013', '1234567890123456'))).toContain('D6=1234567890123456&')
  })

  test('an amount goes into D1 in cents, between D6 and D10', () => {
    expect(decodeURIComponent(createTwqrString('822', '1234567890', '500'))).toBe(
      'TWQRP://個人轉帳/158/02/V1?D5=822&D6=0000001234567890&D1=50000&D10=901',
    )
  })
})

describe('isAccountComplete', () => {
  test('needs a 3-digit bank code and a 10 to 16 digit account number', () => {
    expect(isAccountComplete(account())).toBe(true)
    expect(isAccountComplete(account({ bankCode: '82' }))).toBe(false)
    expect(isAccountComplete(account({ accountNumber: '123456789' }))).toBe(false)
    expect(isAccountComplete(account({ accountNumber: '12345678901234567' }))).toBe(false)
    expect(isAccountComplete(account({ accountNumber: '123-456-7890' }))).toBe(false)
  })

  test('a bank code missing from the list is still accepted', () => {
    expect(findBank('999')).toBeUndefined()
    expect(isAccountComplete(account({ bankCode: '999' }))).toBe(true)
  })
})

describe('normalizeAmountInput', () => {
  test('keeps digits only and drops leading zeros', () => {
    expect(normalizeAmountInput('1,000')).toBe('1000')
    expect(normalizeAmountInput('99.5')).toBe('995')
    expect(normalizeAmountInput('0500')).toBe('500')
    expect(normalizeAmountInput('000')).toBe('0')
    expect(normalizeAmountInput('abc')).toBe('')
  })

  test('caps at 6 digits after stripping separators', () => {
    expect(normalizeAmountInput('123,456')).toBe('123456')
    expect(normalizeAmountInput('1234567')).toBe('123456')
  })
})

describe('isValidAmount', () => {
  test('empty is fine because the amount is optional, zero is not', () => {
    expect(isValidAmount('')).toBe(true)
    expect(isValidAmount('999999')).toBe(true)
    expect(isValidAmount('0')).toBe(false)
  })
})

describe('formatAmount', () => {
  test('adds thousands separators', () => {
    expect(formatAmount('50000')).toBe('NT$ 50,000')
  })
})

describe('accountLabel', () => {
  test('shows only the nickname when there is one', () => {
    expect(accountLabel(account({ nickname: '薪轉' }))).toBe('薪轉')
  })

  test('without a nickname shows the bank short name and last 4 digits', () => {
    expect(accountLabel(account())).toBe('中國信託 ****7890')
  })

  test('an unknown bank falls back to its code, an empty account to a placeholder', () => {
    expect(accountLabel(account({ bankCode: '999' }))).toBe('999 ****7890')
    expect(accountLabel(account({ bankCode: '', accountNumber: '' }))).toBe('未填寫')
  })
})

describe('qrImageFilename', () => {
  test('uses the nickname, or the bank code when there is none', () => {
    expect(qrImageFilename(account({ nickname: '薪轉' }))).toBe('twqr-薪轉-7890.png')
    expect(qrImageFilename(account())).toBe('twqr-822-7890.png')
  })

  test('appends the amount when there is one', () => {
    expect(qrImageFilename(account({ nickname: '薪轉' }), '500')).toBe('twqr-薪轉-7890-500.png')
  })
})

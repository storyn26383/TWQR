import type { Account } from '~~/engine/twqr'

interface AccountBook {
  accounts: Account[]
  selectedId: string
}

const blankAccount = (): Account => ({
  // ponytail: 唔用 crypto.randomUUID，佢喺 http 區網預覽（非 secure context）用唔到
  id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`,
  nickname: '',
  bankCode: '',
  accountNumber: '',
})

const firstVisit = (): AccountBook => {
  const account = blankAccount()
  return { accounts: [account], selectedId: account.id }
}

/** 收款帳戶列表同目前揀中嘅帳戶，最少保留一個。 */
export const useAccounts = () => {
  const book = usePersistedState<AccountBook>('twqr.accounts', firstVisit)

  const add = () => {
    const account = blankAccount()
    book.value.accounts.push(account)
    book.value.selectedId = account.id
  }

  const remove = (id: string) => {
    if (book.value.accounts.length <= 1) return
    book.value.accounts = book.value.accounts.filter(account => account.id !== id)
    if (book.value.selectedId === id) book.value.selectedId = book.value.accounts[0]!.id
  }

  return { book, add, remove }
}

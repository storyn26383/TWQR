<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import {
  accountLabel,
  BANKS,
  findBank,
  isAccountComplete,
  isValidAccountNumber,
  isValidAmount,
  isValidBankCode,
  normalizeAmountInput,
  shareText,
  type Account,
} from '~~/engine/twqr'

const BANK_LIST_ID = 'bank-list'
const DELETE_CONFIRM_TIMEOUT_MS = 3000

const { book, add, remove } = useAccounts()

/** 每次收款金額唔同，所以唔入 localStorage；所有帳戶共用。 */
const amount = ref('')
/** 直接改寫 input，否則打非數字時 amount 冇變，Vue 唔會重新 render 走個字。 */
const onAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  input.value = normalizeAmountInput(input.value)
  amount.value = input.value
}
const amountInput = useTemplateRef<HTMLInputElement>('amountInput')
/** 清除之後即刻 focus，通常係要入新金額。 */
const clearAmount = () => {
  amount.value = ''
  amountInput.value?.focus()
}
const canShowQr = (account: Account) => isAccountComplete(account) && isValidAmount(amount.value)
const qrHint = (account: Account) =>
  isAccountComplete(account) ? '金額須大於 0' : '請先編輯帳戶'

/** 平時只顯示 QR；表單、排序、刪除都喺編輯模式。未有完整帳戶或者一個都冇就一定要編輯。 */
const isEditRequested = ref(!book.value.accounts.some(isAccountComplete))
const isEditing = computed(() => isEditRequested.value || !book.value.accounts.length)

const selectedAccount = computed(() => book.value.accounts.find(account => account.id === book.value.selectedId))
const preparedPng = usePreparedTwqrPng(() => {
  const account = selectedAccount.value
  if (!account || !canShowQr(account)) return undefined
  return { account: { ...account }, amount: amount.value }
})

/** 刪除要撳兩下：第一下變「確定刪除」，3 秒內再撳先刪。 */
const confirmingDeleteId = ref<string>()
let confirmTimer: ReturnType<typeof setTimeout> | undefined
const requestDelete = (id: string) => {
  clearTimeout(confirmTimer)
  const isConfirmed = confirmingDeleteId.value === id
  confirmingDeleteId.value = undefined
  if (isConfirmed) return remove(id)
  confirmingDeleteId.value = id
  confirmTimer = setTimeout(() => { confirmingDeleteId.value = undefined }, DELETE_CONFIRM_TIMEOUT_MS)
}
</script>

<template>
  <div class="min-h-dvh max-w-lg mx-auto">
    <header class="px-4 pt-5 pb-3">
      <h1 class="text-2xl font-bold tracking-tight">TWQR 收款碼</h1>
      <p class="text-sm opacity-60">臺灣通用收款碼產生器</p>
    </header>

    <main class="flex flex-col gap-6 px-4 pb-8">
      <section class="flex flex-col gap-2">
        <label class="section-label" for="amount">金額（選填）</label>
        <label class="input w-full">
          <span class="opacity-60">NT$</span>
          <input id="amount" ref="amountInput" :value="amount" inputmode="numeric" placeholder="不填則由付款人輸入" @input="onAmountInput">
          <button v-if="amount" type="button" class="btn btn-ghost btn-xs btn-circle opacity-60" aria-label="清除金額" @click="clearAmount">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </label>
        <p v-if="!isValidAmount(amount)" class="text-xs text-error">須大於 0</p>
      </section>

      <section class="flex flex-col gap-2">
        <div class="flex min-h-8 items-center justify-between">
          <h2 class="section-label">收款帳戶</h2>
          <button v-if="book.accounts.length" type="button" class="btn btn-outline btn-sm opacity-60" @click="isEditRequested = !isEditing">
            {{ isEditing ? '完成' : '編輯' }}
          </button>
        </div>
        <p v-if="!book.accounts.length" class="panel p-6 text-center text-sm opacity-60">尚未新增收款帳戶</p>
        <VueDraggable v-model="book.accounts" handle=".drag-handle" :animation="150" class="flex flex-col gap-2">
          <div v-for="account in book.accounts" :key="account.id" class="panel flex flex-col gap-3 p-3">
            <div class="flex items-center gap-2">
              <span v-if="isEditing" class="drag-handle flex cursor-grab items-center px-1 opacity-40" role="img" aria-label="拖曳排序">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </span>
              <button
                type="button"
                class="min-h-8 flex-1 text-left font-semibold"
                :aria-expanded="!isEditing && account.id === book.selectedId"
                :disabled="isEditing"
                @click="book.selectedId = account.id"
              >
                {{ accountLabel(account) }}
              </button>
              <!-- 確認狀態加埋文字，唔好淨係靠變色提示再撳一下就會刪 -->
              <button
                v-if="isEditing"
                type="button"
                class="btn btn-sm"
                :class="confirmingDeleteId === account.id ? 'btn-error' : 'btn-ghost btn-square opacity-70'"
                :aria-label="confirmingDeleteId === account.id ? '確定刪除' : '刪除'"
                @click="requestDelete(account.id)"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                </svg>
                <span v-if="confirmingDeleteId === account.id">確定刪除</span>
              </button>
              <template v-else-if="account.id === book.selectedId">
                <button
                  v-if="preparedPng"
                  type="button"
                  class="btn btn-ghost btn-sm btn-square opacity-70"
                  aria-label="下載收款碼"
                  @click="downloadFile(preparedPng)"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 4v11m-4-4 4 4 4-4M5 20h14" />
                  </svg>
                </button>
                <button
                  v-if="preparedPng && canShareFile(preparedPng)"
                  type="button"
                  class="btn btn-ghost btn-sm btn-square opacity-70"
                  aria-label="分享收款碼"
                  @click="shareFile(preparedPng, shareText(account, amount))"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 15V3m-4 4 4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
                  </svg>
                </button>
              </template>
            </div>

            <div v-if="isEditing" class="flex flex-col gap-2">
              <input v-model="account.nickname" class="input input-sm w-full" placeholder="暱稱（選填）" aria-label="暱稱">
              <div class="grid grid-cols-[7rem_1fr] gap-2">
                <div>
                  <input
                    v-model="account.bankCode"
                    :list="BANK_LIST_ID"
                    class="input input-sm w-full font-mono"
                    placeholder="銀行代碼"
                    aria-label="銀行代碼"
                  >
                  <p v-if="account.bankCode && !isValidBankCode(account.bankCode)" class="mt-1 text-xs text-error">須為 3 碼數字</p>
                  <p v-else-if="account.bankCode && !findBank(account.bankCode)" class="mt-1 text-xs opacity-60">查無此銀行代碼</p>
                </div>
                <div>
                  <input
                    v-model="account.accountNumber"
                    class="input input-sm w-full font-mono"
                    inputmode="numeric"
                    maxlength="16"
                    placeholder="帳號"
                    aria-label="帳號"
                  >
                  <p v-if="account.accountNumber && !isValidAccountNumber(account.accountNumber)" class="mt-1 text-xs text-error">
                    須為 8 至 16 碼數字
                  </p>
                </div>
              </div>
            </div>
            <template v-else-if="account.id === book.selectedId">
              <TwqrCode v-if="canShowQr(account)" :account="account" :amount="amount" />
              <p v-else class="py-6 text-center text-sm opacity-60">{{ qrHint(account) }}</p>
            </template>
          </div>
        </VueDraggable>
        <button v-if="isEditing" type="button" class="btn btn-dash btn-neutral btn-block" @click="add">新增帳戶</button>
      </section>
    </main>

    <datalist :id="BANK_LIST_ID">
      <option v-for="bank in BANKS" :key="bank.code" :value="bank.code">{{ bank.name }}</option>
    </datalist>
  </div>
</template>

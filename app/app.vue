<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import { accountLabel, BANKS, findBank, isAccountComplete, isValidAccountNumber, isValidBankCode } from '~~/engine/twqr'

const BANK_LIST_ID = 'bank-list'
const DELETE_CONFIRM_TIMEOUT_MS = 3000

const { book, add, remove } = useAccounts()

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

    <main class="flex flex-col gap-2 px-4 pb-8">
      <h2 class="section-label">收款帳戶</h2>
      <VueDraggable v-model="book.accounts" handle=".drag-handle" :animation="150" class="flex flex-col gap-2">
        <div v-for="account in book.accounts" :key="account.id" class="panel flex flex-col gap-3 p-3">
          <div class="flex items-center gap-2">
            <span class="drag-handle flex cursor-grab items-center px-1 opacity-40" role="img" aria-label="拖曳排序">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </span>
            <button
              type="button"
              class="min-h-8 flex-1 text-left font-semibold"
              :aria-expanded="account.id === book.selectedId"
              @click="book.selectedId = account.id"
            >
              {{ accountLabel(account) }}
            </button>
            <button
              v-if="account.id === book.selectedId"
              type="button"
              class="btn btn-sm"
              :class="{ 'btn-error': confirmingDeleteId === account.id }"
              :disabled="book.accounts.length <= 1"
              @click="requestDelete(account.id)"
            >
              {{ confirmingDeleteId === account.id ? '確定刪除' : '刪除' }}
            </button>
          </div>

          <template v-if="account.id === book.selectedId">
            <TwqrCode v-if="isAccountComplete(account)" :account="account" />
            <p v-else class="py-6 text-center text-sm opacity-60">填寫銀行代碼與帳號後產生 QR Code</p>

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
                  須為 10 至 16 碼數字
                </p>
              </div>
            </div>
          </template>
        </div>
      </VueDraggable>
      <button type="button" class="btn btn-dash btn-neutral btn-block" @click="add">新增帳戶</button>
    </main>

    <datalist :id="BANK_LIST_ID">
      <option v-for="bank in BANKS" :key="bank.code" :value="bank.code">{{ bank.name }}</option>
    </datalist>
  </div>
</template>

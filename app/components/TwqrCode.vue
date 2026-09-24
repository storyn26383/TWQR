<script setup lang="ts">
import { findBank, formatAmount, type Account } from '~~/engine/twqr'

const ACCOUNT_NUMBER_CLASS = 'font-mono text-lg font-semibold tracking-wide opacity-90'
const COPIED_FEEDBACK_MS = 1500

const { account, amount } = defineProps<{ account: Account, amount: string }>()

const svg = computed(() => renderTwqrSvg(account, amount))

/** 唔支援（例如 http 區網預覽）就當普通文字，唔顯示複製 icon。 */
const canCopy = 'clipboard' in navigator
const isCopied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | undefined
const showCopied = () => {
  clearTimeout(copiedTimer)
  isCopied.value = true
  copiedTimer = setTimeout(() => { isCopied.value = false }, COPIED_FEEDBACK_MS)
}
/** 失敗就唔變 ✓，用家仍然可以長按帳號自己複製。 */
const copyAccountNumber = () => navigator.clipboard.writeText(account.accountNumber).then(showCopied, () => {})
onBeforeUnmount(() => clearTimeout(copiedTimer))
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="w-full max-w-72" v-html="svg" />
    <div class="text-center">
      <p v-if="amount" class="mb-2 text-2xl font-bold text-primary">{{ formatAmount(amount) }}</p>
      <p class="text-sm opacity-60">{{ account.bankCode }} {{ findBank(account.bankCode)?.shortName }}</p>
      <button
        v-if="canCopy"
        type="button"
        class="inline-flex items-center gap-2"
        :class="ACCOUNT_NUMBER_CLASS"
        :aria-label="isCopied ? '已複製帳號' : `複製帳號 ${account.accountNumber}`"
        @click="copyAccountNumber"
      >
        {{ account.accountNumber }}
        <svg class="opacity-60" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="isCopied" d="M5 12l5 5L20 7" />
          <path v-else d="M9 9h11v11H9zM5 15V4h11" />
        </svg>
      </button>
      <p v-else :class="ACCOUNT_NUMBER_CLASS">{{ account.accountNumber }}</p>
    </div>
  </div>
</template>

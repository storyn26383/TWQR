<script setup lang="ts">
import { findBank, formatAmount, type Account } from '~~/engine/twqr'

const { account, amount } = defineProps<{ account: Account, amount: string }>()

const svg = computed(() => renderTwqrSvg(account, amount))
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="w-full max-w-72" v-html="svg" />
    <div class="text-center">
      <p v-if="amount" class="mb-2 text-2xl font-bold text-primary">{{ formatAmount(amount) }}</p>
      <p class="text-sm opacity-60">{{ account.bankCode }} {{ findBank(account.bankCode)?.name }}</p>
      <p class="font-mono text-lg font-semibold tracking-wide opacity-90">{{ account.accountNumber }}</p>
    </div>
  </div>
</template>

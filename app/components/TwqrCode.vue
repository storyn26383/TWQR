<script setup lang="ts">
import { renderSVG } from 'uqr'
import { createTwqrString, findBank, qrImageFilename, type Account } from '~~/engine/twqr'

/** QR 標準建議四格 quiet zone，印出嚟都掃得到。 */
const QUIET_ZONE_MODULES = 4
const PNG_SIZE_PX = 1024

const { account } = defineProps<{ account: Account }>()

const svg = computed(() =>
  renderSVG(createTwqrString(account.bankCode, account.accountNumber), { border: QUIET_ZONE_MODULES }))

/** SVG 要有明確寬高，Firefox 先肯畫落 canvas，Safari 先唔會糊。 */
const downloadPng = async () => {
  const sizedSvg = svg.value.replace('<svg ', `<svg width="${PNG_SIZE_PX}" height="${PNG_SIZE_PX}" `)
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sizedSvg)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = PNG_SIZE_PX
  canvas.height = PNG_SIZE_PX
  canvas.getContext('2d')!.drawImage(image, 0, 0)

  const link = document.createElement('a')
  link.href = canvas.toDataURL('image/png')
  link.download = qrImageFilename(account)
  link.click()
}
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="w-full max-w-72" v-html="svg" />
    <div class="text-center">
      <p class="text-sm opacity-60">{{ account.bankCode }} {{ findBank(account.bankCode)?.name }}</p>
      <p class="font-mono text-lg font-semibold tracking-wide opacity-90">{{ account.accountNumber }}</p>
    </div>
    <button type="button" class="btn btn-sm btn-neutral" @click="downloadPng">下載圖片</button>
  </div>
</template>

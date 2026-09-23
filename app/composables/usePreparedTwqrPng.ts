import type { Account } from '~~/engine/twqr'

interface TwqrPngSource {
  account: Account
  amount: string
}

/** 預先整好 PNG，撳分享時先可以同步呼叫 navigator.share()。 */
export const usePreparedTwqrPng = (source: () => TwqrPngSource | undefined) => {
  const png = shallowRef<File>()
  watch(source, async (target, _previous, onCleanup) => {
    let isStale = false
    onCleanup(() => { isStale = true })
    png.value = undefined
    if (!target) return
    const rendered = await renderTwqrPng(target.account, target.amount)
    if (!isStale) png.value = rendered
  }, { immediate: true })
  return png
}

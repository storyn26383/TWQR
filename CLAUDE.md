# CLAUDE.md

TWQR 收款碼：輸入銀行代碼同帳號產生臺灣共用支付碼。技術同風格跟 `../mahjong`。

## 指令

```sh
bun install
bun run dev        # 開發伺服器
bun test           # 只測 engine/
bun run typecheck  # vue-tsc
bun run generate   # 靜態輸出到 .output/public
```

## 架構

- `engine/twqr.ts`：純 TypeScript，冇 Vue、冇瀏覽器 API。字串格式、驗證、銀行查詢、選項文字、PNG 檔名都喺度，改動要有 `bun test`。
- `app/`：Nuxt 4 SPA（`ssr: false`），冇 `pages/`，淨係 `app.vue` 一頁。Tailwind 4 + daisyUI 5，內建主題 `autumn`。
- 帳戶存成 `{ accounts, selectedId }` 一個 object（`usePersistedState` 會用 `{ ...default, ...saved }` 合併，唔可以直接存 array）。

## 規則要點（唔好重新爭論）

- TWQR 字串照抄 payme 嘅 builder：`TWQRP://個人轉帳/158/02/V1?D5=<行庫>&D6=<帳號補 0 到 16 位>&D1=<金額 × 100>&D10=901`，成條再 `encodeURIComponent`；冇金額就冇 D1。唔做備註（D9）。
- 金額選填、所有帳戶共用，只係 `ref`，唔入 localStorage。輸入時用 `normalizeAmountInput` 即時淨係留數字、去前導零、截到 6 位（上限 999,999）；唯一唔合格係 0，會顯示紅字同唔出 QR。QR 下面顯示「NT$ 1,234」，PNG 檔名尾加金額。
- 銀行代碼只驗 3 位數字；唔喺 `banks.json` 就顯示「查無此銀行代碼」，但照出 QR。帳號 10 至 16 位數字。
- 銀行代碼用 `<input list>` + `<datalist>`，唔好加 `inputmode="numeric"`（會令用家打唔到銀行名搜尋）。
- 多帳戶，暱稱選填。冇 `<select>`：帳戶列表係 accordion，同一時間只展開揀中嗰張，QR 同編輯欄位喺同一張卡；標題行有暱稱就淨係顯示暱稱，冇就顯示「簡稱 ****1234」，乜都未填就顯示「未填寫」。
- 帳戶卡片跟 payme 模式：input 即改即存，冇編輯模式；「新增帳戶」加空白卡並展開；最少保留一張。展開嘅卡標題行右邊有下載同刪除兩個 icon-only 掣（下載只喺出到 QR 時先有）。
- 排序用 `vue-draggable-plus` 拖拉（原生 drag and drop 喺 iOS 用唔到）。
- 刪除唔彈 `confirm()`、唔用 modal：兩段式按鈕，第一下變紅色並顯示「確定刪除」文字，3 秒內再撳先刪。
- 一頁式，冇 `pages/`。
- QR 用 `uqr` 出 SVG，quiet zone 4 格。下載 PNG 淨係 QR，1024 px，檔名 `twqr-<暱稱或代碼>-<尾 4 位>[-<金額>].png`。
- 部署同 PWA 照 mahjong，冇 service worker。

## 介面文案

- 畫面文字用臺灣正體，唔用粵語；「臺灣」唔寫「台灣」（`banks.json` 入面嘅銀行正式名稱照原樣）。
- 對話同代碼註解可以用粵語。
- 唔顯示 focus outline。

## 工作方式

- 改檔案入面嘅中文時用 Bun script，唔好用 perl `-e`（會亂碼）。
- 部署 base path 由 GitHub repo variable `NUXT_APP_BASE_URL` 決定，預設 `/`。

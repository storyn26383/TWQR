# TWQR 收款碼

輸入銀行代碼同帳號，即時產生臺灣共用支付碼（TWQR）轉帳 QR Code 嘅手機瀏覽器小工具，唔使安裝、冇後端，資料只存喺本機 localStorage。

- 可以存多個收款帳戶，每個帳戶可以加暱稱。帳戶列表係 accordion，撳一下就揀中並展開，QR Code 同編輯欄位都喺同一張卡入面。
- 即改即存，可以拖拉排序；刪除要撳兩下確認。
- 金額選填（1 至 999,999 元），所有帳戶共用，唔會記住，reload 就清空。
- QR Code 下面顯示銀行同完整帳號，方便對方手動轉帳；可以下載 1024 px PNG。

TWQR 字串格式同銀行清單來自 [JTH58/payme](https://github.com/JTH58/payme)（MIT），只保留「個人轉帳」同金額，冇備註。

## 開發

需要 [Bun](https://bun.sh)。

```sh
bun install
bun run dev        # 開發伺服器
bun test           # TWQR 引擎測試
bun run typecheck  # vue-tsc
bun run generate   # 輸出靜態檔到 .output/public
```

## 結構

```
engine/    純 TypeScript，冇 Vue 或瀏覽器依賴，bun test 測呢層
  twqr.ts        TWQR 字串、驗證、銀行查詢、選項文字同檔名
  banks.json     銀行代碼清單（來自 payme）
app/       Nuxt 單頁，只負責收集輸入、調用引擎、渲染輸出
  app.vue        帳戶 accordion 列表
  components/    TwqrCode（QR 同帳戶資料）
  utils/         twqrImage（出 SVG、下載 PNG）
  composables/   useAccounts（帳戶列表，記 localStorage）
```

技術棧：Nuxt（SPA，`ssr: false`）、Tailwind + daisyUI、Bun、[uqr](https://github.com/unjs/uqr)、[vue-draggable-plus](https://github.com/Alfred-Skyblue/vue-draggable-plus)。

## 部署

推上 GitHub 之後，喺 repo Settings → Pages 揀 Source 為 **GitHub Actions**，`.github/workflows/deploy.yml` 會自動 build 同部署，預設 base path 係 `/`。如果部署到 `<user>.github.io/<repo>/` 呢類子路徑，喺 Settings → Secrets and variables → Actions → Variables 加 `NUXT_APP_BASE_URL`，值係 `/<repo>/`。

本地或者其他靜態托管：

```sh
NUXT_APP_BASE_URL=/ bun run generate
```

然後托管 `.output/public`。手機瀏覽器開網址後可以 Add to Home Screen。

## 暫時唔做

備註、分享連結、QR 樣式、離線（service worker）。

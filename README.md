# OSV 安全掃描器

一個基於 Vue 3 的前端應用程式，用於掃描指定目錄下的專案 package.json 檔案，檢查套件版本是否存在安全漏洞。使用 OSV (Open Source Vulnerabilities) API 提供準確的安全資訊。

## ✨ 功能特色

- 🔍 **目錄掃描**: 自動掃描指定目錄下的所有專案（支援 3 層子目錄）
- 📦 **套件分析**: 檢查 dependencies 和 devDependencies 中的套件
- 🛡️ **安全漏洞檢測**: 整合 OSV API 檢查已知的安全漏洞
- 📊 **版本檢查**: 比較當前版本與最新版本，找出過期套件
- 📈 **視覺化報告**: 提供清晰的掃描結果概覽和詳細資訊
- ⚡ **即時進度**: 掃描過程中顯示即時進度和目前處理的專案

## 🚀 技術架構

### 前端框架
- **Vue 3** - 採用 Composition API + `<script setup>` 語法
- **TypeScript** - 完整的型別支援
- **Vite** - 快速建置工具

### UI 組件庫
- **Element Plus** - 企業級 UI 組件庫
- **TailwindCSS** - 工具類優先的 CSS 框架
- **Chart.js + Vue-ChartJS** - 圖表視覺化

### 狀態管理與資料處理
- **Pinia** - Vue 3 狀態管理
- **TanStack Vue Query** - 伺服器狀態管理和快取
- **Lodash-ES** - 實用工具函式庫

### 開發工具
- **ESLint + Prettier** - 程式碼風格檢查和格式化
- **Vue TSC** - Vue 專用的 TypeScript 編譯器

## 📁 專案結構

```
src/
├── types/
│   └── scanner.ts          # TypeScript 型別定義
├── utils/
│   └── packageScanner.ts   # 核心掃描邏輯
├── views/
│   ├── HomeView.vue        # 主頁面
│   └── components/
│       ├── ScanResultsOverview.vue   # 掃描結果概覽
│       └── ProjectResultsList.vue    # 專案結果列表
└── stores/
    └── counter.ts          # Pinia store 範例
```

## 🔧 安裝與執行

### 環境需求
- Node.js 18+ 
- 現代瀏覽器（支援 File System Access API）

### 安裝依賴
```bash
npm install
```

### 開發環境執行
```bash
npm run dev
```

### 建置生產版本
```bash
npm run build
```

### 程式碼檢查
```bash
npm run lint
```

### 型別檢查
```bash
npm run type-check
```

## 📋 使用方式

1. **選擇目錄**: 點擊「選擇目錄」按鈕，選擇要掃描的根目錄
2. **開始掃描**: 點擊「開始掃描」按鈕開始分析
3. **查看結果**: 掃描完成後查看：
   - 掃描概覽：總專案數、漏洞統計、過期套件統計
   - 詳細結果：每個專案的具體漏洞和過期套件資訊

## 🔍 掃描機制

### 目錄掃描
- 自動遞迴掃描最多 3 層子目錄
- 跳過 `.git`、`node_modules`、`dist`、`build` 等目錄
- 尋找包含 `package.json` 的專案目錄

### 套件檢查
- **過期檢查**: 使用 npm registry API 檢查套件最新版本
- **安全檢查**: 使用 OSV API 檢查已知安全漏洞
- **嚴重性分級**: 根據 CVSS 分數分為 low、moderate、high、critical

### 支援的生態系統
- npm (JavaScript/TypeScript 專案)

## 🛡️ 安全性說明

本工具僅用於**防禦性安全分析**：
- ✅ 檢測已知安全漏洞
- ✅ 分析套件版本風險
- ✅ 產生安全報告
- ❌ 不包含任何惡意功能
- ❌ 僅讀取檔案，不修改專案內容

## 🔗 API 整合

- **NPM Registry API**: `https://registry.npmjs.org/` - 取得套件最新版本資訊
- **OSV API**: `https://api.osv.dev/v1/query` - 查詢開源軟體漏洞資料庫

## 📝 開發規範

本專案遵循 Feature Based 架構設計：
- 使用 `<script setup>` 語法
- 2 個空格縮排
- 駝峰命名法 (camelCase)
- 完整的 TypeScript 型別註解
- ESLint + Prettier 程式碼格式化

## 📄 授權

本專案為開源專案，僅供學習和防禦性安全分析使用。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案！

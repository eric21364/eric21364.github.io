# 蝦皮自動化腳本與 IPTV 播放清單 (Shopee Automation Scripts & IPTV Playlist)

## 專案簡介 (Project Overview)

本專案主要提供一系列針對蝦皮（Shopee）設計的自動化腳本，適用於 Quantumult X 和 Surge 等網路代理工具。此外，專案也包含一個 IPTV 播放清單。這些腳本旨在自動化日常任務，例如每日簽到、蝦蝦果園自動澆水、領取獎勵等，以節省使用者時間。

This project provides a collection of automation scripts for Shopee, designed to be used with network proxy tools like Quantumult X and Surge. It also includes an IPTV playlist. The scripts aim to automate daily tasks such as check-ins, farm watering, claiming rewards, and more.

## 主要功能 (Features)

- **蝦皮每日簽到 (Shopee Daily Check-in)**
- **蝦蝦果園自動化 (Shopee Farm Automation)**: 自動澆水、自動收成等。
- **幸運抽獎 (Lucky Draws)**: 自動參與各種抽獎活動。
- **品牌商店任務 (Brand Store Missions)**
- **IPTV 播放清單 (IPTV Playlist)**

## 專案結構 (Project Structure)

```
.
├── iptv/               # IPTV 播放清單 (IPTV playlist)
│   └── iptv.m3u8
├── modules/            # Surge/Loon 模組設定檔 (Module configurations for Surge/Loon)
│   ├── shopee_auto_water.json
│   └── ...
├── qx/                 # Quantumult X 腳本 (Scripts for Quantumult X)
│   ├── shopee_checkin.js
│   ├── shopee_auto_water.js
│   └── ...
├── surge/              # Surge 腳本 (Scripts for Surge)
│   └── shopee_brand_store_water.js
├── index.html          # 專案首頁 (Project landing page)
└── README.md           # 專案說明文件 (This file)
```

- `qx/`: 存放適用於 Quantumult X 的 JavaScript (.js) 腳本。
- `surge/`: 存放適用於 Surge 的 JavaScript (.js) 腳本。
- `modules/`: 存放 Surge/Loon 等工具使用的模組設定檔 (.json)。
- `iptv/`: 存放 M3U8 格式的 IPTV 播放清單。
- `html/`: 包含一些靜態網頁，可能作為使用指南或測試頁面。

## 使用方式 (Usage)

1.  **取得 Token**: 大部分的蝦皮腳本都需要設定個人的 Shopee Token 才能正常運作。請參考 `qx/shopee_token.js` 等腳本的說明來取得並設定您的 Token。
2.  **設定腳本**:
    - **Quantumult X**: 在 `[task_local]` 區段中加入對應的腳本路徑，並設定定時執行。
    - **Surge**: 將腳本設定為 `cron` 任務，或透過安裝對應的 `.sgmodule` 模組來使用。
3.  詳細的使用說明請參考 `html/使用指南.txt` 或各腳本內的註解。

## 免責聲明 (Disclaimer)

本專案所有腳本僅供學術研究與技術交流使用，使用者需自行承擔因使用本專案所造成的任何風險與後果。

All scripts in this project are for academic research and technical exchange purposes only. The user assumes all risks and consequences arising from the use of this project.
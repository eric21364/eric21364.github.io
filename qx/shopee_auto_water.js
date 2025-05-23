// ==UserScript==
// @name         蝦皮台灣自動澆水
// @namespace    http://your.namespace/
// @version      1.0
// @description  Quantumult X 輸出純 JS 載入自動澆水
// @author       你
// @match        https://raw.githubusercontent.com/eric21364/eric21364.github.io/refs/heads/main/qx/shopee_auto_water.js
// @grant        none
// ==/UserScript==
async function preCheck() {
    return new Promise((resolve, reject) => {
        const shopeeInfo = getSaveObject('ShopeeInfo');
        if (isEmptyObject(shopeeInfo)) {
            return reject(['檢查失敗 ‼️', '找不到 token']);
        }

        const shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
        if (isEmptyObject(shopeeFarmInfo)) {
            return reject(['檢查失敗 ‼️', '沒有蝦蝦果園資料']);
        }

        const shopeeHeaders = {
            'Cookie': cookieToString(shopeeInfo.token),
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        config = {
            shopeeInfo: shopeeInfo,
            shopeeFarmInfo: shopeeFarmInfo,
            shopeeHeaders: shopeeHeaders,
        }
        return resolve();
    });
}
(async () => {
    const CROP_ID = '6013820'; // 輸入你的作物ID
    const SECRET_KEY = 'TW_2024_SECRET_V2'; // 你的密鑰
    const API_HOST = 'games.shopee.tw';

    // 生成簽名（HMAC-SHA256）
    function generateSignature(timestamp, nonce, deviceId) {
        const str = `${timestamp}${nonce}${deviceId}`;
        const encoder = new TextEncoder();
        const keyData = encoder.encode(SECRET_KEY);
        const data = encoder.encode(str);
        return crypto.subtle.importKey('raw', keyData, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign'])
            .then(cryptoKey => crypto.subtle.sign('HMAC', cryptoKey, data))
            .then(signature => {
                const hashArray = Array.from(new Uint8Array(signature));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            });
    }

    // 地理模糊
    function obfuscateGeo(baseLat, baseLng) {
        const gaussian = (μ, σ) => {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            return μ + σ * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        };
        const delta = 0.0003;
        return {
            lat: (baseLat + gaussian(0, delta)).toFixed(6),
            lng: (baseLng + gaussian(0, delta)).toFixed(6)
        };
    }

    // 取得設備ID（模擬）
    function getDeviceId() {
        return 'ASUS_Z01RD'; // 可自訂或固定
    }

    // 發送請求
    async function water() {
        const geo = obfuscateGeo(23.6978, 120.9605);
        const timestamp = Date.now();
        const nonce = Math.random().toString(36).substr(2,8);
        const deviceId = getDeviceId();

        const signature = await generateSignature(timestamp, nonce, deviceId);

        const url = `https://${API_HOST}/farm/api/orchard/crop/water`;
        const headers = {
            'Content-Type': 'application/json',
            'X-Region': 'TW',
            'X-Device-Model': deviceId,
            'Cookie': `SPC_EC=${$persistentStore.read('SPC_EC')}`,
            'User-Agent': 'ShopeeTW/5.80.10 (iPhone; iOS 17.4.1; Scale/3.00)'
        };
        const body = {
            cropId: CROP_ID,
            location: `${geo.lat},${geo.lng}`,
            timestamp: timestamp,
            nonce: nonce,
            signature: signature
        };

        try {
            const resp = await $httpRequest({
                method: 'POST',
                url: url,
                headers: headers,
                body: JSON.stringify(body)
            });
            const data = JSON.parse(resp.body);
            if (data.code === 0) {
                $notify('澆水成功', `剩餘水量: ${data.waterBalance}ml`);
            } else {
                $notify('澆水失敗', data.msg || '未知錯誤');
            }
        } catch (e) {
            $notify('請求失敗', e.message);
        }
    }

    // 定時自動執行
    function schedule() {
        const interval = 127 * 1000; // 127秒
        const jitter = Math.random() * 30 * 1000; // 0-30秒
        setTimeout(async () => {
            await water();
            schedule();
        }, interval + jitter);
    }

    // 初始化
    if ($persistentStore.read('SPC_EC') == null) {
        $notify('請先獲取Cookie', '請在瀏覽器中登入蝦皮並設置MitM攔截Cookie');
        return;
    }
	await preCheck();
    await water();
	$done();
})();

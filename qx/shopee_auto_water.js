// shopee_tw_water.js
const $ = new API('shopee-tw');
const crypto = require('crypto');

// 台灣專屬加密核心
const generateTWSignature = (timestamp, nonce) => {
  const hmac = crypto.createHmac('sha256', TW_CONFIG.crypto_secret);
  hmac.update(`${timestamp}${nonce}${$.getDeviceId()}`);
  return hmac.digest('hex');
};

// 地理模糊算法
const obfuscateGeo = (baseLat, baseLng) => {
  const Δ = 0.0003 + Math.random() * 0.0002;
  return {
    lat: (baseLat + Δ * (Math.random() > 0.5 ? 1 : -1)).toFixed(6),
    lng: (baseLng + Δ * (Math.random() > 0.5 ? 1 : -1)).toFixed(6)
  };
};

// 主澆水邏輯
async function waterProcess() {
  try {
    // 獲取動態地理參數
    const geo = obfuscateGeo(23.6978, 120.9605);
    
    // 構建請求參數
    const params = {
      cropId: $.getEnv('CROP_ID'),
      location: `${geo.lat},${geo.lng}`,
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substr(2, 8)
    };
    
    // 生成台灣專屬簽名
    params.signature = generateTWSignature(params.timestamp, params.nonce);
    
    // 發送請求
    const resp = await $.post({
      url: `https://${TW_CONFIG.api_host}/farm/api/orchard/crop/water`,
      headers: {
        'X-Region': TW_CONFIG.region_code,
        'X-Device-Model': TW_CONFIG.device_model,
        'Cookie': `SPC_EC=${$.persistentGet('SPC_EC')}`
      },
      body: params
    });
    
    // 處理響應
    if (resp.data.code === 0) {
      $.notify('澆水成功', `剩餘水量: ${resp.data.waterBalance}ml`);
    } else {
      $.notify('澆水失敗', resp.data.msg);
    }
  } catch (e) {
    $.log(`錯誤代碼: ${e.status}\n${e.message}`);
  }
}

// 分散式排程入口
function main() {
  const baseDelay = 127000; // 127秒基礎間隔
  const jitter = Math.floor(Math.random() * 30000); // 30秒隨機抖動
  setTimeout(waterProcess, baseDelay + jitter);
}

main();

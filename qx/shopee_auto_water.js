// shopee_tw_water.js
const $ = new API('shopee-tw', true);
const crypto = require('crypto');

// HMAC-SHA256 簽名生成函數
function generateSignature(timestamp, nonce) {
  const secret = 'TW_2024_SECRET_V2';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${timestamp}${nonce}${$.device.identifier}`);
  return hmac.digest('hex');
}

// 地理模糊算法（高斯分佈）
function obfuscateGeo(baseLat, baseLng) {
  const gaussian = (μ, σ) => {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return μ + σ * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
  
  return {
    lat: gaussian(baseLat, 0.0003).toFixed(6),
    lng: gaussian(baseLng, 0.0003).toFixed(6)
  };
}

// 主澆水流程
async function waterPlant() {
  try {
    // 獲取動態參數
    const geo = obfuscateGeo(...TW_CONFIG.geo_center);
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substr(2, 8);

    // 構建請求
    const response = await $.http.post({
      url: `https://${TW_CONFIG.api_endpoint}/farm/api/orchard/crop/water`,
      headers: {
        'X-Region': TW_CONFIG.region_code,
        'X-Device-Model': TW_CONFIG.device_model,
        'Cookie': `SPC_EC=${$.persistentStore.read('SPC_EC')}`
      },
      body: {
        cropId: $.env.get('CROP_ID'),
        location: `${geo.lat},${geo.lng}`,
        timestamp: timestamp,
        nonce: nonce,
        signature: generateSignature(timestamp, nonce)
      }
    });

    // 處理響應
    if (response.data.code === 0) {
      $.notify('澆水成功', `剩餘水量: ${response.data.waterBalance}ml`);
    } else {
      throw new Error(response.data.msg || '未知錯誤');
    }
  } catch (error) {
    $.notify('澆水失敗', error.message);
    // 自動切換IP
    await $.task.fetch({
      url: 'http://proxy-pool.tw/reset',
      method: 'POST'
    });
  }
}

// 分散式排程控制
function scheduleTask() {
  const baseDelay = TW_CONFIG.request_interval;
  const jitter = Math.floor(Math.random() * 30000); // 30秒隨機抖動
  setTimeout(() => {
    waterPlant().finally(scheduleTask);
  }, baseDelay + jitter);
}

// 初始化執行
scheduleTask();

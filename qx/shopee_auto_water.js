// ================== 头部引入 ==================
const Env = require('./Env.min.js'); // 引入核心库
const $ = new Env("虾皮台湾自动浇水"); // 初始化环境

// ================== 功能模块 ==================
async function waterPlant() {
  try {
    const geo = generateFakeGeo(23.6978, 120.9605); // 台湾地理中心模糊
    const response = await $.http.post({
      url: `https://games.shopee.tw/farm/api/water`,
      headers: {
        'Cookie': `SPC_EC=${$.persistentGet('SPC_EC')}`,
        'X-Device-Model': 'ASUS_Z01RD'
      },
      body: {
        cropId: $.env.get('CROP_ID'),
        lat: geo.lat,
        lng: geo.lng
      }
    });
    $.notify('浇水结果', response.data.msg);
  } catch (e) {
    $.log(`错误详情: ${e.stack}`);
  }
}

// ================== 地理模糊算法 ==================
function generateFakeGeo(baseLat, baseLng) {
  const Δ = 0.0003 * (Math.random() > 0.5 ? 1 : -1);
  return {
    lat: (baseLat + Δ).toFixed(6),
    lng: (baseLng + Δ).toFixed(6)
  };
}

// ================== 执行入口 ==================
waterPlant();

let showNotification = true;
let config = null;

// 通知
function surgeNotify(subtitle = '', message = '') {
  $notify('🍤 蝦蝦果園自動澆水', subtitle, message, { 'url': 'shopeetw://' });
}

// 錯誤處理
function handleError(error) {
  if (Array.isArray(error)) {
    console.log(`❌ ${error[0]} ${error[1]}`);
    if (showNotification) surgeNotify(error[0], error[1]);
  } else {
    console.log(`❌ ${error}`);
    if (showNotification) surgeNotify(error);
  }
}

// 讀取本地存儲
function getSaveObject(key) {
  const string = $prefs.valueForKey(key);
  return !string || string.length === 0 ? {} : JSON.parse(string);
}

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

// Cookie 物件轉字串
function cookieToString(cookieObject) {
  let string = '';
  for (const [key, value] of Object.entries(cookieObject)) {
    string += `${key}=${value}; `;
  }
  return string.trim();
}

// 前置檢查
async function preCheck() {
  return new Promise((resolve, reject) => {
    const shopeeInfo = getSaveObject('ShopeeInfo');
    if (isEmptyObject(shopeeInfo)) return reject(['檢查失敗 ‼️', '找不到 token']);

    const shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
    if (isEmptyObject(shopeeFarmInfo)) return reject(['檢查失敗 ‼️', '沒有蝦蝦果園資料']);

    // 這裡請根據你自己的存儲方式調整欄位
    const cookie = shopeeInfo.token ? cookieToString(shopeeInfo.token) : '';
    config = {
      shopeeInfo,
      shopeeFarmInfo,
      cookie,
    };
    resolve();
  });
}

// 刪除舊資料
async function deleteOldData() {
  return new Promise((resolve, reject) => {
    try {
      $prefs.setValueForKey(null, 'ShopeeAutoCropName');
      $prefs.setValueForKey(null, 'ShopeeCrop');
      $prefs.setValueForKey(null, 'ShopeeCropState');
      $prefs.setValueForKey(null, 'ShopeeCropName');
      $prefs.setValueForKey(null, 'ShopeeCropToken');
      $prefs.setValueForKey(null, 'ShopeeGroceryStoreToken');
      let shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
      delete shopeeFarmInfo['autoCropSeedName'];
      $prefs.setValueForKey(JSON.stringify(shopeeFarmInfo, null, 4), 'ShopeeFarmInfo');
      resolve();
    } catch (error) {
      reject(['刪除舊資料發生錯誤 ‼️', error]);
    }
  });
}

// 澆水主程式
async function water() {
  return new Promise((resolve, reject) => {
    try {
      const crop = config.shopeeFarmInfo.currentCrop;
      if (!crop || !crop.cropId) {
        showNotification = false;
        return reject(['澆水失敗 ‼️', '目前沒有作物']);
      }

      // 必要欄位
      const bodyObj = {
        cropId: crop.cropId,
        resourceId: crop.resourceId,
        s: crop.s,
        device_id: config.shopeeInfo.device_id || '3EA661251F5F4C0082F22BB49CD6377B', // 需自行補齊
        security_dfp: config.shopeeInfo.security_dfp || 'pa29qBzQrg4fwT5DKMUN/g==|uWJkYH529a11OUgKrxsdaBX0X4UKpTdA7dsSuLCbQuwL2E4W5ue5gzw0I91GHdWneXSPbsAWirwNvSoY6+I=|yDxtIu7cSGe7337j|08|3', // 需自行補齊
      };
      console.log(`ℹ️ 正在澆水作物：${crop.cropName}，ID：${crop.cropId}` + JSON.stringify(bodyObj));
      // 完整 headers
      const headers = {
        'Accept-Encoding': 'gzip, deflate, br',
        'fruit-app-version': '35155',
        'Host': 'games.shopee.tw',
        'Origin': 'https://games.shopee.tw',
        'Sec-Fetch-Dest': 'empty',
        'Connection': 'keep-alive',
        'game-entrance': 'normal',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Beeshop locale=zh-Hant version=35155 appver=35155 rnver=1747813207 shopee_rn_bundle_version=6059005 Shopee language=zh-Hant app_type=1 platform=web_ios os_ver=18.5.0',
        'Content-Type': 'application/json',
        'Referer': 'https://games.shopee.tw/farm/?utm_medium=notification&utm_source=apppn&__source__=push_notification&__dsrn__=1',
        'games-app-version': '35155',
        'Accept-Language': 'en-US,en;q=0.9',
        'game-operation-source': 'fruit_farm',
        'fruit-version-type': 'h5',
        'Accept': '*/*',
        'games-rn-bundle-version': '6059005',
        'games-biz-version': '9.1.0',
        'Cookie': config.cookie,
        'Sec-Fetch-Mode': 'cors',
        'games-runtime': 'EgretH5'
      };

      const waterRequest = {
        method: 'POST',
        url: 'https://games.shopee.tw/farm/api/orchard/crop/water',
        headers: headers,
        body: JSON.stringify(bodyObj)
      };

      $task.fetch(waterRequest).then(response => {
        const data = response.body;
        if (response.statusCode == 200) {
          const obj = JSON.parse(data);
          if (obj.code === 0) {
            const useNumber = obj.data.useNumber;
            const state = obj.data.crop.state;
            const exp = obj.data.crop.exp;
            const levelExp = obj.data.crop.meta.config.levelConfig[state.toString()].exp;
            const remain = levelExp - exp;
            return resolve({ state, useNumber, remain });
          } else if (obj.code === 409000) {
            showNotification = false;
            return reject(['澆水失敗 ‼️', '水壺目前沒水']);
          } else if (obj.code === 403005) {
            return reject(['澆水失敗 ‼️', '作物狀態錯誤，請先手動澆水一次']);
          } else if (obj.code === 409004) {
            return reject(['澆水失敗 ‼️', '作物狀態錯誤，請檢查是否已收成']);
          } else {
            return reject(['澆水失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
          }
        } else {
          return reject(['澆水失敗 ‼️', response.status]);
        }
      }).catch(error => {
        return reject(['澆水失敗 ‼️', '連線錯誤']);
      });
    } catch (e) {
      reject(['澆水失敗 ‼️', e]);
    }
  });
}

// 主流程
(async () => {
  console.log('ℹ️ 蝦蝦果園自動澆水 v20240530.1');
  try {
    await preCheck();
    await deleteOldData();
    const result = await water();
    if (result.state === 3) {
      console.log(`本次澆了：${result.useNumber} 滴水 💧，剩餘 ${result.remain} 滴水收成`);
    } else {
      console.log(`本次澆了：${result.useNumber} 滴水 💧，剩餘 ${result.remain} 滴水成長至下一階段`);
    }
    if (result.remain === 0) {
      surgeNotify('澆水成功 ✅', '種植完畢，作物可以收成啦 🌳');
    }
  } catch (error) {
    handleError(error);
  }
  $done();
})();

// ================== 核心配置區塊 ==================
const CONFIG = {
  api_host: "games.shopee.tw",
  check_interval: 127000,  // 請求間隔(毫秒)
  max_retries: 3           // 最大重試次數
};

// ================== 持久化儲存處理 ==================
function getSavedData(key) {
  return JSON.parse($persistentStore.read(key) || "{}");
}

function saveData(key, value) {
  return $persistentStore.write(JSON.stringify(value), key);
}

// ================== 通知功能 ==================
function notify(subtitle, message) {
  $notification.post("🍤 蝦蝦果園自動澆水", subtitle, message, { "url": "shopeetw://" });
}

// ================== 初始化檢查 ==================
async function preCheck() {
  const shopeeInfo = getSavedData("ShopeeInfo");
  if (Object.keys(shopeeInfo).length === 0) {
    throw ["檢查失敗 ‼️", "找不到必要憑證"];
  }

  const cookies = Object.entries(shopeeInfo.token)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  return {
    headers: {
      "Cookie": cookies,
      "Content-Type": "application/json",
      "X-Requested-With": "com.shopee.tw"
    },
    farmInfo: getSavedData("ShopeeFarmInfo")
  };
}

// ================== 澆水核心邏輯 ==================
async function waterPlant(config) {
  const cropInfo = config.farmInfo.currentCrop;
  if (!cropInfo || cropInfo.cropId === 0) {
    notify("澆水中斷", "目前沒有可澆水的作物");
    return;
  }

  const response = await $http.post({
    url: `https://${CONFIG.api_host}/farm/api/orchard/crop/water`,
    headers: config.headers,
    body: {
      cropId: cropInfo.cropId,
      resourceId: cropInfo.resourceId,
      s: cropInfo.s
    }
  });

  if (response.statusCode !== 200) {
    throw [`HTTP 錯誤`, `狀態碼: ${response.statusCode}`];
  }

  const data = response.data;
  if (data.code !== 0) {
    handleErrorCode(data.code, data.msg);
    return;
  }

  const result = {
    state: data.data.crop.state,
    used: data.data.useNumber,
    remain: data.data.crop.meta.config.levelConfig[data.data.crop.state.toString()].exp - data.data.crop.exp
  };

  notify("澆水成功", `本次使用 ${result.used} 滴水💧\n距離下一階段還需 ${result.remain} 滴`);
}

// ================== 錯誤代碼處理 ==================
function handleErrorCode(code, msg) {
  const errorMap = {
    409000: ["水量不足", "水壺已空需補充"],
    403005: ["狀態錯誤", "請先手動澆水一次"],
    409004: ["作物異常", "請檢查是否已收成"]
  };
  
  if (errorMap[code]) {
    throw errorMap[code];
  }
  throw ["操作失敗", `錯誤代碼: ${code}\n${msg}`];
}

// ================== 主執行流程 ==================
async function main() {
  try {
    const config = await preCheck();
    await waterPlant(config);
  } catch (error) {
    if (Array.isArray(error)) {
      notify(error[0], error[1]);
    } else {
      notify("未知錯誤", error.message);
    }
  }
  $done();
}

// ================== 定時任務控制 ==================
let retryCount = 0;
function scheduleTask() {
  main().finally(() => {
    const delay = CONFIG.check_interval + Math.random() * 30000;
    setTimeout(scheduleTask, delay);
    
    if (retryCount++ >= CONFIG.max_retries) {
      notify("系統警告", "已達最大重試次數，請檢查設定");
      $done();
    }
  });
}

// ================== 初始化執行 ==================
scheduleTask();

function surgeNotify(subtitle = '', message = '') {
  $notify('🍤 蝦蝦果園作物資料', subtitle, message, { 'url': 'shopeetw://' });
};

function handleError(error) {
  if (Array.isArray(error)) {
    console.log(`❌ ${error[0]} ${error[1]}`);
    if (showNotification) {
      surgeNotify(error[0], error[1]);
    }
  } else {
    console.log(`❌ ${error}`);
    if (showNotification) {
      surgeNotify(error);
    }
  }
}

function isManualRun(checkRequest = false, checkResponse = false) {
  if (checkRequest) {
    return typeof $request === 'undefined' || ($request.body && JSON.parse($request.body).foo === 'bar');
  }
  if (checkResponse) {
    return typeof $response === 'undefined' || ($response.body && JSON.parse($response.body).foo === 'bar');
  }
  return false;
}

function getSaveObject(key) {
  const string = $prefs.valueForKey(key);
  return !string || string.length === 0 ? {} : JSON.parse(string);
}

async function getCropData() {
  return new Promise((resolve, reject) => {
    try {
      const body = JSON.parse($request.body);
      console.log(JSON.stringify(body));
      // 必須包含所有欄位
      if (body && body.cropId && body.resourceId && body.s && body.device_id && body.security_dfp) {
        let shopeeFarmInfo = getSaveObject('ShopeeFarmInfo');
        // 完整存入
        shopeeFarmInfo.currentCrop = {
          cropId: body.cropId,
          resourceId: body.resourceId,
          s: body.s,
          device_id: body.device_id,
          security_dfp: body.security_dfp
        };
        const save = $prefs.setValueForKey(JSON.stringify(shopeeFarmInfo, null, 4), 'ShopeeFarmInfo');
        if (!save) {
          return reject(['保存失敗 ‼️', '無法儲存作物資料']);
        }
        console.log('作物資料:', JSON.stringify(shopeeFarmInfo.currentCrop));
        return resolve();
      } else {
        return reject(['作物資料儲存失敗 ‼️', '缺少必要欄位，請重新獲得 Cookie 後再嘗試']);
      }
    } catch (error) {
      return reject(['保存失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ 蝦蝦果園作物資料 v20240530.1');
  try {
    if (isManualRun(true, false)) {
      throw '請勿手動執行此腳本';
    }
    await getCropData();
    console.log('✅ 作物資料保存成功');
    surgeNotify(`作物資料保存成功 🌱`, '');
  } catch (error) {
    handleError(error);
  }
  $done({});
})();

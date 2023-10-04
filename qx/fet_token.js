let showNotification = true;
let config = null;

function surgeNotify(subtitle = '', message = '') {
  $notify('遠傳心生活取得 token', subtitle, message, { 'url': '' });
};

function getSaveObject(key) {
  const string = $prefs.valueForKey(key);
  return !string || string.length === 0 ? {} : JSON.parse(string);
}

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object ? true : false;
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

async function getToken() {
  return new Promise((resolve, reject) => {
    try {
      if ($response.status !== 200) {
        return reject(['發生錯誤 ‼️', 'token 已失效或過期']);
      } else {
        const obj = JSON.parse($response.body);
        if (obj && obj.access_token && obj.refresh_token) {
          const info = {
            'accessToken': obj.access_token,
            'refreshToken': obj.refresh_token,
            'userId': 0
          };
          config = info;
          const save = $prefs.setValueForKey(JSON.stringify(info, null, 4), 'FetSuperAppInfo');
          if (!save) {
            return reject(['保存失敗 ‼️', '請刪除「遠傳心生活」，重新安裝並登入後再試一次。']);
          } else {
            return resolve();
          }
        } else {
          return reject(['保存失敗 ‼️', '找不到 token，請刪除「遠傳心生活」，重新安裝並登入後再試一次。']);
        }
      }
    } catch (error) {
      return reject(['保存失敗 ‼️', error]);
    }
  });
}

function getUserLevel() {
  return new Promise((resolve, reject) => {
    try {
      const headers = {
        Authorization: 'Bearer ' + config.accessToken,
      };
      const request = {
        method: 'GET',
        url: 'https://dspapi.fetnet.net:1443/dsp/api/superapp-middle/fcms/member/level?client_id=78df8f6d-eb06-4405-a0c9-b56c45335307',
        headers: headers,
        redirect: 'follow'
    };
    $task.fetch(request)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (data.result?.responseBody?.fetUnifyId) {
            config.userId = data.result.responseBody.fetUnifyId;
            const save = $prefs.setValueForKey(JSON.stringify(config, null, 4), 'FetSuperAppInfo');
            if (save) {
              return resolve();
            } else {
              return reject(['保存使用者 ID 失敗 ‼️', '無法儲存 ID']);
            }
          } else {
            return reject(['保存使用者 ID 失敗 ‼️', '找不到使用者 ID']);
          }
        })
        .catch((error) => {
          return reject(['保存使用者 ID 失敗 ‼️', error.message]);
        });
    } catch (error) {
      return reject(['保存使用者 ID 失敗 ‼️', error]);
    }
  });
}

(async () => {
  console.log('ℹ️ 遠傳心生活取得 token v20230119.2');
  try {
    if (isManualRun(false, true)) {
      throw '請勿手動執行此腳本';
    }

    await getToken();
    console.log('✅ token 保存成功');
    await getUserLevel();
    console.log('✅ 使用者 ID 保存成功');
    surgeNotify(
      '保存成功 🍪',
      '請先關閉本模組，再刪除「遠傳心生活」並重新安裝，以避免 session 衝突。'
    );
    $done({});
  } catch (error) {
    console.log(`❌ ${error[0]} ${error[1]}`);
    if (showNotification) {
      shopeeNotify(error[0], error[1]);
    }
  }
  $done({});
})();
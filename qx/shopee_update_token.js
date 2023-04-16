
let showNotification = true;
let config = null;

function surgeNotify(subtitle = '', message = '') {
  $notification.post('更新 token', subtitle, message, { 'url': 'shopeetw://' });
};

function handleError(error) {
  if (Array.isArray(error)) {
    console.log(`�� ${error[0]} ${error[1]}`);
    if (showNotification) {
      surgeNotify(error[0], error[1]);
    }
  } else {
    console.log(`�� ${error}`);
    if (showNotification) {
      surgeNotify(error);
    }
  }
}

function getSaveObject(key) {
  const string = $prefs.valueForKey(key);
  return !string || string.length === 0 ? {} : JSON.parse(string);
}

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0 && obj.constructor === Object ? true : false;
}

function parseCookie(cookieString) {
  return cookieString
    .split(';')
    .map(v => v.split('='))
    .filter((v) => v.length > 1)
    .reduce((acc, v) => {
      let value = decodeURIComponent(v[1].trim());
      for (let index = 2; index < v.length; index++) {
        if (v[index] === '') {
          value += '=';
        }
      }
      acc[decodeURIComponent(v[0].trim())] = value;
      return acc;
    }, {});
}

function cookieToString(cookieObject) {
  let string = '';
  for (const [key, value] of Object.entries(cookieObject)) {
    // SPC_EC �血��惩�
    if (key !== 'SPC_EC') {
      string += `${key}=${value};`
    }
  }
  return string;
}

async function updateSpcEc() {
  return new Promise((resolve, reject) => {
    let shopeeInfo = getSaveObject('ShopeeInfo');
    if (isEmptyObject(shopeeInfo)) {
      return reject(['更新token失敗', '無法更新 token']);
    }

    const request = {
      url: 'https://mall.shopee.tw/api/v4/client/refresh',
      headers: {
        'Cookie': `shopee_token=${shopeeInfo.shopeeToken};`,
        'Content-Type': 'application/json',
      },
    };

    try {
      $task.get(request, function (error, response, data) {
        if (error) {
          return reject(['無法 SPC_EC 憭望� �潘�', '����航炊']);
        } else {
          if (response.status == 200) {
            const obj = JSON.parse(data);
            if (obj.error) {
              return reject(['取得 SPC_EC 憭望� �潘�', '隢钅��啣�敺� token']);
            }
            const cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
            if (cookie) {
              const filteredCookie = cookie.replaceAll('HttpOnly;', '').replaceAll('Secure,', '');
              const cookieObject = parseCookie(filteredCookie);
              return resolve(cookieObject.SPC_EC);
            } else {
              return reject(['取得 SPC_EC 憭望� �潘�', '�曆��啣��厩� token']);
            }
          } else {
            return reject(['取得 SPC_EC 憭望� �潘�', response.status]);
          }
        }
      });
    } catch (error) {
      return reject(['取得 SPC_EC 憭望� �潘�', error]);
    }
  });
}

async function updateCookie(spcEc) {
  return new Promise((resolve, reject) => {
    try {
      let shopeeInfo = getSaveObject('ShopeeInfo');
      if (isEmptyObject(shopeeInfo)) {
        return reject(['無法 token 取得', '無法取得 token']);
      }

      const request = {
        url: 'https://shopee.tw/api/v2/user/account_info?from_wallet=false&skip_address=1&need_cart=1',
        headers: {
          'Cookie': `${cookieToString(shopeeInfo.token)}SPC_EC=${spcEc};shopee_token=${shopeeInfo.shopeeToken};`,
        },
      };

      
      $task.fetch(request).then((error, response, data) =>{
        if (error) {
          return reject(['無法 token 重新嘗試', '無法取得token']);
        } else {
          if (response.status == 200) {
            const obj = JSON.parse(data);
            if (obj.error) {
              return reject(['失敗 token 重新獲取', '重新獲取 token']);
            }
            const cookie = response.headers['Set-Cookie'] || response.headers['set-cookie'];
            if (cookie) {
              const filteredCookie = cookie.replaceAll('HttpOnly;', '').replaceAll('Secure,', '');
              const cookieObject = parseCookie(filteredCookie);
              const tokenInfo = {
                SPC_EC: spcEc,
                SPC_R_T_ID: cookieObject.SPC_R_T_ID,
                SPC_R_T_IV: cookieObject.SPC_R_T_IV,
                SPC_SI: cookieObject.SPC_SI,
                SPC_ST: cookieObject.SPC_ST,
                SPC_T_ID: cookieObject.SPC_T_ID,
                SPC_T_IV: cookieObject.SPC_T_IV,
                SPC_F: cookieObject.SPC_F,
                SPC_U: cookieObject.SPC_U,
              };
              if (shopeeInfo.token.SPC_EC === tokenInfo.SPC_EC) {
                console.log('�𩤃� SPC_EC �啗��批捆銝��湛�銝行𧊋�湔鰵');
              }
              if (shopeeInfo.token.SPC_R_T_ID === tokenInfo.SPC_R_T_ID) {
                console.log('�𩤃� SPC_R_T_ID �啗��批捆銝��湛�銝行𧊋�湔鰵');
              }
              if (shopeeInfo.token.SPC_R_T_IV === tokenInfo.SPC_R_T_IV) {
                console.log('�𩤃� SPC_R_T_IV �啗��批捆銝��湛�銝行𧊋�湔鰵');
              }
              if (shopeeInfo.token.SPC_SI === tokenInfo.SPC_SI) {
                console.log('�𩤃� SPC_SI �啗��批捆銝��湛�銝行𧊋�湔鰵');
              }
              if (shopeeInfo.token.SPC_ST === tokenInfo.SPC_ST) {
                console.log('�𩤃� SPC_ST �啗��批捆銝��湛�銝行𧊋�湔鰵');
              }
              if (shopeeInfo.token.SPC_T_ID === tokenInfo.SPC_T_ID) {
                console.log('�𩤃� SPC_T_ID �啗��批捆銝��湛�銝行𧊋�湔鰵');
              }
              if (shopeeInfo.token.SPC_T_IV === tokenInfo.SPC_T_IV) {
                console.log('�𩤃� SPC_T_IV �啗��批捆銝��湛�銝行𧊋�湔鰵');
              }

              shopeeInfo.token = tokenInfo;
              const save = $prefs.setValueForKey(JSON.stringify(shopeeInfo, null, 4), 'ShopeeInfo');
              if (!save) {
                return reject(['靽嘥�憭望� �潘�', '�⊥��脣� token']);
              } else {
                return resolve();
              }
            } else {
              return reject(['�湔鰵 token 憭望� �潘�', '�曆��啣��喟� token']);
            }
          } else {
            return reject(['�湔鰵 token 憭望� �潘�', response.status])
          }
        }
      });
    } catch (error) {
      return reject(['�湔鰵 token 憭望� �潘�', error]);
    }
  });
}

async function deleteOldKeys() {
  return new Promise((resolve, reject) => {
    try {
      $prefs.setValueForKey(null, 'CSRFTokenSP');
      $prefs.setValueForKey(null, 'CookieSP');
      $prefs.setValueForKey(null, 'SPC_EC');
      $prefs.setValueForKey(null, 'ShopeeToken');
      $prefs.setValueForKey(null, 'Shopee_SPC_U');
      return resolve();
    } catch (error) {
      return reject(['錯誤的 key 重新', error]);
    }
  });
}

(async () => {
  console.log('更新 token v20230131.1');
  try {
    await deleteOldKeys();
    console.log('重新獲取key ');
    const spcEc = await updateSpcEc();
    console.log(' SPC_EC 重新');
    await updateCookie(spcEc);
    console.log('更新 token 成功');
    $done();
  } catch (error) {
    handleError(error);
  }
  $done();
})();

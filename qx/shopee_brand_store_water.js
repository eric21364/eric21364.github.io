let showNotification = true;
let config = null;

function surgeNotify(subtitle = '', message = '') {
    $notify('🍤 蝦蝦果園品牌商店水滴', subtitle, message, { 'url': 'shopeetw://' });
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

function getSaveObject(key) {
    const string = $prefs.valueForKey(key);
    return !string || string.length === 0 ? {} : JSON.parse(string);
}

function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object ? true : false;
}

function cookieToString(cookieObject) {
    let string = '';
    for (const [key, value] of Object.entries(cookieObject)) {
        string += `${key}=${value};`
    }
    return string;
}

function aesEncrypt(string, key, iv) {
    const aesKey = CryptoJS.enc.Utf8.parse(key);
    const aesIv = CryptoJS.enc.Utf8.parse(iv);
    const aesConfig = { iv: aesIv, mode: CryptoJS.mode.CBC, pad: CryptoJS.pad.Pkcs7 };
    return CryptoJS.AES.encrypt(string, aesKey, aesConfig).toString();
}

function genKeyIv(token, offset) {
    let chars = ''
    for (let i = 0; i < token.length; i++) {
        const char = token.charCodeAt(i);
        const nextChar = token.charCodeAt((i + offset) % token.length);
        const hexChar = (char ^ nextChar).toString(16);
        chars += hexChar.length === 1 ? ('0' + hexChar) : hexChar;
    }
    return CryptoJS.MD5(CryptoJS.enc.Hex.parse(chars)).toString().substring(8, 24);
}

function getTask(url) {
    let activityId = '';
    const re = url.includes('taskId=') ? /taskId=(.*)&/i : /taskId%3D(.*)%26/i;
    const found = url.match(re);
    activityId = found[1];

    return activityId;
}

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
            'Content-Type': 'application/json',
        }
        config = {
            shopeeInfo: shopeeInfo,
            shopeeFarmInfo: shopeeFarmInfo,
            shopeeHeaders: shopeeHeaders,
        }
        return resolve();
    });
}

async function getBrandList() {
    return new Promise((resolve, reject) => {
        try {
            const request = {
                mothod: 'GET',
                url: 'https://games.shopee.tw/farm/api/brands_ads/task/list',
                headers: config.shopeeHeaders,
            };

            $task.fetch(request).then(response => {
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    if (obj.code === 0) {
                        let brandStores = [];
                        const Tasks = obj.data.userTasks.concat(obj.data.shopAdsTask);
                        for (const store of Tasks) {
                            if (store.taskFinishStatus <= 4) {
                                const storeInfo = store.taskInfo
                                const storeUserName = store.rcmd_shop_info ? store.rcmd_shop_info.shop_user_name : storeInfo.taskName;
                                const moduleId = store.taskInfo.moduleId.toString();
                                console.log(`ℹ️ 找到品牌商店：${storeInfo.taskName}`);

                                const taskId = getTask(storeInfo.ctaUrl)
                                brandStores.push({
                                    'shop_id': store.shopAdsRcmdShopInfo ? store.shopAdsRcmdShopInfo.rcmdShopInfo.shopId : 0,
                                    'storeName': storeInfo.taskName,
                                    'task_id': taskId,
                                    'module_id': moduleId,
                                    'brandName': storeUserName,
                                    'waterValue': storeInfo.prizeValue
                                });
                            }
                        }
                        if (!brandStores.length) {
                            return reject(['取得品牌商店列表失敗 ‼️', '今天沒有品牌商店水滴活動']);
                        } else {
                            return resolve(brandStores);
                        }
                    } else {
                        return reject(['取得品牌商店列表失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
                    }
                } else {
                    return reject(['取得品牌商店列表失敗 ‼️', response.status]);
                }
            }).catch(error => {
                if (error) {
                    return reject(['取得品牌商店列表失敗 ‼️', error]);
                }
            })


        } catch (error) {
            return reject(['取得品牌商店列表失敗 ‼️', error]);
        }
    });
}


async function getBrandToken(store) {
    return new Promise((resolve, reject) => {
        try {
            const request = {
                mothod: 'GET',
                url: `https://games.shopee.tw/gameplatform/api/v3/task/browse/${store.task_id}?module_id=${store.module_id}`,
                headers: config.shopeeHeaders,
            };

            $task.fetch(request).then(response => {
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    if (obj.code === 0) {
                        console.log(`ℹ️ 取得 ${store.brandName} token 成功：${obj.data.report_token}`);
                        return resolve(obj.data.report_token);
                    } else {
                        return reject([`取得 ${store.brandName} token 失敗 ‼️`, `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
                    }
                } else {
                    return reject([`取得 ${store.brandName} token 失敗 ‼️`, response.status]);
                }
            }).catch(error => {
                if (error) {
                    return reject([`取得 ${store.brandName} token 失敗 ‼️`, '連線錯誤']);
                }
            })
        } catch (error) {
            return reject([`取得 ${store.brandName} token 失敗 ‼️`, error]);
        }
    });
}

async function componentReport(store, token) {
    return new Promise((resolve, reject) => {
        try {

            const request = {
                method: 'POST',
                url: 'https://games.shopee.tw/gameplatform/api/v3/task/component/report',
                headers: config.shopeeHeaders,
                body: JSON.stringify(
                    {
                        'report_token': token,
                    }
                ),
                redirect: 'follow'
            };

            $task.fetch(request).then(response => {
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    store.shop_id = store.shop_id != 0 ? store.shop_id : obj.data.user_task.rcmd_shop_info ? obj.data.user_task.rcmd_shop_info.shop_id : 0;
                    store.task_id = obj.data.user_task.task.id;
                    store.module_id = obj.data.user_task.task.module_id;
                    return resolve(store);
                } else {
                    return reject([`取得品牌商店 ${store.brandName} 活動 ID 失敗 ‼️`, response.statusCode]);
                }
            }).catch(error => {
                if (error) {
                    return reject([`取得品牌商店 ${store.brandName} 水滴失敗 ‼️`, '連線錯誤']);
                }
            })

        } catch (error) {
            return reject([`取得品牌商店 ${store.brandName} 活動 ID 失敗 ‼️`, error]);
        }
    });
}


async function claim(store) {
    return new Promise((resolve, reject) => {
        try {
            const request_id = `__game_platform_task__${store.shop_id}_${parseInt(config.shopeeInfo.token.SPC_U)}_${Math.floor(new Date().getTime())}`;
            const request = {
                method: 'POST',
                url: 'https://games.shopee.tw/farm/api/brands_ads/claim',
                headers: config.shopeeHeaders,
                body: JSON.stringify(
                    {
                        'task_id': store.task_id,
                        'request_id': request_id,
                        'module_id': store.module_id.toString(),
                    }
                ),
                redirect: 'follow',
            };
            console.log(JSON.stringify(request))
            $task.fetch(request).then(response => {
                console.log(JSON.stringify(response))
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    if (obj.code === 0) {
                        return resolve();
                    } else if (obj.code === 409004) {
                        return reject([`取得品牌商店 ${store.brandName} 水滴失敗 ‼️`, '作物狀態錯誤，請檢查是否已收成']);
                    } else if (obj.code === 420101) {
                        console.log(`❌ 取得品牌商店 ${store.brandName} 水滴失敗 ‼️ 今天已領過`);
                        return resolve();
                    } else {
                        return reject([`取得 ${store.brandName} 水滴失敗 ‼️`, `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
                    }
                } else {
                    return reject([`取得品牌商店 ${store.brandName} 活動 ID 失敗 ‼️`, response.status]);
                }
            }).catch(error => {
                if (error) {
                    return reject([`取得品牌商店 ${store.brandName} 水滴失敗 ‼️`, '連線錯誤']);
                }
            })

        } catch (error) {
            return reject([`取得品牌商店 ${store.brandName} 活動 ID 失敗 ‼️`, error]);
        }
    });
}
async function delay(seconds) {
    console.log(`⏰ 等待 ${seconds} 秒`);
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, seconds * 1000);
    });
}

(async () => {
    console.log('ℹ️ 蝦蝦果園自動澆水 v20230214.1');
    try {
        await preCheck();
        console.log('✅ 檢查成功');
        const brandStores = await getBrandList();

        let totalClaimedWater = 0;
        for (const store of brandStores) {
            if (!store.isClaimed) {
                const token = await getBrandToken(store);
                await delay(31);
                let new_store = await componentReport(store, token);
                console.log(JSON.stringify(new_store))
                await claim(new_store);
                otalClaimedWater += store.waterValue;

            } else {
                console.log(`✅ 今天已領過 ${store.brandName} 的水滴`);
            }
        }

        surgeNotify(
            '領取成功 ✅',
            `本次共領取了 ${totalClaimedWater} 滴水 💧`
        );
    } catch (error) {
        handleError(error);
    }
    $done();
})();
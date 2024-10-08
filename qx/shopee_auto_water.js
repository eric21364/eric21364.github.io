let showNotification = true;
let config = null;

function surgeNotify(subtitle = '', message = '') {
    $notify('🍤 蝦蝦果園自動澆水', subtitle, message, { 'url': 'shopeetw://' });
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
            const save = $prefs.setValueForKey(JSON.stringify(shopeeFarmInfo, null, 4), 'ShopeeFarmInfo');
            if (!save) {
                return reject(['保存失敗 ‼️', '無法更新作物資料']);
            } else {
                return resolve();
            }

            return resolve();
        } catch (error) {
            return reject(['刪除舊資料發生錯誤 ‼️', error]);
        }
    });
}

async function water() {
    return new Promise((resolve, reject) => {
        try {
            if (!config.shopeeFarmInfo.currentCrop || config.shopeeFarmInfo.currentCrop.cropId === 0) {
                showNotification = false;
                return reject(['澆水失敗 ‼️', '目前沒有作物']);
            }

            const waterRequest = {
                method: 'POST',
                url: 'https://games.shopee.tw/farm/api/orchard/crop/water',
                headers: config.shopeeHeaders,  // 確保 config.shopeeHeaders 內的 headers 完整
                body: JSON.stringify({
                    cropId: config.shopeeFarmInfo.currentCrop.cropId, // 確認 cropId 存在
                    resourceId: config.shopeeFarmInfo.currentCrop.resourceId, // 確認 resourceId 存在
                    s: config.shopeeFarmInfo.currentCrop.s // 確認 s 存在
                }),
                sessionIndex: 14255
            };
            console.log(JSON.stringify(waterRequest))
            $task.fetch(waterRequest).then(response => {
                console.log(JSON.stringify(response))
                const data = response.body;
                console.log(data);

                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);

                    if (obj.code === 0) {
                        const useNumber = obj.data.useNumber;
                        const state = obj.data.crop.state;
                        const exp = obj.data.crop.exp;
                        const levelExp = obj.data.crop.meta.config.levelConfig[state.toString()].exp;
                        const remain = levelExp - exp;

                        return resolve({
                            state: state,
                            useNumber: useNumber,
                            remain: remain,
                        });
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
            })
                .catch(error => {
                    return reject(['澆水失敗 ‼️', '連線錯誤']);
                });
        }
        catch (e) {
            console.log(e)
        }
    });
}

(async () => {
    console.log('ℹ️ 蝦蝦果園自動澆水 v20230210.1');
    try {
        await preCheck();
        console.log('✅ 檢查成功');
        await deleteOldData();
        console.log('✅ 刪除舊資料成功');
        const result = await water();
        console.log('✅ 澆水成功');

        if (result.state === 3) {
            console.log(`本次澆了： ${result.useNumber} 滴水 💧，剩餘 ${result.remain} 滴水收成`);
        } else {
            console.log(`本次澆了： ${result.useNumber} 滴水 💧，剩餘 ${result.remain} 滴水成長至下一階段`);
        }

        if (result.remain === 0) {
            surgeNotify(
                '澆水成功 ✅',
                '種植完畢，作物可以收成啦 🌳'
            );
        }
    } catch (error) {
        handleError(error);
    }
    $done();
})();

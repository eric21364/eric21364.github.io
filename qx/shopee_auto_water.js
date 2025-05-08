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
            'Cookie': 'ds=8a7735165d22f1efac1f363c26162133; shopee_webUnique_ccd=czq0%2BG9xjer2wmoQmHbHOg%3D%3D%7Cf2NkYH529a11OUgKrxsdaBX0X4UKpTdA7dsSuPMSfWIK2E4W5ue5gzw0I91GHdWneXSPbsAWirwNvSoY6%2BI%3D%7CyDxtIu7cSGe7337j%7C08%7C3; REC7iLP4Q=1cc30d6a-de3a-40c5-8da0-f84b3becf2e7; SPC_AFTID=LAT; SPC_CLIENTID=MjEwQTU3Q0U0OEE1aymnehhpoynetvav; SPC_EC=.VkdTcVpXQnFTZVlseVdaMnt/HcqaX8Hoi2ZcjhSH2fV/ABORJ+WTPWWIOF91nMO8qvjrmDj83P2MRI8g3pYWH0ln6bDc6zCYWAOFwrTtr2g3JPppm07uP6qoblHq+86fo2rlbgHrcNxK8/7Laz1zY7uDglBrZTbqcbu+RX3Q8gYuuD19EUqR39kzcvk6gKZBOlucxN8bm9Hi/uLT1s/sKZ3p6TkEX3kZMNEdU9Sw2c0=; SPC_R_T_ID=nMBsXRn7zjcOUBlVRGbeF3pcPI9yI5ZueGbMIexqeTrRCyW4JRwx2YkvOwsE6c+xGh3UHZ/h78Ihr0ffbZvsu1oDQsdFIC0GEm5I3N5WEtAyFdTEkxyElg5xKYv0YkZj0ITLrwBJjWD8td03fjqsh60BnZ0GHb9czj/qsuXiFJM=; SPC_R_T_IV=MFpCZDlCU1pjcWZ1MkFtUw==; SPC_SI=+hCsZwAAAABqeDUyWTlhZXq5fQAAAAAAQ0FGNlJiS0k=; SPC_ST=.YWNhZGFlQXNqdnBCZWVJMYzqWfeFXxK3gCSa9UVnDZsQfDkZFdvoK9LcqKZemr/tNoETJBMkhSGaQ0+rpyH8i34wrQ4lOxdbGU94RFhDUQjicuA9Bf56xphg+BS76cQToh2Zg0pBGSSt14ndlAtTxPIkPdvucaJSTtK+0f1OZYCCBqJvTJBRNiVYDlT96ldNeJ1heuktVMVQW7TU18jhTe3rB6+mTtJps0Y4BV+LSfw=; SPC_T_ID=nMBsXRn7zjcOUBlVRGbeF3pcPI9yI5ZueGbMIexqeTrRCyW4JRwx2YkvOwsE6c+xGh3UHZ/h78Ihr0ffbZvsu1oDQsdFIC0GEm5I3N5WEtAyFdTEkxyElg5xKYv0YkZj0ITLrwBJjWD8td03fjqsh60BnZ0GHb9czj/qsuXiFJM=; SPC_T_IV=MFpCZDlCU1pjcWZ1MkFtUw==; SPC_U=33906694; SPC_B_SI=f7EAaAAAAABPbFVaZnZ4cr1nHAAAAAAAWVM0WWhhUHc=; shopee_token=EFDH2InsA1tFjF+17stheVsLPX3T/ntOEek8y+flo2Cb9SKUSg352Qyx8OhqIIWwpb4WW08p7CuFqABzmuTU; shopid=33905310; userid=33906694; username=gale1; shopee_app_version=34938; shopee_rn_bundle_version=6056009; shopee_rn_version=1745927938; SPC_F=3EA661251F5F4C0082F22BB49CD6377B; csrftoken=fNu9SY9IFqjkLSdNnMlEv26g7gBtfX9d; SPC_DH=EW0lzFcIYOgLOw09cYKhy+7rmsA0v0fPbkBBCJPkPBtU8bKfITIWXnX7W+VwOvKySIctxmeiqrc5.1k1oklo.ce321c43; SPC_F=3EA661251F5F4C0082F22BB49CD6377B; _fbp=fb.1.1735602404273.988103500278367534; _ga=GA1.1.439103282.1695474550; _ga_E1H7XE0312=GS1.1.1744290653.6.0.1744290653.60.0.0; _gcl_au=1.1.926834546.1744290650; _QPWSDCXHZQA=458ae745-a3ea-49e9-ab63-373336938dc7; REC_T_ID=b8458e8c-9441-11ef-9e34-9ae27ee20269',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Sec-Fetch-Mode':'cors',
            "games-runtime":"EgretH5",
            "Content-Type":"application/json",
"Referer":"https://games.shopee.tw/farm/",
"games-app-version":"34938",
"Accept-Language":"en-US,en;q=0.9",
"game-operation-source":"fruit_farm",
"fruit-version-type":"h5",
"Accept":"*/*",
"games-rn-bundle-version":"6056009",
"games-biz-version":"9.1.0",
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Beeshop locale=zh-Hant version=34938 appver=34938 rnver=1745927938 shopee_rn_bundle_version=6056009 Shopee language=zh-Hant app_type=1 platform=web_ios os_ver=18.4.1'
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

            const crop = config.shopeeFarmInfo.currentCrop;
const waterRequest = {
    method: 'POST',
    url: 'https://games.shopee.tw/farm/api/orchard/crop/water',
    headers: config.shopeeHeaders,
    body: JSON.stringify({
        cropId: crop.cropId,
        resourceId: crop.resourceId,
        s: crop.s,
        device_id: config.shopeeInfo.device_id || '',
        security_dfp: config.shopeeInfo.security_dfp || ''
    })
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

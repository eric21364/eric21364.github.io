let showNotification = true;
let config = null;

function surgeNotify(subtitle = '', message = '') {
    $notify('🍤 蝦蝦果園水滴任務', subtitle, message, { 'url': 'shopeetw://' });
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
            return reject(['檢查失敗 ‼️', '沒有新版 token']);
        }
        const shopeeHeaders = {
            'Cookie': cookieToString(shopeeInfo.token),
            'Content-Type': 'application/json',
        }
        config = {
            shopeeInfo: shopeeInfo,
            shopeeHeaders: shopeeHeaders,
        }
        return resolve();
    });
}

async function checkIn() {
    return new Promise((resolve, reject) => {
        try {
            const request = {
                method: 'POST',
                url: 'https://games.shopee.tw/farm/api/task/action?t=' + new Date().getTime(),
                headers: config.shopeeHeaders,
                body: JSON.stringify({ actionKey: 'act_Check_In' }),
                redirect: 'follow'
            };

            $task.fetch(request).then(response => {
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    if (obj.msg === 'success') {
                        return resolve();
                    } else if (obj.msg === 'false') {
                        return reject(['打卡失敗 ‼️', '每日只能打卡三次，今日已完成打卡任務']);
                    } else if (obj.msg === 'task check in invalid time') {
                        return reject(['打卡失敗 ‼️', '打卡間隔少於三小時']);
                    } else {
                        return reject(['打卡失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
                    }
                } else {
                    return reject(['打卡失敗 ‼️', response.status]);
                }
            }).catch(error => {
                if (error) {
                    return reject(['打卡失敗 ‼️', '連線錯誤']);
                }
            })
        } catch (error) {
            return reject(['打卡失敗 ‼️', error]);
        }
    });
}

(async () => {
    console.log('ℹ️ 蝦蝦果園自動打卡 v20230115.1');
    try {
        await preCheck();
        console.log('✅ 檢查成功');
        await checkIn();
        console.log('✅ 打卡成功');

        surgeNotify('打卡成功 ✅', '');
    } catch (error) {
        handleError(error);
    }
    $done();
})();

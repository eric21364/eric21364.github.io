let showNotification = true;
let config = null;
let buyFreeItemRequest = null;

function surgeNotify(subtitle = '', message = '') {
    $notify('🍤 蝦蝦果園免費道具', subtitle, message, { 'url': 'shopeetw://' });
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

async function getWaterStoreItem() {
    return new Promise((resolve, reject) => {
        try {
            const waterStoreItemListRequest = {
                mothod: 'GET',
                url: `https://games.shopee.tw/farm/api/prop/list?storeType=1&typeId=&isShowRevivalPotion=true&t=${new Date().getTime()}`,
                headers: config.shopeeHeaders,
            };

            $task.fetch(waterStoreItemListRequest).then(response => {
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    if (obj.msg === 'success') {
                        const props = obj.data.props;
                        let found = false;
                        for (const prop of props) {
                            if (prop.price === 0) {
                                found = true;
                                if (prop.buyNum < prop.buyLimit) {
                                    buyFreeItemRequest = {
                                        method: 'POST',
                                        url: `https://games.shopee.tw/farm/api/prop/buy/v2?t=${new Date().getTime()}`,
                                        headers: config.shopeeHeaders,
                                        body: JSON.stringify(
                                            {
                                                propMetaId: prop.propMetaId,
                                            }
                                        ),
                                        redirect: 'follow'
                                    };
                                    return resolve(prop.name);
                                }
                                else {
                                    showNotification = false;
                                    return reject(['沒有可購買的免費道具 ‼️', `本日已購買免費${prop.name}`]);
                                }
                            }
                        }
                        if (!found) {
                            showNotification = false;
                            return reject(['取得道具列表失敗 ‼️', '本日無免費道具']);
                        }
                    } else {
                        return reject(['取得道具列表失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
                    }
                } else {
                    return reject(['取得道具列表失敗 ‼️', response.status]);
                }
            }).catch(error => {
                if (error) {
                    return reject(['取得道具列表失敗 ‼️', '連線錯誤']);
                }
            })
        } catch (error) {
            return reject(['取得道具列表失敗 ‼️', error]);
        }
    });
}

async function buyFreeItem() {
    return new Promise((resolve, reject) => {
        try {

            $task.fetch(buyFreeItemRequest).then(response => {
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    if (obj.msg === 'success') {
                        return resolve();
                    }
                    else if (obj.code === 409049) {
                        return reject(['購買道具失敗 ‼️', `此道具持有數量已滿，請先使用道具再領取。`]);
                    }
                    else {
                        return reject(['購買道具失敗 ‼️', `錯誤代號：${obj.code}，訊息：${obj.msg}`]);
                    }
                } else {
                    return reject(['購買道具失敗 ‼️', response.status]);
                }
            }).catch(error => {
                if (error) {
                    return reject(['購買道具失敗 ‼️', '連線錯誤']);
                }
            })
        } catch (error) {
            return reject(['購買道具失敗 ‼️', error]);
        }
    });
}

(async () => {
    console.log('ℹ️ 蝦蝦果園免費道具 v20230128.1');
    try {
        await preCheck();
        console.log('✅ 檢查成功');
        const itemName = await getWaterStoreItem();
        console.log('✅ 取得特價商店道具列表成功');
        await buyFreeItem();
        console.log('✅ 購買免費道具成功');
        console.log(`ℹ️ 獲得 ${itemName}`);
        surgeNotify(
            '購買免費道具成功 ✅',
            `獲得 👉 ${itemName} 💎`
        );
    } catch (error) {
        handleError(error);
    }
    $done();
})();

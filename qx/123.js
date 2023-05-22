let showNotification = true;
let config = null;
let friends = [];
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
        } catch (error) {
            return reject(['刪除舊資料發生錯誤 ‼️', error]);
        }
    });
}

async function searchFriend() {
    const waterRequest = {
        method: 'GET',
        url: 'https://games.shopee.tw/farm/api/friend/list/get?all=1',
        headers: config.shopeeHeaders,
    };
    $task.fetch(waterRequest).then(response => {
        const data = response.body
        if (response.statusCode == 200) {
            const obj = JSON.parse(data);
            const friend = obj.data.friends;
            for (let i = 0; i < friend.length; i++) {
                if (friend[i].isFarmUser === true && friend[i].hasCrop === 1 && friend[i].interactData.helpThisFriendCnt > 0) {
                    friends.push({
                        friendId: friend[i].id,
                    });
                }
            }
            if (friends.length) {
                console.log(`✅ 取得列表成功，總共有 ${friends.length} 個任務可領取獎勵`);
                return resolve();
            }
            else {
                return reject(['取得列表失敗 ‼️', '沒有可領取的獎勵']);
            }
        } else {
            return reject(['取得列表失敗 ‼️', response.status]);
        }
    }).catch(error => {
        if (error) {
            return reject(['取得好友列表失敗 ‼️', '連線錯誤']);
        }
    })
}

async function searchFriendCrop() {
    for (let i = 0; i < friends.length; i++) {
        const cropRequest = {
            method: 'GET',
            url: 'https://games.shopee.tw/farm/api/friend/orchard/context/get?friendId=' + friends[].friendId,
            headers: config.shopeeHeaders,
        };
        $task.fetch(cropRequest).then(response => {
            const data = response.body
            if (response.statusCode == 200) {
                const obj = JSON.parse(data);
                friends[i] = {
                    friendId,
                    cropsId: obj.data.crops[0].id,
                    userName: obj.data.user.name
                }
            } else {
                return reject(['取得列表失敗 ‼️', response.status]);
            }
        }).catch(error => {
            if (error) {
                return reject(['取得好友列表失敗 ‼️', '連線錯誤']);
            }
        })
    }
}

async function help() {
    return new Promise((resolve, reject) => {
        try {
            for (let i = 0; i < friends.length; i++) {
                const waterRequest = {
                    method: 'POST',
                    url: 'https://games.shopee.tw/farm/api/friend/help',
                    headers: config.shopeeHeaders,
                    body: JSON.stringify(
                        {
                            's': config.shopeeFarmInfo.currentCrop.s,
                            'friendId':friends[i].friendId,
                            'cropId':friends[i].cropsId,
                            'friendName':friends[i].userName
                        }
                    ),
                    redirect: 'follow'
                };
                $task.fetch(waterRequest).then(response => {
                    const data = response.body
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
                        } else if (obj.code === 409002) {
                            showNotification = false;
                            return reject(['澆水失敗 ‼️', '已經幫助過了']);
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
                    if (error) {
                        return reject(['澆水失敗 ‼️', '連線錯誤']);
                    }
                })
            }
        } catch (error) {
            return reject(['澆水失敗 ‼️', error]);
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
        await searchFriend()
        console.log('✅ 尋找朋友成功');
        const result = await help();
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

let showNotification = true;
let config = null;
let friends = [];
let helpFriends = 0;

function surgeNotify(subtitle = '', message = '') {
    $notify('🍤 蝦蝦果園自動幫助澆水', subtitle, message, { 'url': 'shopeetw://' });
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
    return new Promise((resolve, reject) => {
        try {
            const request = {
                method: 'GET',
                url: 'https://games.shopee.tw/farm/api/friend/list/get?all=1',
                headers: config.shopeeHeaders,
                redirect: 'follow'
            };

            $task.fetch(request).then(response => {
                const data = response.body
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    const friend = obj.data.friends;
                    // 紀錄朋友人數
                    for (let i = 0; i < friend.length; i++) {
                        if (friend[i].isFarmUser === true && friend[i].hasCrop === 1 && friend[i].interactData.helpThisFriendCnt == 0) {
                            friends.push({
                                friendId: friend[i].id,
                            });
                        }
                    }
                    if (friends.length) {
                        console.log(`✅ 取得列表成功，總共有 ${friends.length} 個朋友可以澆水`);
                        return resolve(friends);
                    }
                    else {
                        console.log(friends.length)
                        return reject(['取得列表失敗 ‼️', '沒有可領取的獎勵']);
                    }
                } else {
                    return reject(['取得列表失敗 ‼️', response.statusCode]);
                }
            }).catch(error => {
                if (error) {
                    return reject(['取得好友列表失敗 ‼️', '連線錯誤']);
                }
            })
        } catch (error) {
            console.log('error')
        }
    })
}

async function searchFriendCrop(friend) {
    return new Promise((resolve, reject) => {
        const request = {
            method: 'GET',
            url: 'https://games.shopee.tw/farm/api/friend/orchard/context/get?friendId=' + friend.friendId,
            headers: config.shopeeHeaders,
        };
        $task.fetch(request).then(response => {
            const data = response.body
            if (response.statusCode == 200) {
                const obj = JSON.parse(data);
                friend = {
                    friendId: friend.friendId,
                    cropsId: obj.data.crops[0].id,
                    userName: obj.data.user.name
                }

            } else {
                return reject(['取得列表失敗 ‼️', response.status]);
            }
        }).catch(error => {
            if (error) {
                console.log(error)
                return reject(['取得好友列表失敗 ‼️', '連線錯誤']);
            }
        })

        return resolve();
    })
}

async function help(friend) {
    return new Promise((resolve, reject) => {
        try {
            const helpPayload = {
                's': config.shopeeFarmInfo.currentCrop.s,
                'friendId': friend.friendId,
                'cropId': friend.cropsId,
                'friendName': friend.userName,
            };

            const request = {
                method: 'POST',
                url: 'https://games.shopee.tw/farm/api/friend/help',
                headers: config.shopeeHeaders,
                body: JSON.stringify(helpPayload),
                redirect: 'follow',
            };

            $task.fetch(request).then(response => {
                const data = response.body
                console.log(JSON.stringify(response))
                if (response.statusCode == 200) {
                    const obj = JSON.parse(data);
                    if (obj.code === 0) {
                        helpFriends++;
                        console.log(`ℹ️ 已幫 ${friend.userName} 澆水`);
                        return resolve();
                    } else if (obj.code === 409002) {
                        showNotification = false;
                        console.log(`澆水失敗 ‼️,已經幫助過${friend.userName}了`);
                        return resolve(`澆水失敗 ‼️`);
                    } else {
                        return resolve(`澆水失敗 ‼️`);
                    }
                } else {
                    return reject(['幫助澆水失敗 ‼️', response.status]);
                }
            }).catch(error => {
                if (error) {
                    return reject(['幫助澆水失敗 ‼️', '連線錯誤']);
                }
            })
        } catch (error) {
            return reject(['幫助澆水失敗 ‼️', error]);
        }
    });
}


async function toHelpWater() {
    await searchFriend();
    for (let i = 0; i < friends.length; i++) {
        await searchFriendCrop(friends[i])
        await help(friends[i]);
    }
    return;
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
    console.log('ℹ️ 蝦蝦果園自動澆水 v20230210.1');
    try {
        await preCheck();
        console.log('✅ 檢查成功');
        await toHelpWater();
        console.log(`共幫助${helpFriends}人`)
    } catch (error) {
        handleError(error);
    }
    $done();
})();

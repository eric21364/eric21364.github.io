let showNotification = true;

function surgeNotify(subtitle = '', message = '') {
  $notify('快點我！', subtitle, message, { 'url': 'shopeetw://' });
};


(async () => {
  console.log('date for 381');
    console.log(`

老婆 
之前我連續抽中成功的牌
一個是無意義的念頭
一個是我們結婚
還有一個是問著我求婚會不會成功
雖然有段時間了
但一起過著的這幾個月
我們大大小小的事情都發生過了
不論是吵架還是甜蜜
每一件事情都彷彿讓我們在預習著接下來一輩子會發生的事情
雖然生氣但還是想找妳
或許覺得厭煩 但還是很愛妳

求婚雖然不像其他人的一樣甜蜜 慎重 浪漫
但我想的只有與妳一起共享
可能我害羞
也或許是我沒有想法
但我只想與妳獨自在一起的時候講

愛妳😘老婆❤️
我想與妳好好的過完這輩子
讓我們好好的珍惜彼此
過完我們想像中的生活😚`);
    surgeNotify('點我看訊息！', '');
  $done({});
})();

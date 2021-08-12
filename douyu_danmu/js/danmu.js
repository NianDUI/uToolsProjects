/**
 * 斗鱼弹幕工具
 * <p><a href="https://www.cnblogs.com/aadd123/p/14009467.html">通过websocket抓取斗鱼弹幕和礼物消息</a></p>
 * <p><a href="https://github.com/flxxyz/douyudm">基于websocket实时获取斗鱼弹幕</a></p>
 */
/* 其他依赖js */
// token相关方法
document.write('<script src="../js/util/danmu.js"></script>');

const html = $("html");
const roomid = $(".roomid");
const connect = $(".connect");
const disconnect = $(".disconnect");
const legend = $(".legend");

// WebSocket 对象
let ws = null;
// 心跳定时器
const mrkl = "type@=mrkl/";
let mrklTimer = null;

// 按键弹起事件
roomid.keyup(function (e) {
    // 回车
    if (e.keyCode === 13) {
        connect.click();
    }
});
// 连接点击事件
connect.click(() => {
    // 关闭之前的链接
    disconnect.click();
    const fieldset = $(".fieldset");
    // 弹幕服务器随机端口：8501-8506
    const port = "850" + parseInt(Math.random() * 6 + 1);
    // 弹幕服务器地址
    const url = "wss://danmuproxy.douyu.com:" + port;
    // 房间号
    const rid = roomid.val();
    ws = new WebSocket(url);
    // 一个websocket只能接收一种二进制数据，要么是blob，要么是arraybuffer，但是默认是blob，但是我们可以
    // 通过WebSocket对象的一个属性binaryType指定接收的二进制类型。ws.binaryType="arraybuffer";那么这时指定接收的二进制数据就是ArrayBuffer
    ws.binaryType="arraybuffer";
    // 连接成功
    ws.onopen = function () {
        updateLegend("连接成功 " + port);
        // 登录: "type@=loginreq/roomid@=" + rid + "/dfl@=sn@AA=105@ASss@AA=1/username@=88380680/uid@=88380680/ver@=20190610/aver@=218101901/ct@=0/"
        const loginreq = "type@=loginreq/roomid@=" + rid + "/";
        ws.send(msgToArrayBuffer(loginreq));
        // 加入组消息：gid默认1，此处改成 -9999 改成海量弹幕模式
        const joingroup = "type@=joingroup/rid@=" + rid + "/gid@=1/";
        ws.send(msgToArrayBuffer(joingroup));
        // 心跳消息
        ws.send(msgToArrayBuffer(mrkl));
        // 启动心跳定时器
        mrklTimer = window.setInterval("ws.send(msgToArrayBuffer(mrkl));", 45000);
        // 屏蔽礼物消息：
        const dmfbdreq = "type@=dmfbdreq/dfl@=sn@AA=105@ASss@AA=1@AS@Ssn@AA=106@ASss@AA=1@AS@Ssn@AA=107@ASss@AA=1@AS@Ssn@AA=108@ASss@AA=1@AS@Ssn@AA=110@ASss@AA=1@AS@Ssn@AA=901@ASss@AA=1@AS@S/";
        ws.send(msgToArrayBuffer(dmfbdreq));
    }

    // 接收消息处理
    ws.onmessage = function (evt) {
        const msg = parseMsg(arrayBufferToMsg(evt.data));
        if ("chatmsg" === msg.type) {
            // 只输出用户发送的消息
            const spans = '<span class="lv">lv' + msg.level + '</span>' + '<span class="nn">' + msg.nn + '</span>：' + msg.txt;
            fieldset.append('<div class="field-item inline-block">' + spans + '</div>');
            // 适配窗口高度
            fitWindowHeight();
        }
    }

    ws.onerror = function(evt){
        // 如果出现连接、处理、接收、发送数据失败的时候触发onerror事件
        disconnect.click();
        updateLegend("出错！" + evt);
    }

    // //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    // window.onbeforeunload = function () {
    //     ws.close();
    // }
    return false;
});
// 断开连接点击事件
disconnect.click(() => {
    if (ws != null && ws.readyState === 1) {
        // 停止心跳定时器
        window.clearInterval(mrklTimer);
        mrklTimer = null;
        // 退出登录
        const logout = "type@=logout/";
        ws.send(msgToArrayBuffer(logout));
        ws.close();
        ws = null;
        updateLegend("退出登录-断开连接");
    }
    return false;
});

// 适配窗口高度
function fitWindowHeight() {
    let items;
    // html高度 > 可视高度, 并且多余1条(2条以上删除后还能剩下1条, 防止多次调用卡住)
    while (html.height() > document.documentElement.clientHeight && (items = $(".field-item")).length > 1) {
        items.eq(0).remove();
    }
}

// 更新 legend
function updateLegend(msg) {
    legend.text("弹幕 - " + msg);
}
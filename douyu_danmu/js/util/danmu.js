/**
 * 斗鱼弹幕工具
 * <p><a href="https://www.cnblogs.com/aadd123/p/14009467.html">通过websocket抓取斗鱼弹幕和礼物消息</a></p>
 * <p><a href="https://github.com/flxxyz/douyudm">基于websocket实时获取斗鱼弹幕</a></p>
 * <p><a href="https://github.com/flxxyz/douyudm/blob/master/src/packet.js">基于websocket实时获取斗鱼弹幕:packet.js</a></p>
 */
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// 将字符串消息解析 ArrayBuffer, 用于向弹幕服务器发送消息
function msgToArrayBuffer(msg) {
    // Uint8Array
    const msgUint8Array = encoder.encode(msg);
    const byteLength = msgUint8Array.byteLength;
    const size = 4 + 2 + 1 + 1 + byteLength + 1;
    const buffer = new ArrayBuffer(4 + size);
    const dataView = new DataView(buffer);

    // true：以小端方式写入
    // 消息长度。
    dataView.setInt32(0, size, true)
    // 头部-消息长度：4 字节小端整数，表示整条消息（包括自身）长度（字节数）。
    dataView.setInt32(4, size, true)
    // 头部-消息类型：2 字节小端整数，表示消息类型。取值如下：
    //689 客户端发送给弹幕服务器的文本格式数据
    //690 弹幕服务器发送给客户端的文本格式数据。
    //头部-加密字段：暂时未用，默认为 0。头部-保留字段：暂时未用，默认为 0。
    dataView.setInt16(8, 689, true)
    dataView.setInt8(10, 0)
    dataView.setInt8(11, 0)
    // 数据部分：斗鱼独创序列化文本数据，结尾必须为‘\0’。
    for (let i = 0, j = byteLength; i < j; i++) {
        dataView.setUint8(12 + i, msgUint8Array[i]);
    }
    dataView.setInt8(12 + byteLength, 0)
    return buffer;
}

// 将 ArrayBuffer 解析为字符串消息, 用于接收弹幕服务器发送消息
function arrayBufferToMsg(buffer) {
    const dataView = new DataView(buffer);
    // true：以小端方式读取
    // 消息长度
    const size1 = dataView.getInt32(0, true);
    // 头部-消息长度：4 字节小端整数，表示整条消息（包括自身）长度（字节数）。
    const size2 = dataView.getInt32(4, true);
    // 头部-消息类型：2 字节小端整数，表示消息类型。取值如下：
    //689 客户端发送给弹幕服务器的文本格式数据
    //690 弹幕服务器发送给客户端的文本格式数据。
    //头部-加密字段：暂时未用，默认为 0。头部-保留字段：暂时未用，默认为 0。
    const type = dataView.getInt16(8, true);
    // const encryptedField = buffer.getInt8(10);
    // const reservedText = buffer.getInt8(11);
    // 数据部分：斗鱼独创序列化文本数据，结尾必须为‘\0’。
    const msgInt8Array = new Uint8Array(size1 - 4 - 2 - 1 - 1 - 1);
    for (let i = 0, j = msgInt8Array.byteLength; i < j; i++) {
        msgInt8Array[i] = dataView.getUint8(12 + i);
    }
    return decoder.decode(msgInt8Array);
}


// 将字符串消息解析为 json 对象
function parseMsg(msg) {
    // ↓ 297	690	type@=chatmsg/rid@=288016/ct@=1/uid@=358963144/nn@=烟花易冷cold17322/txt@=玩的是自定义吗／？/cid@=5e87fe93079d4499d26b861600000000/ic@=avatar_v3@S202102@S452f3a40f8264d20aa54c4bc5163725b/level@=15/sahf@=0/cst@=1627874185/bnn@=/bl@=0/brid@=0/hc@=/el@=/lk@=/pdg@=91/pdk@=87/ext@=/
    const msgMap = {};
    const split = "@=";
    let index = -1, preIndex;
    while ((index = msg.indexOf('/', preIndex = index + 1)) > -1) {
        // 字符串中还存在'/', 并将上一个的索引值 + 1 复制给 preIndex
        const item = msg.substring(preIndex, index);
        // 判断消息是否为正常的消息
        const i = item.indexOf(split);
        if (i > -1) {
            // 消息正常，解析放入
            const key = item.substring(0, i);
            msgMap[key] = item.substring(i + split.length);
        } else {
            // 消息不正常，直接放入
            msgMap[item] = item;
        }
    }
    // 返回解析后的消息
    return msgMap;
}
/* 系统 */
// 插件装载成功回调方法
const pluginReadyCallbacks = [];

/**
 * 设置插件装载成功回调
 * @param callback function 回调函数
 */
function putPluginReadyCallback(callback) {
    pluginReadyCallbacks.push(callback);
}

// 当插件装载成功，uTools 将会主动调用这个方法（生命周期内仅调用一次），所有的 api 都应该在 onPluginReady 之后进行调用
utools.onPluginReady(() => {
    for (const callback of pluginReadyCallbacks) {
        callback();
    }
})

// 显示系统通知
function showNotification(body, clickFeatureCode) {
    utools.showNotification(body, clickFeatureCode);
}

/***************uTools DB API：dbStorage***************/

// 在 本地数据库 api 基础上封装的值键对存储方式，供快速使用。
/**
 * 键值对存储，如果键名存在，则更新其对应的值
 *
 * @param key String 键名(同时为文档ID)
 * @param value Any 键值(任意类型)
 */
function setItem(key, value) {
    utools.dbStorage.setItem(key, value);
}

/**
 * 获取键名对应的值
 *
 * @param key String 键名(同时为文档ID)
 * @param defaultValue Any 默认值
 * @returns Any
 */
function getItem(key, defaultValue) {
    const value = utools.dbStorage.getItem(key);
    if (value == null) {
        // 获取值为null，返回默认值
        return defaultValue;
    }
    return value;
}

/**
 * 删除键值对(删除文档)
 *
 * @param key String 键名(同时为文档ID)
 */
function removeItem(key) {
    utools.dbStorage.removeItem('pai')
}
/* 系统 */

// 显示系统通知
function showNotification(body, clickFeatureCode) {
    utools.showNotification(body, clickFeatureCode);
}

// 无 UI 模式
window.exports = {
    "mybatislogformat": { // 注意：键对应的是 plugin.json 中的 features.code
        mode: "none",  // 用于无需 UI 显示，执行一些简单的代码
        args: {
            // 进入插件时调用
            enter: (action) => {
                // code 类型 内容
                // action = { code, type, payload }
                // 执行该方法将会隐藏 uTools 主窗口，包括此时正在主窗口运行的插件，分离的插件不会被隐藏。
                window.utools.hideMainWindow();
                // 处理Mybatis sql日志
                processMybatisSqlLog(action);
                // 执行该方法将会退出当前插件。（插件进入后台，进程并未结束）
                window.utools.outPlugin();
            }
        }
    }
}

// 处理Mybatis sql日志
function processMybatisSqlLog(action) {
    // 选中的sql日志
    const sqlLog = action.payload;
    /************** Preparing 声明部分 **************/
        // preparing 开始索引
    let preparingStart = sqlLog.indexOf("Preparing:");
    if (preparingStart < 0) {
        // 不存在 "Preparing:" 退出
        return;
    }
    preparingStart += 10;
    // preparing 结束索引
    let preparingEnd = sqlLog.indexOf("\n", preparingStart);
    if (preparingEnd < 0) {
        // 没有参数行 复制并退出
        utools.copyText(sqlLog.substr(preparingStart).trim());
        return;
    }
    // 截取 preparing
    let preparing = sqlLog.substring(preparingStart, preparingEnd).trim();
    preparingEnd += 1;
    /************** Parameters 参数部分 **************/
        // parameters 开始索引
    let parametersStart = sqlLog.indexOf("Parameters:", preparingEnd);
    if (parametersStart < 0) {
        // 不存在 "Parameters:" 复制并退出
        utools.copyText(preparing);
        return;
    }
    parametersStart += 11;
    // parameters 结束索引
    let parametersEnd = sqlLog.indexOf("\n", parametersStart);
    parametersEnd = parametersEnd < 0 ? sqlLog.length : parametersEnd;
    // 截取 parameters
    let parameters = sqlLog.substring(parametersStart, parametersEnd).trim();
    if (parameters.length === 0) {
        // parameters 参数为空 复制并退出
        utools.copyText(preparing);
    }
    // 参数不为空处理
    // 拆分声明，连接一个字符方式以" ?"结尾
    const preparingArray = splitPreparing(preparing + "/");
    // 拆分参数
    const parametersArray = splitParameters(parameters);
    // 组装sql
    const sql = assemblySql(preparingArray, parametersArray);
    // 复制并退出，去除最后一个多余字符
    utools.copyText(sql.substring(0, sql.length - 1));
}

// 拆分声明
function splitPreparing(preparing) {
    return preparing.split(" ?");
}

// 拆分参数
function splitParameters(parameters) {
    // 整理结尾
    if (parameters.endsWith(",")) {
        parameters += " ";
    } else if (!parameters.endsWith(", ")) {
        parameters += ", ";
    }
    // 替换null的，使其可以拆分
    parameters = parameters.replaceAll(" null, ", " null), ");
    // 拆分
    const parametersArray = parameters.split("), ");
    // 移除数组末尾无用最后一项
    parametersArray.pop();
    // 处理每个参数
    for (let i = 0; i < parametersArray.length; i++) {
        let parameter = parametersArray[i].trim();
        if ("null" === parameter) {
            continue;
        }
        const lastIndexOf = parameter.lastIndexOf("(");
        if (lastIndexOf >= 0) {
            // 类型
            let type = parameter.substring(lastIndexOf + 1);
            // 参数
            parameter = parameter.substring(0, lastIndexOf);
            switch (type) {
                case "Byte":
                case "Short":
                case "Integer":
                case "Long":
                case "Float":
                case "Double":
                case "Boolean":
                    parametersArray[i] = parameter;
                    break;
                default:
                    // Character、String、Data、Timestamp、PgArray...
                    parametersArray[i] = "'" + parameter + "'";
                    break;
            }

        }
    }

    return parametersArray;
}

// 组装sql
function assemblySql(preparingArray, parametersArray) {
    const length = Math.min(preparingArray.length - 1, parametersArray.length);
    let sql = preparingArray[0];
    let i = 0;
    for (; i < length; i++) {
        sql += " " + parametersArray[i] + preparingArray[i + 1];
    }
    for (i++; i < preparingArray.length; i++) {
        sql += " ?" + preparingArray[i];
    }
    return sql;
}


const net = require("net");
const { FRP_TYPE, frpWrite, frpRead } = require("./common");

const requestFn = (port, frpData, userClient) => {
    // 接收请求
    // 创建http服务
    let now = Date.now();
    let len = 0;
    let httpClient = net.createConnection({ port }, () => {
        console.log("httpClient 发送数据");
        httpClient.write(frpData.data);
    });
    httpClient.on("data", (data) => {
        let buffStr = data.toString("utf8");
        if (len > 0) {
            len = len - data.length;
            userClient.write(data);
            if (len <= 0) {
                httpClient.end();
            }
            return;
        }
        if (buffStr.startsWith("HTTP")) {
            let header = {};
            let index = buffStr.indexOf("\r\n\r\n");
            let bodyStr = buffStr.substring(index + 4);

            let wrStr = "";
            buffStr
                .substring(0, index)
                .split("\r\n")
                .map((str, i) => {
                    if (i > 0) {
                        let index = str.indexOf(": ");
                        let key = str.substring(0, index);
                        header[key] = str.substring(index + 2);
                        if (key === "Content-Length") {
                            str = "";
                        }
                    }
                    if (str) {
                        wrStr += str + "\r\n";
                    }
                });
            // 203779
            // 138347
            if (header["Content-Length"]) {
                len = header["Content-Length"] - Buffer.from(bodyStr, "utf8").length;
            }
            wrStr += "\r\n" + bodyStr;
            let bodyLen = len + Buffer.from(wrStr, "utf8").length;
            frpWrite(userClient, frpData.id, FRP_TYPE.RESPONSE, wrStr, bodyLen);
        } else {
            throw new Error("异常");
        }
    });
    httpClient.on("error", (error) => {
        console.log("httpClient 客户端连接失败", error);
    });
    httpClient.on("end", () => {
        console.log("httpClient 客户端连接结束", Date.now() - now);
    });
};
const start = function (port, ip, local_port) {
    if (!ip || !port || !local_port) {
        console.log(chalk.red("参数错误，必须包含服务端ip,服务端端口，本地转发端口3个参数"));
        return;
    }

    let userClient = net.createConnection({ port: port, host: ip }, () => {
        // 发起注册
        console.log("客户端发起注册");
        frpWrite(userClient, "", FRP_TYPE.REGISTER);
    });
    userClient.on("data", (data) => {
        let context = data.toString();
        console.log("接收服务端消息");
        if (context.startsWith("NFRP")) {
            let frpData = frpRead(context);
            if (frpData.type == FRP_TYPE.REGISTER) {
                if (frpData.data.includes("success")) {
                    console.log("客户端注册成功");
                } else {
                    console.log("客户端已经被注册");
                    userClient.end();
                }
            } else if (frpData.type == FRP_TYPE.REQUEST) {
                requestFn(local_port, frpData, userClient);
            }
        } else {
            console.log("请求格式错误");
        }
    });
    userClient.on("error", (error) => {
        console.log("客户端连接失败", error);
    });
    userClient.on("end", () => {
        console.log("客户端连接结束");
    });
};

module.exports = start;

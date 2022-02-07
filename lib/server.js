const net = require("net");
const chalk = require("chalk");
const { FRP_TYPE, FRP_LEN, frpWrite, frpRead } = require("./common");

const start = function (port) {
    if (!port) {
        console.log(chalk.red("参数错误，必须包含服务端端口"));
        return;
    }

    var userClient = null;
    var reqClient = {};
    var currentHttpClient = null;

    // 远程监听访问 用于穿透
    const server = net.createServer((socket) => {
        let id = [socket.remoteAddress, socket.remoteFamily, socket.remotePort].join("_").padEnd(32, "0");
        socket.on("data", (data) => {
            let context = data.toString("utf8");
            if (context.startsWith("NFRP")) {
                let frpData = frpRead(context);
                if (frpData.type == FRP_TYPE.REGISTER) {
                    if (userClient) {
                        console.log(`客户端已经被注册`);
                        frpWrite(userClient, "", FRP_TYPE.REGISTER, "error");
                    } else {
                        console.log(`客户端注册成功`);
                        userClient = socket;
                        userClient.id = id;
                        frpWrite(userClient, "", FRP_TYPE.REGISTER, "success");
                    }
                } else if (frpData.type == FRP_TYPE.RESPONSE) {
                    // 60为NFRP协议长度
                    if (data.length - FRP_LEN < frpData.length) {
                        currentHttpClient = {
                            id: frpData.id,
                            length: frpData.length - data.length + FRP_LEN,
                            sk: reqClient[frpData.id],
                        };
                        reqClient[frpData.id].write(frpData.data);
                    } else {
                        reqClient[frpData.id].write(frpData.data);
                        reqClient[frpData.id].end();
                    }
                }
            } else if (
                userClient &&
                (context.startsWith("GET") ||
                    context.startsWith("POST") ||
                    context.startsWith("HEAD") ||
                    context.startsWith("OPTIONS") ||
                    context.startsWith("PUT") ||
                    context.startsWith("DELETE"))
            ) {
                reqClient[id] = socket;
                frpWrite(userClient, id, FRP_TYPE.REQUEST, context);
            } else if (currentHttpClient) {
                currentHttpClient.length = currentHttpClient.length - data.length;
                reqClient[currentHttpClient.id].write(data);
                if (currentHttpClient.length <= 0) {
                    reqClient[currentHttpClient.id].end();
                    delete reqClient[currentHttpClient.id];
                    currentHttpClient = null;
                }
            } else {
                socket.end();
            }
        });
        socket.on("error", (err) => {
            console.log(`服务端socket报错,客户端${id}`, err);
        });
        socket.on("end", (data) => {
            if (userClient && userClient.id === id) {
                userClient = null;
            }
            console.log(`客户端${id}下线`);
        });
    });
    // 启动服务端监听
    server.listen(port, function () {
        console.log(`服务启动成功 ${port}`);
    });
};

module.exports = start;

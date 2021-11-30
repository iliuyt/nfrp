const net = require("net");
const chalk = require('chalk');
const program = require("commander");

const start = function (port) {
    if (!port) {
        console.log(chalk.red("参数错误，必须包含服务端端口"));
        return;
    }

    var userClient = null;
    var reqClient = {};
    // 远程监听访问 用于穿透
    const server = net.createServer((socket) => {
        let id = [socket.remoteAddress, socket.remoteFamily, socket.remotePort].join("_");
        console.log(`[${new Date().toLocaleString()}] ${socket.remoteAddress}:${socket.remotePort} 上线...`);

        socket.on("data", (data) => {
            let isUserClient = true;
            let context = data.toString();
            try {
                context = JSON.parse(data);
            } catch (error) {
                isUserClient = false;
            }

            if (!isUserClient) {
                // request 接受请求
                if (userClient) {
                    reqClient[id] = socket;
                    userClient.write(
                        JSON.stringify({
                            id,
                            type: "request",
                            data: context,
                        })
                    );
                } else {
                    socket.write("客户端未注册");
                    socket.end();
                }
                return;
            }

            if (context.type == "register") {
                if (userClient) {
                    console.log(`客户端已经被注册`);
                    return socket.write(
                        JSON.stringify({
                            type: "register",
                            data: "error",
                            message: "客户端已经被注册",
                        })
                    );
                }
                // 客户端注册
                userClient = socket;
                userClient.id = id;
                return socket.write(
                    JSON.stringify({
                        type: "register",
                        data: "success",
                    })
                );
            } else if (context.type == "response") {
                console.log(context);
                // 回复请求
                reqClient[context.id].write(context.data);
                reqClient[context.id].end();
                return;
            }
        });
        socket.on("error", (err) => {
            console.log(`服务端socket报错,客户端${id}`, err);
        });
        socket.on("end", (data) => {
            if (userClient.id == id) {
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

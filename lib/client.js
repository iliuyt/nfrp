const net = require("net");
const program = require("commander");

const start = function (port, ip, local_port) {
    if (!ip || !port || !local_port) {
        console.log(chalk.red("参数错误，必须包含服务端ip,服务端端口，本地转发端口3个参数"));
        return;
    }

    let userClient = net.createConnection({ port: port, host: ip }, () => {
        // 发起注册
        console.log("客户端发起注册");
        userClient.write(
            JSON.stringify({
                type: "register",
            })
        );
    });

    userClient.on("data", (data) => {
        let context = data.toString();
        console.log("接收服务端消息", context);

        try {
            context = JSON.parse(data);
        } catch (error) {
            console.log("服务的消息格式错误");
            // 关闭客户端
            userClient.end();
            return;
        }

        if (context.type == "register") {
            if (context.data === "success") {
                console.log("客户端注册成功");
            } else {
                console.log(context.message);
                userClient.end();
            }
        } else if (context.type == "request") {
            // 接收请求
            // 创建http服务
            let httpClient = net.createConnection({ port: local_port }, () => {
                console.log("httpClient 发送数据");
                httpClient.write(context.data);
            });
            httpClient.on("data", (data) => {
                console.log("httpClient 接受数据", data.toString());
                userClient.write(
                    JSON.stringify({
                        id: context.id,
                        type: "response",
                        data: data.toString(),
                    })
                );
                httpClient.end();
            });
            httpClient.on("error", (error) => {
                console.log("httpClient 客户端连接失败", error);
            });
            httpClient.on("end", () => {
                console.log("httpClient 客户端连接结束");
            });
            return;
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
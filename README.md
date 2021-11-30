## NFRP

nfrp是使用nodejs编写的一个简单的frp内外穿透项目，目前只实现文本基本的传输，二进制传输会有问题.

本项目初衷是希望将线上环境流量导入本地进行测试，使用frp进行本机与服务器nginx的穿透连接，使用nodejs进行开发frp，
一个是为了了解frp的原理，另一个是为了能够更加定制化的实现自己的需求。

### 启动服务端

```
nfrp server 10001
```

### 启动客户端

```
nfrp client 127.0.0.1 10001 3000
```



## Licence

[MIT License](https://github.com/iliuyt/nfrp/blob/master/LICENSE)
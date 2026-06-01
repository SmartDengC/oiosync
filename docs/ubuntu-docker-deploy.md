# OIO Sync Ubuntu Docker 部署文档

本文档基于当前仓库结构编写，适用于将 `OIO Sync` 部署到一台 Ubuntu 服务器，并通过 Docker Compose 同时启动前端 `apps/web` 和后端 `apps/mock-api`。

## 1. 部署架构

- `web`：Vue 3 + Vite 构建后的静态页面，由 Nginx 容器提供访问
- `mock-api`：Node.js + Express API 服务
- `mock_api_data`：Docker volume，用于持久化音频文件和 `records.json`

浏览器统一访问 `web` 容器，Nginx 会将以下请求转发到 `mock-api`：

- `/api/*`
- `/generated-audio/*`
- `/mock-downloads/*`
- `/health`

## 2. 服务器准备

建议 Ubuntu 版本：

- Ubuntu 22.04 LTS
- Ubuntu 24.04 LTS

建议服务器最低配置：

- 2 vCPU
- 2 GB RAM
- 10 GB 以上可用磁盘

安装 Docker 与 Docker Compose：

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

可选：将当前用户加入 `docker` 用户组，避免每次都写 `sudo`：

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 3. 拉取项目代码

```bash
git clone <你的仓库地址> oiosync
cd oiosync
```

如果代码已经在服务器上，只需要进入项目目录即可。

## 4. 配置环境变量

后端容器默认会读取 `apps/mock-api/.env`。

先复制示例文件：

```bash
cp apps/mock-api/.env.example apps/mock-api/.env
```

示例内容如下：

```env
MIMO_API_KEY=your_mimo_api_key
MIMO_TTS_MODEL=mimo-v2.5-tts
```

说明：

- `MIMO_API_KEY`：可选。如果不配置，系统会自动走 mock 语音生成流程
- `MIMO_TTS_MODEL`：可选，默认使用 `mimo-v2.5-tts`

如果你暂时不想接入真实 TTS，也可以保留空值，例如：

```env
MIMO_API_KEY=
MIMO_TTS_MODEL=mimo-v2.5-tts
```

## 5. 启动服务

首次部署：

```bash
docker compose up -d --build
```

如果 80 端口已被占用，可以改为 8080：

```bash
WEB_PORT=8080 docker compose up -d --build
```

查看容器状态：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f web
docker compose logs -f mock-api
```

## 6. 访问与验证

浏览器访问：

- `http://<服务器IP>/`
- 或 `http://<你的域名>/`

健康检查：

```bash
curl http://127.0.0.1/health
```

返回类似下面内容表示后端已正常联通：

```json
{"ok":true}
```

如果你将端口改成了 8080，则使用：

```bash
curl http://127.0.0.1:8080/health
```

## 7. 数据持久化

后端生成的音频和记录文件会保存到 Docker volume `mock_api_data` 中，不会因为容器重建而丢失。

容器内对应目录：

```text
/app/apps/mock-api/generated-audio
```

其中主要包含：

- 音频文件，如 `2026-06-01-001.wav`
- 元数据文件 `records.json`

查看 volume：

```bash
docker volume ls
```

## 8. 日常运维命令

停止服务：

```bash
docker compose down
```

停止服务但保留数据卷是默认行为，不会删除音频数据。

重新启动：

```bash
docker compose up -d
```

更新代码后重新部署：

```bash
git pull
docker compose up -d --build
```

查看最近 200 行日志：

```bash
docker compose logs --tail=200 web
docker compose logs --tail=200 mock-api
```

进入后端容器排查问题：

```bash
docker compose exec mock-api sh
```

## 9. 备份与恢复

### 备份音频数据

先找到 volume 对应目录：

```bash
docker volume inspect mock_api_data
```

常见做法是把 `_data` 目录打包备份，或者复制到对象存储/备份盘。

### 恢复数据

恢复时只需要将备份内容放回 `mock_api_data` 对应的 `_data` 目录，然后重启服务：

```bash
docker compose restart mock-api
```

## 10. 域名与 HTTPS 建议

如果用于正式环境，建议至少做下面两件事：

- 域名解析到 Ubuntu 服务器公网 IP
- 在服务器前再加一层 HTTPS 入口，例如 Nginx、Caddy 或云厂商负载均衡

如果当前阶段只是内网测试或原型验证，直接暴露 `80` 端口即可。

## 11. 常见问题

### 1. `docker compose up -d --build` 失败

优先检查：

- 服务器是否可以访问 Docker Hub
- 80 端口是否被占用
- `apps/mock-api/.env` 是否存在

### 2. 页面能打开，但接口报错

排查顺序：

```bash
docker compose ps
docker compose logs --tail=200 mock-api
curl http://127.0.0.1/health
```

### 3. 真实 TTS 没生效

检查：

- `apps/mock-api/.env` 中是否正确配置了 `MIMO_API_KEY`
- 服务器是否可以访问外部 TTS 接口
- `mock-api` 容器日志里是否有调用失败信息

### 4. 音频数据丢失

通常是因为误删了 Docker volume。执行 `docker compose down` 不会删除 volume，但执行带 `-v` 的命令会：

```bash
docker compose down -v
```

正式环境请避免随意执行这条命令。

## 12. 推荐部署目录

推荐将项目放在类似下面的位置：

```text
/srv/oiosync
```

例如：

```bash
sudo mkdir -p /srv/oiosync
sudo chown -R $USER:$USER /srv/oiosync
cd /srv/oiosync
git clone <你的仓库地址> .
```

这样后续升级、备份和运维会更清晰。


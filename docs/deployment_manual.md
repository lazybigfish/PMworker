# 部署手册 (Deployment Manual)

## 1. 环境要求
- **操作系统**: Linux (Ubuntu 20.04+) / Windows Server
- **Node.js**: v18.0.0+
- **Database**: SQLite (默认) 或 PostgreSQL (生产建议)
- **Nginx**: 用于反向代理

## 2. 后端部署 (Server)
1. 进入 `server` 目录:
   ```bash
   cd server
   ```
2. 安装依赖:
   ```bash
   npm install
   ```
3. 启动服务:
   ```bash
   # 开发模式
   node index.js
   
   # 生产模式 (使用 PM2)
   npm install -g pm2
   pm2 start index.js --name "pm-server"
   ```
4. 验证:
   访问 `http://localhost:3001/api/projects` 确认返回JSON数据。

## 3. 前端部署 (Client)
1. 进入 `client` 目录:
   ```bash
   cd client
   ```
2. 安装依赖:
   ```bash
   npm install
   ```
3. 构建生产包:
   ```bash
   npm run build
   ```
   构建产物位于 `dist` 目录。

4. 部署到 Nginx:
   配置 Nginx 指向 `dist` 目录，并设置 API 代理。
   ```nginx
   server {
       listen 80;
       server_name pm.yourcompany.com;

       location / {
           root /path/to/pm-system/client/dist;
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
       }
   }
   ```

## 4. 数据库备份与恢复
- **SQLite**: 直接备份 `server/pm_system.db` 文件。
- **PostgreSQL**: 使用 `pg_dump` 工具。

## 5. 常见问题
- **PowerShell 脚本执行错误**: 
  如果在 Windows PowerShell 中运行 `npm` 报错 "无法加载文件...因为在此系统上禁止运行脚本"，请执行以下命令临时解除限制：
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
  ```
- **甘特图加载慢**: 检查 `task_dependencies` 表索引是否创建。
- **文件上传失败**: 检查 `server/uploads` 目录是否有写入权限。

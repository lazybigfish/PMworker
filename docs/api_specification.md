# RESTful API 规范 (RESTful API Specification)

## 1. 认证 (Authentication)
所有API需在Header中包含 `Authorization: Bearer <token>`。

### POST /api/auth/login
- **Request**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "token": "...", "user": { ... } }`

## 2. 项目管理 (Projects)

### GET /api/projects
- 获取当前用户相关的所有项目列表。
- **Params**: `?status=EXECUTING`

### POST /api/projects
- 创建新项目。
- **Body**: `{ "name": "...", "template_id": 1, ... }`
- **Note**: 如果指定 `template_id`，系统将根据模板自动生成初始任务清单。

### GET /api/projects/:id/dashboard
- 获取项目健康度、燃尽图数据、风险概览。

## 3. 任务管理 & 甘特图 (Tasks & Gantt)

### GET /api/projects/:id/tasks
- 获取项目所有任务（用于甘特图渲染）。
- **Response**:
```json
[
  {
    "id": 1,
    "name": "获取项目建设基础材料",
    "phase": "进场前",
    "start_date": "2023-10-01",
    "duration": 5,
    "dependencies": [ ... ]
  }
]
```

### POST /api/tasks
- 创建任务。

### PUT /api/tasks/:id
- 更新任务状态、进度、时间。
- **Body**: `{ "start_date": "...", "duration": 3, "progress": 50 }`
- **Trigger**: 更新时间后，后端需重新计算后续任务的预计开始时间（如果存在FS依赖）。

### POST /api/tasks/:id/assign
- 分配任务。
- **Body**: `{ "user_id": 5 }`

### POST /api/tasks/:id/status
- 变更状态（生命周期流转）。
- **Body**: `{ "status": "EXECUTING" }`

## 4. 依赖关系 (Dependencies)

### POST /api/dependencies
- 创建任务依赖。
- **Body**: `{ "predecessorId": 1, "successorId": 2, "type": "FS" }`

## 5. 协作 (Collaboration)

### POST /api/tasks/:id/comments
- 添加评论。

### POST /api/tasks/:id/attachments
- 上传附件。

## 6. 错误码 (Error Codes)
- 400: Bad Request (参数错误)
- 401: Unauthorized (未登录)
- 403: Forbidden (权限不足，如成员尝试删除项目)
- 404: Not Found
- 500: Internal Server Error

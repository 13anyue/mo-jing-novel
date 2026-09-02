# 墨境 v37 变更记录

## 本轮目标
将剧情运行页从旧式后台卡片重写为场景优先的高级视觉小说界面，并保持原有 Runtime / NPC / 世界书 / 记忆 / Regex / API 能力可继续使用。

## 新增
- `js/runtime-v7.js`
  - 场景优先运行页渲染
  - 顶部世界/场景信息与存档/设置
  - 右侧群像、地图、回顾、更多操作
  - 大型角色立绘区与沉浸式对话框
  - 自由文本输入、生成选项、继续、重写
  - 返回与设置关闭入口
  - 将提示词注入统一为：小助手 > 预设 > 世界书 > 长期记忆
- `css/runtime-v7.css`
  - 全屏场景背景
  - 暗色玻璃拟态、金色重点色
  - 桌面端右侧操作轨
  - 移动端底部输入与响应式布局

## Loader
- `js/data.js` 升级到 v37
- 加载 `css/runtime-v7.css` 与 `js/runtime-v7.js`

## 兼容策略
Runtime v7 不删除旧业务 API；通过重绘运行页与包装 `APISettings.chat` 的方式，将额外上下文注入现有 AI 请求。

## 检查说明
已进行源码级接口/ID/调用链检查：运行页保留 `vnBg`、`vnCharLayer`、`vnDialogBox`、`vnSpeaker`、`vnDialogText`、`vnLoading`、`rt_input` 等现有 Runtime 关键节点。

GitHub Pages 浏览器端当前不能作为已验证条件；因此本次不声称线上浏览器运行测试通过。
# 墨境 V36 / V7 修改汇总包

## 当前版本
- branch: `main`
- HEAD: `98a1a55656c634a8963ce5fcb800c835cbf24297`
- latest feature: `feat: enable v7 immersive novel UI`

## 本轮上下文修改范围
以下变更从 `6bf1a485b656f054c964bc7f23a096f87a1bffe0` 到当前 HEAD，共 16 个连续提交；GitHub compare 显示 8 个最终受影响文件：

- `css/platform-v2-fix.css`
- `css/platform-v2.css`
- `css/platform-v6.css`
- `css/platform-v7.css`
- `js/data.js`
- `js/platform-v2-fix.js`
- `js/platform-v6-qa.js`
- `js/platform-v6.js`

## 功能层
- 统一高级互动文游视觉平台壳
- v6 全局路由、返回、取消、Esc、移动端导航
- v6 业务 DOM 保留策略，避免旧壳搬移节点导致功能失效
- 禁用破坏性 legacy Scene Pages 渲染链
- v6 QA / 自愈检查：关键模块、重复壳、DOM 异常、JS error、Promise rejection
- v7 沉浸式视觉小说运行舞台
- 剧情页面全屏化、对白层、自由输入层、移动端适配
- 深色墨色 / 羊皮纸 / 金色高级文游视觉体系
- 长记忆、世界状态、群像、素材、助手等已有能力继续保留

## 关键提交链
1. `6bf1a485b656f054c964bc7f23a096f87a1bffe0` — feat: add long memory v2 media studio and assistant workspace
2. `2f93cbb0d159fd431124f06c2a11d5a7d5d3450d` — style: add universal visual novel platform capability UI
3. `e02cca8d08329e7c02d3d32f1f7a1c05d2a2a52f` — feat: load platform v2 capability layer
4. `dbb2d044cd3be6b6eaf0f0f5828c134b1e216d1b` — fix: migrate legacy memory and add platform hub access
5. `c974adab0a15ebd94e57bb130128955e9b201b46` — style: add floating creator hub button
6. `f90a892b55ea7a3307392570307bfcd1fa380dad` — fix: finalize platform capability bootstrap
7. `96d20f90e4c3f1e0f51a53ce892fc209948c9f3c` — feat: add full visual novel platform v6 skin
8. `6294c4626ed8ca06d43bee128dc3044877b8e013` — feat: rewrite navigation and all page chrome as v6 visual novel platform
9. `28c6a191357e7a4a463cc426b2efc0730fcf0ce6` — feat: load platform v6 as final unified visual novel shell
10. `77a09b48b7d3a0a49b27c78893c41e87eef4ea85` — fix: preserve business DOM while applying v6 platform shell
11. `a9a44a690c3bbcc4e9a627f4d0e9d4156708531f` — fix: remove duplicate legacy chrome and keep one unified platform
12. `49f70e123b44ae7020545369212a7ec388901626` — feat: add platform v6 runtime QA and self-healing checks
13. `ab1fce6bf30d83f1413546bfe68d47396dff87bd` — chore: load platform v6 runtime QA
14. `e0d682f88f497424dd8741a071721273291b1688` — fix: disable destructive legacy scene page renderer
15. `28569984a6e51044713a728c882b99d112923979` — refactor: harden v6 navigation and immersive platform chrome
16. `454585af64915714887ce47019203e37cfe2491e` — feat: add v7 immersive visual novel styling
17. `98a1a55656c634a8963ce5fcb800c835cbf24297` — feat: enable v7 immersive novel UI

## 发布 / 打包说明
当前 `main` 已包含上述修改。由于当前 GitHub 写入接口只支持 UTF-8 文本文件，不能直接把二进制 ZIP 作为仓库文件上传；因此本文件作为可追溯的变更清单。需要完整工程 ZIP 时，应直接下载当前 `main` 的 GitHub source archive；它会包含这里列出的全部修改。

## 验证边界
代码已进行结构级检查并保留 QA 自检模块。当前环境无法稳定访问 GitHub Pages 的实时浏览器缓存，因此不能宣称已完成线上浏览器端到端点击测试；GitHub 提交本身已成功写入 `main`。

# Changelog

## v0.3.3 (2026-08-19)

- **彻底按需触发**：宽度未命中移动端查询（>820px）时插件整套不运行——
  不注入任何样式、不跑行为块（模型缩写/弹窗重居中）、不起轮询和观察器，
  桌面端零干预；跨过断点自动启停（matchMedia change 监听）
- 模型触发键缩写（Flash/Pro）在插件停止时恢复完整名（原文本存
  `dataset.muiOrig`，stop 时还原），不留痕迹
- `install.sh`：pnpm 装完把 node_modules 里的包替换为指向 `plugins/` 的
  符号链接（`../plugins/<name>`），保证「改 lib/client.js → 刷新页面即
  生效」；并验证链接可解析

## v0.3.2 (2026-08-19)

- 新增 `questionSheet` 块：选项卡片（ask_user_question）移动端两行 footer
  —— 第一行 pager+错误提示，第二行按钮组右对齐；修复窄屏下按钮被卡片
  `overflow:hidden` 裁切、错误提示被挤成竖排撑高 footer 的问题
- 新增 `planReviewSheet` 块：计划审批卡片同样两行 footer，三个按钮窄屏
  可换行堆叠不裁切
- 选项卡片收窄内边距（用满屏幕宽度）、标题/选项/正文长文本断字
- 插件改名为 `dsh-mobile-ui`（去本地 `@dsh-local` scope，公开发布）

## v0.3.1

- 诊断出口 `window.__dshMobileUi`：各块 status/notes 只读快照
- composer 块改为 static（InputBar 模块只有字体规则，派生空转）
- 宿主半 LAN 特权桥整体移除，由 `@dsh-local/dsh-lan-bridge` 接管

## v0.3.0

- 布局状态改用官方 DOM 稳定钩子（`data-sidebar-collapsed`、
  `data-details-collapsed`、`data-composer-seat` 等），不再猜网格列宽
- 哈希类名派生改为逐规则、逐逗号段、逐匹配收集
- 每个 derived 块在样式表未就绪时输出结构选择器兜底
- 手机端输入区分两行（命令/许可/计划 + 模型选择/上下文/发送）
- HTTP（非安全上下文）下为 `crypto.randomUUID` 提供 UUID v4 兜底
- 新增重叠自愈守卫：运行时检测真实重叠，自动把所在 flex 行改换行

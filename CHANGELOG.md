# Changelog

## v0.3.8 (2026-08-24)

- 模型触发键缩写加兜底：除 Flash/Pro/Vision 外的任何其它模型（含未来新增、
  第三方目录）一律缩成 `Model`，触发键永不溢出；官方占位文案（未选模型时的
  "选择模型"/"Select model"）保持原样不被误改

## v0.3.7 (2026-08-24)

- 模型触发键缩写：视觉模型 `DeepSeek-V4-Flash-Vision-Exp` 由 `Flash Vision`
  改为只显示 `Vision`——`Flash Vision` 在窄屏底行仍偏长、会挤出两行，
  `Vision` 更短，与 Flash/Pro 一样单行放下

## v0.3.6 (2026-08-24)

- 新增 `composerRow` 块：官方新的「上下文用量」按钮（ContextMeter）加进输入区
  底行 `.trailing` 后，360px 上下整行被 `flex-wrap` 挤成两行——收紧底行/
  工具行/尾随组间距并微调按钮尺寸，让模型+上下文+停止+发送与左边工具单行放下
- 新增 `contextMeter` 块：ContextMeter 弹窗原为相对触发器右缘、宽 264px 的
  绝对定位，窄屏下会向视口左/右外侧溢出被裁切——手机端改成相对视口的固定
  底部弹层（左右 10px、bottom 安全区、宽度限幅、可滚动），整屏完整可见

## v0.3.5 (2026-08-24)

- 模型触发键缩写支持新的 DeepSeek 官方目录（新增 `DeepSeek-V4-Flash-Vision-Exp`）：
  视觉模型不再被名字里的 `flash` 误缩成 `Flash`，而是缩写为 `Vision`
  （匹配顺序先 vision 再 flash/pro）
- 修复切换模型时「先显示全名、约 1 秒后才变缩写」的延迟：`MutationObserver`
  原先只监听 `childList`，而 React 切换模型是复用文本节点改 `data`
  （`characterData` 变更），被漏掉、要等下一轮轮询。现在订阅 `characterData`，
  模型一改就立即重新缩写
- 缩写改为就地改文本节点 `data`，不再用 `textContent` 整段替换，避免把
  React 持有的文本节点摘掉、导致之后切换模型触发键不再更新

## v0.3.4 (2026-08-19)

- 新增 `messageMeta` 块：消息 meta 行（时间 · 用时 · 首 token · tok/s）
  官方 `white-space:nowrap` 单行，窄屏下必然撑出容器被 `overflow` 裁切
  （手机端常显时「首 token」被截断、桌面 hover 时同样溢出）——窄屏改为
  允许折行 + 断字，actions 行高度同步放开，任何宽度不再溢出、信息完整

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

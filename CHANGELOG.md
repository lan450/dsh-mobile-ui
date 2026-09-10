# Changelog

## v0.3.16 (2026-09-10)

- 修复升级 dsh 0.1.5-rc.1 后手机端（视口 ≤820px）整页白屏：
  - 根因：官方 0.1.5-rc.1 把 AppFrame 第三列类名 `detailsCol` 改名为
    `rightbarCol`（frame 上的属性族也已是 `data-rightbar-*`）。`shell` 块的
    derive() 要求五个条目全齐才算成功，`detailsCol` 派生不到 → 整体返回
    null → 该块全部规则退化到属性选择器兜底。其中隐藏拖拽把手的规则
    `${H} { display: none !important }` 兜底选择器为
    `[data-sidebar-collapsed],[data-details-collapsed] > div:nth-child(n+5)`，
    首段 `[data-sidebar-collapsed]` 单独成段，而 frame 自己就带
    `data-sidebar-collapsed` 属性 → 整个应用框架 display:none，
    页面只剩 #root 之外的鲸鱼余额挂件。
  - 方案：`shell` 块 entries 里 `detailsCol` → `rightbarCol`，build 里
    `c.detailsCol` → `c.rightbarCol`，派生恢复成功，哈希类名选择器接管，
    兜底选择器不再触发。
  - 实测（IAB 390×844 视口，连本机 0.1.5-rc.1）：改前 frame
    `display: none`、#root 内 180 个元素 0 个可见（白屏复现）；改后
    frame `display: grid`、125 个元素可见。
- 修复右栏全屏遮挡（评审发现，同源问题的第二阶段）：
  - 根因：详情列全屏规则 `${F}:not([data-details-collapsed]) ${D}` 里的
    `data-details-collapsed` 在 0.1.5 已随改名变成 `data-rightbar-collapsed`，
    旧属性名恒不存在 → `:not(...)` 恒真 → 通常是空 div 的右栏列在手机端
    永远套上 `position:fixed; inset:0; z-index:25` 的全屏不透明层，
    `elementFromPoint` 实测输入框中心命中的是 `rightbarCol` 而非输入框，
    全页可看不可点。
  - 方案：`:not([data-details-collapsed])` → `:not([data-rightbar-collapsed])`；
    顺带把 F 兜底选择器和 sidebarScrim 的 frame 查询里两处
    `data-details-collapsed` 同步改名。
- 跟进 0.1.5 的两处官方模块迁移（评审发现，均为静默失配→功能退化）：
  - `messageMeta` 块：`MessageIconActions.module.css` 从 `dsh-client-ui-conversation`
    迁到 `dsh-client-ui-chat`，更新 tag 路径（三个类名 `actions/timeStart/timeEnd`
    在新模块里已逐一验证存在）。
  - `exportIcon` 块：`session-log-export` 的 `HeaderAction.module.css` 里
    `sessionLogButton` 更名 `moreButton`（官方已自带 28px 图标化），块改为
    跟随新类名、作为「官方把文字 label 加回来」时的保险。
- 其它：client.js 诊断口的 `version` 串同步 0.3.16。

## v0.3.15 (2026-09-08)

- 修复「内测模型 `deepseek-v4.1-flash-expires-on-0910`（配置名现为 `4.1 Flash`，
  报障时叫 `v4.1-Flash`）在输入区触发键上被缩成 `Flash`，与 `deepseek-v4-flash`
  撞名」：
  - 根因：触发键文字取服务端下发的 `model.name`（即 `~/.dsh/settings.yaml`
    里的 `name:`），而 `modelLabel` 块的缩写是纯正则、第一个命中即生效——
    名字里含 `flash` 就命中 `/flash/i` → `Flash`，版本号 `4.1` 被丢掉。
    这套规则是当初按官方全名（`DeepSeek-V4-Flash` / `DeepSeek-V4-Pro` /
    `DeepSeek-V4-Flash-Vision-Exp`）写的；后来 settings 里的 name 已简化成
    `Flash` / `Pro` / `Vision` / `4.1 Flash`，它就变成对已简化名再缩一遍，
    把用户自己起的短名改坏。
  - 方案：缩写只对**长名**生效（`MAX_SHORT_NAME = 14` 字符以上，即官方全名
    与第三方目录名）；名字本身够短时原样显示。占位文案（`选择模型` /
    `Select model`）永远不动。缩写结果 `Flash`/`Pro`/`Vision`/`Model` 都远短于
    这条线，函数天然幂等，不会把自己的输出再缩一遍；`muiOrig` 原文记录 /
    宽屏恢复逻辑不变。
  - 实测（无头 Chrome 连运行中的 GUI，`is_mobile` 390×844）：
    - 改前：触发键 `aria-label="选择模型，当前 v4.1-Flash，推理等级 High"`，
      可见文字 `Flash`。
    - 改后：可见文字原样显示配置名（测量时为 `4.1 Flash`，`title`/`aria-label`
      同为该名）；在触发键里注入长名 `DeepSeek-V4-Flash-Vision-Exp` 仍被缩成
      `Vision`、`DeepSeek-V4-Pro` 缩成 `Pro`、`DeepSeek-V4-Flash` 缩成 `Flash`、
      `some-random-model-xyz` 缩成 `Model`，占位文案 `选择模型` / `Select model`
      与短名 `Flash-Vision` / `v4.1-Flash` 原样不动——8 条规则逐条实测通过。
    - 宽屏恢复：390px 下注入 `DeepSeek-V4-Pro` → 显示 `Pro`、记下原文；
      拉到 1100px 插件停用 → 恢复 `DeepSeek-V4-Pro`；收回 390px → 重新缩写。
    - 底行宽度：320 / 340 / 360 / 390px 四档（标签 `4.1 Flash` 51px），
      底行高度恒 40px、`scrollWidth === clientWidth`，无换行无横向溢出。
  - 顺带把 `window.__dshMobileUi.version` 从写死的 `0.3.13` 对齐到 `0.3.15`
    （此前与 package.json 不一致）。
  - 只改 `lib/client.js`（浏览器半）与版本号，未改 `dsh.client.inject` 列表——
    无需重启服务，手机刷新页面即生效。

## v0.3.14 (2026-09-05)

- 修复会话页头部「标题短时标准模式挤上第一行」（及长标题时下载按钮掉到第二行）：
  根因是 `flex-wrap` 的**归行发生在 `flex-grow` 之前**，按每一项的
  hypothetical（= `flex-basis`）宽度判断能否放进当前行；`flex-grow` 只负责
  分行后把空位填满，不参与归行。旧写法 `crumbCurrent` 用 `flex:1 1 auto`、
  `headerActions` 用 `flex:0 1 auto`，于是标题短时第一行有空位 →
  headerActions（标准模式+后台任务）被塞进第一行；标题长时其 basis 巨大、
  独占第一行 → 下载按钮掉到第二行。
- 方案（`lib/client.js` 的 `chatLayout` + `subagentLineage` 块）：
  - `crumbCurrent`（及子代理切换器 `.switcherRoot`）改为 `flex:1 1 0`：标题
    只在行内 grow/ellipsis，永不把下载按钮挤下去，下载按钮始终钉在第一行右缘。
  - `headerActions` 改为 `flex:0 1 100%`：强制标准模式+后台任务永远独占一行
    （第二行起），与标题长短无关；它自身带 `flex-wrap`，两按钮可在整行内换行。
- 实测（无头 Chrome 390px，短/中/长标题三档）：标题+下载一定在第一行，
  标准模式+后台任务一定在第二行或以下。
- 只改 `lib/client.js`（浏览器半）与版本号，未改 `dsh.client.inject` 列表——
  无需重启服务，手机刷新页面即生效。

## v0.3.13 (2026-08-26)

- 修复会话页头部「第一行太窄 / 下载按钮被挤到中间行 / 层叠计数放进第一行」：
  原 `chatLayout` 用 flex-wrap + `crumbs(flex:1 1 auto)`，标题面包屑（含
  「N 个子代理」）填满整行后，`headerUtilities`（下载会话按钮）被挤到中间
  独立一行；标题也被层叠计数挤窄（省略号提前截断）。
- 方案：把头部改为真正的两行结构——**第一行只留当前任务名 + 下载会话（最右）**，
  **其余（层叠计数「N 个子代理」/ 子代理父级面包屑 + 标准模式 + 后台任务）从第二行
  开始堆叠**。做法是用 `display:contents` 依次拆平 `titleCluster → crumbs →
  crumbSeg → 层叠包装层(空 div)`，让「当前任务名按钮 / 层叠计数根 / 下载按钮 /
  动作组」成为 `titleRow` 的直接 flex 项，再用 `order` 归行。
- 新增 `subagentLineage` 派生块（`SubagentHeaderLineage.module.css`）：子代理
  **切换器**（当前子代理任务名）留在第一行随下载按钮同行；普通「N 个子代理」
  层叠计数挪到第二行。
- 实测（无头 Chrome 390px）：
  - 主会话：`标题 + 下载按钮` 第一行，`/ N 个子代理` 第二行，`标准模式 +
    N 个后台任务运行中` 第三行，标题不再被截断。
  - 点进子代理会话：`子代理任务名 + 下载按钮` 第一行，`父级面包屑 /` 第二行，
    `标准模式 + 后台任务` 第三行。
- 只改 `lib/client.js`（浏览器半）、`package.json` 版本号，未改
  `dsh.client.inject` 列表——无需重启服务，手机刷新页面即生效。

## v0.3.12 (2026-08-26)

- 新增 `jobsMenu` 块：官方「后台任务弹窗」（`@deepseek-ai/dsh-client-ui-jobs`
  的 `JobListAction`）原是绝对定位（`top:calc(100%+5px)`、`left:0`）的下拉列表，
  宽固定 336px。手机会话页里触发键在头部、位置随布局变化，点击后菜单从触发键
  左缘往右铺开、被挤出视口右缘裁切——移动端改成相对视口的固定底部抽屉
  （左右 10px + 底部安全区、限高可滚动、圆角），列表整屏完整可见，与既有
  contextMeter/modelSheet/popupSheet 的底部抽屉风格一致
  - `package.json` 无需新增 inject 依赖（`@deepseek-ai/dsh-client-ui-jobs` 已在
    inject 列表中，其 `JobListAction.module.css` 样式表已就绪）

## v0.3.11 (2026-08-25)

- 修复移动端展开侧栏时 grid 错位：侧栏 `position:absolute` 脱离 grid 流后，
  中间列（会话）落到 0px 首轨而消失、详情列落到满宽中轨盖满整屏，右上角
  露出“关闭详情”X 且点击无效（详情状态本为 0，`closeDetails` 无操作）——
  显式把中间列钉回 2 轨、详情列钉回 3 轨
- 侧栏展开时加半透明遮罩（`frame::after`，`rgba(0,0,0,.4)`、z:14、0.2s 淡入）：
  压暗外侧内容、挡住误触、聚焦抽屉；不用 `backdrop-filter` 模糊（移动端常驻
  重绘耗电，且后面只露 ~90px 边角、模糊零信息价值）
- 新增 `sidebarScrim` 行为块：点在遮罩（侧栏之外）= 收起侧栏，复用官方 toggle
  按钮，侧栏内部点击不误关
- 遮罩下内容不重排：首轨固定 56px（DSH 折叠态 rail 宽），展开抽屉时中间列宽度
  不变（= 视口 − 56px），文字不重新换行，只是被抽屉遮住 + 被遮罩压暗

## v0.3.10 (2026-08-25)

- 目标栏移动端信息架构调整：官方单行“状态标签 + 目标全文(截断) + 按钮”
  在窄屏下目标全文区只剩 0–13px（最多露出半个字）——移动端把 `.objective`
  收起，主栏变成纯粹的状态条 + 操作（label 缩小到 12px、允许省略号兜底，
  360px 视口也单行放下）
- 新增 `goalPopup` 行为块：完整目标内容改为点击“进行中的目标”打开——
  固定底部长文本面板（与其它底部抽屉同风格：左右 10px + 安全区、圆角、
  限高 + 可滚动、遮罩），标题取当前状态（进行中的目标/已暂停的目标），
  正文为完整目标文本（非截断），Esc/遮罩/关闭按钮均可关闭；暂停态与
  活跃态同样生效，编辑态（输入框）不触发，React 重建目标栏后事件委托
  照样命中，宽屏下不运行、无任何残留

## v0.3.9 (2026-08-25)

- 新增 `goalBar` 块：目标栏（"进行中的目标" + 暂停/编辑/废弃）官方
  `bar` 右内边距只有 5px（左 12px），桌面端栏居中收窄、视觉无感；手机上
  整条栏贴近屏幕右缘，最后一个废弃按钮距栏右缘只剩 5px，看起来贴边。
  移动端修复（实测 360/390/430px 下按钮距栏缘/屏缘均为 13/45px）：
  - 右内边距 5px → 12px（与左内边距对称），废弃按钮恢复呼吸感
  - 按钮间距 10px → 8px 微收，给目标文本留空间
  - ≤374px 极窄屏（如 360px 安卓）隐藏装饰性目标图标（goalGlyph），
    固定内容腾出空间、留白不缩水
  - 编辑模式（输入框 + 保存/取消）与暂停态（恢复/编辑/废弃）同样生效
- `package.json` `dsh.client.inject` 增加 `@deepseek-ai/dsh-client-ui-goal`
  （目标栏样式表的加载时序依赖；下一次重启 dsh 服务后生效，未重启时
  派生块靠既有重试机制自动补上，无需人工干预）

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

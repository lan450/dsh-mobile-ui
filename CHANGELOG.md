# Changelog

## v0.3.26 (2026-10-01)

修复：重叠自愈守卫把 `flex-wrap: wrap` 加到**纵向** flex 容器上，撑宽整个会话
列——长命令/长文段不再换行或省略号，整段会话可左右拖动。

- 症状（用户报告）：手机上「看着看着某行命令或某些文段就不换行、不省略号，
  而是把整个屏幕可预览范围撑宽」，DSH 0.2.0-rc.2 之后才出现。
- 根因：守卫 `flexAncestor()` 只看 `display:flex|inline-flex|grid`，**不判断
  `flex-direction`**。两个可交互元素瞬时重叠（加载/流式过程中）时，最近的 flex
  祖先会命中纵向的会话列 `.column`，于是给它加 `.mui-wrap{flex-wrap:wrap!important}`。
  对纵向 flex 容器来说，`flex-wrap:wrap` 会让「行交叉尺寸」从容器宽度变成内容的
  max-content 宽度，`align-items:stretch` 不再把子项钳在列宽内。实测
  `session-0378af4a…`（390px 视口）：`.column` 宽 268px，但进程组行 `O_Ebla_root`
  涨到 546px；会话滚动容器 `overflow-y:auto`（因此 `overflow-x` 计算为 `auto`）
  变成 `scrollWidth 578 / clientWidth 332`，可横向拖 246px。旧实现只加不摘
  （仅在插件卸载的 disposer 里清理），一次瞬时重叠即永久生效到刷新。
  DSH 0.2.0 重写进程行/TextShimmer（`display:inline-grid; width:max-content`）后
  行的固有宽度变大、守卫命中的祖先也变了，因此「最近才出现」。
- 改法（`lib/client.js`）：
  1. `flexAncestor()` → `commonAncestor()` + `markTarget()`：以两个元素的**最低
     共同祖先**为起点向上找容器（旧代码只看 `a` 的祖先，可能根本不含 `b`）；
     横向 flex / grid → `.mui-wrap`（换行，行为不变），纵向 flex → 新的
     `.mui-gap`（只加 `row-gap:6px`，仍能分开重叠的两行，但不取消列宽钳制）。
  2. `[data-chat-flow]`（会话流容器，全部是纵向 flex）任何情况下都不标记。
  3. `containment` 块补 `[data-chat-flow]{flex-wrap:nowrap!important}` 兜底。
  4. disposer 同步清理 `.mui-gap`。
- 实测（Playwright + 运行中 GUI，390px）：
  - 复现会话：修复前 `.column` 带 `mui-wrap`、flex-wrap=wrap、进程组 546px、
    滚动区 578/332；修复后 `.column` 无标记、flex-wrap=nowrap、进程组 268px、
    滚动区 332/332，正文与命令摘要恢复换行/省略号。
  - 15 个会话批量扫描：横向溢出 0 个（修复前 45 个会话中 2 个命中：246px / 2px）。
  - 守卫能力回归（注入两个重叠按钮）：横向 flex 容器仍得到 `.mui-wrap`
    （wrap + row-gap 6px），纵向容器得到 `.mui-gap`（nowrap + row-gap 6px）。
- 说明：`.mui-wrap`/`.mui-gap` 仍保持「只加不摘」——摘除会让仍然重叠的布局在
  wrap/nowrap 之间来回抖动；方向判断已消除唯一的破坏性路径。

## v0.3.25 (2026-09-30)

调整：插件页头部归行方式改版（用户指定）——「标题 + 添加插件」留第一行，
副标题让到第二行。

- v0.3.23 的做法是「工具行整体落到第二行」；用户提出：没有副标题时，标题 +
  按钮本来一行就放得下（实测 40 + 间距 16 + 工具行 140 = 196px，320px 视口
  可用 216px 都够），那就把副标题放第二行，按钮留在第一行。
- 实现：左块（标题/副标题的无类名包装 `div`）`display:contents` 拆平，再用
  `order` 归行——标题 `order:0`、工具行 `order:1`（`flex:0 0 auto` +
  `margin-left:auto` 靠右）、副标题 `order:2`（`flex:1 1 100%` 独占整行）；
  头部 `flex-wrap:wrap` + `align-items:center`。按钮 `flex:none` +
  `white-space:nowrap` 不变。
- 实测（Playwright + 运行中 GUI）：320/360/375/390/414/430/768px —— 第一行
  「标题 + 刷新 + ＋添加插件」（按钮恒 96×32、文字 1 行、右缘贴页面右内边距），
  第二行副标题整行单行，头部高 100px，无横向溢出（`scrollWidth == 视口宽`）。
  副标题换更长的语言（英文）也只是第二行更长，不会再挤压按钮。
- 桌面端（1280px，>820px 门控外）不受影响：`flex-wrap: nowrap`、order 均为
  0，官方原样（头部 904×80）。

## v0.3.24 (2026-09-30)

调整：访问模式「Auto review」→「Auto」（用户指定的简化命名）。

- 该显示名写死在官方 `@deepseek-ai/dsh-client-ui-permission-presets` 的
  客户端字典 `permission.access`（`auto.label`，中英都是 "Auto review"；
  宿主给的预置名对 `auto` 被官方忽略），没有配置出口；`ctx.locale.register`
  对同一 `(ns, locale)` 只允许注册一次、重复注册抛 `already has locale`，
  覆盖字典这条路走不通。
- 改法：包一层 `LocaleRuntime.translate`（`bind(ns)` 缓存的 `t` 最终都走
  实例方法 `this.translate(ns, key, params)`）——`permission.access` 命名
  空间下任何含 "Auto review" 的文案统一缩成 "Auto"，其余命名空间/key 原样
  透传。中英各覆盖 4 条：`auto.label`、`auto.confirm.title`、
  `auto.confirm.description`、`auto.confirm.enable`；`auto.badge`（EXP）与
  `auto.description` 不含该词，保持原样。幂等（HMR 重跑不叠加包裹）。
- 与视口无关（同 favicon 例外，不进 820px 门控）：桌面端的访问模式触发器、
  菜单、二次确认文案同样是 Auto；locale 服务若晚于本插件就绪则轮询补装。
  装没装上见 `window.__dshMobileUi.autoLabel`（"Auto" / "pending"）。
- 实测（Playwright + 运行中 GUI）：390px 与 1280px 打开访问模式菜单，条目
  文案为「Auto EXP」（原「Auto review EXP」）；枚举字典逐条演练确认改写后
  的中英文案（如「确认启用 Auto（实验）？」「启用 Auto」）。只打开菜单、
  未选中任何项，访问模式与会话状态未改动。
- 范围说明：这是本插件第一处「非布局」的官方文案覆盖；桌面端其余零干预的
  原则不变。

## v0.3.23 (2026-09-30)

修复：插件页（左栏「插件」）右上角的「添加插件」按钮在手机上被挤压换行、
加号与文字溢出按钮容器。

- 症状：按钮从 96px 被压到 57–85px（视口 320→57px、360→70px、375→77px、
  390→85px），按钮内文字换行成 2–4 行；而按钮高度是官方固定的 32px，文字
  直接溢出按钮容器外——视觉上「加号 + 添加插件」四个字跑出深色药丸。
  同一行的左侧简介也被挤成两行。
- 根因：官方插件页头部是 `justify-content:space-between` 的**单行 flex 且
  不换行**。桌面 960px 宽绰绰有余，手机上连一行都放不下——实测一行需要
  310px（左块标题+简介 154px + 间距 16px + 工具行 28+16+96=140px），而可用
  宽度只有 320px 视口→216px、360→256、375→271、390→286。官方没有
  `flex-wrap`，两侧按 `flex-shrink` 一起缩水：简介折行；按钮被压到小于自身
  内容宽（96px），文字在按钮内换行，固定 32px 高度装不下 2–4 行。
- 修复（新增 `pluginManagerHead` 派生块，派生自
  `@deepseek-ai/dsh-client-ui-plugin-manager/PluginManagerPage.module.css` 的
  `pageHead`/`toolbar`/`addButton`）：头部允许换行；工具行整体不收缩
  （`flex:0 0 auto`）并用 `margin-left:auto` 靠右——换到第二行仍钉在右缘；
  按钮 `flex:none` + `white-space:nowrap`。放不下时整个工具行（刷新 +
  添加插件）落到第二行，标题/简介与按钮文字都保持单行完整；
  **414px 及以上放得下时维持官方单行布局不变**（实测 414px 头部高 80px，
  仍是一行）。派生失败时退化为 `[data-plugin-panel] > header …` 结构选择器。
- 实测（Playwright + 运行中的 GUI）：320/360/375/390px 竖屏，按钮恒为
  96×32px、文字 1 行、头部两行、工具行右缘与页面右内边距对齐（无横向溢出，
  `scrollWidth == clientWidth`）；414/430/768px 为官方单行布局。
  `window.__dshMobileUi.status.pluginManagerHead` 为 `ok`，其余块状态不变；
  桌面 1280px 本块不注入，官方原样。
- 范围：只改插件页头部这一个点；「添加插件」点击后的安装向导、插件列表、
  卡片、开关等一律未动（安装弹窗实测照常打开）。

## v0.3.22 (2026-09-28)

修复：输入区「访问模式（权限）」弹窗在手机上溢出屏幕右缘，改成与模型选择
弹窗同款的底部抽屉。

- 症状：点输入区底行的权限触发键（盾牌图标），弹出的「仅可查看 / 工作区内
  修改 / 完全权限」列表右侧被切掉——卡片右缘连同选中勾一起跑出视口，被
  `html{overflow-x:hidden}` 裁掉。360px 视口实测菜单右缘 370px，越界 10px；
  375/390px 只是刚好压线，320px 越界 50px。
- 根因：该弹窗由 primitives 的 `Menu` 渲染，官方**没有走 portal**——菜单被
  内联挂在触发键的 `.root` 包装层里，样式是
  `position:absolute; left:0; top:calc(100%+4px); min-width:218px`
  （`_list_1nxmc_8` + `_sideTop_1nxmc_52`，向触发键上方展开）。手机上输入区
  底行的权限触发键偏左（360px 实测 x=152，盾牌图标态宽 44px），218px 从触发键
  **左缘往右**铺开 → 与触发键在屏幕里的位置直接耦合，触发键越靠右溢出越多。
  （会话页/首次进入页都一样；设置页「新会话默认权限」的同一个弹窗走的是
  `_portal_1nxmc_44` 的 fixed 分支并右对齐，不受影响。）
- 修复（新增 `permissionSheet` 派生块）：与 `modelSheet`/`popupSheet` 完全同款
  ——`position:fixed` + 左右 10px + `bottom: calc(10px + env(safe-area-inset-bottom))`
  + 限高 `min(60dvh,520px)` + 18px 圆角 + 上投影 + `z-index:200`，整块相对视口，
  与触发键位置彻底解耦；内层滚动视口（`role="presentation"`）跟着父级限高滚动。
- 定位方式：primitives 打进 `dsh-web-frontend` 静态包，没有
  `data-plugin-css` 样式表，`derive()` 取不到 `_list_1nxmc_8` 这类哈希名。
  改用官方 `PermissionSelect.module.css` 的 `trigger` 类名（可派生）：菜单与
  触发键同挂在 `Menu` 的 `.root` 下互为兄弟，故用
  `:has(> .触发键) > [role="menu"]` 精确命中访问模式这一个弹窗。官方将来若
  把它改成 portal（fixed + `z-index:1100`），该选择器自然失配——那时也不需要
  这条规则了。
- 实测（Playwright + 运行中的 GUI，390/360/320 竖屏 + 740×360 横屏，首次进入页
  与会话页各一遍）：弹窗四边距视口 10px，右缘越界归零，`border-radius:18px`、
  `z-index:200`，与模型抽屉逐项一致；`window.__dshMobileUi.status.permissionSheet`
  为 `ok`。桌面端（1280px）本块不注入，官方原样（absolute / 20px 圆角）。
  「完全权限」的二次确认弹窗（`RiskConfirmation`）实测 360px 下居中、四边 24px，
  无需额外处理。

## v0.3.21 (2026-09-26)

调整：favicon 鲸鱼在方底内缩至 85%（`<g>` 中心缩放，四边各留 7.5% 边距）。
官方 path 本就铺满 50×50 画布，v0.3.20 套上方底后鲸鱼背鳍/尾鳍几乎贴边、
没了呼吸感。仅改内嵌 SVG 字符串（path 数据原样不动），网页内 UI 零接触。

## v0.3.20 (2026-09-26)

新增：favicon 底色补丁。官方 favicon.svg 是透明底鲸鱼（日间黑鲸/夜间白鲸，
靠 SVG 内 `prefers-color-scheme` media query 切换），但 media query 的解析
结果可能与浏览器界面主题脱节（部分手机浏览器如此），透明底让图标色直接
撞上标签栏底色——白鲸落浅色栏上就看丢了。

- 客户端把官方鲸鱼 path 原样包进圆角方形底（rx=10/50），日间白底黑鲸、
  夜间黑底白鲸，底与鲸恒为反色，任何主题组合下都清晰；即便浏览器完全不
  解析 SVG 内的 media query，也会落到日间白底黑鲸这档，依旧可读。
- 实现：整份 SVG data URI 内嵌（零网络请求），原地替换官方
  `<link rel="icon">` 的 href，幂等（HMR 重跑 apply 也安全）；官方 path
  数据逐字节未动。
- 与视口无关、一次性执行，不进 820px 门控：Mac 日间模式的透明底图标同样
  要修；除此之外「桌面端零干预」的原则不变。运行状态在
  `window.__dshMobileUi.favicon`（patched / failed）可查。

## v0.3.19 (2026-09-14)

修复：手机端会话页「对话/轨迹」标签行右端多出一条小白条（会话态正压在鲸鱼
挂件上，看着像鲸鱼图标旁边长了个白条）。这是 0.1.5-rc.1 升级引入的真实断裂点
（同一处 0.1.1-rc.2 上不存在），也是 v0.3.16「0.1.5-rc.1 适配」漏掉的一处。

- 根因（三段叠加，逐段实测）：
  1. **官方改了激活 tab 的下划线偏移。** 0.1.5-rc.1 是
     `.tab{padding:0 0 9px}` + `.tab::after{height:2px;bottom:-1px}`
     （从运行中 GUI 的 CSSOM 读出）；旧版 0.1.1-rc.2 源码是
     `padding-bottom:11px` + `bottom:1px`——下划线在盒**内**，不溢出。
     新版下划线比 tab 盒低 1px → 标签行内容比行内容盒多 1px。
  2. **本插件让标签行成了滚动容器。** `chatLayout` 里 `.tabs` 带
     `overflow-x: auto`（v0.3.2 起），按 CSS 规范另一轴的 `visible` 会计算成
     `auto` → `.tabs` 两轴都是滚动容器，那 1px 溢出就变成一条竖向滚动条。
     实测（Playwright 连运行中的 GUI，360×802）：`.tabs` 高 25px，
     `clientHeight 25 / scrollHeight 26`，`overflow-x/y` 均为 `auto`。
  3. **安卓 Chromium 把自定义滚动条常驻渲染。** 官方全局
     `::-webkit-scrollbar{width:8px}` + `::-webkit-scrollbar-thumb{background:
     var(--dsh-scrollbar-thumb)}`，实测该变量 `#e5e5e5`、`border-radius:4px`
     → 标签行右端画出一条 8×约 23px 的浅色圆角小条（手机截图实测小条
     约 7×23 CSS px、位置 x≈340–347 / 视口 359px，正好等于标签行右缘
     349px 减去滚动条宽度；颜色实测 ≈#e9e5df，与 #e5e5e5 在 JPEG 下一致；
     thumb 高 25²/26≈24px 也对得上）。桌面端不出现：>820px 插件整套不注入，
     且 macOS 用 overlay 滚动条。
  - 为什么看着像挂在鲸鱼上：标签行官方是 `position: relative; z-index: 1`，
    而手机端鲸鱼挂件是 `position: fixed; z-index: 0` → 滚动条画在鲸鱼之上，
    鲸鱼挡不住；会话态鲸鱼又「贴合顶栏」到右上角，正好被这条小条压住。
- 修复（`chatLayout` 的 `.tabs` 规则）：
  - `padding-bottom: 1px`（+ `margin-bottom: -1px` 抵消，头部总高不变）——
    给下划线留出行内 padding 空间，溢出归零，官方 2px 下划线完整、位置不变。
  - `overflow-y: hidden`——竖向兜底：官方以后再把下划线往下挪，也只会裁掉
    超出部分，不会再生成滚动条；标签行不再可竖向滚动。
  - `overflow-x: auto` 保留（标签多时仍可横滑，原功能不减），但加
    `scrollbar-width: none` + `.tabs::-webkit-scrollbar{display:none}` 不再画
    横条——与官方 `.stripTabs` 的写法一致。
- 实测（Playwright 连运行中的 GUI，360×802、插件 0.3.19）：
  `.tabs` `clientHeight == scrollHeight`（26 == 26）、`.tabs` 上
  `offsetWidth - clientWidth == 0`；激活下划线仍在（截图核对「对话」下划线
  2px 完整）；点「轨迹」→ 视图切换正常；头部总高与 0.3.18 一致（标签行
  26px 边框盒 = 内容 25 + padding 1，负 margin 抵消）。

## v0.3.18 (2026-09-10)

dsh 0.1.5-rc.1 适配复核（全量审计）后的收尾版本。结论：**除下面两处收尾外，
插件在 0.1.5-rc.1 上不需要新的适配**（v0.3.16 已修的三处是这次升级仅有的真实
断裂点）。

- 修复：侧栏遮罩「点外侧关闭」可能命中右侧栏的 toggle。
  - 根因：`setupSidebarScrim().closeSidebar()` 用
    `button[aria-label*="侧边栏"]` 取第一个匹配，而官方右栏自己的按钮叫
    「收起右侧边栏 / collapse right sidebar」，同样含关键词。实测 DOM 顺序
    上左栏按钮在前（左栏展开时首个匹配正是「收起侧边栏」），所以此前没暴露，
    但这是靠顺序兜的。
  - 方案：收集全部匹配后排除 `[data-sidebar-right-panel]` 内的按钮，以及
    aria-label 含「右侧/right」的按钮，再取第一个。
  - 实测（Playwright 390×844、is_mobile）：折叠 → 点「打开侧边栏」→ 侧栏列
    56px→301px 展开；点右侧遮罩 → 回到 56px、frame 重新带
    `data-sidebar-collapsed`，行为与改前一致。
- 更正文件头钩子清单：`data-details-collapsed` → `data-rightbar-collapsed`
  （官方 0.1.5 已改名；旧名在官方包里 0 命中，仅注释残留）。
- 复核记录（不改代码，存档备查）：
  - **静态**：15 个 derived 块的 `tag` 与全部 `entries` 在官方 0.1.5-rc.1 包里
    逐一存在（0 个 miss）；插件依赖的 7 个 data-* 钩子
    （sidebar-collapsed / rightbar-collapsed / composer-seat / composer-card /
    chat-flow / conversation-scroll / goal-bar）全部存在。
  - **实机**（Playwright 连运行中的 GUI，390×844、is_mobile、devtools 真事件）：
    首页、会话页、设置页四个 tab、左栏抽屉、右栏详情、模型底部抽屉、
    上下文用量弹层、`/` 命令菜单、轨迹页、统计弹层——每处
    `document.scrollWidth == clientWidth == 390`；会话页一次性扫描 101 个已加载
    官方 CSS 模块，**0 个越界元素**（横向滚动容器内的表格已排除）；无 console /
    page error；底行恒 40px 单行。
  - **软键盘尺寸**：视口压到 500 / 380 高（≈键盘弹起）时，`/` 命令菜单由官方
    自行限高到 204 / 144px，内部 `.viewport` 可滚动（scrollHeight 2584，
    实测滚到 308），不裁切、不出屏。
  - **断点**：1280px 与 821px 完全不注入（无 `dsh-mobile-ui/mobile.css`
    style 标签、status 为空、模型名原样）；820px 起 21 块全 ok。
  - 对一份静态审计（102 个官方 CSS 模块）提出的 13 处疑似风险逐条实机复核：
    轨迹工具条（中文 + `--dsh-content-font-delta-secondary: 8px` 均不溢出）、
    目录选择器（实测单栏 302px，非双栏 524px）、统计弹层（300px 全在视口内，
    无 nowrap 外溢）、`/` 菜单（内部可滚）**均不成立**；tool/skill 的
    `chevronHover` 是官方 hover 图标互换，触屏仍显示 idle 图标，非功能缺失。
  - 未实机复现、留待出现时再处理的候选（不盲改）：QueueDock 排队行
    （`.row{height:36px}` + `.file{flex:0 180px}`）、WorkflowRunPanel 阶段列
    （`width:calc(132px + …)` 固定）、attachment `remove` 18px 热区、
    设置页模型行四列网格、`TrajectoryToolbar` 英文 locale 下的换行余量。

## v0.3.17 (2026-09-10)

- 移除「模型触发键缩写」行为块（`modelLabel` / `setupModelLabelShortener`，
  含 `MAX_SHORT_NAME` 判定、`muiOrig` 原文记录与宽屏恢复）——官方已经自己
  做了窄屏简化，这块逻辑不再有必要，而且在还会显示名字的宽度上会丢信息：
  - 官方 0.1.5-rc.1 的 `ModelSelect.module.css` 里，触发键自己带容器查询
    `@container (width<=360px) { .triggerIcon { display:block }
    .triggerLabel, .triggerEffort { display:none } }`，容器就是它所在的
    输入区底行（`InputBar.module.css` 的 `.row`，`container-type:
    inline-size`；访问模式触发器是同一套写法）。也就是窄屏官方只留图标、
    不留文字。
  - 实测（Playwright 连运行中的 GUI，390×844、is_mobile、插件 0.3.16）：
    底行容器内容宽 **300px** ≤ 360px → `triggerLabel` / `triggerEffort`
    计算样式均为 `display: none`，触发键宽 46px；但插件缩写仍在改那个
    不可见文本节点——`textContent = "Flash"`、`data-mui-orig =
    "DeepSeek-V41-Flash"`，纯空转还往 DOM 上挂脏属性。
  - 同一探针在 700px（仍在 ≤820px 移动端区间、容器 >360px、名字会显示）
    下：触发键可见文字被缩成 `Flash`，而 `aria-label` / `title` 仍是
    `DeepSeek-V41-Flash`——版本号 4.1 被吞掉。移除后此处恢复显示官方原名。
  - 只删行为：`modelSheet` 块的底部抽屉、触发键收窄（`max-width:
    min(240px, 55vw)`）与推理等级徽标隐藏都保留（那些是布局适配，不是改名）。
  - 只改 `lib/client.js`（浏览器半）与版本号，`dsh.client.inject` 列表未动
    ——无需重启服务，手机刷新页面即生效。

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

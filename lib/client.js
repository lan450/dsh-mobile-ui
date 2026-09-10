/**
 * dsh-mobile-ui — browser half (v3).
 *
 * 手机端 UI 适配（重写版）。相对旧 v2 的关键变化：
 *
 *  1. 布局状态不再猜网格列宽，改用官方 DOM 的稳定钩子：
 *     [data-sidebar-collapsed] / [data-rightbar-collapsed]（frame 上，
 *     0.1.5 起由 data-details-collapsed 改名）、
 *     [data-composer-seat] / [data-composer-card] / [data-chat-flow] /
 *     [data-conversation-scroll] / [data-goal-bar]。
 *  2. 哈希类名派生改为「逐规则、逐逗号段、逐匹配」收集，避免漏掉组合
 *     选择器里排在后面的条目（v2 只取每条规则第一个类名）。
 *  3. 每个 derived 块在样式表未就绪时输出结构选择器兜底，手机端至少可用。
 *  4. 手机端输入区分两行：第一行命令/许可/计划，第二行模型选择（模型+推理
 *     等级）+ 上下文 + 发送，避免模型条目和左边按钮重叠。调试徽章已移除。
 *  5. HTTP（非安全上下文）下为 crypto.randomUUID 提供 UUID v4 兜底——
 *     修复工作区选择在 http:// 下报 "crypto.randomUUID is not a function"。
 *  6. 重叠自愈守卫：运行时检测真实发生的按钮/控件重叠，自动把所在 flex 行
 *     改为换行（.mui-wrap），任何屏幕尺寸/字号下组件不再互相重叠。
 *
 *  v3.1：
 *  7. 诊断出口 window.__dshMobileUi：各块 status/notes 只读快照，
 *     排查「某个块没生效」直接看控制台。
 *  8. composer 块改为 static（InputBar 模块只有字体规则，派生空转）。
 *     宿主半的 LAN 桥已整体移除，由 @dsh-local/dsh-lan-bridge 接管。
 *
 *  v3.2：
 *  9. 选项/计划审批卡片（@deepseek-ai/dsh-client-ui-user-questions）移动端
 *     适配：footer 改两行（第一行 pager+错误提示，第二行按钮组右对齐），
 *     修复窄屏按钮被卡片 overflow:hidden 裁切、错误提示竖排撑高 footer；
 *     卡片收窄内边距用满宽度；选项/标题/正文长文本断字。
 *
 *  v3.3：
 *  10. 彻底按需触发：宽度未命中移动端查询（>820px）时整套不运行——
 *      不注入样式、不跑行为块（弹窗重居中/重叠自愈）、不起轮询/观察器，
 *      桌面端零干预；跨过断点自动启停（matchMedia change）。
 *
 *  v0.3.6：
 *  11. 新增 composerRow 块：官方新「上下文用量」按钮（ContextMeter）加进
 *      输入区底行 .trailing 后，360px 上下被 flex-wrap 挤成两行——收紧
 *      底行/工具行/尾随组间距，让模型+上下文+停止+发送与左边工具单行放下。
 *  12. 新增 contextMeter 块：ContextMeter 弹窗原为相对触发器右缘的
 *      264px 绝对定位，窄屏下往视口左/右外溢出被裁切——手机端改成
 *      相对视口的固定底部弹层（左右 10px、bottom 安全区），整屏可见。
 *
 *  v0.3.9：
 *  13. 新增 goalBar 块：目标栏（"进行中的目标" + 暂停/编辑/废弃）官方
 *      bar 右内边距只有 5px（左 12px），桌面端栏居中收窄视觉无感，手机上
 *      整条栏贴近屏右缘时最后一个废弃按钮就显得贴边——移动端右内边距
 *      加大到 12px（与左对齐），按钮离栏缘/屏缘恢复呼吸感。
 *
 *  v0.3.10：
 *  14. 目标栏移动端信息架构调整：官方单行"标签 + 目标全文(截断) + 按钮"
 *      在窄屏下目标全文区只剩 0–13px（最多露出半个字）——移动端把
 *      .objective 收起，主栏变成状态条 + 操作；完整目标改为点击
 *      "进行中的目标"（新 goalPopup 行为块）弹出底部长文本面板。
 *
 *  v0.3.12：
 *  15. 新增 jobsMenu 块：官方「后台任务弹窗」（JobListAction）是绝对定位
 *      （top:calc(100%+5px)、left:0）的下拉列表，宽固定 336px；手机会话页
 *      头部触发键位置随布局变化，点击后菜单从触发键左缘往右铺开、被挤出
 *      视口右缘裁切——移动端改成相对视口的固定底部抽屉（左右 10px + 底部
 *      安全区、限高可滚动、圆角），列表整屏完整可见。
 *
 *  v0.3.13：
 *  16. 修复会话页头部「第一行太窄 / 下载按钮被挤到中间行 / 层叠计数放进
 *      第一行」：原 chatLayout 用 flex-wrap + crumbs(flex:1 1 auto)，标题
 *      面包屑（含「N 个子代理」）填满整行后，headerUtilities（下载会话）
 *      被挤到中间独立一行，标题也被层叠计数挤窄（省略号提前截断）。
 *      改为真正的两行结构——第一行只留当前任务名 + 下载会话（最右），
 *      其余（层叠计数/子代理父级面包屑 + 标准模式 + 后台任务）从第二行
 *      开始堆叠。用 display:contents 依次拆平 titleCluster → crumbs →
 *      crumbSeg → 层叠包装层(空 div)，让 任务名按钮/层叠计数根/下载按钮/
 *      动作组 成为 titleRow 的直接 flex 项，再用 order 归行；
 *      新增 subagentLineage 派生块：子代理切换器（任务名）留在第一行、
 *      普通「N 个子代理」计数挪到第二行。
 *
 *  v0.3.14：
 *  17. 修复「标题短时标准模式挤上第一行」（及长标题时下载按钮掉到第二行）。
 *      根因：flex-wrap 的归行发生在 flex-grow 之前，按每一项的 hypothetical
 *      （=flex-basis）宽度判断能否放进当前行；flex-grow 只负责分行后把空位
 *      填满，不参与归行。旧写法 crumbCurrent flex:1 1 auto / headerActions
 *      flex:0 1 auto，标题短时第一行有空位 → headerActions（标准模式+后台
 *      任务）被塞进第一行；标题长时其 basis 巨大独占第一行 → 下载按钮掉到
 *      第二行。改为：crumbCurrent（及子代理切换器）flex-basis 0，标题只在
 *      行内 grow/ellipsis、永不把下载按钮挤下去；headerActions flex-basis
 *      100%，强制标准模式+后台任务永远独占一行（第二行起），与标题长短无关。
 *
 *  v0.3.17：
 *  18. 移除「模型触发键缩写」行为块（modelLabel / setupModelLabelShortener）。
 *      官方 0.1.5-rc.1 起模型触发键自己做了窄屏简化：它所在的输入区底行
 *      （InputBar .row，container-type: inline-size）容器 inline-size ≤ 360px
 *      时，triggerLabel/triggerEffort 直接 display:none、只留 triggerIcon
 *      （访问模式触发器同一套写法）。手机竖屏实测 390px 视口下底行容器内容
 *      宽 300px —— 模型名压根不显示，缩写是在改一个 display:none 的文本
 *      节点，纯空转；而在 361–820px 这段仍会显示名字的宽度上，缩写反而把
 *      配置名（DeepSeek-V41-Flash）压成 Flash，丢掉版本信息。整套缩写
 *      （含 muiOrig 原文记录/宽屏恢复）删除，触发键文字完全交给官方。
 *
 *  v0.3.18：
 *  19. 0.1.5-rc.1 适配复核后的两处收尾：侧栏遮罩关闭时不再可能命中右侧栏
 *      的 toggle（官方右栏按钮 aria-label 是「收起右侧边栏」，与左栏同含
 *      「侧边栏」关键词，改为排除 [data-sidebar-right-panel] 内与含
 *      「右侧/right」的按钮）；文件头钩子清单里过期的 data-details-collapsed
 *      更正为 data-rightbar-collapsed。
 *
 * 开发节奏：改本文件 → 手机刷新页面即生效（client.js 每次加载重新拉取）；
 * 改 package.json（inject 列表等）→ 需要重启 dsh 服务。
 */
window.__ModuleLoader__.load({
	id: "dsh-mobile-ui",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// ── HTTP（非安全上下文）兜底：crypto.randomUUID ───────────────────
		// 工作区选择 / 消息 ID / RPC ID 依赖 crypto.randomUUID，但它只在
		// 安全上下文（https/localhost）存在。局域网用 http 访问时补一个
		// UUID v4 实现（crypto.getRandomValues 在非安全上下文同样可用）。
		if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function" && typeof crypto.randomUUID !== "function") {
			crypto.randomUUID = () => {
				const b = crypto.getRandomValues(new Uint8Array(16));
				b[6] = (b[6] & 0x0f) | 0x40; // version 4
				b[8] = (b[8] & 0x3f) | 0x80; // variant 10
				let h = "";
				for (let i = 0; i < 16; i++) h += b[i].toString(16).padStart(2, "0");
				return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
			};
		}

		const PACKAGE_ID = "dsh-mobile-ui";
		const CSS_TAG = PACKAGE_ID + "/mobile.css";
		const MOBILE_QUERY = "(max-width: 820px)";

		// ── 工具：从官方组件样式表派生哈希类名 ───────────────────────────
		// 官方包把组件 CSS 注入为 <style data-plugin-css="pkg/File.module.css">，
		// 规则形如 .HASH_entry { ... }。逐规则、逐逗号段、逐匹配收集，
		// 全部条目齐了才算成功。
		function derive(tagId, entries) {
			const tag = document.querySelector(`style[data-plugin-css=${JSON.stringify(tagId)}]`);
			if (!tag || !tag.sheet) return null;
			let rules;
			try { rules = tag.sheet.cssRules; } catch { return null; }
			const map = {};
			const re = /\.(_?[A-Za-z0-9][A-Za-z0-9_-]*)_([A-Za-z0-9][A-Za-z0-9_-]*)/g;
			for (const rule of rules) {
				if (!rule.selectorText) continue;
				for (const sel of String(rule.selectorText).split(",")) {
					re.lastIndex = 0;
					let m;
					while ((m = re.exec(sel)) !== null) {
						const name = m[2];
						if (entries.includes(name) && map[name] === void 0) map[name] = `${m[1]}_${name}`;
					}
				}
			}
			return entries.every((e) => map[e] !== void 0) ? map : null;
		}

		// ── 块注册表 ─────────────────────────────────────────────────────
		// type: "static"   → css 字符串直接生效
		//       "derived"  → 从 tag 声明的样式表派生 entries，交给 build(c)
		//                     （c 为类名映射；派生失败时 c 为 null，build 输出兜底）
		//       "behavior" → JS 行为，run() 执行
		const BLOCKS = [
			{
				id: "containment",
				title: "基础防溢出",
				type: "static",
				css: `
	/* 页面永不横向滚动；长 token 自动折行；对话内表格/图片收缩 */
	html, body { max-width: 100%; overflow-x: hidden; }
	#root { max-width: 100vw; }
	[data-chat-flow] :is(p, li, td, th, h1, h2, h3, h4) { overflow-wrap: anywhere; }
	[data-chat-flow] pre { max-width: 100%; overflow-x: auto; }
	[data-chat-flow] code { max-width: 100%; overflow-wrap: anywhere; }
	[data-chat-flow] table { max-width: 100%; display: block; overflow-x: auto; }
	[data-chat-flow] :is(img, video, svg) { max-width: 100%; height: auto; }
	[data-conversation-scroll] { overscroll-behavior-y: contain; }
	[role="dialog"] { max-width: calc(100vw - 20px) !important; max-height: calc(100dvh - 20px) !important; }
	/* 被 JS 判定“位置坏掉”的弹窗强制居中 */
	.mui-recenter {
		position: fixed !important;
		inset: 0 !important;
		margin: auto !important;
		width: min(480px, calc(100vw - 20px)) !important;
		max-width: calc(100vw - 20px) !important;
		max-height: calc(100dvh - 20px) !important;
		overflow: auto !important;
		z-index: 80 !important;
	}
`,
			},
			{
				id: "shell",
				title: "侧栏覆盖 + 详情全屏",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-layout/AppFrame.module.css",
				entries: ["frame", "sidebarCol", "centerCol", "rightbarCol", "handle"],
				build: (c) => {
					// 有派生类用派生类；没有则用结构选择器兜底
					const F = c ? `.${c.frame}` : "[data-sidebar-collapsed],[data-rightbar-collapsed]";
					const S = c ? `.${c.sidebarCol}` : `${F} > div:nth-child(1)`;
					const C = c ? `.${c.centerCol}` : `${F} > div:nth-child(2)`;
					const D = c ? `.${c.rightbarCol}` : `${F} > div:nth-child(3)`;
					const H = c ? `.${c.frame} .${c.handle}` : `${F} > div:nth-child(n+5)`;
					return `
	/* 展开的左侧栏覆盖内容，而不是把中间列挤到 110px。
	   首轨固定 56px = 折叠态侧栏轨道宽（DSH computeColumns 的 rail 宽）：
	   这样展开抽屉时中间列宽度不变（仍 = 视口 - 56px），内容不重排、字不换行，
	   只是被抽屉遮住 + 被遮罩压暗。 */
	${F}:not([data-sidebar-collapsed]) { grid-template-columns: 56px minmax(0, 1fr) 0px !important; }
	/* 侧栏 absolute 脱离 grid 流后，中间/详情两列会整体左移一格：
	   中间列落到 56px 首轨（会话内容消失）、详情列落到满宽中轨（详情面板
	   盖满整屏 + 右上角“关闭详情”X 无反应）。显式把两列钉回原轨（中间=2、
	   详情=3），杜绝错位。 */
	${F}:not([data-sidebar-collapsed]) ${C} { grid-column: 2 !important; }
	${F}:not([data-sidebar-collapsed]) ${D} { grid-column: 3 !important; }
	${F}:not([data-sidebar-collapsed]) ${S} {
		position: absolute !important;
		left: 0; top: 0; bottom: 0;
		width: min(300px, 84vw) !important;
		z-index: 15;
		box-shadow: 6px 0 24px rgba(0, 0, 0, 0.18);
		border-right: 1px solid var(--dsw-alias-border-l1);
	}
	/* 侧栏展开时，外侧加一层半透明遮罩：压暗内容、挡住误触、聚焦抽屉。
	   不用 backdrop-filter 模糊——移动端常驻重绘耗电，且后面只露 90px 边角，
	   模糊零信息价值。遮罩 z:14（内容 0 之下、侧栏 15 之上），pointer-events:auto
	   挡掉对下层内容的误触。 */
	${F}:not([data-sidebar-collapsed])::after {
		content: "";
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 14;
		pointer-events: auto;
		animation: dsh-mui-scrim-in 0.2s ease;
	}
	@keyframes dsh-mui-scrim-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	/* 详情列（预览/变更面板）在手机上全屏覆盖 */
	${F}:not([data-rightbar-collapsed]) ${D} {
		position: fixed !important;
		inset: 0 !important;
		width: 100vw !important;
		height: 100vh !important;
		height: 100dvh !important;
		z-index: 25;
		background: var(--dsw-alias-bg-base);
		border-left: none !important;
	}
	/* 触屏上列宽拖拽把手没用 */
	${H} { display: none !important; }
`;
				},
			},
			{
				id: "composer",
				title: "输入区适配（安全区留白）",
				type: "static",
				css: `
	/* 输入区避开 iOS 底部安全区；模型触发键文字交给官方（窄屏官方自己
	   收成图标），输入区恢复原生单行布局。
	   v3.1 起不再派生 InputBar 类名——该模块只有 @font-face 规则，派生只会
	   空转。极端窄屏仍重叠时，重叠守卫兜底换行。 */
	[data-composer-seat] { padding-bottom: max(8px, env(safe-area-inset-bottom)) !important; }
`,
			},
			{
				id: "composerRow",
				title: "输入区底行收紧（容纳上下文用量按钮）",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-conversation/InputBar.module.css",
				entries: ["row", "tools", "trailing", "add", "modes", "primary"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 官方新的「上下文用量」按钮（ContextMeter）加进底行 .trailing 后，
	   右侧本就在 340–360px 临界，行整体被 flex-wrap 挤到两行。
	   收紧底行各间距，让 模型+上下文+停止+发送 与左边工具一条放得下。
	   （这一行同时是官方模型触发键的容器查询容器：inline-size ≤ 360px 时
	   官方把触发键收成纯图标，手机竖屏实测容器内容宽 300px；361–820px
	   这段仍显示模型名，触发键自身的 max-width + ellipsis 兜底长名。） */
	.${c.row} { gap: 6px !important; }
	.${c.tools} { gap: 8px !important; }
	.${c.trailing} { gap: 4px !important; }
	.${c.modes} { gap: 6px !important; }
	.${c.add} { width: 28px !important; height: 28px !important; }
	.${c.primary} { width: 30px !important; height: 30px !important; transform: translateY(-2px) !important; }
`;
				},
			},
			{
				id: "modelSheet",
				title: "模型选择 → 底部抽屉",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-model-selection/ModelSelect.module.css",
				entries: ["trigger", "triggerLabel", "triggerEffort", "menu"],
				build: (c) => {
					if (!c) return "";
					return `
	.${c.trigger} { max-width: min(240px, 55vw) !important; min-width: 0 !important; font-size: 12px !important; height: 32px !important; padding: 0 4px 0 8px !important; }
	/* 触发键文字完全用官方的（窄屏官方自己收成图标，见 composerRow 注释）；
	   这里只收窄触发键、并把推理等级徽标藏起来（等级仍可在抽屉里选）。 */
	.${c.triggerLabel} { font-size: 12px !important; }
	.${c.triggerEffort} { display: none !important; }
	.${c.menu} {
		position: fixed !important;
		left: 10px !important; right: 10px !important;
		top: auto !important; bottom: calc(10px + env(safe-area-inset-bottom)) !important;
		width: auto !important; max-width: none !important;
		max-height: min(60dvh, 520px) !important;
		border-radius: 18px !important;
		box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.35) !important;
		z-index: 200 !important;
	}
`;
				},
			},
			{
				id: "popupSheet",
				title: "命令弹窗 → 底部抽屉",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-commands/PopupSelectView.module.css",
				entries: ["card", "viewport"],
				build: (c) => {
					if (!c) return "";
					return `
	.${c.card} {
		position: fixed !important;
		left: 10px !important; right: 10px !important;
		top: auto !important; bottom: calc(10px + env(safe-area-inset-bottom)) !important;
		width: auto !important; min-width: 0 !important; max-width: none !important;
		max-height: min(60dvh, 520px) !important;
		border-radius: 18px !important;
		box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.35) !important;
		z-index: 200 !important;
	}
	.${c.card} .${c.viewport} { overflow-y: auto !important; max-height: none !important; }
`;
				},
			},
			{
				id: "contextMeter",
				title: "上下文用量弹窗 → 保持视口内完整显示",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-conversation/ContextMeter.module.css",
				entries: ["panel"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 官方 ContextMeter 弹窗固定在触发器右缘（right:0，宽 264px），
	   窄屏下按钮右侧还有发送键等，264px 从按钮右缘向左铺开会被挤到
	   视口左缘外、裁切。手机端改成相对视口的固定底部弹层，宽度限幅，
	   上下完全在屏内。 */
	.${c.panel} {
		position: fixed !important;
		left: 10px !important; right: 10px !important;
		top: auto !important; bottom: calc(10px + env(safe-area-inset-bottom)) !important;
		width: auto !important; max-width: calc(100vw - 20px) !important;
		max-height: min(58dvh, 420px) !important;
		overflow-y: auto !important;
		border-radius: 16px !important;
		box-shadow: 0 -8px 36px rgba(0, 0, 0, 0.30) !important;
		z-index: 200 !important;
	}
`;
				},
			},
			{
				id: "chatLayout",
				title: "会话页头部两行布局",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-conversation/ConversationRoot.module.css",
				entries: ["header", "titleRow", "titleCluster", "crumbs", "crumbSeg", "crumb", "crumbSep", "crumbCurrent", "headerActions", "headerUtilities", "tabs", "scrollBody", "composerSeat"],
				build: (c) => {
					if (!c) return "";
					return `
	.${c.header} { padding: 10px 10px 16px 10px !important; }
	/* 手机头部两行固定结构：
	   第一行 = 当前任务名称 + 下载会话（最右，永远不被挤下去）;
	   第二行起 = 层叠计数(N 个子代理)/父级面包屑 + 标准模式 + 后台任务，
	   折行堆叠。
	   要做到「第一行只留任务名 + 下载按钮」，必须把标题和层叠计数拆开：
	   display:contents 依次拆平 titleCluster → crumbs → crumbSeg →
	   层叠包装层(空 div)，让 当前任务名按钮 / 层叠计数根 / 下载按钮 /
	   动作组 全部成为 titleRow 的直接 flex 项，再用 order 归行：
	   任务名(0)+下载(1) 第一行，其余(2,3) 第二行起。旧方案只用
	   flex-wrap + crumbs(flex:1 1 auto) 时，标题+计数填满整行会把
	   下载按钮挤到中间行，或把标题挤窄。 */
	.${c.titleRow} { display: flex !important; flex-wrap: wrap !important; align-items: center !important; row-gap: 6px !important; column-gap: 10px !important; }
	.${c.titleCluster} { display: contents !important; }
	.${c.crumbs} { display: contents !important; }
	.${c.crumbSeg} { display: contents !important; }
	/* 层叠计数/切换器的包装层（crumbSeg 里那个空 div）也拆平，暴露出谱系根 */
	.${c.crumbSeg} > div { display: contents !important; }
	/* 当前任务名（主会话）留在第一行，占满剩余宽度、超长省略 */
	/* 当前任务名撑满第一行但文字左对齐（按钮默认 text-align:center，撑满后会居中）。
	   flex-basis 用 0 而不是 auto：flex-wrap 的「归行」发生在 flex-grow 之前，
	   依据的是每一项的 hypothetical（=basis）宽度。若用 auto，短标题 basis 很小
	   → 返回一个空行还塞得下标准模式；长标题 basis 很大 → 标题独占第一行把下载
	   按钮挤到下一行。basis:0 让标题永远只在行内 grow/ellipsis，下载按钮始终
	   钉在第一行右缘，与标题长短无关。 */
	.${c.crumbCurrent} { flex: 1 1 0 !important; min-width: 0 !important; max-width: none !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; text-align: left !important; order: 0 !important; }
	/* 下载会话固定在第一行最右（任务名 flex:1 撑满，把下载按钮顶到右缘），永不掉到中间行 */
	.${c.headerUtilities} { flex: 0 0 auto !important; margin-left: 8px !important; order: 1 !important; }
	/* 父级面包屑（子代理会话）与层叠分隔符：第二行，排在标准模式之后 */
	.${c.crumb}:not(.${c.crumbCurrent}) { flex: 0 1 auto !important; min-width: 0 !important; text-align: left !important; order: 3 !important; }
	.${c.crumbSep} { flex: 0 0 auto !important; order: 3 !important; }
	/* 标准模式 + 后台任务放第二行最前（order 2 < 层叠/父级面包屑的 order 3）——
	   标准模式每次都有，放最前。flex-basis 用 100% 而不是 auto：flex-wrap 的归行
	   发生在 flex-grow 之前、按 basis 判断能否放进当前行。若用 auto（=内容宽），
	   标题一短，第一行的空位就足以容纳标准模式 → 它被挤上第一行（bug）。basis:100%
	   强制它永远独占新的一行（第二行起），标题再短也上不了第一行；它自身带
	   flex-wrap，两个按钮在整行内可换行堆叠。 */
	.${c.headerActions} { flex: 0 1 100% !important; min-width: 0 !important; order: 2 !important; flex-wrap: wrap !important; }
	.${c.headerActions} :is(button, [role="button"]), .${c.headerUtilities} :is(button, [role="button"]) { white-space: nowrap !important; }
	.${c.tabs} { gap: 18px !important; padding-left: 4px !important; overflow-x: auto !important; margin-top: 10px !important; }
	.${c.scrollBody} { scrollbar-gutter: auto !important; }
	.${c.composerSeat} { --dsh-composer-text-max-height: 40dvh !important; }
`;
				},
			},
			{
				id: "subagentLineage",
				title: "子代理谱系归行（切换器/计数）",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-subagent/SubagentHeaderLineage.module.css",
				entries: ["root", "separator", "trigger", "switcherRoot", "switcherTrigger", "switcherTitle"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 子代理谱系根分两种：
	   切换器（当前子代理任务名，.switcherRoot）留在第一行随下载按钮同行；
	   普通「N 个子代理」层叠计数（非 switcherRoot）挪到第二行。
	   与 chatLayout 块拆平 crumbs/crumbSeg 后，这些根已成为 titleRow 的
	   直接 flex 项，这里用 order 归行：切换器 order0（第一行）、计数 order2（第二行）。
	   切换器同 crumbCurrent：flex-basis 用 0（见 chatLayout 块），下载按钮才
	   永远钉在第一行右缘，短标题也不会把后续项（标准模式/计数）挤上第一行。 */
	.${c.root}.${c.switcherRoot} { flex: 1 1 0 !important; min-width: 0 !important; order: 0 !important; }
	.${c.root}.${c.switcherRoot} .${c.switcherTitle} { max-width: none !important; }
	.${c.root}:not(.${c.switcherRoot}) { flex: 0 1 auto !important; min-width: 0 !important; order: 3 !important; }
`;
				},
			},
			{
				id: "jobsCompact",
				title: "后台任务按钮压缩（防挤下行）",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-jobs/JobListAction.module.css",
				entries: ["trigger", "count"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 后台任务文案（"1 个后台任务运行中"）设上限并省略号截断，
	   保证和标准模式/下载会话在同一行，不再把下载会话挤到下一行 */
	.${c.trigger} { max-width: 210px !important; }
	.${c.count} {
		max-width: 140px !important;
		display: inline-block !important;
		overflow: hidden !important;
		text-overflow: ellipsis !important;
		white-space: nowrap !important;
		vertical-align: middle !important;
	}
`;
				},
			},
			{
				id: "jobsMenu",
				title: "后台任务弹窗 → 移动端底部抽屉",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-jobs/JobListAction.module.css",
				entries: ["menu"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 官方后台任务弹窗是绝对定位（top:calc(100%+5px)、left:0）的下拉列表，
	   宽固定 336px。手机会话页里触发键在头部、位置随布局变化，点击后 336px
	   从触发键左缘往右铺开，会被挤出视口右缘/裁切——手机端改成相对视口的
	   固定底部抽屉（与 contextMeter/modelSheet/popupSheet 同风格：左右 10px +
	   底部安全区、限高可滚动、圆角），列表整屏完整可见。 */
	.${c.menu} {
		position: fixed !important;
		left: 10px !important; right: 10px !important;
		top: auto !important; bottom: calc(10px + env(safe-area-inset-bottom)) !important;
		width: auto !important; max-width: none !important;
		max-height: min(60dvh, 520px) !important;
		overflow-y: auto !important;
		border-radius: 18px !important;
		box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.35) !important;
		z-index: 200 !important;
	}
`;
				},
			},
			{
				id: "exportIcon",
				title: "下载会话 → 纯图标",
				type: "derived",
				tag: "@deepseek-ai/dsh-session-log-export/HeaderAction.module.css",
				entries: ["moreButton"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 下载会话按钮只留图标：0.1.5 起类名 moreButton（官方已自带图标化，
	   此块作为保险，防官方将来把文字 label 加回来） */
	.${c.moreButton} {
		min-width: 32px !important;
		width: 32px !important;
		height: 32px !important;
		padding: 0 !important;
		gap: 0 !important;
		border-radius: 999px !important;
	}
	.${c.moreButton} > span { display: none !important; }
`;
				},
			},
			{
				id: "goalBar",
				title: "目标栏废弃按钮右缘留白",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-goal/GoalBar.module.css",
				entries: ["bar", "actions", "goalGlyph", "label", "objective"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 目标栏（"进行中的目标" + 暂停/编辑/废弃）——移动端布局：
	   官方 bar 右内边距只有 5px（padding: 4px 5px 4px 12px，左 12 右 5
	   不对称），手机上整条栏贴近屏右缘（实测栏右缘距视口仅 32px）、废弃
	   按钮贴边 → 右内边距加大到 12px（与左对称）、按钮间距 10→8px、
	   ≤374px 隐藏装饰性目标图标，按钮离栏缘/屏缘恢复呼吸感。
	   同时：官方单行结构是"状态标签 + 目标全文(截断) + 按钮"，窄屏下
	   标签六个字再加右侧按钮后，目标全文区只剩 0–13px（最多露出半个字）
	   ——移动端把 .objective 收起（visibility:hidden：保留 flex:1 占位与
	   DOM 文本，供点击弹窗读取），主栏变成纯粹的状态条 + 操作；完整目标
	   内容改为点击"进行中的目标"弹出底部长文本面板（见 goalPopup 行为块）。
	   label 缩小到 12px、允许省略号兜底，360px 视口也单行放下；
	   label/goalGlyph 都可点击。 */
	.${c.bar} { padding-right: 12px !important; }
	.${c.actions} { gap: 8px !important; }
	.${c.label} {
		flex: 0 1 auto !important;
		min-width: 0 !important;
		max-width: 88px !important;
		font-size: 12px !important;
		white-space: nowrap !important;
		overflow: hidden !important;
		text-overflow: ellipsis !important;
		cursor: pointer !important;
	}
	.${c.goalGlyph} { cursor: pointer !important; }
	/* 目标全文收起但保留占位：objective 是 flex:1，它把右侧按钮组推到
	   栏右缘（display:none 会让按钮组失去弹性项、停在栏中间）；visibility
	   隐藏文本但保留布局与 DOM 文本（点击弹窗读取完整内容）。 */
	.${c.objective} { visibility: hidden !important; }
	@media (max-width: 374px) {
		.${c.goalGlyph} { display: none !important; }
	}
`;
				},
			},
			{
				id: "questionSheet",
				title: "选项卡片移动端两行布局",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-user-questions/QuestionComposer.module.css",
				entries: ["frame", "card", "header", "title", "body", "options", "option", "optionLabel", "description", "customRow", "footer", "pager", "feedback", "footerActions"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 选项卡片（ask_user_question）在手机上用满宽度：去掉 side-clearance 大边距 */
	.${c.frame} { padding: 6px 10px 10px !important; }
	.${c.header} { padding: 12px 12px 0 16px !important; gap: 10px !important; }
	.${c.title} { overflow-wrap: anywhere !important; }
	.${c.options} { padding: 4px 8px !important; }
	.${c.option}, .${c.customRow} { padding: 8px 10px !important; }
	.${c.optionLabel}, .${c.description} { overflow-wrap: anywhere !important; }
	.${c.body} :is(p, li, td, th, h1, h2, h3, h4) { overflow-wrap: anywhere !important; }
	.${c.body} pre { max-width: 100% !important; overflow-x: auto !important; }
	/* footer 两行：第一行 pager+错误提示，第二行按钮组右对齐——窄屏永不裁切 */
	.${c.footer} {
		flex-wrap: wrap !important;
		row-gap: 8px !important;
		column-gap: 10px !important;
		padding: 4px 12px 10px !important;
	}
	.${c.pager} { flex: 0 0 auto !important; order: 0 !important; }
	.${c.feedback} {
		flex: 1 1 auto !important;
		min-width: 0 !important;
		order: 0 !important;
		align-self: center !important;
		text-align: right !important;
		overflow-wrap: anywhere !important;
	}
	.${c.footerActions} {
		flex: 1 1 100% !important;
		order: 1 !important;
		justify-content: flex-end !important;
		flex-wrap: wrap !important;
		gap: 8px !important;
	}
`;
				},
			},
			{
				id: "planReviewSheet",
				title: "计划审批卡片移动端布局",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-user-questions/PlanReviewPanel.module.css",
				entries: ["frame", "strip", "body", "footer", "feedback", "actions", "discuss"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 计划审批卡片：同样两行 footer（第一行错误提示，第二行按钮组右对齐） */
	.${c.frame} { padding: 6px 10px 10px !important; }
	.${c.strip} { padding: 8px 12px !important; font-size: 12px !important; }
	.${c.body} :is(p, li, td, th, h1, h2, h3, h4) { overflow-wrap: anywhere !important; }
	.${c.body} pre { max-width: 100% !important; overflow-x: auto !important; }
	.${c.footer} {
		flex-wrap: wrap !important;
		row-gap: 8px !important;
		column-gap: 10px !important;
		padding: 8px 12px 10px !important;
	}
	.${c.feedback} {
		flex: 1 1 auto !important;
		min-width: 0 !important;
		order: 0 !important;
		overflow-wrap: anywhere !important;
	}
	.${c.actions} {
		flex: 1 1 100% !important;
		order: 1 !important;
		justify-content: flex-end !important;
		flex-wrap: wrap !important;
		gap: 8px !important;
	}
	.${c.discuss} { white-space: nowrap !important; }
`;
				},
			},
			{
				id: "messageMeta",
				title: "消息 meta 折行（防溢出）",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-chat/MessageIconActions.module.css",
				entries: ["actions", "timeStart", "timeEnd"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 消息 meta（时间 · 用时 · 首 token · tok/s）官方是 white-space:nowrap，
	   桌面 hover 才显示（@media (hover:hover) opacity:0→1）、手机常显。
	   窄屏单行必然撑出容器被 overflow 裁切（“首”被截断），这里允许折行，
	   任何宽度都不溢出；actions 高度同步放开。 */
	.${c.actions} { height: auto !important; min-height: 28px !important; flex-wrap: wrap !important; row-gap: 2px !important; }
	.${c.timeStart}, .${c.timeEnd} {
		white-space: normal !important;
		overflow-wrap: anywhere !important;
		line-height: 20px !important;
		padding-top: 3px !important;
		padding-bottom: 3px !important;
	}
`;
				},
			},
			{
				id: "settingsShell",
				title: "设置页移动端布局",
				type: "derived",
				tag: "@deepseek-ai/dsh-client-ui-settings-general/SettingsRoot.module.css",
				entries: ["panel", "nav", "navTitle", "navList", "navCell", "navLabel", "content", "header", "options"],
				build: (c) => {
					if (!c) return "";
					return `
	/* 设置页在手机上是 800px 面板 + 188px 左导航横排，内容区只剩 ~150px。
	   改为：全屏面板 + 顶部横排导航（可横向滚动）+ 内容占满剩余空间。 */
	.${c.panel} {
		width: 100vw !important;
		max-width: 100vw !important;
		height: 100dvh !important;
		max-height: 100dvh !important;
		border-radius: 0 !important;
		flex-direction: column !important;
	}
	.${c.nav} {
		flex-direction: row !important;
		width: 100% !important;
		flex: none !important;
		gap: 6px !important;
		padding: 8px 10px 0 !important;
		overflow-x: auto !important;
	}
	.${c.navTitle} { display: none !important; }
	.${c.navList} { flex-direction: row !important; gap: 6px !important; }
	.${c.navCell} {
		height: 34px !important;
		flex: none !important;
		padding: 0 12px !important;
		border-radius: 999px !important;
		white-space: nowrap !important;
	}
	.${c.navLabel} { white-space: nowrap !important; }
	.${c.content} { flex: 1 !important; min-height: 0 !important; }
	.${c.header} { height: auto !important; min-height: 48px !important; padding: 12px 14px 4px !important; }
	.${c.options} {
		padding: 4px 14px 20px !important;
		overflow-wrap: anywhere !important;
	}
	/* 输入类控件占满行宽，避免 label+控件互相挤压 */
	.${c.options} :is(input, select, textarea) {
		width: 100% !important;
		max-width: 100% !important;
		box-sizing: border-box !important;
	}
`;
				},
			},
			{
				id: "dialogs",
				title: "坏位置弹窗自动居中",
				type: "behavior",
				run: () => setupDialogRecenter(),
			},
			{
				id: "overlapGuard",
				title: "重叠自愈（移动端）",
				type: "behavior",
				run: () => setupOverlapGuard(),
			},
			{
				id: "goalPopup",
				title: "目标栏点击弹出完整目标",
				type: "behavior",
				run: () => setupGoalPopup(),
			},
			{
				id: "sidebarScrim",
				title: "侧栏遮罩点击关闭",
				type: "behavior",
				run: () => setupSidebarScrim(),
			},
		];

		// 每块的状态："ok" | "miss" | "todo" | "off" | "run" | "skip"
		const status = {};
		const notes = {};

		// ── 样式拼装与注入（幂等，内容变化才改 DOM） ─────────────────────
		function buildCss() {
			const parts = [];
			for (const b of BLOCKS) {
				if (b.type === "static") {
					status[b.id] = "ok";
					parts.push(`/* [${b.id}] */\n${b.css}`);
				} else if (b.type === "derived") {
					if (!b.build) { status[b.id] = "todo"; continue; }
					const c = derive(b.tag, b.entries);
					if (!c) {
						status[b.id] = "miss";
						notes[b.id] = `样式表未就绪或条目失配: ${b.tag}`;
					} else {
						status[b.id] = "ok";
						delete notes[b.id];
					}
					const out = b.build(c);
					if (out) parts.push(`/* [${b.id}] */\n${out}`);
				}
			}
			return parts.length ? `@media ${MOBILE_QUERY} {${parts.join("\n")}}` : "";
		}

		function injectCss() {
			const css = buildCss();
			if (!css) return;
			let tag = document.querySelector(`style[data-plugin-css=${JSON.stringify(CSS_TAG)}]`);
			if (!tag) {
				tag = document.createElement("style");
				tag.dataset.plugin = PACKAGE_ID;
				tag.dataset.pluginCss = CSS_TAG;
				document.head.appendChild(tag);
			}
			if (tag.textContent !== css) tag.textContent = css;
		}

		function removeCss() {
			const tag = document.querySelector(`style[data-plugin-css=${JSON.stringify(CSS_TAG)}]`);
			if (tag) tag.remove();
		}

		// ── 行为块 ───────────────────────────────────────────────────────
		function setupDialogRecenter() {
			const scan = () => {
				const vw = window.innerWidth;
				const vh = window.innerHeight;
				for (const d of document.querySelectorAll('[role="dialog"]:not(.mui-recenter)')) {
					const r = d.getBoundingClientRect();
					if (r.width < 120 || r.height < 40 || r.right > vw + 2 || r.left < -2 || r.bottom > vh + 2) {
						d.classList.add("mui-recenter");
					}
				}
			};
			scan();
			const mo = new MutationObserver(scan);
			mo.observe(document.body, { childList: true, subtree: true });
			window.addEventListener("resize", scan);
			window.addEventListener("orientationchange", scan);
			return () => {
				mo.disconnect();
				window.removeEventListener("resize", scan);
				window.removeEventListener("orientationchange", scan);
			};
		}

		// ── 重叠自愈守卫 ──────────────────────────────────────────────────
		// 纯 CSS 无法证明"任意尺寸/字号都不重叠"；守卫改为运行时检测真实
		// 发生的重叠并自动纠正：发现两个互不包含的可交互元素大面积相交时，
		// 给它们最近的 flex 祖先加 .mui-wrap（强制换行），让组件各占一行。
		// 排除 position:fixed/absolute 的浮层（弹窗/菜单/徽标本来就该悬浮）。
		const GUARD_CSS = `
.mui-wrap { flex-wrap: wrap !important; row-gap: 6px !important; }
`;
		function setupOverlapGuard() {
			const css = document.createElement("style");
			css.dataset.plugin = PACKAGE_ID;
			css.dataset.pluginCss = PACKAGE_ID + "/guard.css";
			css.textContent = GUARD_CSS;
			document.head.appendChild(css);

			let raf = null;
			let lastScan = 0;
			const mq = window.matchMedia(MOBILE_QUERY);
			const scan = () => {
				// 只守护移动端：桌面保持原生布局（下载按钮等各就各位），不干预
				if (!mq.matches) return;
				const now = Date.now();
				if (now - lastScan < 1200) return;
				lastScan = now;
				const vw = window.innerWidth, vh = window.innerHeight;
				const visible = (el) => {
					const r = el.getBoundingClientRect();
					return r.width >= 16 && r.height >= 16 && r.right > 0 && r.left < vw && r.bottom > 0 && r.top < vh;
				};
				const inFlow = (el) => {
					const s = getComputedStyle(el);
					return (s.position === "static" || s.position === "relative") && s.pointerEvents !== "none" && s.visibility !== "hidden" && s.display !== "none";
				};
				// 排除悬浮层内部的元素：底部抽屉/弹窗里的选项按钮虽然是 static，
				// 但它们本来就应该覆盖在页面内容之上，绝不能触发换行自愈
				// （否则点开模型抽屉会把发送键挤到第三行且永远回不来）。
				// 例外：覆盖整个视口的面板（如设置页 overlay）不算悬浮层——
				// 它内部的行/按钮也需要自愈保护。
				const inOverlay = (el) => {
					let p = el;
					while (p && p !== document.body) {
						const role = p.getAttribute?.("role");
						if (role === "menu" || role === "dialog" || role === "listbox" || role === "tooltip") return true;
						const s = getComputedStyle(p);
						if (s.position === "fixed" || s.position === "absolute") {
							const r = p.getBoundingClientRect();
							const coversViewport = r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9;
							if (!coversViewport) return true;
						}
						p = p.parentElement;
					}
					return false;
				};
				const flexAncestor = (el) => {
					let p = el.parentElement;
					while (p && p !== document.body) {
						const d = getComputedStyle(p).display;
						if (d === "flex" || d === "inline-flex" || d === "grid") return p;
						p = p.parentElement;
					}
					return null;
				};
				const els = Array.from(document.querySelectorAll('button, [role="button"], [role="tab"], [aria-haspopup]'))
					.filter((el) => visible(el) && inFlow(el) && !inOverlay(el))
					.slice(0, 40);
				const small = (r) => r.width * r.height;
				for (let i = 0; i < els.length; i++) {
					const a = els[i];
					const ra = a.getBoundingClientRect();
					if (small(ra) <= 0) continue;
					for (let j = i + 1; j < els.length; j++) {
						const b = els[j];
						if (a.contains(b) || b.contains(a)) continue;
						const rb = b.getBoundingClientRect();
						if (small(rb) <= 0) continue;
						const ix = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
						const iy = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
						const inter = ix * iy;
						const minArea = Math.min(small(ra), small(rb));
						if (inter / minArea > 0.35) {
							const target = flexAncestor(a) ?? flexAncestor(b);
							if (target) target.classList.add("mui-wrap");
						}
					}
				}
			};
			const schedule = () => {
				if (raf !== null) return;
				raf = requestAnimationFrame(() => { raf = null; scan(); });
			};
			const mo = new MutationObserver(schedule);
			mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class"] });
			window.addEventListener("resize", schedule);
			window.addEventListener("orientationchange", schedule);
			const iv = setInterval(scan, 2500); // 兜底：字号/布局变化未必触发事件
			scan();
			return () => {
				mo.disconnect();
				window.removeEventListener("resize", schedule);
				window.removeEventListener("orientationchange", schedule);
				clearInterval(iv);
				css.remove();
				document.querySelectorAll(".mui-wrap").forEach((el) => el.classList.remove("mui-wrap"));
			};
		}

		// ── 目标全文弹窗：点击"进行中的目标"打开完整目标 ─────────────────
		// 移动端目标栏只保留状态标签 + 操作按钮（goalBar 块把 .objective
		// 收起），完整目标内容一点即看：点击 label（或 ≥375px 的 goalGlyph）
		// 打开固定底部长文本面板。样式与插件其它底部抽屉一致（左右 10px +
		// 安全区、圆角、限高、可滚动、遮罩、Esc/遮罩/按钮关闭）。
		// 目标全文直接从 DOM 读：objective span 只是被 CSS 隐藏，textContent
		// 始终完整；事件委托在 document 层、类名运行时派生，React 重建
		// 目标栏/切换暂停态后照样命中。编辑态（输入框）没有 label，不触发。
		const GOAL_POPUP_CSS = `
.mui-goal-sheet-backdrop {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.45);
	/* 盖过 DeepSeek 余额小部件（dshwv-root z-index:9999）等浮层 */
	z-index: 10000;
}
.mui-goal-sheet-card {
	position: fixed;
	left: 10px;
	right: 10px;
	top: auto;
	bottom: calc(10px + env(safe-area-inset-bottom));
	max-height: min(60dvh, 520px);
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	background: var(--dsw-alias-bg-base, #141414);
	border: 1px solid var(--dsw-alias-border-l1, #333);
	border-radius: 18px;
	box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.35);
	z-index: 10001;
}
.mui-goal-sheet-head {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 14px 12px 8px 16px;
}
.mui-goal-sheet-title {
	flex: 1;
	min-width: 0;
	color: var(--dsw-alias-label-primary, #eee);
	font-size: 14px;
	font-weight: 500;
	line-height: 24px;
	overflow-wrap: anywhere;
}
.mui-goal-sheet-close {
	width: 32px;
	height: 32px;
	flex: none;
	display: grid;
	place-items: center;
	color: var(--dsw-alias-label-tertiary, #999);
	background: none;
	border: none;
	border-radius: 999px;
	padding: 0;
	cursor: pointer;
}
.mui-goal-sheet-close:active {
	background: var(--dsw-alias-interactive-bg-hover, #2a2a2a);
}
.mui-goal-sheet-body {
	margin: 0;
	padding: 4px 16px 16px;
	overflow-y: auto;
	color: var(--dsw-alias-label-primary, #eee);
	font-size: 14px;
	line-height: 22px;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
}
`;
		function setupGoalPopup() {
			const css = document.createElement("style");
			css.dataset.plugin = PACKAGE_ID;
			css.dataset.pluginCss = PACKAGE_ID + "/goal-popup.css";
			css.textContent = GOAL_POPUP_CSS;
			document.head.appendChild(css);

			let cls = null;
			const ensure = () => {
				if (cls) return true;
				const c = derive("@deepseek-ai/dsh-client-ui-goal/GoalBar.module.css", ["label", "objective", "goalGlyph"]);
				if (!c) return false;
				cls = c;
				return true;
			};

			let sheet = null;
			const close = () => {
				if (sheet) {
					sheet.remove();
					sheet = null;
				}
			};
			const open = () => {
				if (!ensure()) return;
				const bar = document.querySelector("[data-goal-bar]");
				if (!bar) return;
				const labelEl = bar.querySelector(`.${cls.label}`);
				const objEl = bar.querySelector(`.${cls.objective}`);
				const labelText = (labelEl?.textContent || "").trim() || "进行中的目标";
				const text = (objEl?.textContent || "").trim();
				if (!text) return; // 无目标（编辑态/刚清除）不弹
				close();
				sheet = document.createElement("div");
				sheet.className = "mui-goal-sheet";
				// role="dialog" 放 card 上而不是容器上：容器无定位、初始
				// getBoundingClientRect 高 0，会被 setupDialogRecenter 当成
				// "坏位置弹窗"加 .mui-recenter（全屏透明层，虽无害但多余）。
				const backdrop = document.createElement("div");
				backdrop.className = "mui-goal-sheet-backdrop";
				backdrop.addEventListener("click", close);
				const card = document.createElement("div");
				card.className = "mui-goal-sheet-card";
				card.setAttribute("role", "dialog");
				card.setAttribute("aria-modal", "true");
				const head = document.createElement("div");
				head.className = "mui-goal-sheet-head";
				const title = document.createElement("span");
				title.className = "mui-goal-sheet-title";
				title.textContent = labelText;
				const closeBtn = document.createElement("button");
				closeBtn.type = "button";
				closeBtn.className = "mui-goal-sheet-close";
				closeBtn.setAttribute("aria-label", "关闭");
				closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
				closeBtn.addEventListener("click", close);
				head.append(title, closeBtn);
				const body = document.createElement("div");
				body.className = "mui-goal-sheet-body";
				body.textContent = text;
				card.append(head, body);
				sheet.append(backdrop, card);
				document.body.appendChild(sheet);
			};

			const onClick = (e) => {
				if (!ensure()) return;
				const t = e.target;
				if (!(t instanceof Element)) return;
				if (t.closest(`.${cls.label}, .${cls.goalGlyph}`)) open();
			};
			const onKeyDown = (e) => {
				if (e.key === "Escape" && sheet) close();
			};
			document.addEventListener("click", onClick);
			window.addEventListener("keydown", onKeyDown);
			return () => {
				close();
				document.removeEventListener("click", onClick);
				window.removeEventListener("keydown", onKeyDown);
				css.remove();
			};
		}

		// ── 侧栏遮罩点击关闭 ─────────────────────────────────────────────
		// 移动端展开侧栏时，shell 块给 frame::after 加了一层半透明遮罩。
		// 这里补齐交互：点在遮罩（侧栏之外）= 收起侧栏。官方侧栏本身只有
		// 顶部一个 toggle 按钮，抽屉模式下「点外侧关闭」是更顺手的关闭路径。
		function setupSidebarScrim() {
			let sidebarColCls = null;
			const ensure = () => {
				if (sidebarColCls) return true;
				const c = derive("@deepseek-ai/dsh-client-ui-layout/AppFrame.module.css", ["sidebarCol"]);
				if (!c) return false;
				sidebarColCls = c.sidebarCol;
				return true;
			};
			const frame = () => document.querySelector("[data-sidebar-collapsed],[data-rightbar-collapsed]");
			const isExpanded = () => {
				const f = frame();
				return !!f && !f.hasAttribute("data-sidebar-collapsed");
			};
			const closeSidebar = () => {
				// 复用官方 toggle 按钮（侧栏 logoRow 里）：点击即 toggleSidebar()，
				// 当前已展开 → 点击结果就是收起。aria-label 中英双语都含
				// 「侧边栏/sidebar」，不依赖哈希类名，locale 切换也不失配。
				//
				// 注意排除右侧栏的按钮：官方右栏自己的 toggle 叫「收起右侧边栏 /
				// collapse right sidebar」，同样命中关键词。DOM 顺序上左栏按钮在
				// 前面（实测左栏展开时首个匹配是「收起侧边栏」），但不能靠顺序，
				// 这里显式排掉右栏面板内的按钮。
				const btns = [...document.querySelectorAll('button[aria-label*="侧边栏"], button[aria-label*="sidebar"]')]
					.filter((b) => !b.closest("[data-sidebar-right-panel]") && !/右侧|right/i.test(b.getAttribute("aria-label") || ""));
				if (btns[0]) btns[0].click();
			};
			const onClick = (e) => {
				if (!isExpanded()) return;
				if (!ensure()) return;
				const t = e.target;
				if (!(t instanceof Element)) return;
				// 点在侧栏内部（会话列表/设置/toggle 按钮等）不关；点在外侧遮罩才关。
				// 遮罩是 frame::after，点它的 e.target 是 frame（不在侧栏内）→ 命中关闭。
				if (t.closest(`.${sidebarColCls}`)) return;
				closeSidebar();
			};
			document.addEventListener("click", onClick);
			return () => document.removeEventListener("click", onClick);
		}

		// ── 启动 ─────────────────────────────────────────────────────────
		function ensureViewportMeta() {
			let meta = document.querySelector('meta[name="viewport"]');
			if (!meta) {
				meta = document.createElement("meta");
				meta.name = "viewport";
				document.head.appendChild(meta);
			}
			const content = meta.getAttribute("content") || "width=device-width, initial-scale=1";
			if (!/viewport-fit/i.test(content)) meta.setAttribute("content", `${content}, viewport-fit=cover`);
		}

		function apply(ctx) {
			ctx.effect(() => {
				ensureViewportMeta();

				// 诊断出口：window.__dshMobileUi —— 各块状态/备注的只读快照，
				// 排查「某个块没生效」时在浏览器控制台看 status/notes 即可。
				const diag = {
					package: PACKAGE_ID,
					version: "0.3.18",
					mobileQuery: MOBILE_QUERY,
					get status() { return { ...status }; },
					get notes() { return { ...notes }; },
				};
				try { window.__dshMobileUi = diag; } catch { /* 忽略：快照仅为调试便利 */ }

				// v3.3 起彻底按需：宽度未命中移动端查询时，插件完全不运行——
				// 不注入任何样式、不跑行为块（弹窗重居中/重叠自愈）、不起轮询
				// 和观察器，桌面端零干预。跨过断点时自动整套启动/停止。
				const mq = window.matchMedia(MOBILE_QUERY);

				let started = false;
				let teardown = null;

				const start = () => {
					if (started) return;
					started = true;
					let disposed = false;
					// 注入 + 重试：其他模块的样式表晚到也能补上
					const retry = () => { if (!disposed) injectCss(); };
					retry();
					setTimeout(retry, 0);
					window.addEventListener("load", retry);
					const headObserver = new MutationObserver(retry);
					headObserver.observe(document.head, { childList: true, subtree: true });
					// 周期性重试：derived 块失配时样式表可能仍在加载
					const poll = setInterval(() => {
						if (disposed) return;
						injectCss();
					}, 3000);

					// 行为块
					const disposers = [];
					for (const b of BLOCKS) {
						if (b.type !== "behavior") continue;
						if (b.enabled && !b.enabled()) { status[b.id] = "off"; continue; }
						try { disposers.push(b.run() || (() => {})); status[b.id] = "run"; }
						catch (e) { status[b.id] = "miss"; notes[b.id] = String(e); }
					}

					console.info(
						`[dsh-mobile-ui] 已启动 · 视口 ${window.innerWidth}px · ` +
						`块状态: ${BLOCKS.map((b) => `${b.id}=${status[b.id] || "skip"}`).join(", ")}`
					);

					teardown = () => {
						disposed = true;
						clearInterval(poll);
						headObserver.disconnect();
						window.removeEventListener("load", retry);
						for (const d of disposers) d();
						removeCss();
					};
				};

				const stop = () => {
					if (!started) return;
					started = false;
					if (teardown) teardown();
					teardown = null;
					// 宽屏下各块标记为 off（未运行），命中后重新启动
					for (const b of BLOCKS) {
						if (b.type === "behavior") status[b.id] = "off";
						delete notes[b.id];
					}
					console.info(`[dsh-mobile-ui] 已停止 · 视口 ${window.innerWidth}px 超出移动端范围`);
				};

				// html.dsh-mobile：手机视口的稳定钩子（用户自定义样式也可用）
				const sync = () => {
					document.documentElement.classList.toggle("dsh-mobile", mq.matches);
					if (mq.matches) start(); else stop();
				};
				sync();
				mq.addEventListener?.("change", sync);

				return () => {
					stop();
					mq.removeEventListener?.("change", sync);
					if (window.__dshMobileUi === diag) delete window.__dshMobileUi;
				};
			}, "dsh-mobile-ui: mobile layout");
		}

		exports.apply = apply;
		return module.exports;
	}
});

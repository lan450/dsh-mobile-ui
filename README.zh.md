# dsh-mobile-ui — DeepSeek Harness 手机端 UI 适配插件

[English](README.md) | 中文

让以 PC 优先设计的 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web 界面在手机上不再溢出、可单手使用。不改 DSH 任何一行源码，全部是浏览器端运行时适配。

![移动端主页](assets/mobile-main.png)

![选项卡片](assets/mobile-question.png)

## 适配内容

| 块 | 作用 |
| --- | --- |
| 按需触发 | v0.3.3 起仅在视口 ≤820px 时运行；宽屏下什么都不注入、不执行——桌面端连运行时都零干预 |
| 基础防溢出 | 页面永不横向滚动；长 token 折行；代码块/表格块内横滚；图片收缩；弹窗不超视口 |
| 侧栏覆盖 + 详情全屏 | 手机上展开侧栏时覆盖在内容之上（不再把中间列挤到 110px）；详情面板全屏浮层 |
| 输入区安全区 | 输入区避开 iOS 底部安全区；模型触发键缩写成 Flash/Pro/Vision/Model；底行收紧让新的「上下文用量」按钮单行放得下 |
| 模型选择 → 底部抽屉 | 模型选择器变底部弹层，拇指可达 |
| 命令弹窗 → 底部抽屉 | `/model` 等 popupSelect 变底部弹层 |
| 上下文用量弹窗 | 官方新的「上下文用量」按钮弹窗窄屏下会被视口裁切——手机端改成固定底部弹层，整屏完整可见 |
| 会话页布局微调 | 页头两行布局（标题 + 下载会话一行、标准模式+后台任务一行）、标签横向滚动、输入框最大高度适配 |
| 后台任务/下载按钮压缩 | 后台任务文案省略号截断；下载会话缩成纯图标钮 |
| 设置页全屏 | 设置页改全屏 + 顶部横排导航，输入控件占满行宽 |
| 选项卡片两行布局 | 选项（ask_user_question）卡片：footer 改两行（pager+错误提示一行、按钮组右对齐一行），窄屏按钮永不裁切；卡片用满宽度、长文本断字 |
| 计划审批卡片 | 计划审批卡片同样两行 footer，三个按钮窄屏可换行堆叠不裁切 |
| 消息 meta 折行 | 消息 meta 行（时间 · 用时 · 首 token · tok/s，桌面 hover 显示、手机常显）窄屏允许折行，任何宽度都不溢出、不被截断 |
| 目标栏右缘留白 | 目标小组件（"进行中的目标" + 暂停/编辑/废弃）官方右内边距仅 5px，手机上废弃按钮贴边——移动端加大到 12px（与左侧对齐），按钮离右缘恢复呼吸感 |
| 坏位置弹窗自动居中 | 渲染进 0 宽列而不可见的弹窗自动重新居中 |
| 重叠自愈 | 运行时检测真实发生的按钮/控件重叠，自动把所在 flex 行改换行（.mui-wrap） |

## 安装

要求已有 DSH web profile（`dsh web`）。插件是纯浏览器端适配，不修改 DSH 源码。

### 方式一：一键安装脚本（macOS / Linux）

```sh
bash -c "$(curl -fsSL https://raw.githubusercontent.com/lan450/dsh-mobile-ui/main/install.sh)"
```

脚本会把插件克隆到 profile 的 `plugins/` 目录，注册进 profile 的
`package.json` 与 `cordis.patch.yml`（幂等，可重复执行），并提示重启。

### 方式二：手动安装（任意平台）

```sh
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"          # 按需调整 DSH 数据目录
PROFILE="${PROFILE:-web}"                    # 运行 `dsh web` 的 profile

# 1. 克隆插件到 profile 的 plugins 目录
git clone --depth 1 https://github.com/lan450/dsh-mobile-ui.git \
  "$DSH_HOME/profiles/$PROFILE/plugins/dsh-mobile-ui"

# 2. 注册进 profile 的 package.json 并安装
cd "$DSH_HOME/profiles/$PROFILE"
pnpm add "dsh-mobile-ui@file:plugins/dsh-mobile-ui"

# 3. 向 cordis.patch.yml 追加插件注册行
cat >> cordis.patch.yml <<'EOF'
- insert:
    - id: mobile-ui
      name: 'dsh-mobile-ui'
EOF
```

然后重启 `dsh web`（或热重载 profile）。手机打开 Web UI 刷新即可。

## 使用

手机上打开 Web UI（桌面浏览器窗口窄于 820px 同样生效），全部适配自动应用。
**屏幕宽于 820px 时插件完全不运行**——不注入任何样式、不跑行为块、不起
轮询和观察器，桌面 UI 完全不受干预（模型名保持全称、弹窗不重居中）。
视口跨过断点时插件自动整套启动/停止。

### 诊断

浏览器控制台执行：

```js
window.__dshMobileUi.status   // 各块状态：ok / miss / run / off
window.__dshMobileUi.notes    // miss 块的失败原因（样式表未就绪或条目失配）
```

宽屏下 `status` 为空 —— 插件处于关闭状态。派生类名失配时该块会走结构
选择器兜底（手机端至少可用），或直接输出空（如 modelSheet/popupSheet 无
兜底 CSS），此时 `notes` 会给出原因。

## 卸载

删除 `cordis.patch.yml` 中的 `- insert:` 行（可选：再移除 profile
`package.json` 里的 `dsh-mobile-ui` 依赖），重启 `dsh web` 即可。插件无持久
状态，无需其他清理。

## 开发

- `lib/client.js` —— 插件全部逻辑（浏览器半）。改完刷新页面即生效
  （client.js 每次加载重新拉取）。
- 安装脚本会把 `node_modules/dsh-mobile-ui` 链接到 `plugins/dsh-mobile-ui`
  （从 node_modules 出发的符号链接：`../plugins/dsh-mobile-ui`），保证改
  源码立即生效。若手动用 `pnpm add file:...` 安装，包会被**复制**进
  node_modules —— 请把副本替换成上述符号链接。
- `package.json` 的 `dsh.client.inject` —— 加载时序依赖；改它需要重启服务。
- v0.3.3 起彻底按需：只有 `(max-width: 820px)` 命中才启动，不命中则整套
  停止，桌面端运行时也零干预。
- 哈希类名在运行时从官方组件样式表
  （`style[data-plugin-css="<包>/<File>.module.css"]`）派生；样式表未就绪时
  插件会在 DOM 变化和 3 秒轮询时自动重试。

## 兼容性

在 DSH web `0.1.0-rc.6`（deepseek-harness master）上测试通过。支持局域网
纯 HTTP 访问（内置非安全上下文 `crypto.randomUUID` 兜底）。

## License

MIT

/**
 * @dsh-local/dsh-mobile-ui — host half (empty shell).
 *
 * 空壳存在：让插件进入 loader 组合，浏览器半（lib/client.js）经
 * package.json 的 `dsh.client` 声明被发现并注入页面。
 *
 * v0.3.1 起这里不再有任何业务代码：
 * - 旧版内嵌的「LAN 特权 RPC 桥」（interceptor 方案）已整体移除——
 *   /api 通道只允许注册一个 interceptor，槽位被官方 api-gateway 独占，
 *   该桥每次启动必然注册失败（web.log 里曾留下大量报错）。
 *   局域网特权放行现由 @dsh-local/dsh-lan-bridge 独立承担（webServer
 *   层改写，v1.1 起带同源校验，跨站请求仍被官方 fence 拦截）。
 *
 * 宿主半不注册任何服务/路由，也不依赖任何官方服务——官方程序更新
 * 不会波及这里；本文件未来只作为占位存在。
 */

export function apply() {
	// 无副作用：全部逻辑在浏览器半。
}

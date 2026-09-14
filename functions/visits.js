// 访问统计查询页：打开 https://zhaohai.cc/visits?key=你设置的密码 查看
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function page(body) {
  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>访客记录</title>
<style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#f5f6f8;color:#2c3e50;margin:0;padding:24px;line-height:1.6}
.wrap{max-width:1080px;margin:0 auto}h1{font-size:22px;margin:0 0 18px}
h2{font-size:16px;margin:28px 0 10px;color:#1565c0}
.cards{display:flex;gap:14px;flex-wrap:wrap}.card{background:#fff;border-radius:10px;padding:16px 22px;box-shadow:0 1px 4px rgba(0,0,0,.06);min-width:130px}
.card .n{font-size:26px;font-weight:700;color:#1565c0}.card .l{font-size:13px;color:#888}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.06);font-size:14px}
th,td{padding:9px 12px;text-align:left;border-bottom:1px solid #eef0f3}th{background:#fafbfc;color:#666;font-weight:600;white-space:nowrap}
tr:last-child td{border-bottom:none}td.num{text-align:right;font-variant-numeric:tabular-nums}
.tag{display:inline-block;padding:1px 8px;border-radius:10px;background:#eef4fc;color:#1565c0;font-size:12px}
input,button{padding:9px 12px;font-size:14px;border:1px solid #ccd;border-radius:8px}button{background:#1565c0;color:#fff;border:none;cursor:pointer}
.muted{color:#999;font-size:13px}.ua{color:#999;font-size:12px;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
</style></head><body><div class="wrap">${body}</div></body></html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';

  if (!env || !env.VISIT_DB) {
    return new Response(page('<h1>访客记录</h1><p>数据库尚未绑定：请在 Cloudflare Pages → 项目 → Settings → Functions → D1 bindings 中绑定，变量名填 <b>VISIT_DB</b>。</p>'), {
      headers: { 'content-type': 'text/html;charset=utf-8' }
    });
  }
  if (!env.STATS_KEY) {
    return new Response(page('<h1>访客记录</h1><p>尚未设置查询密码：请在 Pages → Settings → Variables 中添加变量 <b>STATS_KEY</b>。</p>'), {
      headers: { 'content-type': 'text/html;charset=utf-8' }
    });
  }
  if (key !== env.STATS_KEY) {
    return new Response(page(`<h1>访客记录</h1>
      <form method="get">
        <input name="key" type="password" placeholder="请输入查询密码" autofocus>
        <button type="submit">查看</button>
      </form><p class="muted">密码即你在 Cloudflare 变量 STATS_KEY 中设置的值；也可直接用 /visits?key=密码 收藏。</p>`), {
      headers: { 'content-type': 'text/html;charset=utf-8' }
    });
  }

  const showBot = url.searchParams.get('bot') === '1';
  const botWhere = showBot ? '' : 'WHERE bot = 0';

  const [overview, cities, recent] = await Promise.all([
    env.VISIT_DB.prepare(
      `SELECT COUNT(*) pv,
              COUNT(DISTINCT ip) uv,
              COUNT(DISTINCT country || '|' || region || '|' || city) city_num
       FROM visits ${botWhere}`
    ).first(),
    env.VISIT_DB.prepare(
      `SELECT country, region, city, COUNT(*) pv, COUNT(DISTINCT ip) uv, MAX(created_at) last
       FROM visits ${botWhere}
       GROUP BY country, region, city
       ORDER BY pv DESC LIMIT 120`
    ).all(),
    env.VISIT_DB.prepare(
      `SELECT created_at, country, region, city, ip, path, ua, bot
       FROM visits ORDER BY id DESC LIMIT 60`
    ).all()
  ]);

  const geo = (r) => [r.country, r.region, r.city].filter(Boolean).join(' · ') || '未知';

  const cityRows = (cities.results || []).map((r) => `
    <tr><td>${esc(geo(r))}</td><td class="num">${r.pv}</td><td class="num">${r.uv}</td><td>${esc(r.last)}</td></tr>`).join('');

  const recentRows = (recent.results || []).map((r) => `
    <tr>
      <td style="white-space:nowrap">${esc(r.created_at)}</td>
      <td>${esc(geo(r))}${r.bot ? ' <span class="tag">爬虫</span>' : ''}</td>
      <td style="white-space:nowrap">${esc(r.ip)}</td>
      <td><a href="${esc(r.path)}">${esc(r.path)}</a></td>
      <td class="ua" title="${esc(r.ua)}">${esc(r.ua)}</td>
    </tr>`).join('');

  const botToggle = showBot
    ? '<a href="/visits?key=' + encodeURIComponent(key) + '">隐藏爬虫</a>'
    : '<a href="/visits?key=' + encodeURIComponent(key) + '&bot=1">包含爬虫</a>';

  const html = page(`
    <h1>访客记录 <span class="muted">（时间为北京时间） ${botToggle}</span></h1>
    <div class="cards">
      <div class="card"><div class="n">${overview.pv || 0}</div><div class="l">总访问量 PV</div></div>
      <div class="card"><div class="n">${overview.uv || 0}</div><div class="l">独立 IP 数</div></div>
      <div class="card"><div class="n">${overview.city_num || 0}</div><div class="l">覆盖城市数</div></div>
    </div>
    <h2>城市排行</h2>
    <table><thead><tr><th>国家 · 省/州 · 城市</th><th style="text-align:right">PV</th><th style="text-align:right">独立IP</th><th>最近访问</th></tr></thead>
    <tbody>${cityRows || '<tr><td colspan=4 class=muted>暂无记录</td></tr>'}</tbody></table>
    <h2>最近 60 条访问</h2>
    <table><thead><tr><th>时间</th><th>城市</th><th>IP</th><th>页面</th><th>设备</th></tr></thead>
    <tbody>${recentRows || '<tr><td colspan=5 class=muted>暂无记录</td></tr>'}</tbody></table>
    <p class="muted">地理信息来自 Cloudflare 边缘节点定位，城市精度取决于运营商 IP 库，通常到地级市；手机流量可能定位到省会或骨干网节点。</p>
  `);

  return new Response(html, { headers: { 'content-type': 'text/html;charset=utf-8' } });
}

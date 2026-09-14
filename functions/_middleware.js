// 访客记录中间件
// 原理：Cloudflare 在每个请求上附带 request.cf 地理对象（国家/省/城市/经纬度，免费版可用）
//       以及 CF-Connecting-IP 真实访客 IP；这里把页面访问异步写入 D1 数据库，不影响访问速度
export async function onRequest(context) {
  const { request, env, next, waitUntil } = context;

  try {
    const url = new URL(request.url);
    const accept = request.headers.get('accept') || '';
    // 只记录“人在浏览器里打开页面”的 GET/HTML 请求；查询页本身不记录
    const isPage =
      request.method === 'GET' &&
      accept.includes('text/html') &&
      !url.pathname.startsWith('/visits');

    if (isPage && env && env.VISIT_DB) {
      const cf = request.cf || {};
      const ua = request.headers.get('user-agent') || '';
      const isBot = /bot|spider|crawler|slurp|facebookexternalhit|embedly|quora|pinterest|preview|python|curl|request/i.test(ua) ? 1 : 0;
      const lat = typeof cf.latitude === 'number' ? cf.latitude : null;
      const lon = typeof cf.longitude === 'number' ? cf.longitude : null;

      // waitUntil：在返回网页给访客之后再写库，访客完全无感
      waitUntil(
        env.VISIT_DB.prepare(
          `INSERT INTO visits
             (ip, country, region, city, lat, lon, timezone, path, referer, ua, bot, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now','+8 hours'))`
        )
          .bind(
            request.headers.get('CF-Connecting-IP') || '',
            cf.country || '',
            cf.region || '',
            cf.city || '',
            lat,
            lon,
            cf.timezone || '',
            url.pathname,
            request.headers.get('referer') || '',
            ua.slice(0, 299),
            isBot
          )
          .run()
          .catch(() => {}) // 写库失败静默，绝不影响网站访问
      );
    }
  } catch (e) {
    // 任何异常都不阻断正常访问
  }

  return next();
}

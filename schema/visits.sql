-- 访客记录表（Cloudflare D1 / SQLite）
-- 在本地工程根目录执行（先 wrangler login、wrangler d1 create blog_visits）：
--   远程建表：npx wrangler d1 execute blog_visits --remote --file schema/visits.sql
--   本地预览：npx wrangler d1 execute blog_visits --local  --file schema/visits.sql
CREATE TABLE IF NOT EXISTS visits (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ip         TEXT NOT NULL DEFAULT '',   -- 访客真实 IP（CF-Connecting-IP）
  country    TEXT NOT NULL DEFAULT '',   -- 国家代码，如 CN
  region     TEXT NOT NULL DEFAULT '',   -- 省/州，如 Hubei
  city       TEXT NOT NULL DEFAULT '',   -- 城市，如 Wuhan
  lat        REAL,                       -- 纬度
  lon        REAL,                       -- 经度
  timezone   TEXT NOT NULL DEFAULT '',   -- 时区，如 Asia/Shanghai
  path       TEXT NOT NULL DEFAULT '',   -- 访问的页面路径
  referer    TEXT NOT NULL DEFAULT '',   -- 来源页
  ua         TEXT NOT NULL DEFAULT '',   -- 浏览器/设备 UA
  bot        INTEGER NOT NULL DEFAULT 0, -- 1=搜索引擎/爬虫
  created_at TEXT NOT NULL               -- 访问时间（北京时间，UTC+8）
);

CREATE INDEX IF NOT EXISTS idx_visits_created ON visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_geo     ON visits(country, region, city);

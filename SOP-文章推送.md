# 文章发布 SOP（带图片）

> 适用：在 Obsidian 写文章 → 发布到 zhaohai.cc（Hexo + Cloudflare Pages 自动构建）

## 一、写文章（Obsidian）

1. 用模板新建文章（在 `test` 库 → `Templates` 插入模板），或直接复制任意旧文章开头格式。
2. **必填 front-matter**（放文件最顶部，`---` 包裹）：

```yaml
---
title: 文章标题
date: 2026-09-10
tags:
  - 标签1
  - 标签2
---
```

- `date`：实际写作日期，**手动填写**（如 `2022-02-01`）；若留空则自动填当天日期。
- 文章网址格式：`https://zhaohai.cc/日期8位/文章名/`，如 2022-02-01 的《奇怪的梦》→ `https://zhaohai.cc/20220201/奇怪的梦/`。
- 标签规则：**每篇 ≤ 10 个，每个 ≤ 4 个汉字**。
- 写作完成后**删除模板里的使用说明注释块**（`<!-- ... -->`）。

## 二、图片

- 图片先放到 Obsidian 库任意位置（或直接复制到 `D:\Blog\frank-blog\source\img\`）。
- **Obsidian 的 `![[图片名]]` 语法必须改成 Markdown 格式**：`![](/img/图片名)`。
- 图片建议规范（发布前处理）：
  - 宽边 ≤ 1200px；照片类转 JPG（体积小 10 倍）；**压缩至不大于 500KB，视觉无损**
  - 文件名用**英文 + 日期**，如 `meng20220201.jpg`、`chengdu20220901.jpg`

## 三、推送（发布）

**方式 A：交给助手（推荐）**
在 Obsidian 写好文章后，对助手说「推送新文章」，并告诉图片在哪。助手会：
1. 从 Obsidian 取文章 → 修复 front-matter / 图片引用 → 放入 `source\_posts\`
2. 图片复制到 `source\img\` 并压缩
3. 本地构建验证 → git 提交推送

**方式 B：手动推送**
1. 把文章 `.md` 放入 `D:\Blog\frank-blog\source\_posts\`
2. 图片放入 `D:\Blog\frank-blog\source\img\`，md 中写 `![](/img/文件名)`
3. 在 `D:\Blog\frank-blog` 打开终端执行：

```
npx hexo generate        # 构建验证（无报错即可）
git add -A
git commit -m "新增文章：标题"
git push origin main
```

4. Cloudflare Pages 自动构建，**1~3 分钟后**刷新 https://zhaohai.cc/ 生效。

## 四、常见坑（务必检查）

| 坑 | 正确做法 |
|---|---|
| `![[xxx.png]]` Obsidian 语法 | 改成 `![](/img/xxx.png)` |
| 忘了删模板注释块 | 发布前删除 `<!-- ... -->` |
| 标签超过 10 个 / 超 4 汉字 | 精简，≤10 个、每个 ≤4 汉字 |
| date 是模板占位值（2022-02-01 等） | 改成实际写作日期 |
| 图片太大（>500KB） | 压至 ≤500KB，照片转 JPG，保持视觉无损 |
| 图片放 `_posts` 里 | 放到 `source\img\`（`post_asset_folder` 未开启） |

## 五、改文章 / 删文章

- **改已发布文章**：改 `source\_posts\` 里对应 .md → 推送 → CF 自动重新构建。
- **删文章**：删除对应 .md → 推送 → 网站即不再显示（本地文件可自行备份）。

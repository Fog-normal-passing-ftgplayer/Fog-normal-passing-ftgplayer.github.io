/* GP-Combine 展示站：把两套截图渲染成图鉴。
   图片命名来自仿真器的巡演脚本（.sim/tours/*.tour），加图只要在下面的 SHOTS 里补一条。 */

const SHOTS = {
  "240": {
    w: 240, h: 135,
    label: "240 × 135",
    pages: [
      { idx: "01", title: "设置", main: "page_01_setting", opts: [
        { id: "setting_sections", title: "分区选择" },
        { id: "opt_handle",  title: "手柄 · 输入模式 / SOCD / D-PAD" },
        { id: "opt_display", title: "显示 · 输入历史 / 布局 / 主题" },
        { id: "opt_system",  title: "系统 · 配置档 / 保存 / 恢复" },
      ]},
      { idx: "02", title: "电池", main: "page_02_battery", opts: [] },
      { idx: "03", title: "灯光", main: "page_03_led", opts: [
        { id: "opt_led", title: "彩灯 · 动画模式 / 亮度 / 颜色" },
      ]},
      { idx: "04", title: "背景", main: "page_04_bg", opts: [
        { id: "opt_bg", title: "背景 · 透明度 / 翻转 / 反色" },
      ]},
      { idx: "05", title: "休眠", main: "page_05_sleep", opts: [
        { id: "opt_sleep", title: "休眠 · 屏保模式 / 时间 / 关屏" },
      ]},
      { idx: "06", title: "无线", main: "page_06_wireless", opts: [
        { id: "opt_wireless", title: "无线 · 开关 / 重新配对 / BOOTSEL" },
      ]},
    ]
  },
  "320": {
    w: 320, h: 170,
    label: "170 × 320",
    pages: [
      { idx: "01", title: "设置", main: "page_01_setting", opts: [
        { id: "setting_sections", title: "分区选择" },
        { id: "opt_handle",  title: "手柄 · 输入模式 / SOCD / D-PAD" },
        { id: "opt_display", title: "显示 · 输入历史 / 布局 / 主题" },
        { id: "opt_system",  title: "系统 · 配置档 / 保存 / 恢复" },
      ]},
      { idx: "02", title: "电池", main: "page_02_battery", opts: [] },
      { idx: "03", title: "灯光", main: "page_03_led", opts: [
        { id: "opt_led", title: "彩灯 · 动画模式 / 亮度 / 颜色" },
      ]},
      { idx: "04", title: "背景", main: "page_04_bg", opts: [
        { id: "opt_bg", title: "背景 · 透明度 / 翻转 / 反色" },
      ]},
      { idx: "05", title: "休眠", main: "page_05_sleep", opts: [
        { id: "opt_sleep", title: "休眠 · 屏保模式 / 时间 / 关屏" },
      ]},
      { idx: "06", title: "无线", main: "page_06_wireless", opts: [
        { id: "opt_wireless", title: "无线 · 开关 / 重新配对 / BOOTSEL" },
      ]},
      { idx: "07", title: "小游戏", main: "page_07_nes", opts: [
        { id: "nes_list", title: "ROM 列表（卡内无 ROM 时的提示）" },
      ]},
    ]
  }
};

const _q = new URLSearchParams(location.search).get("res");
let CUR = (s => (s === "240" || s === "320") ? s : "320")(_q);

const $  = (s, r = document) => r.querySelector(s);
const ASSET_V = "7";   // 资源版本号：改了素材就 +1，绕开 GitHub Pages 的 10 分钟缓存
const asset = (res, name) => `assets/${res}/${name}.png?v=${ASSET_V}`;

/* 生成一个可点击放大的图（rel 是 assets/<res>/ 下的相对路径） */
function media(res, rel, caption, W, H, cls = "") {
  const fig = document.createElement("figure");
  fig.className = "shot " + cls;
  const img = document.createElement("img");
  img.src = `assets/${res}/${rel}?v=${ASSET_V}`;
  img.alt = caption || name;
  img.width = W;
  img.height = H;
  img.loading = "lazy";
  img.decoding = "async";
  img.dataset.cap = caption || name;
  fig.appendChild(img);
  if (caption) {
    const cap = document.createElement("figcaption");
    cap.textContent = caption;
    // 动画素材标个「动态」，一眼能看出来该盯哪儿
    if (rel.endsWith(".webp")) {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "动态";
      cap.appendChild(badge);
    }
    fig.appendChild(cap);
  }
  return fig;
}

/* 静态截图：assets/<res>/<name>.png */
const shot = (res, name, caption, W, H, cls = "") =>
  media(res, `${name}.png`, caption, W, H, cls);

function render(res) {
  CUR = res;
  const cfg = SHOTS[res];
  document.body.dataset.res = res;

  // 分辨率按钮
  document.querySelectorAll(".switch button").forEach(b => {
    b.classList.toggle("on", b.dataset.res === res);
  });
  // 让地址栏反映当前分辨率，方便分享/深链
  try {
    const u = new URL(location.href);
    u.searchParams.set("res", res);
    history.replaceState(null, "", u);
  } catch (e) { /* file:// 下某些浏览器会拒绝，忽略 */ }

  // 主图 / 壁纸图：用动画 WebP，真正会动的 60 帧循环
  for (const [sel, cap] of [["#hero-img", "主界面（动态壁纸）"], ["#wp-img", "主界面 · 动态壁纸"]]) {
    const el = $(sel);
    if (!el) continue;
    el.src = `assets/${res}/anim/wallpaper.webp?v=${ASSET_V}`;
    el.width = cfg.w;
    el.height = cfg.h;
    el.alt = cap;
    el.dataset.cap = cap;
  }

  // 页面列表：每页 = 标题 + 一行图（第一张是页面封面，后面是它的选项列表）
  const box = $("#pages");
  box.textContent = "";

  // 翻页动画（280ms 缓出 + 尾部停顿，便于循环观看）
  const animBlock = document.createElement("article");
  animBlock.className = "page page-anim";
  const ah = document.createElement("div");
  ah.className = "page-head";
  ah.innerHTML = `<span class="idx">↔</span><h3>翻页动画</h3>`;
  animBlock.appendChild(ah);
  const ag = document.createElement("div");
  ag.className = "shots";
  ag.appendChild(media(res, "anim/page_slide.webp",
    "按 → 切页：整屏横向滑动，280ms 缓出", cfg.w, cfg.h, "wide"));
  animBlock.appendChild(ag);
  box.appendChild(animBlock);

  for (const p of cfg.pages) {
    const art = document.createElement("article");
    art.className = "page";

    const head = document.createElement("div");
    head.className = "page-head";
    head.innerHTML = `<span class="idx">${p.idx}</span><h3></h3>`;
    head.querySelector("h3").textContent = p.title;
    art.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "shots";
    grid.appendChild(shot(res, p.main, `${p.title} · 页面`, cfg.w, cfg.h, "cover"));
    for (const o of p.opts) grid.appendChild(shot(res, o.id, o.title, cfg.w, cfg.h));

    if (!p.opts.length) {
      const none = document.createElement("p");
      none.className = "none";
      none.textContent = "这一页是状态展示，没有可调项。";
      grid.appendChild(none);
    }
    art.appendChild(grid);
    box.appendChild(art);
  }
}

/* 灯箱 */
function initLightbox() {
  const lb = $("#lightbox");
  const img = lb.querySelector("img");
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.tagName === "IMG" && !lb.contains(t)) {
      img.src = t.src;
      img.alt = t.alt || "";
      lb.hidden = false;
      document.body.style.overflow = "hidden";
    } else if (t === lb || t === img) {
      lb.hidden = true;
      document.body.style.overflow = "";
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !lb.hidden) {
      lb.hidden = true;
      document.body.style.overflow = "";
    }
  });
}

/* 分辨率切换 */
function initSwitch() {
  document.querySelectorAll(".switch button").forEach(b => {
    b.addEventListener("click", () => render(b.dataset.res));
  });
}

/* 图片缺失时给出可见提示，别留破图 */
function initFallback() {
  document.addEventListener("error", e => {
    const img = e.target;
    if (img.tagName !== "IMG") return;
    const fig = img.closest("figure");
    if (!fig || fig.dataset.broken) return;
    fig.dataset.broken = "1";
    const cap = fig.querySelector("figcaption");
    if (cap) cap.textContent += "（缺图）";
    fig.style.opacity = ".35";
  }, true);
}

initSwitch();
initLightbox();
initFallback();
render(CUR);

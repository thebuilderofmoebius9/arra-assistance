/* ARRA Assistance — ส่วนโต้ตอบ (ไม่มี library ภายนอก, ไม่ส่งข้อมูลออกจากเบราว์เซอร์)
   1) สมุดความจำ 3 มิติ (canvas)  2) เครื่อง terminal จำลอง  3) แท็บ Mac/Windows
   4) เช็กลิสต์ + แถบความคืบหน้า (เก็บใน localStorage)  5) ตัวสร้างข้อความถาม AI */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ใช้ต่อได้โดยไม่จำค่า */ } }
  };
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- แสงตะเกียงตามเมาส์ (ตกแต่งอย่างเดียว ไม่เก็บ/ส่งตำแหน่งไปไหน) ---------- */
  if (!reduce && window.matchMedia && matchMedia("(pointer:fine)").matches) {
    var lampRaf = 0, lx = 0, ly = 0, root = document.documentElement;
    document.addEventListener("pointermove", function (e) {
      lx = e.clientX; ly = e.clientY;
      if (lampRaf) return;
      lampRaf = requestAnimationFrame(function () { lampRaf = 0; root.style.setProperty("--mx", lx + "px"); root.style.setProperty("--my", ly + "px"); });
    }, { passive: true });
  }

  /* ---------- 4) ความคืบหน้า ---------- */
  var ITEMS = window.ARRA_ITEMS || {};
  var PKEY = "arra-progress-v1";
  var progress = store.get(PKEY, {});
  var allIds = [];
  Object.keys(ITEMS).forEach(function (p) { ITEMS[p].forEach(function (id) { allIds.push(id); }); });

  function refreshProgress() {
    var done = allIds.filter(function (id) { return progress[id]; }).length;
    var txt = $("#progtxt"), bar = $("#progbar");
    if (txt) txt.textContent = "ทำแล้ว " + done + "/" + allIds.length;
    if (bar) bar.style.width = (allIds.length ? (100 * done / allIds.length) : 0) + "%";
    $$("nav a[data-page]").forEach(function (a) {
      var ids = ITEMS[a.getAttribute("data-page")] || [];
      var ok = ids.length > 0 && ids.every(function (id) { return progress[id]; });
      a.classList.toggle("ok", ok);
    });
    var fin = $(".done[data-finish]");
    if (fin) fin.classList.toggle("reached", !!(progress["p5-learn"] && progress["p5-search"]));
  }

  function setDone(id, val, quiet) {
    var was = !!progress[id];
    progress[id] = !!val;
    store.set(PKEY, progress);
    $$('input[data-id="' + id + '"]').forEach(function (c) { c.checked = !!val; });
    refreshProgress();
    if (!quiet && val && !was && progress["p5-learn"] && progress["p5-search"] && !store.get("arra-finish-shown", false)) {
      store.set("arra-finish-shown", true);
      celebrate();
    }
  }

  $$('input[type="checkbox"][data-id]').forEach(function (c) {
    c.checked = !!progress[c.getAttribute("data-id")];
    c.addEventListener("change", function () { setDone(c.getAttribute("data-id"), c.checked); });
  });
  refreshProgress();

  function celebrate() {
    var t = document.createElement("div");
    t.className = "finish";
    t.setAttribute("role", "status");
    t.innerHTML = "🎉 <b>ถึงเส้นชัยแล้ว</b> ARRA ของคุณจดและจำได้จริง ไปปลุก Oracle ต่อที่ <a href=\"awaken.html\">หน้า 6</a> ได้เลย";
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 9000);
    if (reduce) return;
    var colors = ["#ffd166", "#8ea2ff", "#6ee7b7", "#f472b6", "#fb923c"];
    for (var i = 0; i < 40; i++) {
      var s = document.createElement("span");
      s.className = "confetti";
      s.style.left = (Math.random() * 100) + "vw";
      s.style.background = colors[i % colors.length];
      s.style.animationDuration = (1.8 + Math.random() * 1.8) + "s";
      s.style.animationDelay = (Math.random() * 0.4) + "s";
      document.body.appendChild(s);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4200); })(s);
    }
  }

  /* ---------- 3) แท็บ Mac / Windows ---------- */
  var os = store.get("arra-os", /Windows/i.test(navigator.userAgent) ? "win" : "mac");
  function applyOS(v) {
    os = v; store.set("arra-os", v);
    $$(".os-pane").forEach(function (p) { p.hidden = p.getAttribute("data-os") !== v; });
    $$(".os-tab").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-os") === v)); });
  }
  $$(".os-tab").forEach(function (b) { b.addEventListener("click", function () { applyOS(b.getAttribute("data-os")); }); });
  if ($$(".os-pane").length) applyOS(os);

  /* ---------- 2) terminal จำลอง ---------- */
  $$(".term").forEach(function (t) {
    var log = $(".term-log", t), form = $("form", t), input = $("input", t);
    function print(text, cls) {
      var d = document.createElement("div");
      d.className = "line" + (cls ? " " + cls : "");
      d.textContent = text; // textContent เท่านั้น: สิ่งที่พิมพ์ไม่ถูกตีความเป็น HTML
      log.appendChild(d);
      log.scrollTop = log.scrollHeight;
    }
    print("ยินดีต้อนรับ นี่คือเครื่องจำลอง พิมพ์ help เพื่อดูคำสั่งที่ลองได้", "dim");
    function run(raw) {
      var parts = raw.split(/\s+/), cmd = parts[0], rest = raw.slice(cmd.length).trim();
      if (!cmd) return;
      if (cmd === "echo") {
        var out = rest.replace(/^["']|["']$/g, "");
        print(out);
        if (out === "hello") { print("✅ ผ่านด่านแรก คุณใช้ terminal เป็นแล้ว", "ok"); setDone("p2-echo", true); }
      } else if (cmd === "help") {
        print("คำสั่งที่ลองได้: echo hello · pwd · ls · whoami · date · clear");
      } else if (cmd === "pwd") { print("/home/you");
      } else if (cmd === "ls") { print("Desktop  Documents  Downloads");
      } else if (cmd === "whoami") { print("you");
      } else if (cmd === "date") { print(new Date().toLocaleString("th-TH"));
      } else if (cmd === "clear") { log.textContent = "";
      } else if (cmd === "rm" || cmd === "sudo" || cmd === "del") {
        print("⚠️ ในเครื่องจำลองไม่มีอะไรถูกลบจริง แต่บนเครื่องจริง อย่าพิมพ์คำสั่งที่มี rm หรือ sudo ถ้ายังไม่เข้าใจว่ามันทำอะไร", "warn");
      } else {
        print("ไม่รู้จักคำสั่ง \"" + cmd + "\" ลองพิมพ์ help", "warn");
      }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var raw = input.value.trim();
      input.value = "";
      if (raw) { print("$ " + raw, "cmd"); run(raw); }
    });
    $$("[data-cmd]", t).forEach(function (b) {
      b.addEventListener("click", function () { input.value = b.getAttribute("data-cmd"); form.requestSubmit(); });
    });
  });

  /* ---------- 5) ตัวสร้างข้อความถาม AI ---------- */
  $$(".builder").forEach(function (b) {
    var f = {
      step: $('[name="step"]', b), os: $('[name="os"]', b), cmd: $('[name="cmd"]', b), err: $('[name="err"]', b)
    };
    var out = $(".builder-out", b), btn = $(".builder-copy", b);
    function build() {
      var c = f.cmd.value.trim() || "[วางคำสั่งที่รัน]";
      var e = f.err.value.trim() || "[วางข้อความ error ทั้งหมด หรือแนบภาพหน้าจอ]";
      out.value = "ฉันเป็นมือใหม่ที่ไม่เคยใช้ terminal กำลังทำตามคู่มือ ARRA Assistance\n" +
        "ขั้นที่ฉันติด: " + f.step.value + "\n" +
        "ระบบของฉัน: " + f.os.value + "\n" +
        "ฉันรันคำสั่งนี้: " + c + "\n" +
        "แล้วเจอข้อความนี้: " + e + "\n\n" +
        "ช่วยอธิบายเป็นภาษาไทยง่าย ๆ ว่าเกิดอะไรขึ้น แล้วบอกสิ่งที่ต้องลองทีละขั้น\n" +
        "ห้ามให้ฉันลบหรือแก้ไฟล์ที่ไม่เกี่ยวข้อง และถามฉันก่อนถ้าไม่แน่ใจ";
    }
    Object.keys(f).forEach(function (k) { f[k].addEventListener("input", build); f[k].addEventListener("change", build); });
    btn.addEventListener("click", function () {
      var done = function () { btn.textContent = "คัดลอกแล้ว"; setTimeout(function () { btn.textContent = "คัดลอกข้อความ"; }, 1500); };
      if (navigator.clipboard) navigator.clipboard.writeText(out.value).then(done);
      else { out.select(); document.execCommand("copy"); done(); }
    });
    build();
  });

  /* ---------- 1) สมุดความจำ 3 มิติ ---------- */
  $$(".mem3d").forEach(function (root) {
    var canvas = $(".mem-canvas", root), ctx = canvas.getContext("2d");
    var addForm = $(".mem-add", root), findInput = $(".mem-find input", root), status = $(".mem-status", root);
    var seeds = ["แมวนอนบนโซฟาสีแดง", "My first note", "bun คือตัวรันของ ARRA", "terminal ไม่อันตราย", "Oracle คือผู้ช่วยที่มีความจำ",
      "Nothing is Deleted", "ค้นด้วยคำที่ตรงกัน", "จดวันนี้ ค้นพรุ่งนี้", "learn แล้ว search", "อะตอมคือหน่วยความรู้เล็กที่สุด"];
    var nodes = [], MAXN = 60, w = 0, h = 0, dpr = 1;
    var ry = 0.6, rx = -0.35, dragging = false, lastX = 0, lastY = 0, hover = null, query = "", running = false, visible = true, raf = 0;
    var ringAngle = 0;

    function unit(i, n) { // กระจายจุดบนทรงกลมแบบ Fibonacci
      var y = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - y * y), a = i * 2.399963;
      return { x: Math.cos(a) * r, y: y, z: Math.sin(a) * r };
    }
    function randUnit() {
      var z = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - z * z);
      return { x: Math.cos(a) * r, y: z, z: Math.sin(a) * r };
    }
    function addNode(text, p, fresh) {
      nodes.push({ x: p.x, y: p.y, z: p.z, text: text, born: fresh ? performance.now() : -1e9, user: !!fresh });
      if (nodes.length > MAXN) { for (var i = 0; i < nodes.length; i++) if (nodes[i].user) { nodes.splice(i, 1); break; } }
    }
    var total = 28;
    for (var i = 0; i < total; i++) addNode(i < seeds.length ? seeds[i] : "", unit(i, total), false);

    function size() {
      var r = canvas.parentNode.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(240, Math.floor(r.width)); h = Math.floor(Math.max(260, Math.min(380, w * 0.62)));
      canvas.width = w * dpr; canvas.height = h * dpr; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      schedule();
    }

    function rot(x, y, z) {
      var cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      var x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      return { x: x1, y: y * cx - z1 * sx, z: y * sx + z1 * cx };
    }
    var CAM = 3.2;
    function screen(p) {
      var R = Math.min(w, h) * 0.42, f = CAM / (CAM - p.z);
      return { x: w / 2 + p.x * R * f, y: h / 2 + p.y * R * f, f: f, z: p.z };
    }
    function matches(n) { return query && n.text && n.text.toLowerCase().indexOf(query) !== -1; }

    function drawRing(tilt, spin, color) {
      ctx.beginPath();
      for (var i = 0; i <= 48; i++) {
        var a = i / 48 * Math.PI * 2;
        var x = Math.cos(a) * 0.62, y = Math.sin(a) * 0.62 * Math.cos(tilt), z = Math.sin(a) * 0.62 * Math.sin(tilt);
        var c = Math.cos(spin), s = Math.sin(spin);
        var p = screen(rot(x * c - y * s, x * s + y * c, z));
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
    }
    function electron(tilt, spin, a, color) {
      var x = Math.cos(a) * 0.62, y = Math.sin(a) * 0.62 * Math.cos(tilt), z = Math.sin(a) * 0.62 * Math.sin(tilt);
      var c = Math.cos(spin), s = Math.sin(spin);
      var p = screen(rot(x * c - y * s, x * s + y * c, z));
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.2 * p.f, 0, 6.2832); ctx.fillStyle = color; ctx.fill();
    }

    function draw(now) {
      ctx.clearRect(0, 0, w, h);
      var g = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, Math.min(w, h) * 0.6);
      g.addColorStop(0, "rgba(80,100,220,.28)"); g.addColorStop(1, "rgba(10,14,30,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      drawRing(0.0, 0.0, "rgba(142,162,255,.22)");
      drawRing(1.05, 0.9, "rgba(142,162,255,.18)");
      drawRing(-1.05, -0.9, "rgba(142,162,255,.18)");
      electron(0.0, 0.0, ringAngle, "#8ea2ff");
      electron(1.05, 0.9, ringAngle * 1.3 + 2, "#6ee7b7");
      electron(-1.05, -0.9, ringAngle * 0.8 + 4, "#f472b6");

      // นิวเคลียส
      var pulse = reduce ? 0 : Math.sin(now / 500) * 2;
      var ng = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 20 + pulse);
      ng.addColorStop(0, "rgba(255,255,255,.95)"); ng.addColorStop(0.4, "rgba(255,209,102,.8)"); ng.addColorStop(1, "rgba(255,209,102,0)");
      ctx.fillStyle = ng; ctx.beginPath(); ctx.arc(w / 2, h / 2, 22 + pulse, 0, 6.2832); ctx.fill();

      var pts = nodes.map(function (n) {
        var age = Math.min(1, (now - n.born) / 800), e = 1 - Math.pow(1 - age, 3);
        var p = screen(rot(n.x * e, n.y * e, n.z * e));
        p.n = n; p.e = e; p.age = age; return p;
      });
      // เส้นเชื่อมระหว่างโน้ตที่อยู่ใกล้กัน
      ctx.lineWidth = 1;
      for (var i = 0; i < nodes.length; i++) for (var j = i + 1; j < nodes.length; j++) {
        var d = nodes[i].x * nodes[j].x + nodes[i].y * nodes[j].y + nodes[i].z * nodes[j].z;
        if (d > 0.8) {
          var alpha = 0.1 + 0.16 * ((pts[i].z + pts[j].z) / 2 + 1) / 2;
          ctx.strokeStyle = "rgba(142,162,255," + alpha.toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
      var order = pts.slice().sort(function (a, b) { return a.z - b.z; });
      var labels = [];
      order.forEach(function (p) {
        var hit = matches(p.n), dim = query && !hit, isHover = hover === p.n;
        var r = (4 + (hit ? 3.5 : 0) + (p.n.user ? 1.2 : 0)) * p.f;
        var depth = 0.6 + 0.4 * (p.z + 1) / 2;
        ctx.globalAlpha = dim ? 0.18 : depth;
        if (hit || p.age < 1) { // เรืองแสง
          ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.2, 0, 6.2832);
          ctx.fillStyle = hit ? "rgba(255,209,102,.25)" : "rgba(110,231,183,.25)"; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832);
        ctx.fillStyle = hit ? "#ffd166" : (p.n.user ? "#6ee7b7" : "#b5c0ff"); ctx.fill();
        ctx.globalAlpha = 1;
        if ((hit || isHover) && p.n.text) labels.push(p);
      });
      ctx.font = "13px 'Noto Sans Thai','Sarabun','Leelawadee UI',system-ui,sans-serif";
      ctx.textBaseline = "middle";
      labels.forEach(function (p) {
        var tw = ctx.measureText(p.n.text).width, bx = Math.max(4, Math.min(w - tw - 16, p.x + 10)), by = Math.max(14, Math.min(h - 14, p.y - 14));
        ctx.fillStyle = "rgba(8,12,28,.88)"; ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(bx - 6, by - 11, tw + 12, 22, 6); else ctx.rect(bx - 6, by - 11, tw + 12, 22);
        ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillText(p.n.text, bx, by + 0.5);
      });
      draw.pts = pts;
    }

    function tick(now) {
      raf = 0;
      if (!visible || document.hidden) { running = false; return; }
      if (!reduce && !dragging) { ry += 0.0035; ringAngle += 0.02; }
      draw(now);
      if (!reduce || dragging) raf = requestAnimationFrame(tick); else running = false;
    }
    function schedule() {
      if (raf || !visible) return;
      running = true; raf = requestAnimationFrame(tick);
    }

    function updateStatus(msg) {
      if (msg) { status.textContent = msg; return; }
      if (!query) { status.textContent = "ลากเพื่อหมุน · จดโน้ตของคุณ · พิมพ์คำเพื่อค้น"; return; }
      var c = nodes.filter(matches).length;
      status.textContent = c ? ("เจอ " + c + " โน้ตที่มีคำว่า \"" + query + "\" (ดวงสีทองคือที่ตรง)") : ("ไม่เจอโน้ตที่มีคำว่า \"" + query + "\"");
    }

    addForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = $("input", addForm), t = inp.value.trim().slice(0, 60);
      if (!t) return;
      addNode(t, randUnit(), true);
      inp.value = "";
      updateStatus("จดแล้ว: \"" + t + "\" (ดวงสีเขียวคือโน้ตของคุณ ลองพิมพ์คำจากโน้ตนี้ในช่องค้น)");
      setDone("p1-demo", true);
      schedule();
    });
    findInput.addEventListener("input", function () {
      query = findInput.value.trim().toLowerCase();
      updateStatus();
      if (query) setDone("p1-demo", true);
      schedule();
    });
    $(".mem-find", root).addEventListener("submit", function (e) { e.preventDefault(); });

    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointerdown", function (e) { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); schedule(); });
    canvas.addEventListener("pointerup", function () { dragging = false; schedule(); });
    canvas.addEventListener("pointercancel", function () { dragging = false; });
    canvas.addEventListener("pointermove", function (e) {
      var rect = canvas.getBoundingClientRect(), mx = e.clientX - rect.left, my = e.clientY - rect.top;
      if (dragging) {
        ry += (e.clientX - lastX) * 0.008;
        if (e.pointerType === "mouse") rx = Math.max(-1.2, Math.min(1.2, rx + (e.clientY - lastY) * 0.008));
        lastX = e.clientX; lastY = e.clientY;
      }
      var best = null, bd = 18;
      (draw.pts || []).forEach(function (p) { var d = Math.hypot(p.x - mx, p.y - my); if (d < bd && p.n.text) { bd = d; best = p.n; } });
      if (best !== hover) { hover = best; schedule(); }
    });
    canvas.addEventListener("pointerleave", function () { hover = null; schedule(); });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) schedule(); }).observe(canvas);
    }
    document.addEventListener("visibilitychange", function () { if (!document.hidden) schedule(); });
    if ("ResizeObserver" in window) new ResizeObserver(size).observe(canvas.parentNode); else window.addEventListener("resize", size);
    size();
    updateStatus();
  });
})();

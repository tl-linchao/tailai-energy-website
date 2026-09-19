/* 泰莱综合能源官网交互脚本 */
(function () {
  'use strict';

  /* ---------- 顶部导航:滚动状态 ---------- */
  var header = document.getElementById('header');
  var backTop = document.getElementById('backTop');

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('scrolled', y > 40);
    backTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  navToggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ---------- 锚点平滑滚动(带固定头部偏移) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = 76;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* ---------- 园区数字孪生加载检测(需经服务器访问) ---------- */
  var twinFrame = document.getElementById('twinFrame');
  var heroFallback = document.getElementById('heroFallback');
  var twinBtns = [document.getElementById('twinFullBtn'), document.getElementById('parkTwinBtn')];
  var fbText = document.getElementById('fallbackText');
  var twinTargets = [
    '../building-label-formal-integration-test/index.html',
    '../building-label-formal-integration-test/Build/building-label-formal-candidate.data.unityweb'
  ];

  function headOk(url) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 6000);
    return fetch(url, { method: 'HEAD', signal: controller ? controller.signal : undefined })
      .then(function (res) {
        clearTimeout(timer);
        if (!res.ok) throw new Error('http ' + res.status);
        return true;
      })
      .catch(function () { clearTimeout(timer); return false; });
  }
  function checkTwin() {
    Promise.all([headOk(twinTargets[0]), headOk(twinTargets[1])]).then(function (r) {
      var pageOk = r[0], dataOk = r[1];
      if (pageOk && dataOk) {
        if (!twinFrame.getAttribute('src')) twinFrame.setAttribute('src', twinTargets[0]);
        heroFallback.hidden = true;
        twinBtns.forEach(function (b) { if (b) b.hidden = false; });
      } else {
        heroFallback.hidden = false;
        twinBtns.forEach(function (b) { if (b) b.hidden = true; });
        if (fbText) {
          fbText.innerHTML = pageOk
            ? '线上版数字孪生资源较大,正在优化压缩中,敬请期待。<br>完整 3D 园区体验可双击本地「启动官网.bat」查看。'
            : '数字孪生需要通过本地服务器运行。<br>请双击文件夹中的「启动官网.bat」打开本网站,体验 3D 园区展示。';
        }
      }
    });
  }
  checkTwin();
  var retryBtn = document.getElementById('retryTwin');
  if (retryBtn) {
    retryBtn.addEventListener('click', function () {
      heroFallback.hidden = true;
      checkTwin();
    });
  }

  /* ---------- 导航高亮:当前板块 ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav a');
  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id || 'home';
      navLinks.forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('href') === '#' + id);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { sectionObserver.observe(s); });

  /* ---------- 滚动显现动画 ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObserver.observe(el); });

  /* ---------- 数字滚动动画 ---------- */
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    if (isNaN(target)) return;
    var suffix = el.dataset.suffix || '';
    var duration = 1600;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { countObserver.observe(el); });

  /* ---------- 回到顶部 ---------- */
  backTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

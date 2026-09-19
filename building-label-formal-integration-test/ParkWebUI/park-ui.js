(function () {
  "use strict";

  var unityInstance = null;
  var uiRoot = null;
  var buttons = [];
  var activeScene = null;
  var worldLabelsRoot = null;
  var anchors = {};
  var sceneCard = null;

  var ZERO_CARBON_PLATFORM_URL = "http://101.201.237.45:8090/ECEMS/login?n=admin&p=Acrel%23001";
  var sceneCardTitle = null;
  var sceneCardBody = null;
  var sceneCardTimer = null;

  var sceneDescriptions = {
    FocusOverview: {
      title: "园区全景",
      body: "距高铁泰安站、京台高速泰安西收费站均 3.5km，紧邻 104 国道，10 分钟直达岱岳区政府｜16 栋高标准厂房，600~12000㎡/栋，檐高 12m，跨度 25~30m，10T 牛腿，央企施工，道路宽 14~19m｜区属国企西部经济独资建设，注册资本 6 亿元，AA 级信用，旗下 8 家子公司"
    },
    FocusPV: {
      title: "分布式光伏",
      body: "10.8MW 分布式光伏（屋顶 + 车棚 + 自动跟踪）· 5MW/10MWh 工商业储能 · V2G 双向充电桩集群 · 移动储能充电车 · 光储直柔充电一体"
    },
    FocusMobileCharging: {
      title: "移动储充",
      body: "10.8MW 分布式光伏（屋顶 + 车棚 + 自动跟踪）· 5MW/10MWh 工商业储能 · V2G 双向充电桩集群 · 移动储能充电车 · 光储直柔充电一体"
    },
    FocusFixedCharger: {
      title: "固定充电桩",
      body: "10.8MW 分布式光伏（屋顶 + 车棚 + 自动跟踪）· 5MW/10MWh 工商业储能 · V2G 双向充电桩集群 · 移动储能充电车 · 光储直柔充电一体"
    },
    FocusEnergyStorage: {
      title: "储能设备",
      body: "10.8MW 分布式光伏（屋顶 + 车棚 + 自动跟踪）· 5MW/10MWh 工商业储能 · V2G 双向充电桩集群 · 移动储能充电车 · 光储直柔充电一体"
    }
  };

  function setOverviewLabelsVisible(visible) {
    if (!worldLabelsRoot) return;
    worldLabelsRoot.classList.toggle("is-hidden", !visible);
  }

  function setActive(button) {
    buttons.forEach(function (item) {
      var isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (activeScene && button) {
      activeScene.textContent = button.dataset.label || "园区全景";
    }

    var isOverview = !!button && button.dataset.method === "FocusOverview";
    setOverviewLabelsVisible(isOverview);
    if (uiRoot) uiRoot.classList.toggle("is-focus-view", !isOverview);

    /* 更新场景说明卡片 */
    if (sceneCard && button) {
      var desc = sceneDescriptions[button.dataset.method];
      if (desc) {
        sceneCard.classList.add("is-fading");
        clearTimeout(sceneCardTimer);
        sceneCardTimer = setTimeout(function () {
          sceneCardTitle.textContent = desc.title;
          sceneCardBody.textContent = desc.body;
          sceneCard.classList.remove("is-fading");
        }, 140);
      }
    }
  }

  function invokeUnity(methodName) {
    if (!unityInstance || !methodName) return false;

    try {
      unityInstance.SendMessage("Interactions", methodName);
      return true;
    } catch (error) {
      console.error("[Park Web UI] Unity 调用失败:", methodName, error);
      return false;
    }
  }

  function bindButtons() {
    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (!unityInstance) return;
        if (invokeUnity(button.dataset.method)) {
          setActive(button);
        }
      });
    });

    Object.keys(anchors).forEach(function (key) {
      var anchor = anchors[key];
      var methodName = anchor.dataset.method;

      // A/B 充放电位置标签仅用于说明，不拦截鼠标，也不触发镜头切换。
      if (!methodName) return;

      anchor.addEventListener("click", function () {
        if (!unityInstance) return;
        if (invokeUnity(methodName)) {
          var navButton = buttons.find(function (item) {
            return item.dataset.method === methodName;
          });
          if (navButton) setActive(navButton);
        }
      });
    });
  }

  function init() {
    uiRoot = document.querySelector("#park-web-ui");
    buttons = Array.prototype.slice.call(document.querySelectorAll(".park-scene-button"));
    activeScene = document.querySelector("#park-active-scene");
    worldLabelsRoot = document.querySelector("#park-world-labels");

    sceneCard = document.querySelector("#park-scene-card");
    if (sceneCard) {
      sceneCardTitle = sceneCard.querySelector(".park-scene-card__title");
      sceneCardBody = sceneCard.querySelector(".park-scene-card__body");
    }

    Array.prototype.slice.call(document.querySelectorAll("[data-anchor]")).forEach(function (element) {
      if (element.dataset.anchor) {
        anchors[element.dataset.anchor] = element;
      }
    });

    bindButtons();
    setOverviewLabelsVisible(true);

    /* 全屏切换按钮 */
    var fsBtn = document.querySelector("#park-fullscreen-btn");
    if (fsBtn) {
      function updateFsLabel() {
        var isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
        fsBtn.innerHTML = isFS ? "⛶ 退出全屏" : "⛶ 全屏";
        fsBtn.setAttribute("aria-label", isFS ? "退出全屏" : "全屏");
      }
      fsBtn.addEventListener("click", function () {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
          (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else {
          var el = document.documentElement;
          (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        }
      });
      document.addEventListener("fullscreenchange", updateFsLabel);
      document.addEventListener("webkitfullscreenchange", updateFsLabel);
    }

    /* 泰莱综能绿色零碳智能管理平台入口 */
    var platformBtn = document.querySelector("#park-zero-carbon-platform");
    if (platformBtn) {
      platformBtn.addEventListener("click", function () {
        window.open(ZERO_CARBON_PLATFORM_URL, "_blank", "noopener,noreferrer");
      });
    }
  }

  function setReady(instance) {
    unityInstance = instance;
    if (uiRoot) uiRoot.classList.remove("is-loading");
  }

  /* --- 标签位置插值平滑：Unity 回调只更新目标值，网页端逐帧追踪，旋转更丝滑 --- */
  var anchorMotion = {};
  var anchorRafId = 0;
  var ANCHOR_SMOOTHING = 0.32;

  /* 相机运动检测：连续运动时给 UI 根节点加 is-motion，自动摘除毛玻璃减负 */
  var motionActive = false;
  var motionFrames = 0;
  var motionTimerId = 0;

  function setMotion(on) {
    if (on === motionActive) return;
    motionActive = on;
    if (uiRoot) uiRoot.classList.toggle("is-motion", on);
  }

  function renderAnchors() {
    var settled = true;

    Object.keys(anchorMotion).forEach(function (id) {
      var m = anchorMotion[id];
      if (!m.element) return;

      var dx = m.targetX - m.currentX;
      var dy = m.targetY - m.currentY;

      if (Math.abs(dx) > 0.0002 || Math.abs(dy) > 0.0002) {
        m.currentX += dx * ANCHOR_SMOOTHING;
        m.currentY += dy * ANCHOR_SMOOTHING;
        settled = false;
      } else {
        m.currentX = m.targetX;
        m.currentY = m.targetY;
      }

      m.element.style.transform =
        "translate3d(" + (m.currentX * 100).toFixed(3) + "vw, " +
        (m.currentY * 100).toFixed(3) + "vh, 0) translate(-50%, -100%)";

      /* 前后纵深排序：屏幕越靠下=离镜头越近 → z-index 越高（按0.5%屏高分桶，减少每帧写入） */
      var z = Math.round(m.currentY * 200);
      if (z !== m.lastZ) {
        m.lastZ = z;
        m.element.style.zIndex = String(z);
      }
    });

    /* 持续运动 → 摘毛玻璃；静止半秒 → 恢复毛玻璃 */
    if (!settled) {
      motionFrames += 1;
      if (motionTimerId) {
        clearTimeout(motionTimerId);
        motionTimerId = 0;
      }
      if (motionFrames >= 3) setMotion(true);
    } else {
      motionFrames = 0;
      if (motionActive && !motionTimerId) {
        motionTimerId = setTimeout(function () {
          motionTimerId = 0;
          setMotion(false);
        }, 500);
      }
    }

    anchorRafId = settled ? 0 : window.requestAnimationFrame(renderAnchors);
  }

  function updateAnchor(anchorId, x01, y01, visible) {
    var element = anchors[anchorId];
    if (!element) return;

    var motion = anchorMotion[anchorId];
    if (!motion) {
      motion = anchorMotion[anchorId] = {
        element: element,
        currentX: x01,
        currentY: y01,
        targetX: x01,
        targetY: y01
      };
    }

    motion.targetX = x01;
    motion.targetY = y01;
    element.classList.toggle("is-visible", !!visible);

    if (!anchorRafId) {
      anchorRafId = window.requestAnimationFrame(renderAnchors);
    }
  }

  window.ParkWebUI = {
    setReady: setReady,
    updateAnchor: updateAnchor,
    setActiveByMethod: function (methodName) {
      var button = buttons.find(function (item) {
        return item.dataset.method === methodName;
      });
      if (button) setActive(button);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

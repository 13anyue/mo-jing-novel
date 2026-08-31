/**
 * npc-mood.js — NPC好感度追踪与可视化图表模块
 * 视觉小说系统 v6 专用
 * 风格：古风墨境
 * 纯 Canvas API，零外部依赖
 */

(function (global) {
  'use strict';

  // =========================
  // 配色与常量定义（古风墨境）
  // =========================
  const COLORS = {
    parchment: '#F5E6D3',      // 暖羊皮纸底色
    ink: '#2C1810',              // 墨色主文字
    gold: '#C9A227',             // 金色（主NPC折线）
    secondaryText: '#8B7355',    // 坐标轴文字
    grid: '#D4C4A8',             // 网格线
    tooltipBg: 'rgba(245, 230, 211, 0.95)',
    tooltipBorder: '#C9A227',
    tooltipText: '#2C1810',
    npcPalette: [
      '#C9A227', // 金色（主NPC）
      '#C9453A', // 朱红
      '#2F4F8F', // 靛蓝
      '#7B68EE', // 紫罗兰
      '#2E8B57', // 翠绿
      '#E8A838', // 橙黄
      '#D65A8F'  // 玫粉
    ]
  };

  const STORAGE_KEY = 'npcMoodHistory_v11';
  const CHART_PADDING = { top: 30, right: 80, bottom: 50, left: 50 };
  const NPC_NAMES_CACHE = {}; // npcId -> npcName 映射缓存

  // =========================
  // NPCMoodTracker 全局对象
  // =========================
  const NPCMoodTracker = {
    _resizeHandlers: new Map(), // containerId -> handler
    _tooltipEl: null,           // 全局共享 tooltip DOM
    _canvasMap: new Map()       // containerId -> { canvas, ctx, data, type, npcIds }
  };

  // =========================
  // 初始化
  // =========================
  /**
   * 初始化模块，创建全局共享 tooltip DOM
   */
  NPCMoodTracker.init = function () {
    if (!this._tooltipEl) {
      this._tooltipEl = document.createElement('div');
      this._tooltipEl.id = 'npc-mood-tooltip';
      Object.assign(this._tooltipEl.style, {
        position: 'fixed',
        pointerEvents: 'none',
        background: COLORS.tooltipBg,
        border: `1px solid ${COLORS.tooltipBorder}`,
        borderRadius: '4px',
        padding: '8px 12px',
        fontSize: '12px',
        color: COLORS.tooltipText,
        boxShadow: '0 2px 8px rgba(44,24,16,0.15)',
        zIndex: '10000',
        display: 'none',
        fontFamily: "'Noto Serif SC', 'SimSun', serif",
        lineHeight: '1.6',
        maxWidth: '220px',
        wordBreak: 'break-word'
      });
      document.body.appendChild(this._tooltipEl);
    }
  };

  // =========================
  // 数据记录
  // =========================
  /**
   * 记录一次NPC好感度变化
   * @param {string} npcId    NPC唯一标识
   * @param {number} moodValue 好感度数值（0-100）
   * @param {string} context  对话摘要或上下文
   */
  NPCMoodTracker.recordMood = function (npcId, moodValue, context) {
    const history = this.getMoodHistory();
    const npcName = NPC_NAMES_CACHE[npcId] || '未知角色';

    const record = {
      npcId: String(npcId),
      npcName: npcName,
      timestamp: Date.now(),
      moodValue: Math.max(0, Math.min(100, Number(moodValue) || 0)),
      context: String(context || '').trim()
    };

    history.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    return record;
  };

  /**
   * 获取全部好感度历史记录（浅拷贝数组）
   * @returns {Array<Object>}
   */
  NPCMoodTracker.getMoodHistory = function () {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('[NPCMoodTracker] 读取历史记录失败:', e);
      return [];
    }
  };

  /**
   * 按时间范围筛选记录
   * @param {Array<Object>} records
   * @param {number} days 最近N天，0表示全部
   * @returns {Array<Object>}
   */
  function filterByDays(records, days) {
    if (!days || days <= 0) return records;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return records.filter(r => r.timestamp >= cutoff);
  }

  /**
   * 按NPC ID分组记录
   * @param {Array<Object>} records
   * @returns {Map<string, Array<Object>>}
   */
  function groupByNpc(records) {
    const map = new Map();
    records.forEach(r => {
      const list = map.get(r.npcId) || [];
      list.push(r);
      map.set(r.npcId, list);
    });
    return map;
  }

  /**
   * 设置NPC名称缓存（供外部调用，如 npc-v3.js 在打开详情页时注入）
   * @param {string} npcId
   * @param {string} npcName
   */
  NPCMoodTracker.setNpcName = function (npcId, npcName) {
    NPC_NAMES_CACHE[String(npcId)] = String(npcName);
  };

  // =========================
  // 清空与示例数据
  // =========================
  /**
   * 清空全部好感度历史记录
   */
  NPCMoodTracker.clearHistory = function () {
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * 生成10条模拟记录，用于预览图表效果
   * @param {string} npcId  目标NPC ID
   * @param {string} npcName NPC名字
   */
  NPCMoodTracker.generateDemoData = function (npcId, npcName) {
    const history = this.getMoodHistory();
    const base = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const contexts = [
      '初次相遇，彼此试探',
      '共同探讨古籍，产生共鸣',
      '月下独酌，敞开心扉',
      '遭遇敌袭，并肩作战',
      '赠送信物，暗生情愫',
      '误会解除，冰释前嫌',
      '携手游园，笑语盈盈',
      '离别前夕，依依不舍',
      '重逢之际，喜极而泣',
      '定下山盟，生死相随'
    ];
    let currentMood = 45;

    for (let i = 0; i < 10; i++) {
      const delta = Math.floor(Math.random() * 12) - 3; // -3 ~ +8
      currentMood = Math.max(0, Math.min(100, currentMood + delta));
      const ts = base + i * 3 * 24 * 60 * 60 * 1000 + Math.floor(Math.random() * 12 * 60 * 60 * 1000);
      history.push({
        npcId: String(npcId),
        npcName: String(npcName),
        timestamp: ts,
        moodValue: currentMood,
        context: contexts[i]
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  };

  // =========================
  // Canvas 绘图工具函数
  // =========================

  /**
   * 创建高DPI Canvas
   * @param {HTMLCanvasElement} canvas
   */
  function setupHiDPICanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

  /**
   * 格式化时间标签
   * @param {number} ts 时间戳
   * @returns {string}
   */
  function formatTime(ts) {
    const d = new Date(ts);
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${MM}-${DD} ${hh}:${mm}`;
  }

  /**
   * 在两点间绘制平滑曲线（Catmull-Rom 样条近似）
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{x:number, y:number}>} points
   */
  function drawSmoothLine(ctx, points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
    ctx.stroke();
  }

  /**
   * 绘制半透明渐变填充区域
   * @param {CanvasRenderingContext2D} ctx
   * @param {Array<{x:number, y:number}>} points
   * @param {number} baselineY 底部Y坐标
   * @param {string} color 主色
   * @param {number} alpha 透明度
   */
  function drawGradientFill(ctx, points, baselineY, color, alpha) {
    if (points.length < 2) return;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, baselineY);
    ctx.lineTo(points[0].x, points[0].y);

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }

    ctx.lineTo(points[points.length - 1].x, baselineY);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, Math.min(...points.map(p => p.y)), 0, baselineY);
    gradient.addColorStop(0, color.replace(')', `, ${alpha})`).replace('rgb', 'rgba'));
    gradient.addColorStop(1, color.replace(')', `, 0.05)`).replace('rgb', 'rgba'));
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  /**
   * 绘制虚线
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @param {Array<number>} dash
   */
  function drawDashedLine(ctx, x1, y1, x2, y2, dash = [4, 4]) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 十六进制色转rgb字符串（用于渐变填充）
   * @param {string} hex
   * @returns {string} rgb(r, g, b)
   */
  function hexToRgb(hex) {
    const m = hex.replace('#', '').match(/.{2}/g);
    if (!m || m.length < 3) return 'rgb(0,0,0)';
    const r = parseInt(m[0], 16);
    const g = parseInt(m[1], 16);
    const b = parseInt(m[2], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  // =========================
  // 核心图表绘制引擎
  // =========================
  /**
   * 绘制单NPC或多NPC对比折线图
   * @param {HTMLCanvasElement} canvas
   * @param {Array<Object>} records 已筛选的记录数组
   * @param {string|Array<string>} npcIds 单个ID或ID数组
   * @param {boolean} isComparison 是否为多NPC对比模式
   */
  function drawChart(canvas, records, npcIds, isComparison) {
    const { ctx, width, height } = setupHiDPICanvas(canvas);
    const pad = CHART_PADDING;
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 填充羊皮纸底色
    ctx.fillStyle = COLORS.parchment;
    ctx.fillRect(0, 0, width, height);

    // 确定需要展示的NPC列表
    const targetNpcIds = isComparison ? npcIds.map(String) : [String(npcIds)];
    const grouped = groupByNpc(records);

    // 收集所有要展示的数据点以确定时间范围
    let allShownRecords = [];
    targetNpcIds.forEach(id => {
      const list = grouped.get(id) || [];
      allShownRecords = allShownRecords.concat(list);
    });

    if (allShownRecords.length === 0) {
      drawEmptyState(ctx, width, height);
      return;
    }

    // 按时间排序
    allShownRecords.sort((a, b) => a.timestamp - b.timestamp);
    const minTs = allShownRecords[0].timestamp;
    const maxTs = allShownRecords[allShownRecords.length - 1].timestamp;
    const timeSpan = Math.max(1, maxTs - minTs);

    // Y轴刻度：0 ~ 100，每20一格
    const ySteps = 5;
    const yMax = 100;
    const yMin = 0;

    // 绘制网格线与Y轴标签
    ctx.font = '11px "Noto Serif SC", "SimSun", serif';
    ctx.fillStyle = COLORS.secondaryText;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;

    for (let i = 0; i <= ySteps; i++) {
      const val = yMin + (i / ySteps) * (yMax - yMin);
      const y = pad.top + chartH - (val / yMax) * chartH;

      // 网格线
      ctx.strokeStyle = COLORS.grid;
      drawDashedLine(ctx, pad.left, y, pad.left + chartW, y);

      // Y轴标签
      ctx.fillStyle = COLORS.secondaryText;
      ctx.fillText(String(Math.round(val)), pad.left - 8, y);
    }

    // Y轴标题
    ctx.save();
    ctx.translate(14, pad.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = '12px "Noto Serif SC", "SimSun", serif';
    ctx.fillStyle = COLORS.secondaryText;
    ctx.fillText('好感度', 0, 0);
    ctx.restore();

    // X轴时间标签（根据数据量动态决定显示数量，最多6个）
    const xLabels = [];
    const total = allShownRecords.length;
    const labelCount = Math.min(6, total);
    for (let i = 0; i < labelCount; i++) {
      const idx = Math.floor((i / (labelCount - 1)) * (total - 1));
      xLabels.push({
        text: formatTime(allShownRecords[idx].timestamp),
        xRatio: (allShownRecords[idx].timestamp - minTs) / timeSpan
      });
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = COLORS.secondaryText;
    xLabels.forEach(lbl => {
      const x = pad.left + lbl.xRatio * chartW;
      ctx.fillText(lbl.text, x, pad.top + chartH + 8);
    });

    // X轴标题
    ctx.fillText('时间', pad.left + chartW / 2, height - 10);

    // 绘制各NPC折线
    const allPointsMap = new Map(); // npcId -> Array<{x, y, record}>

    targetNpcIds.forEach((npcId, npcIndex) => {
      const list = (grouped.get(npcId) || []).slice().sort((a, b) => a.timestamp - b.timestamp);
      if (list.length === 0) return;

      const color = COLORS.npcPalette[npcIndex % COLORS.npcPalette.length];
      const points = list.map(r => {
        const x = pad.left + ((r.timestamp - minTs) / timeSpan) * chartW;
        const y = pad.top + chartH - (r.moodValue / yMax) * chartH;
        return { x, y, record: r };
      });
      allPointsMap.set(npcId, points);

      // 渐变填充
      const rgb = hexToRgb(color);
      const baselineY = pad.top + chartH;
      drawGradientFill(ctx, points, baselineY, rgb, 0.2);

      // 折线
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      drawSmoothLine(ctx, points);

      // 数据点
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = COLORS.parchment;
        ctx.stroke();
      });
    });

    // 图例（右侧或底部自适应）
    drawLegend(ctx, targetNpcIds, width, height, pad, isComparison);

    // 返回用于交互检测的数据结构
    return {
      pointsMap: allPointsMap,
      pad,
      chartW,
      chartH,
      yMax
    };
  }

  /**
   * 绘制图例
   */
  function drawLegend(ctx, npcIds, width, height, pad, isComparison) {
    if (npcIds.length <= 1 && !isComparison) return;

    const itemHeight = 18;
    const lineWidth = 20;
    const gap = 10;
    const legendX = width - pad.right + 10;
    let legendY = pad.top + 10;

    // 若右侧空间不足，切换到左下角
    const useRight = pad.right >= 70;
    const lx = useRight ? legendX : pad.left;
    const ly = useRight ? legendY : height - 20;
    const vertical = useRight;

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = '11px "Noto Serif SC", "SimSun", serif';

    npcIds.forEach((npcId, i) => {
      const color = COLORS.npcPalette[i % COLORS.npcPalette.length];
      const name = NPC_NAMES_CACHE[npcId] || npcId;

      const x = vertical ? lx : lx + i * 90;
      const y = vertical ? ly + i * itemHeight : ly;

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + lineWidth, y);
      ctx.stroke();

      ctx.fillStyle = COLORS.ink;
      ctx.fillText(name, x + lineWidth + 5, y);
    });
  }

  /**
   * 绘制空状态提示
   */
  function drawEmptyState(ctx, width, height) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px "Noto Serif SC", "SimSun", serif';
    ctx.fillStyle = COLORS.secondaryText;
    ctx.fillText('暂无心情记录，开始与角色对话后会自动记录好感度变化', width / 2, height / 2 - 10);

    ctx.font = '12px "Noto Serif SC", "SimSun", serif';
    ctx.fillStyle = COLORS.gold;
    ctx.fillText('点击"生成示例数据"按钮可预览效果', width / 2, height / 2 + 20);
    ctx.restore();
  }

  // =========================
  // Tooltip 与交互
  // =========================
  /**
   * 显示 tooltip
   */
  function showTooltip(content, x, y) {
    const el = NPCMoodTracker._tooltipEl;
    if (!el) return;
    el.innerHTML = content;
    el.style.display = 'block';

    // 防止溢出屏幕
    const rect = el.getBoundingClientRect();
    let left = x + 12;
    let top = y - 12;
    if (left + rect.width > window.innerWidth) left = x - rect.width - 12;
    if (top + rect.height > window.innerHeight) top = y - rect.height - 12;
    if (top < 0) top = 12;

    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  /**
   * 隐藏 tooltip
   */
  function hideTooltip() {
    const el = NPCMoodTracker._tooltipEl;
    if (el) el.style.display = 'none';
  }

  /**
   * 为 Canvas 绑定鼠标交互（悬停放大+tooltip）
   * @param {HTMLCanvasElement} canvas
   * @param {Map<string, Array>} pointsMap
   */
  function bindChartInteractions(canvas, pointsMap) {
    let hoveredPoint = null;

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1));
      const my = (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1));

      let found = null;
      let minDist = Infinity;
      const threshold = 12; // 像素感应半径

      pointsMap.forEach((points, npcId) => {
        points.forEach(p => {
          const dx = mx - p.x;
          const dy = my - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < threshold && dist < minDist) {
            minDist = dist;
            found = { ...p, npcId };
          }
        });
      });

      if (found) {
        if (!hoveredPoint || hoveredPoint.record.timestamp !== found.record.timestamp || hoveredPoint.npcId !== found.npcId) {
          hoveredPoint = found;
          // 重绘以放大高亮点
          const info = NPCMoodTracker._canvasMap.get(canvas.id);
          if (info) {
            const { ctx, width, height } = setupHiDPICanvas(canvas);
            // 复用上一次绘制的完整状态：这里简单重绘整图
            drawChart(canvas, info.data, info.npcIds, info.type === 'comparison');
            // 再画高亮圆
            const { x, y } = found;
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = COLORS.gold;
            ctx.globalAlpha = 0.3;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 2;
            ctx.strokeStyle = COLORS.gold;
            ctx.stroke();
            ctx.restore();
          }

          const r = found.record;
          const name = NPC_NAMES_CACHE[r.npcId] || r.npcName || r.npcId;
          const html = [
            `<strong>${name}</strong>`,
            `时间: ${formatTime(r.timestamp)}`,
            `好感度: <span style="color:${COLORS.gold};font-weight:bold">${r.moodValue}</span>`,
            r.context ? `摘要: ${r.context}` : ''
          ].filter(Boolean).join('<br>');
          showTooltip(html, e.clientX, e.clientY);
        }
      } else {
        if (hoveredPoint) {
          hoveredPoint = null;
          hideTooltip();
          const info = NPCMoodTracker._canvasMap.get(canvas.id);
          if (info) {
            drawChart(canvas, info.data, info.npcIds, info.type === 'comparison');
          }
        }
      }
    };

    const onLeave = () => {
      hoveredPoint = null;
      hideTooltip();
      const info = NPCMoodTracker._canvasMap.get(canvas.id);
      if (info) {
        drawChart(canvas, info.data, info.npcIds, info.type === 'comparison');
      }
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);

    // 导出时也要触发重绘，所以保留引用
    canvas._moodHandlers = { move: onMove, leave: onLeave };
  }

  // =========================
  // 渲染入口
  // =========================
  /**
   * 渲染单NPC心情折线图
   * @param {string} containerId 容器元素ID
   * @param {string} npcId       NPC唯一标识
   * @param {number} [days=0]    时间范围：最近N天（0=全部）
   */
  NPCMoodTracker.renderMoodChart = function (containerId, npcId, days) {
    this.init();
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[NPCMoodTracker] 容器 #${containerId} 不存在`);
      return;
    }

    // 清空容器并构建内部结构：控制栏 + canvas
    container.innerHTML = '';
    container.style.background = COLORS.parchment;
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.position = 'relative';

    // 控制栏
    const toolbar = document.createElement('div');
    toolbar.style.marginBottom = '8px';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '8px';
    toolbar.style.alignItems = 'center';
    toolbar.style.flexWrap = 'wrap';

    const dayOptions = [
      { label: '全部', val: 0 },
      { label: '最近30天', val: 30 },
      { label: '最近7天', val: 7 },
      { label: '最近1天', val: 1 }
    ];

    dayOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.style.cssText = `
        border:1px solid ${COLORS.gold}; background:${days === opt.val ? COLORS.gold : 'transparent'};
        color:${days === opt.val ? '#fff' : COLORS.ink}; padding:2px 10px; border-radius:12px;
        cursor:pointer; font-family:"Noto Serif SC","SimSun",serif; font-size:12px;
        transition:all 0.2s;
      `;
      btn.addEventListener('mouseenter', () => {
        if (days !== opt.val) btn.style.background = 'rgba(201,162,39,0.15)';
      });
      btn.addEventListener('mouseleave', () => {
        if (days !== opt.val) btn.style.background = 'transparent';
      });
      btn.addEventListener('click', () => {
        this.renderMoodChart(containerId, npcId, opt.val);
      });
      toolbar.appendChild(btn);
    });

    // 清空按钮
    const clearBtn = document.createElement('button');
    clearBtn.textContent = '清空记录';
    clearBtn.style.cssText = `
      margin-left:auto; border:1px solid ${COLORS.secondaryText}; background:transparent;
      color:${COLORS.secondaryText}; padding:2px 10px; border-radius:12px;
      cursor:pointer; font-family:"Noto Serif SC","SimSun",serif; font-size:12px;
    `;
    clearBtn.addEventListener('click', () => {
      if (confirm('确定要清空该角色的所有好感度记录吗？此操作不可恢复。')) {
        const all = this.getMoodHistory();
        const filtered = all.filter(r => r.npcId !== String(npcId));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        this.renderMoodChart(containerId, npcId, days);
      }
    });
    toolbar.appendChild(clearBtn);

    // 示例数据按钮
    const demoBtn = document.createElement('button');
    demoBtn.textContent = '生成示例数据';
    demoBtn.style.cssText = `
      border:1px dashed ${COLORS.gold}; background:transparent;
      color:${COLORS.gold}; padding:2px 10px; border-radius:12px;
      cursor:pointer; font-family:"Noto Serif SC","SimSun",serif; font-size:12px;
    `;
    demoBtn.addEventListener('click', () => {
      const name = NPC_NAMES_CACHE[npcId] || '示例角色';
      this.generateDemoData(npcId, name);
      this.renderMoodChart(containerId, npcId, days);
    });
    toolbar.appendChild(demoBtn);

    container.appendChild(toolbar);

    // Canvas 区域
    const canvasWrap = document.createElement('div');
    canvasWrap.style.width = '100%';
    canvasWrap.style.height = '320px';
    canvasWrap.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.id = containerId + '-mood-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.borderRadius = '4px';
    canvasWrap.appendChild(canvas);
    container.appendChild(canvasWrap);

    // 导出按钮
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '导出PNG';
    exportBtn.style.cssText = `
      position:absolute; top:10px; right:10px; border:1px solid ${COLORS.secondaryText};
      background:rgba(245,230,211,0.8); color:${COLORS.secondaryText};
      padding:2px 8px; border-radius:10px; cursor:pointer; font-size:11px;
      font-family:"Noto Serif SC","SimSun",serif;
    `;
    exportBtn.addEventListener('click', () => {
      this.exportChartPNG(canvas);
    });
    container.appendChild(exportBtn);

    // 数据筛选
    const allRecords = this.getMoodHistory();
    const filtered = filterByDays(
      allRecords.filter(r => r.npcId === String(npcId)),
      days || 0
    );

    // 保存状态用于重绘
    this._canvasMap.set(canvas.id, {
      canvas,
      ctx: null,
      data: filtered,
      type: 'single',
      npcIds: [String(npcId)]
    });

    // 绘制
    const chartInfo = drawChart(canvas, filtered, String(npcId), false);
    if (chartInfo && chartInfo.pointsMap) {
      bindChartInteractions(canvas, chartInfo.pointsMap);
    }

    // Resize 监听（防抖）
    let resizeTimer;
    const handler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const info = this._canvasMap.get(canvas.id);
        if (info) {
          drawChart(canvas, info.data, info.npcIds, info.type === 'comparison');
        }
      }, 150);
    };
    this._resizeHandlers.set(containerId, handler);
    window.addEventListener('resize', handler);
  };

  /**
   * 渲染多NPC对比折线图
   * @param {string} containerId 容器元素ID
   * @param {Array<string>} npcIds NPC ID数组
   * @param {number} [days=0]    时间范围
   */
  NPCMoodTracker.renderComparisonChart = function (containerId, npcIds, days) {
    this.init();
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`[NPCMoodTracker] 容器 #${containerId} 不存在`);
      return;
    }

    container.innerHTML = '';
    container.style.background = COLORS.parchment;
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.position = 'relative';

    const toolbar = document.createElement('div');
    toolbar.style.marginBottom = '8px';
    toolbar.style.display = 'flex';
    toolbar.style.gap = '8px';
    toolbar.style.alignItems = 'center';
    toolbar.style.flexWrap = 'wrap';

    const dayOptions = [
      { label: '全部', val: 0 },
      { label: '最近30天', val: 30 },
      { label: '最近7天', val: 7 },
      { label: '最近1天', val: 1 }
    ];

    dayOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.style.cssText = `
        border:1px solid ${COLORS.gold}; background:${days === opt.val ? COLORS.gold : 'transparent'};
        color:${days === opt.val ? '#fff' : COLORS.ink}; padding:2px 10px; border-radius:12px;
        cursor:pointer; font-family:"Noto Serif SC","SimSun",serif; font-size:12px;
      `;
      btn.addEventListener('click', () => {
        this.renderComparisonChart(containerId, npcIds, opt.val);
      });
      toolbar.appendChild(btn);
    });

    const exportBtn = document.createElement('button');
    exportBtn.textContent = '导出PNG';
    exportBtn.style.cssText = `
      margin-left:auto; border:1px solid ${COLORS.secondaryText}; background:transparent;
      color:${COLORS.secondaryText}; padding:2px 10px; border-radius:12px;
      cursor:pointer; font-family:"Noto Serif SC","SimSun",serif; font-size:12px;
    `;
    exportBtn.addEventListener('click', () => {
      const canvas = document.getElementById(containerId + '-compare-canvas');
      if (canvas) this.exportChartPNG(canvas);
    });
    toolbar.appendChild(exportBtn);

    container.appendChild(toolbar);

    const canvasWrap = document.createElement('div');
    canvasWrap.style.width = '100%';
    canvasWrap.style.height = '360px';
    canvasWrap.style.position = 'relative';

    const canvas = document.createElement('canvas');
    canvas.id = containerId + '-compare-canvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvasWrap.appendChild(canvas);
    container.appendChild(canvasWrap);

    const allRecords = this.getMoodHistory();
    const targetIds = npcIds.map(String);
    const filtered = filterByDays(
      allRecords.filter(r => targetIds.includes(r.npcId)),
      days || 0
    );

    this._canvasMap.set(canvas.id, {
      canvas,
      ctx: null,
      data: filtered,
      type: 'comparison',
      npcIds: targetIds
    });

    const chartInfo = drawChart(canvas, filtered, targetIds, true);
    if (chartInfo && chartInfo.pointsMap) {
      bindChartInteractions(canvas, chartInfo.pointsMap);
    }

    let resizeTimer;
    const handler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const info = this._canvasMap.get(canvas.id);
        if (info) {
          drawChart(canvas, info.data, info.npcIds, true);
        }
      }, 150);
    };
    this._resizeHandlers.set(containerId, handler);
    window.addEventListener('resize', handler);
  };

  // =========================
  // 导出图表为PNG
  // =========================
  /**
   * 将 Canvas 图表导出为 PNG 图片并触发下载
   * @param {HTMLCanvasElement|string} canvasOrId Canvas元素或其ID
   */
  NPCMoodTracker.exportChartPNG = function (canvasOrId) {
    const canvas = (typeof canvasOrId === 'string') ? document.getElementById(canvasOrId) : canvasOrId;
    if (!canvas) {
      console.warn('[NPCMoodTracker] 导出失败：Canvas不存在');
      return;
    }

    try {
      const link = document.createElement('a');
      link.download = `npc-mood-chart-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('[NPCMoodTracker] 导出PNG失败:', e);
      alert('导出失败，请稍后重试');
    }
  };

  // =========================
  // 清理与销毁
  // =========================
  /**
   * 移除指定容器的 resize 监听（页面卸载或标签切换时调用）
   * @param {string} containerId
   */
  NPCMoodTracker.unbindContainer = function (containerId) {
    const handler = this._resizeHandlers.get(containerId);
    if (handler) {
      window.removeEventListener('resize', handler);
      this._resizeHandlers.delete(containerId);
    }
  };

  // =========================
  // 暴露到全局
  // =========================
  global.NPCMoodTracker = NPCMoodTracker;

})(typeof window !== 'undefined' ? window : this);

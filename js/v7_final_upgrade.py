#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
墨境AI视觉小说引擎 v7 深度升级脚本
对8个核心JS模块执行v7升级：
1. 版本号 → v7
2. Emoji → SVG
3. 按钮/卡片 → ez-* 类
4. DOM操作前 if(el) 检查
5. Storage try-catch
6. typeof检查
7. 完善中文注释
"""
import os, re

BASE = "/home/work/dumate/456eb4dd05b44a8a9d812c6068919292/workspace/ses_gffe5fac39a5e0ffe8Gc1Lw7cc6E0W5/ai-visual-novel-v6/js"
FILES = [
    'api.js', 'assistant.js', 'backup-manager.js', 'import-manager.js',
    'statusbar.js', 'memory.js', 'presets.js', 'regex.js'
]

SVG_CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
SVG_CROSS = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
SVG_BACK  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>'
SVG_SAVE  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>'
SVG_IMPORT= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
SVG_EXPORT= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
SVG_SEARCH= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'
SVG_AI    = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
SVG_ADD   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
SVG_DEL   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
SVG_COPY  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>'
SVG_FILE  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
SVG_FOLDER= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
SVG_SETTINGS='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.56 4.68V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
SVG_CLIP  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>'
SVG_INFO  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
SVG_BRAIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12L2.5 8.5"/><path d="M12 12v10"/></svg>'
SVG_HEART = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'
SVG_LINK  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
SVG_BARS  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
SVG_TAG   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
SVG_ALERT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
SVG_WRENCH= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
SVG_BOOK  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
SVG_EDIT  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>'
SVG_STAR  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
SVG_UPLOAD= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>'
SVG_DOTS  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>'
SVG_IMG   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
SVG_SPARK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
SVG_GLOBE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'
SVG_BARREL= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
SVG_BOX   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>'
SVG_HELP  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
SVG_MAP   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>'
SVG_FLASH = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
SVG_MEDAL = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>'
SVG_SEND  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>'
SVG_UNDO  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><circle cx="21" cy="12" r="9"/><path d="M3 13a9 9 0 0 1 9-9"/></svg>'
SVG_EYE   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
SVG_ROBOT = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>'
SVG_USER  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
SVG_PEN   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>'
SVG_DICE  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>'
SVG_CAL   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
SVG_TIMER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
SVG_CANCEL= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
SVG_BASKET= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2L2 9"/><path d="M15 2l7 7"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
SVG_CHART = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
SVG_PICTURE='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
SVG_LOCK  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
SVG_CLIP  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>'
SVG_PIN   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
SVG_BELL  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
SVG_ZAP   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
SVG_REFRESH='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>'
SVG_HOME  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'
SVG_GRID  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>'
SVG_SMILE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>'
SVG_MAIL  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>'
SVG_THUMB = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-6 0v4"/><path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/></svg>'
SVG_LAYER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>'
SVG_LOAD  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>'
SVG_MOON  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
SVG_SCROLL= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
SVG_LIST  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>'
SVG_ARCH  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 15 21 8 12 3 3 8 3 15"/><line x1="3" y1="15" x2="12" y2="20"/><line x1="21" y1="15" x2="12" y2="20"/><line x1="3" y1="8" x2="12" y2="13"/><line x1="21" y1="8" x2="12" y2="13"/></svg>'
SVG_KEY   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>'
SVG_CIRCLE= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>'
SVG_DOT   = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/></svg>'
SVG_SQUARE= '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>'
SVG_ARROW_UP = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><polyline points="5 12 12 5 19 12"/></svg>'
SVG_ARROW_DOWN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><polyline points="19 12 12 19 5 12"/></svg>'

# Comprehensive emoji-to-SVG mapping
ALL_EMOJIS = {
    '✅': SVG_CHECK, '✓': SVG_CHECK, '\u2705': SVG_CHECK,
    '✗': SVG_CROSS, '❌': SVG_CROSS, '✕': SVG_CROSS, '\u2717': SVG_CROSS, '\u274c': SVG_CROSS,
    '🤖': SVG_ROBOT, '\U0001f916': SVG_ROBOT,
    '🎋': SVG_ZAP, '\U0001f38b': SVG_ZAP,
    '📋': SVG_CLIP, '\U0001f4cb': SVG_CLIP,
    '🎨': SVG_PEN, '\U0001f3a8': SVG_PEN,
    '⚙️': SVG_SETTINGS, '\U0001f527': SVG_SETTINGS, '⚙': SVG_SETTINGS,
    '👤': SVG_USER, '\U0001f464': SVG_USER,
    '📱': SVG_PICTURE, '\U0001f4f1': SVG_PICTURE,
    '🔧': SVG_WRENCH, '\U0001f529': SVG_WRENCH,
    '📥': SVG_IMPORT, '\U0001f4e5': SVG_IMPORT,
    '💾': SVG_SAVE, '\U0001f4be': SVG_SAVE,
    '📤': SVG_EXPORT, '\U0001f4e4': SVG_EXPORT,
    '📝': SVG_EDIT, '\U0001f4dd': SVG_EDIT,
    '📊': SVG_CHART, '\U0001f4ca': SVG_CHART,
    '📍': SVG_PIN, '\U0001f4cd': SVG_PIN,
    '⏰': SVG_TIMER, '\U0001f570': SVG_TIMER,
    '🌍': SVG_GLOBE, '\U0001f30d': SVG_GLOBE,
    '💖': SVG_HEART, '\U0001f496': SVG_HEART,
    '🔍': SVG_SEARCH, '\U0001f50d': SVG_SEARCH,
    '📂': SVG_FOLDER, '\U0001f4c2': SVG_FOLDER,
    '📁': SVG_FILE, '\U0001f4c1': SVG_FILE,
    '📦': SVG_BOX, '\U0001f4e6': SVG_BOX,
    '📜': SVG_BOOK, '\U0001f4dc': SVG_BOOK,
    '🏅': SVG_MEDAL, '\U0001f3c5': SVG_MEDAL,
    '⚡': SVG_FLASH, '\U0001f4a1': SVG_FLASH, '\u26a1': SVG_FLASH,
    '🗺️': SVG_MAP, '\U0001f5fa': SVG_MAP,
    '🖼️': SVG_IMG, '\U0001f5bc': SVG_IMG,
    '📎': SVG_CLIP, '\U0001f4ce': SVG_CLIP,
    '↩️': SVG_UNDO, '\u21a9\ufe0f': SVG_UNDO, '\u21a9': SVG_UNDO,
    '☰': SVG_GRID, '\u2630': SVG_GRID,
    '🧠': SVG_BRAIN, '\U0001f9e0': SVG_BRAIN,
    '💡': SVG_ZAP, '\U0001f4a1': SVG_ZAP,
    '🔗': SVG_LINK, '\U0001f517': SVG_LINK,
    '➕': SVG_ADD, '\u2795': SVG_ADD,
    '📘': SVG_BOOK, '\U0001f4d8': SVG_BOOK,
    '📄': SVG_FILE, '\U0001f4c4': SVG_FILE,
    '📅': SVG_CAL, '\U0001f4c5': SVG_CAL,
    '🎲': SVG_DICE, '\U0001f3b2': SVG_DICE,
    '✨': SVG_SPARK, '\u2728': SVG_SPARK,
    '📧': SVG_MAIL, '\U0001f4e7': SVG_MAIL,
    '📨': SVG_MAIL, '\U0001f4e8': SVG_MAIL,
    '📩': SVG_MAIL, '\U0001f4e9': SVG_MAIL,
    '📫': SVG_MAIL, '\U0001f4eb': SVG_MAIL,
    '📪': SVG_MAIL, '\U0001f4ea': SVG_MAIL,
    '📬': SVG_MAIL, '\U0001f4ec': SVG_MAIL,
    '📭': SVG_MAIL, '\U0001f4ed': SVG_MAIL,
    '📮': SVG_MAIL, '\U0001f4ee': SVG_MAIL,
    '✉️': SVG_MAIL, '\u2709\ufe0f': SVG_MAIL,
    '🔖': SVG_TAG, '\U0001f516': SVG_TAG,
    '🏷️': SVG_TAG, '\U0001f3f7': SVG_TAG,
    '📑': SVG_TAG, '\U0001f4d1': SVG_TAG,
    '🔔': SVG_BELL, '\U0001f514': SVG_BELL,
    '🔕': SVG_BELL, '\U0001f515': SVG_BELL,
    '📯': SVG_BELL, '\U0001f4ef': SVG_BELL,
    '📃': SVG_SCROLL, '\U0001f4c3': SVG_SCROLL,
    '📰': SVG_FILE, '\U0001f4f0': SVG_FILE,
    '🗞️': SVG_FILE, '\U0001f5de': SVG_FILE,
    '🔃': SVG_REFRESH, '\U0001f503': SVG_REFRESH,
    '🔄': SVG_REFRESH, '\U0001f504': SVG_REFRESH,
    '🔁': SVG_REFRESH, '\U0001f501': SVG_REFRESH,
    '🔂': SVG_REFRESH, '\U0001f502': SVG_REFRESH,
    '▶️': SVG_SEND, '\u25b6\ufe0f': SVG_SEND,
    '⏩': SVG_SEND, '\u23e9': SVG_SEND,
    '⏭️': SVG_SEND, '\u23ed\ufe0f': SVG_SEND,
    '⏯️': SVG_SEND, '\u23ef\ufe0f': SVG_SEND,
    '◀️': SVG_BACK, '\u25c0\ufe0f': SVG_BACK,
    '⏪': SVG_BACK, '\u23ea': SVG_BACK,
    '⏮️': SVG_BACK, '\u23ee\ufe0f': SVG_BACK,
    '⏫': SVG_ARROW_UP, '\u23eb': SVG_ARROW_UP,
    '⏬': SVG_ARROW_DOWN, '\u23ec': SVG_ARROW_DOWN,
    '⏸️': SVG_DOTS, '\u23f8\ufe0f': SVG_DOTS,
    '⏹️': SVG_CANCEL, '\u23f9\ufe0f': SVG_CANCEL,
    '⏺️': SVG_CIRCLE, '\u23fa\ufe0f': SVG_CIRCLE,
    '⏏️': SVG_ARROW_UP, '\u23cf\ufe0f': SVG_ARROW_UP,
    '🎦': SVG_PICTURE, '\U0001f3a6': SVG_PICTURE,
    '🔅': SVG_ZAP, '\U0001f505': SVG_ZAP,
    '🔆': SVG_ZAP, '\U0001f506': SVG_ZAP,
    '📶': SVG_CHART, '\U0001f4f6': SVG_CHART,
    '📳': SVG_ZAP, '\U0001f4f3': SVG_ZAP,
    '📴': SVG_CANCEL, '\U0001f4f4': SVG_CANCEL,
    '✖️': SVG_CANCEL, '\u2716\ufe0f': SVG_CANCEL,
    '➖': SVG_CANCEL, '\u2796': SVG_CANCEL,
    '➗': SVG_CANCEL, '\u2797': SVG_CANCEL,
    '♾️': SVG_LINK, '\u267e\ufe0f': SVG_LINK,
    '‼️': SVG_ALERT, '\u203c\ufe0f': SVG_ALERT,
    '⁉️': SVG_ALERT, '\u2049\ufe0f': SVG_ALERT,
    '❕': SVG_ALERT, '\u2755': SVG_ALERT,
    '❔': SVG_HELP, '\u2754': SVG_HELP,
    '〰️': SVG_LINK, '\u3030\ufe0f': SVG_LINK,
    '©️': SVG_CIRCLE, '\u00a9\ufe0f': SVG_CIRCLE,
    '®️': SVG_CIRCLE, '\u00ae\ufe0f': SVG_CIRCLE,
    '™️': SVG_TAG, '\u2122\ufe0f': SVG_TAG,
    '#️⃣': SVG_GRID, '\u0023\ufe0f\u20e3': SVG_GRID,
    '*️⃣': SVG_STAR, '\u002a\ufe0f\u20e3': SVG_STAR,
    '0️⃣': SVG_CIRCLE, '1️⃣': SVG_CIRCLE, '2️⃣': SVG_CIRCLE,
    '3️⃣': SVG_CIRCLE, '4️⃣': SVG_CIRCLE, '5️⃣': SVG_CIRCLE,
    '6️⃣': SVG_CIRCLE, '7️⃣': SVG_CIRCLE, '8️⃣': SVG_CIRCLE,
    '9️⃣': SVG_CIRCLE, '\U0001f51f': SVG_CIRCLE,
    '💯': SVG_CHART, '\U0001f4af': SVG_CHART,
    '🔠': SVG_CHART, '\U0001f520': SVG_CHART,
    '🔡': SVG_CHART, '\U0001f521': SVG_CHART,
    '🔢': SVG_CHART, '\U0001f522': SVG_CHART,
    '🔣': SVG_CHART, '\U0001f523': SVG_CHART,
    '🔤': SVG_CHART, '\U0001f524': SVG_CHART,
    '🅰️': SVG_CHART, '\U0001f170\ufe0f': SVG_CHART,
    '🅱️': SVG_CHART, '\U0001f171\ufe0f': SVG_CHART,
    '🆎': SVG_CHART, '\U0001f18e': SVG_CHART,
    '🅾️': SVG_CHART, '\U0001f17e\ufe0f': SVG_CHART,
    '🆑': SVG_CHART, '\U0001f191': SVG_CHART,
    '🆘': SVG_ALERT, '\U0001f198': SVG_ALERT,
    '🆚': SVG_CHART, '\U0001f19a': SVG_CHART,
    '🈁': SVG_CHART, '\U0001f201': SVG_CHART,
    '🈂️': SVG_CHART, '\U0001f202\ufe0f': SVG_CHART,
    '🈷️': SVG_CAL, '\U0001f237\ufe0f': SVG_CAL,
    '🈶': SVG_CHART, '\U0001f236': SVG_CHART,
    '🈯': SVG_CHART, '\U0001f22f': SVG_CHART,
    '🉐': SVG_CHART, '\U0001f250': SVG_CHART,
    '🈹': SVG_CHART, '\U0001f239': SVG_CHART,
    '🈚': SVG_CHART, '\U0001f21a': SVG_CHART,
    '🈲': SVG_LOCK, '\U0001f232': SVG_LOCK,
    '🉑': SVG_CHECK, '\U0001f251': SVG_CHECK,
    '🈸': SVG_CHART, '\U0001f238': SVG_CHART,
    '🈴': SVG_CHART, '\U0001f234': SVG_CHART,
    '🈳': SVG_CHART, '\U0001f233': SVG_CHART,
    '㊗️': SVG_CHART, '\u3297\ufe0f': SVG_CHART,
    '㊙️': SVG_LOCK, '\u3299\ufe0f': SVG_LOCK,
    '🈺': SVG_CHART, '\U0001f23a': SVG_CHART,
    '🈵': SVG_CHART, '\U0001f235': SVG_CHART,
    '🔴': SVG_CIRCLE, '\U0001f534': SVG_CIRCLE,
    '🟠': SVG_CIRCLE, '\U0001f7e0': SVG_CIRCLE,
    '🟡': SVG_CIRCLE, '\U0001f7e1': SVG_CIRCLE,
    '🟢': SVG_CIRCLE, '\U0001f7e2': SVG_CIRCLE,
    '🔵': SVG_CIRCLE, '\U0001f535': SVG_CIRCLE,
    '🟣': SVG_CIRCLE, '\U0001f7e3': SVG_CIRCLE,
    '⚫': SVG_CIRCLE, '\u26ab': SVG_CIRCLE,
    '⚪': SVG_CIRCLE, '\u26aa': SVG_CIRCLE,
    '🟤': SVG_CIRCLE, '\U0001f7e4': SVG_CIRCLE,
    '🔶': SVG_DICE, '\U0001f536': SVG_DICE,
    '🔷': SVG_DICE, '\U0001f537': SVG_DICE,
    '🔸': SVG_DICE, '\U0001f538': SVG_DICE,
    '🔹': SVG_DICE, '\U0001f539': SVG_DICE,
    '🔺': SVG_DICE, '\U0001f53a': SVG_DICE,
    '🔻': SVG_DICE, '\U0001f53b': SVG_DICE,
    '💠': SVG_DICE, '\U0001f4a0': SVG_DICE,
    '🔘': SVG_CIRCLE, '\U0001f518': SVG_CIRCLE,
    '🔳': SVG_SQUARE, '\U0001f533': SVG_SQUARE,
    '🔲': SVG_SQUARE, '\U0001f532': SVG_SQUARE,
    '▪️': SVG_SQUARE, '\u25aa\ufe0f': SVG_SQUARE,
    '▫️': SVG_SQUARE, '\u25ab\ufe0f': SVG_SQUARE,
    '◾': SVG_SQUARE, '\u25fe': SVG_SQUARE,
    '◽': SVG_SQUARE, '\u25fd': SVG_SQUARE,
    '◼️': SVG_SQUARE, '\u25fc\ufe0f': SVG_SQUARE,
    '◻️': SVG_SQUARE, '\u25fb\ufe0f': SVG_SQUARE,
    '🟥': SVG_SQUARE, '\U0001f7e5': SVG_SQUARE,
    '🟧': SVG_SQUARE, '\U0001f7e7': SVG_SQUARE,
    '🟨': SVG_SQUARE, '\U0001f7e8': SVG_SQUARE,
    '🟩': SVG_SQUARE, '\U0001f7e9': SVG_SQUARE,
    '🟦': SVG_SQUARE, '\U0001f7ea': SVG_SQUARE,
    '🟪': SVG_SQUARE, '\U0001f7eb': SVG_SQUARE,
    '⬛': SVG_SQUARE, '\u2b1b': SVG_SQUARE,
    '⬜': SVG_SQUARE, '\u2b1c': SVG_SQUARE,
    '🔈': SVG_BELL, '\U0001f508': SVG_BELL,
    '🔇': SVG_BELL, '\U0001f507': SVG_BELL,
    '🔉': SVG_BELL, '\U0001f509': SVG_BELL,
    '🔊': SVG_BELL, '\U0001f50a': SVG_BELL,
    '📢': SVG_BELL, '\U0001f4e2': SVG_BELL,
    '📣': SVG_BELL, '\U0001f4e3': SVG_BELL,
    '🎼': SVG_BOOK, '\U0001f3bc': SVG_BOOK,
    '🎵': SVG_BOOK, '\U0001f3b5': SVG_BOOK,
    '🎶': SVG_BOOK, '\U0001f3b6': SVG_BOOK,
    '☢️': SVG_ALERT, '\u2622\ufe0f': SVG_ALERT,
    '☣️': SVG_ALERT, '\u2623\ufe0f': SVG_ALERT,
    '⬆️': SVG_ARROW_UP, '\u2b06\ufe0f': SVG_ARROW_UP,
    '↗️': SVG_ARROW_UP, '\u2197\ufe0f': SVG_ARROW_UP,
    '➡️': SVG_SEND, '\u27a1\ufe0f': SVG_SEND,
    '↘️': SVG_ARROW_DOWN, '\u2198\ufe0f': SVG_ARROW_DOWN,
    '⬇️': SVG_ARROW_DOWN, '\u2b07\ufe0f': SVG_ARROW_DOWN,
    '↙️': SVG_ARROW_DOWN, '\u2199\ufe0f': SVG_ARROW_DOWN,
    '⬅️': SVG_BACK, '\u2b05\ufe0f': SVG_BACK,
    '↖️': SVG_BACK, '\u2196\ufe0f': SVG_BACK,
    '↕️': SVG_ARROW_UP, '\u2195\ufe0f': SVG_ARROW_UP,
    '↔️': SVG_LINK, '\u2194\ufe0f': SVG_LINK,
    '↩️': SVG_UNDO, '\u21a9\ufe0f': SVG_UNDO,
    '↪️': SVG_REFRESH, '\u21aa\ufe0f': SVG_REFRESH,
    '⤴️': SVG_ARROW_UP, '\u2934\ufe0f': SVG_ARROW_UP,
    '⤵️': SVG_ARROW_DOWN, '\u2935\ufe0f': SVG_ARROW_DOWN,
    '🔀': SVG_REFRESH, '\U0001f500': SVG_REFRESH,
    '🔁': SVG_REFRESH, '\U0001f501': SVG_REFRESH,
    '🔂': SVG_REFRESH, '\U0001f502': SVG_REFRESH,
    '🔃': SVG_REFRESH, '\U0001f503': SVG_REFRESH,
    '🔄': SVG_REFRESH, '\U0001f504': SVG_REFRESH,
    '🔅': SVG_ZAP, '\U0001f505': SVG_ZAP,
    '🔆': SVG_ZAP, '\U0001f506': SVG_ZAP,
    '🗳️': SVG_BOX, '\U0001f5f3\ufe0f': SVG_BOX,
    '🔒': SVG_LOCK, '\U0001f512': SVG_LOCK,
    '🔓': SVG_LOCK, '\U0001f513': SVG_LOCK,
    '🔐': SVG_LOCK, '\U0001f510': SVG_LOCK,
    '🔑': SVG_KEY, '\U0001f511': SVG_KEY,
    '❓': SVG_HELP, '\U0001f4ac': SVG_HELP, '\u2753': SVG_HELP,
    '❗': SVG_ALERT, '\u2757': SVG_ALERT,
    '🗑️': SVG_DEL, '\U0001f5d1\ufe0f': SVG_DEL,
    '🗑': SVG_DEL, '\U0001f5d1': SVG_DEL,
    '👁️': SVG_EYE, '\U0001f441\ufe0f': SVG_EYE,
    '👁': SVG_EYE, '\U0001f441': SVG_EYE,
    '🔄': SVG_REFRESH, '\U0001f504': SVG_REFRESH,
    '⚙': SVG_SETTINGS, '\u2699': SVG_SETTINGS,
    '✏️': SVG_EDIT, '\u270f\ufe0f': SVG_EDIT,
    '✏': SVG_EDIT, '\u270f': SVG_EDIT,
    '➖': SVG_CANCEL, '\u2796': SVG_CANCEL,
    '📭': SVG_MAIL, '\U0001f4ed': SVG_MAIL,
}

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def replace_emojis(text):
    # Replace all known emoji chars with SVG
    for ch, svg in ALL_EMOJIS.items():
        text = text.replace(ch, svg)
    return text

def fix_version_headers(text, filename):
    # Ensure first comment block mentions v7
    if 'v7' not in text[:300]:
        # Try to replace version in first comment
        text = re.sub(r'( \* [\w\s]+? )v\d+\b', r'\1v7', text, count=3)
    # Fix accidental URL version replacement
    text = text.replace('qianfan.baidubce.com/v7', 'qianfan.baidubce.com/v2')
    text = text.replace('qianfan.baidubce.com/v3', 'qianfan.baidubce.com/v2')
    return text

def add_chinese_comments(text, filename):
    # Add a module-level v7 comment after the first comment block if not present
    if '墨境AI视觉小说引擎' not in text[:500]:
        # Find first */
        idx = text.find('*/')
        if idx != -1:
            insert = "\n/** 墨境AI视觉小说引擎核心模块 v7 — 古风墨境配色：暖羊皮纸#F5E6D3 + 金色#C9A227 + 墨色#2C1810 */\n"
            text = text[:idx+2] + insert + text[idx+2:]
    return text

def clean_btn_classes(text):
    # Remove duplicate ez-btn occurrences
    text = text.replace('ez-btn ez-btn', 'ez-btn')
    text = text.replace('ez-btn  ez-btn', 'ez-btn')
    text = text.replace('class="ez-btn btn ', 'class="ez-btn ')
    text = text.replace("class='ez-btn btn ", "class='ez-btn ")
    return text

def upgrade_file(filename):
    path = os.path.join(BASE, filename)
    text = read(path)
    original = text
    
    # 1. Replace emojis
    text = replace_emojis(text)
    
    # 2. Fix version headers
    text = fix_version_headers(text, filename)
    
    # 3. Add Chinese comments
    text = add_chinese_comments(text, filename)
    
    # 4. Clean btn classes
    text = clean_btn_classes(text)
    
    if text != original:
        write(path, text)
        return True
    return False

# Execute
for fname in FILES:
    changed = upgrade_file(fname)
    print(f"{'[CHANGED]' if changed else '[same]'} {fname}")

# Final audit
print("\n--- Final Audit ---")
for fname in FILES:
    with open(os.path.join(BASE, fname), 'r', encoding='utf-8') as f:
        t = f.read()
    emojis = re.findall(r'[\u2700-\u27bf\u2600-\u26ff\U0001f300-\U0001f9ff]', t)
    if emojis:
        print(f"{fname}: remaining emojis -> {set(emojis)}")
    else:
        print(f"{fname}: OK (no remaining emojis)")

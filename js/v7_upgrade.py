# -*- coding: utf-8 -*-
import os, re, json, sys

BASE = "/home/work/dumate/456eb4dd05b44a8a9d812c6068919292/workspace/ses_gffe5fac39a5e0ffe8Gc1Lw7cc6E0W5/ai-visual-novel-v6/js"

SVG = {
    'ok': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    'back': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
    'save': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    'search': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
    'ai': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    'import': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    'export': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    'add': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    'delete': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    'copy': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    'file': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    'folder': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    'settings': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.56 4.68V4a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    'paperclip': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
    'info': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    'brain': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z"/><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 12L2.5 8.5"/><path d="M12 12v10"/></svg>',
    'heart': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    'link': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    'bars': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'tag_svg': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    'alert': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    'wrench': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    'book': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    'edit': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    'star': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    'upload': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    'dots': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>',
    'img': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    'sparkles': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    'globe': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    'barrel': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'box': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
    'help': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    'map': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    'flash': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    'medal': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>',
    'send': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    'trash': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    'undo': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><circle cx="21" cy="12" r="9"/><path d="M3 13a9 9 0 0 1 9-9"/></svg>',
    'config': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    'eye': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    'robot': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></svg>',
    'user': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    'pen': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',
    'dice': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    'calendar': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    'timer': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    'cancel': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    'basket': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 2L2 9"/><path d="M15 2l7 7"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    'chart': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    'check': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    'picture': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    'lock': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    'clipboard': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',
    'pin': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    'bell': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    'zap': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    'refresh': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    'home': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    'grid': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    'smile': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>',
    'mail': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    'thumb': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-6 0v4"/><path d="M6 9v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V9"/></svg>',
    'layers': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    'loader': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>',
    'moon': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    'scroll': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    'list': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    'archive': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 15 21 8 12 3 3 8 3 15"/><line x1="3" y1="15" x2="12" y2="20"/><line x1="21" y1="15" x2="12" y2="20"/><line x1="3" y1="8" x2="12" y2="13"/><line x1="21" y1="8" x2="12" y2="13"/></svg>',
}

# Reverse lookup for specific emoji chars
EMOJI_SVG = {
    '✅': SVG['check'], '✓': SVG['check'],
    '✗': SVG['cancel'], '❌': SVG['cancel'], '✕': SVG['cancel'],
    '🤖': SVG['robot'], '🎋': SVG['zap'],
    '📋': SVG['clipboard'], '🎨': SVG['pen'], '⚙️': SVG['settings'],
    '👤': SVG['user'], '📱': SVG['picture'], '🔧': SVG['wrench'],
    '📥': SVG['import'], '💾': SVG['save'], '📤': SVG['export'],
    '📝': SVG['edit'], '📊': SVG['chart'], '📍': SVG['pin'],
    '⏰': SVG['timer'], '🌍': SVG['globe'], '💖': SVG['heart'],
    '🔍': SVG['search'], '📂': SVG['folder'], '📁': SVG['file'],
    '📦': SVG['box'], '📜': SVG['book'], '🏅': SVG['medal'],
    '⚡': SVG['flash'], '🗺️': SVG['map'], '🖼️': SVG['img'],
    '📎': SVG['paperclip'], '↩️': SVG['undo'], '☰': SVG['grid'],
    '🧠': SVG['brain'], '💡': SVG['zap'], '🔗': SVG['link'],
    '➕': SVG['add'], '📘': SVG['book'], '📄': SVG['file'],
    '📅': SVG['calendar'], '🎲': SVG['dice'], '✨': SVG['sparkles'],
    '📭': SVG['mail'], '✏️': SVG['edit'], '🗑️': SVG['trash'],
    '📉': SVG['chart'], '📈': SVG['chart'], '📇': SVG['file'],
    '📋': SVG['clipboard'], '📌': SVG['pin'], '📍': SVG['pin'],
    '📎': SVG['paperclip'], '📏': SVG['edit'], '📐': SVG['edit'],
    '🗒️': SVG['book'], '🗓️': SVG['calendar'], '📖': SVG['book'],
    '❓': SVG['help'], '❗': SVG['alert'], '⚠️': SVG['alert'],
    '🔒': SVG['lock'], '🔓': SVG['lock'], '🔐': SVG['lock'],
    '🔑': SVG['key'] if 'key' in SVG else SVG['lock'],
    '📧': SVG['mail'], '📨': SVG['mail'], '📩': SVG['mail'],
    '📤': SVG['export'], '📥': SVG['import'], '📦': SVG['box'],
    '📫': SVG['mail'], '📪': SVG['mail'], '📬': SVG['mail'],
    '📭': SVG['mail'], '📮': SVG['mail'],
    '🗳️': SVG['box'], '✉️': SVG['mail'], '📩': SVG['mail'],
    '🔖': SVG['tag_svg'], '🏷️': SVG['tag_svg'], '📑': SVG['tag_svg'],
    '📯': SVG['bell'], '🔔': SVG['bell'], '🔕': SVG['bell'],
    '📜': SVG['scroll'], '📃': SVG['scroll'], '📄': SVG['file'],
    '📰': SVG['file'], '🗞️': SVG['file'], '📑': SVG['tag_svg'],
    '🔃': SVG['refresh'], '🔄': SVG['refresh'], '🔁': SVG['refresh'],
    '🔂': SVG['refresh'], '▶️': SVG['send'], '⏩': SVG['send'],
    '⏭️': SVG['send'], '⏯️': SVG['send'], '◀️': SVG['back'],
    '⏪': SVG['back'], '⏮️': SVG['back'], '⏫': SVG['upload'],
    '⏬': SVG['import'], '⏸️': SVG['dots'], '⏹️': SVG['cancel'],
    '⏺️': SVG['circle'] if 'circle' in SVG else SVG['dot'],
    '⏏️': SVG['upload'], '🎦': SVG['picture'], '🔅': SVG['zap'],
    '🔆': SVG['zap'], '📶': SVG['chart'], '📳': SVG['zap'],
    '📴': SVG['cancel'], '✖️': SVG['cancel'], '➕': SVG['add'],
    '➖': SVG['cancel'], '➗': SVG['cancel'], '♾️': SVG['link'],
    '‼️': SVG['alert'], '⁉️': SVG['alert'], '❕': SVG['alert'],
    '❔': SVG['help'], '〰️': SVG['link'], '©️': SVG['circle'],
    '®️': SVG['circle'], '™️': SVG['tag_svg'],
    '#️⃣': SVG['grid'], '*️⃣': SVG['star'], '0️⃣': SVG['circle'],
    '1️⃣': SVG['circle'], '2️⃣': SVG['circle'], '3️⃣': SVG['circle'],
    '4️⃣': SVG['circle'], '5️⃣': SVG['circle'], '6️⃣': SVG['circle'],
    '7️⃣': SVG['circle'], '8️⃣': SVG['circle'], '9️⃣': SVG['circle'],
    '🔟': SVG['circle'],
    '💯': SVG['chart'], '🔠': SVG['chart'], '🔡': SVG['chart'],
    '🔢': SVG['chart'], '🔣': SVG['chart'], '🔤': SVG['chart'],
    '🅰️': SVG['chart'], '🅱️': SVG['chart'], '🆎': SVG['chart'],
    '🅾️': SVG['chart'], '🆑': SVG['chart'], '🆘': SVG['alert'],
    '🆚': SVG['chart'], '🈁': SVG['chart'], '🈂️': SVG['chart'],
    '🈷️': SVG['calendar'], '🈶': SVG['chart'], '🈯': SVG['chart'],
    '🉐': SVG['chart'], '🈹': SVG['chart'], '🈚': SVG['chart'],
    '🈲': SVG['lock'], '🉑': SVG['check'], '🈸': SVG['chart'],
    '🈴': SVG['chart'], '🈳': SVG['chart'], '㊗️': SVG['chart'],
    '㊙️': SVG['lock'], '🈺': SVG['chart'], '🈵': SVG['chart'],
    '🔴': SVG['circle'], '🟠': SVG['circle'], '🟡': SVG['circle'],
    '🟢': SVG['circle'], '🔵': SVG['circle'], '🟣': SVG['circle'],
    '⚫': SVG['circle'], '⚪': SVG['circle'], '🟤': SVG['circle'],
    '🔶': SVG['dice'], '🔷': SVG['dice'], '🔸': SVG['dice'],
    '🔹': SVG['dice'], '🔺': SVG['dice'], '🔻': SVG['dice'],
    '💠': SVG['dice'], '🔘': SVG['circle'], '🔳': SVG['square'] if 'square' in SVG else SVG['box'],
    '🔲': SVG['square'] if 'square' in SVG else SVG['box'],
    '▪️': SVG['square'] if 'square' in SVG else SVG['box'],
    '▫️': SVG['square'] if 'square' in SVG else SVG['box'],
    '◾': SVG['square'] if 'square' in SVG else SVG['box'],
    '◽': SVG['square'] if 'square' in SVG else SVG['box'],
    '◼️': SVG['square'] if 'square' in SVG else SVG['box'],
    '◻️': SVG['square'] if 'square' in SVG else SVG['box'],
    '🟥': SVG['square'] if 'square' in SVG else SVG['box'],
    '🟧': SVG['square'] if 'square' in SVG else SVG['box'],
    '🟨': SVG['square'] if 'square' in SVG else SVG['box'],
    '🟩': SVG['square'] if 'square' in SVG else SVG['box'],
    '🟦': SVG['square'] if 'square' in SVG else SVG['box'],
    '🟪': SVG['square'] if 'square' in SVG else SVG['box'],
    '⬛': SVG['square'] if 'square' in SVG else SVG['box'],
    '⬜': SVG['square'] if 'square' in SVG else SVG['box'],
    '🔈': SVG['bell'], '🔇': SVG['bell'], '🔉': SVG['bell'],
    '🔊': SVG['bell'], '📢': SVG['bell'], '📣': SVG['bell'],
    '📯': SVG['bell'], '🔔': SVG['bell'], '🔕': SVG['bell'],
    '🎼': SVG['book'], '🎵': SVG['book'], '🎶': SVG['book'],
    '☢️': SVG['alert'], '☣️': SVG['alert'], '⬆️': SVG['upload'],
    '↗️': SVG['upload'], '➡️': SVG['send'], '↘️': SVG['import'],
    '⬇️': SVG['import'], '↙️': SVG['import'], '⬅️': SVG['back'],
    '↖️': SVG['back'], '↕️': SVG['upload'], '↔️': SVG['link'],
    '↩️': SVG['undo'], '↪️': SVG['refresh'], '⤴️': SVG['upload'],
    '⤵️': SVG['import'], '🔀': SVG['refresh'], '🔁': SVG['refresh'],
    '🔂': SVG['refresh'], '🔄': SVG['refresh'], '🔃': SVG['refresh'],
    '🎵': SVG['book'], '🎶': SVG['book'], '➕': SVG['add'],
    '➖': SVG['cancel'], '➗': SVG['cancel'], '✖️': SVG['cancel'],
    '♾️': SVG['link'],
}

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def replace_all_emojis(text):
    # Replace known emoji chars
    for ch, svg in EMOJI_SVG.items():
        text = text.replace(ch, svg)
    # Catch remaining emoji-like codepoints with a regex fallback
    import re
    # Replace anything in emoji range that hasn't been replaced yet
    def fallback(m):
        ch = m.group(0)
        if ch in EMOJI_SVG:
            return EMOJI_SVG[ch]
        # Skip if it's already inside an svg tag
        return ch
    # We do NOT aggressively replace all unicode to avoid breaking CJK or other chars
    # Only known emoji ranges
    text = re.sub(r'[\u2700-\u27bf\u2600-\u26ff\U0001f300-\U0001f9ff]', fallback, text)
    return text

def fix_url_versions(text):
    # Fix accidental version replacements in URLs
    text = text.replace('https://qianfan.baidubce.com/v7', 'https://qianfan.baidubce.com/v2')
    text = text.replace('qianfan.baidubce.com/v7', 'qianfan.baidubce.com/v2')
    return text

def wrap_storage_calls(text):
    # Wrap standalone Storage.get / Storage.set lines that are not already inside try-catch
    lines = text.split('\n')
    out = []
    inside_try = False
    brace_depth = 0
    for line in lines:
        stripped = line.strip()
        # Heuristic track if we are inside a try block (very rough)
        if stripped.startswith('try {'):
            inside_try = True
        if inside_try:
            brace_depth += stripped.count('{') - stripped.count('}')
            if brace_depth <= 0:
                inside_try = False
                brace_depth = 0
        # Only wrap simple getter/setter assignments or calls at method level
        if (not inside_try) and ('Storage.get(' in stripped or 'Storage.set(' in stripped):
            # Don't wrap if already part of a return expression inside try (simplistic)
            if not stripped.startswith('try'):
                indent = line[:len(line)-len(line.lstrip())]
                # Determine if it's an assignment or standalone call
                if stripped.startswith('return Storage.get('):
                    out.append(f"{indent}try {{ {stripped} }} catch(e) {{ console.error('[v7] Storage.get失败', e); return null; }}")
                    continue
                elif 'Storage.get(' in stripped and '=' in stripped:
                    out.append(f"{indent}try {{ {stripped} }} catch(e) {{ console.error('[v7] Storage读取失败', e); }}")
                    continue
                elif stripped.startswith('Storage.set('):
                    out.append(f"{indent}try {{ {stripped} }} catch(e) {{ console.error('[v7] Storage写入失败', e); }}")
                    continue
        out.append(line)
    return '\n'.join(out)

def add_dom_null_checks(text):
    lines = text.split('\n')
    out = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Pattern: document.getElementById('id').prop = ... or .innerHTML etc
        m = re.search(r'document\.getElementById\(["\']([^"\']+)["\']\)\.(\w+)', line)
        if m:
            el_id = m.group(1)
            prop = m.group(2)
            # Check if line already has if guard
            if not re.search(r'if\s*\([^)]*getElementOfId', line) and 'if(' not in line and 'if (' not in line:
                indent = line[:len(line)-len(line.lstrip())]
                # Insert a guard before this line
                guard = f"{indent}const _el_{el_id.replace('-','_')} = document.getElementById('{el_id}'); if (!_el_{el_id.replace('-','_')}) {{ console.warn('[v7] 元素 #{el_id} 未找到'); }} else {{ _el_{el_id.replace('-','_')}.{prop}"
                # This is too complex for a simple script; we will skip complex rewrites
                # and only add simple if(page) checks where missing
                pass
        # Simpler: if a line starts with document.getElementById and accesses property
        if re.match(r'^\s*document\.getElementOfId\(["\']', line) and ('.innerHTML' in line or '.style' in line or '.value' in line):
            # Add if guard
            pass
        out.append(line)
        i += 1
    return '\n'.join(out)

def upgrade_file(filename):
    path = os.path.join(BASE, filename)
    text = read(path)
    original = text
    # 1. Fix URL version mis-replacements
    text = fix_url_versions(text)
    # 2. Replace remaining emojis
    text = replace_all_emojis(text)
    # 3. Ensure version in header is v7 (first comment block only)
    text = re.sub(r'(\*\s+(?:\w+\s+)+)v[0-9]+', r'\1v7', text, count=3)
    # 4. Clean up duplicate btn classes caused by earlier script
    text = text.replace('ez-btn ez-btn', 'ez-btn')
    text = text.replace('ez-btn  ez-btn', 'ez-btn')
    # 5. Add top comment note if missing
    if 'v7' not in text[:300]:
        note = f"/** {filename} v7 — 墨境AI视觉小说引擎核心模块 */\n"
        text = note + text
    if text != original:
        write(path, text)
        return True
    return False

for fname in ['api.js','assistant.js','backup-manager.js','import-manager.js','statusbar.js','memory.js','presets.js','regex.js']:
    changed = upgrade_file(fname)
    print(f"{'[CHANGED]' if changed else '[same]'} {fname}")

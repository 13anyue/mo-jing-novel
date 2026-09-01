#!/usr/bin/env python3
"""
批量为JS模块添加返回按钮
在每个模块的 renderPage() 中，page.innerHTML = ` 之后的第一行添加返回按钮
"""
import os
import re

TARGETS = [
    'npc-v3.js', 'assistant.js', 'plugins.js', 'ui-diy.js',
    'baike-integration.js', 'design-suite-integration.js', 'skill-discovery.js',
    'custom-creator.js', 'mobile-preview.js', 'pwa-system.js', 'cg-gallery.js',
    'events.js', 'save-manager.js', 'chapter-editor.js', 'timeline.js',
    'text-novel.js', 'quest-system.js', 'weather-system.js', 'letter-system.js',
    'random-events.js', 'badge-wall.js', 'scene-system.js', 'npc-behavior.js',
    'group-chat.js', 'code-patcher.js', 'settings-hub.js', 'system-builder.js',
    'worldview-engine.js', 'family-system.js', 'political-system.js',
    'conspiracy-system.js', 'button-customizer.js'
]

BACK_BTN = '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate(\'home\')">← 返回</button></div>\n'

js_dir = '/home/work/dumate/456eb4dd05b44a8a9d812c6068919292/workspace/ses_gffe5fac39a5e0ffe8Gc1Lw7cc6E0W5/ai-visual-novel-v6/js'

for fname in TARGETS:
    fpath = os.path.join(js_dir, fname)
    if not os.path.exists(fpath):
        print(f"SKIP (not found): {fname}")
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 检查是否已经有返回按钮
    if "navigate('home')" in content:
        print(f"SKIP (already has): {fname}")
        continue

    # 在 page.innerHTML = ` 之后的第一行非空内容前插入返回按钮
    # 匹配模式: page.innerHTML = `
    #           [可能有一些空白或换行]
    #           <div... 或 <h2... 等第一行内容
    pattern = r"(page\.innerHTML\s*=\s*`\s*\n)(\s*)([^\s])"

    def replacer(m):
        prefix = m.group(1)
        indent = m.group(2)
        first_char = m.group(3)
        # 在第一行非空内容前插入返回按钮
        return prefix + indent + BACK_BTN + indent + first_char

    new_content, count = re.subn(pattern, replacer, content, count=1)

    if count == 0:
        # 尝试另一种格式：page.innerHTML = `<div... （没有换行）
        pattern2 = r"(page\.innerHTML\s*=\s*`)([^\n])"
        def replacer2(m):
            return m.group(1) + '\n' + BACK_BTN + '      ' + m.group(2)
        new_content, count2 = re.subn(pattern2, replacer2, content, count=1)
        if count2 == 0:
            print(f"FAIL (no match): {fname}")
            continue

    with open(fpath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"OK: {fname}")

print("\nDone. Run syntax check:")
print("cd /home/work/dumate/456eb4dd05b44a8a9d812c6068919292/workspace/ses_gffe5fac39a5e0ffe8Gc1Lw7cc6E0W5/ai-visual-novel-v6/js && for f in " + " ".join(TARGETS) + "; do node -c $f 2>&1 | grep -v 'SYNTAX OK' || echo \"$f OK\"; done")

#!/usr/bin/env python3
"""
最终版：为所有JS模块添加返回按钮
策略：在每个模块的渲染入口（renderPage / onEnter 中设置innerHTML）插入返回按钮
"""
import os
import re

js_dir = '/home/work/dumate/456eb4dd05b44a8a9d812c6068919292/workspace/ses_gffe5fac39a5e0ffe8Gc1Lw7cc6E0W5/ai-visual-novel-v6/js'

BACK_BTN = '      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate(\'home\')">← 返回</button></div>\n'

# 所有可能包含renderPage的JS文件
files = sorted([f for f in os.listdir(js_dir) if f.endswith('.js')])

modified = []
skipped = []
failed = []

for fname in files:
    fpath = os.path.join(js_dir, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 跳过没有renderPage的文件
    if 'renderPage' not in content and '_renderUI' not in content and '_buildPageDOM' not in content:
        skipped.append(f"{fname}: no render method")
        continue

    # 如果已经有返回按钮，跳过
    if "navigate('home')" in content:
        skipped.append(f"{fname}: already has back button")
        continue

    # 策略1: 直接匹配 page.innerHTML = `\n  在第一行内容前插入
    new_content = None

    # 尝试模式A: page.innerHTML = `\n  <xxx> （换行后紧跟标签）
    pattern_a = r"(page\.innerHTML\s*=\s*`\s*\n)(\s*)(<[a-zA-Z])"
    m = re.search(pattern_a, content)
    if m:
        insert_pos = m.end() - len(m.group(3))  # 在 <xxx 之前
        new_content = content[:insert_pos] + BACK_BTN + content[insert_pos:]

    # 尝试模式B: container.innerHTML = `\n  <xxx>
    if new_content is None:
        pattern_b = r"(container\.innerHTML\s*=\s*`\s*\n)(\s*)(<[a-zA-Z])"
        m = re.search(pattern_b, content)
        if m:
            insert_pos = m.end() - len(m.group(3))
            new_content = content[:insert_pos] + BACK_BTN + content[insert_pos:]

    # 尝试模式C: page.innerHTML = `<xxx> （没有换行，直接跟标签）
    if new_content is None:
        pattern_c = r"(page\.innerHTML\s*=\s*`)(<[a-zA-Z])"
        m = re.search(pattern_c, content)
        if m:
            insert_pos = m.end() - len(m.group(2))
            new_content = content[:insert_pos] + '\n' + BACK_BTN + '      ' + content[insert_pos:]

    # 尝试模式D: 通过 _renderUI() 或 _buildPageDOM() 渲染的模块
    # 在 onEnter 或 renderPage 方法中找到 page.innerHTML = this._renderUI() 等模式
    if new_content is None:
        # 找 page.innerHTML = this._xxx() 或 page.innerHTML = XXX._renderUI()
        pattern_d = r"(page\.innerHTML\s*=\s*)(this\.[_a-zA-Z]+\([^)]*\))"
        m = re.search(pattern_d, content)
        if m:
            # 改为: page.innerHTML = '<div...返回按钮</div>' + this._xxx()
            replacement = r"\1`" + BACK_BTN + "` + \2"
            new_content = re.sub(pattern_d, replacement, content, count=1)

    # 尝试模式E: 特殊的render模式
    if new_content is None:
        # settings-hub: container.appendChild(this._buildPageDOM())
        if 'container.appendChild(this._buildPageDOM())' in content:
            # 在 _buildPageDOM 开头添加返回按钮
            pattern_e = r"(const\s+page\s+=\s+document\.createElement\(['\"]div['\"]\);\s*\n\s*)(page\.className\s+=)"
            m = re.search(pattern_e, content)
            if m:
                insert_pos = m.start(2)
                back_btn_js = """    // 返回按钮
    const backBtn = document.createElement('div');
    backBtn.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';
    backBtn.innerHTML = '<button class="btn btn-sm btn-secondary" onclick="App.navigate(\'home\')">← 返回</button>';
    page.appendChild(backBtn);

    """
                new_content = content[:insert_pos] + back_btn_js + content[insert_pos:]

    if new_content is not None:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        modified.append(fname)
    else:
        failed.append(fname)

print(f"Modified: {len(modified)}")
for f in modified:
    print(f"  + {f}")
print(f"\nSkipped: {len(skipped)}")
for s in skipped[:10]:
    print(f"  - {s}")
if len(skipped) > 10:
    print(f"  ... and {len(skipped)-10} more")
print(f"\nFailed: {len(failed)}")
for f in failed:
    print(f"  ! {f}")

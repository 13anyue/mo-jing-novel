/**
 * =========================================================
 * AppChat — 聊天系统（微信样式）
 * 模块名：AppChat
 * 功能：聊天列表、单聊界面、发送消息、表情包、聊天历史
 * 样式参考微信：左侧头像+昵称列表，右侧聊天窗口，底部输入框+发送按钮
 * 数据：聊天对象（NPC或自定义）、消息记录
 * =========================================================
 */
const AppChat = {
  // 存储键名常量
  KEY_CONTACTS: 'appChat_contacts',
  KEY_MESSAGES: 'appChat_messages',
  KEY_SETTINGS: 'appChat_settings',

  // 当前活跃聊天对象ID
  _activeChatId: null,
  // 预设表情包
  _emojiList: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','👍','👎','👏','🙌','🤝','🙏','✌️','🤞','🤟','🤘','🤙','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','☝️','👆','👇','👈','👉','👊','✊','🤛','🤜','👀','🧠','🫀','🫁','🦷','🦴','👂','👃','👅','👄','💋','🩸','🔥','✨','🌟','💫','💥','💢','💦','💧','💤','💨','👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','👛','👜','👝','🎒','🩴','👞','👟','🥾','🥿','👠','👡','🩰','👢','👑','👒','🎩','🎓','🧢','🪖','⛑️','📿','💄','💎','🔇','🔈','🔉','🔊','📢','📣','📯','🔔','🔕','🎼','🎵','🎶','🎙️','🎚️','🎛️','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪕','🥁','🪘','📱','📲','☎️','📞','📟','📠','🔋','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📷','📸','📹','📼','🔍','🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','🗞️','📑','🔖','🏷️','💰','🪙','💴','💵','💶','💷','💸','💳','🧾','💹','✉️','📧','📨','📩','📤','📥','📦','📫','📪','📬','📭','📮','🗳️','✏️','✒️','🖋️','🖊️','🖌️','🖍️','📝','💼','📁','📂','🗂️','📅','📆','🗒️','🗓️','📇','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','🔫','🪃','🏹','🛡️','🪚','🔧','🪛','🔩','⚙️','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','⚗️','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🌡️','🚪','🛗','🪞','🪟','🛏️','🛋️','🪑','🚽','🪠','🚿','🛁','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🗿','🪧','🚰','🚮','🚹','🚺','♿','🚼','🚻','🚼','🚾','🛂','🛃','🛄','🛅','⚠️','🚸','⛔','🚫','🚳','🚭','🚯','🚱','🚷','📵','🔞','☢️','☣️','⬆️','↗️','➡️','↘️','⬇️','↙️','⬅️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🔃','🔄','🔙','🔚','🔛','🔜','🔝','🛐','⚛️','🕉️','✡️','☸️','☯️','✝️','☦️','☪️','☮️','🕎','🔯','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️','🔼','⏫','🔽','⏬','⏸️','⏹️','⏺️','⏏️','🎦','🔅','🔆','📶','📳','📴','♀️','♂️','⚧️','✖️','➕','➖','➗','♾️','‼️','⁉️','❓','❔','❕','❗','〰️','💱','💲','⚕️','♻️','⚜️','🔱','📛','🔰','⭕','✅','☑️','✔️','❌','❎','➰','➿','〽️','✳️','✴️','❇️','©️','®️','™️','#️⃣','*️⃣','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔠','🔡','🔢','🔣','🔤','🅰️','🆎','🅱️','🆑','🆒','🆓','ℹ️','🆔','Ⓜ️','🆕','🆖','🅾️','🆗','🅿️','🆘','🆙','🆚','🈁','🈂️','🈷️','🈶','🈯','🉐','🈹','🈚','🈲','🉑','🈸','🈴','🈳','㊗️','㊙️','🈺','🈵','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔳','🔲','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','▪️','▫️','◾','◽','◼️','◻️','🀄','🃏','🎴','🎭','🖼️','🎨','🧵','🪡','🧶','🪢','👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','👛','👜','👝','🎒','🩴','👞','👟','🥾','🥿','👠','👡','🩰','👢','👑','👒','🎩','🎓','🧢','🪖','⛑️','📿','💄','💎','🔇','🔈','🔉','🔊','📢','📣','📯','🔔','🔕','🎼','🎵','🎶','🎙️','🎚️','🎛️','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪕','🥁','🪘','📱','📲','☎️','📞','📟','📠','🔋','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','💾','💿','📀','🧮','🎥','🎞️','📽️','🎬','📺','📷','📸','📹','📼','🔍','🔎','🕯️','💡','🔦','🏮','🪔','📔','📕','📖','📗','📘','📙','📚','📓','📒','📃','📜','📄','📰','🗞️','📑','🔖','🏷️','💰','🪙','💴','💵','💶','💷','💸','💳','🧾','💹','✉️','📧','📨','📩','📤','📥','📦','📫','📪','📬','📭','📮','🗳️','✏️','✒️','🖋️','🖊️','🖌️','🖍️','📝','💼','📁','📂','🗂️','📅','📆','🗒️','🗓️','📇','📈','📉','📊','📋','📌','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','🗑️','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','🛠️','🗡️','⚔️','🔫','🪃','🏹','🛡️','🪚','🔧','🪛','🔩','⚙️','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','⚗️','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🌡️','🚪','🛗','🪞','🪟','🛏️','🛋️','🪑','🚽','🪠','🚿','🛁','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🗿','🪧','🚰','🚮','🚹','🚺','♿','🚼','🚻','🚼','🚾','🛂','🛃','🛄','🛅','⚠️','🚸','⛔','🚫','🚳','🚭','🚯','🚱','🚷','📵','🔞','☢️','☣️','⬆️','↗️','➡️','↘️','⬇️','↙️','⬅️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🔃','🔄','🔙','🔚','🔛','🔜','🔝','🛐','⚛️','🕉️','✡️','☸️','☯️','✝️','☦️','☪️','☮️','🕎','🔯','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️','🔼','⏫','🔽','⏬','⏸️','⏹️','⏺️','⏏️','🎦','🔅','🔆','📶','📳','📴','♀️','♂️','⚧️','✖️','➕','➖','➗','♾️','‼️','⁉️','❓','❔','❕','❗','〰️','💱','💲','⚕️','♻️','⚜️','🔱','📛','🔰','⭕','✅','☑️','✔️','❌','❎','➰','➿','〽️','✳️','✴️','❇️','©️','®️','™️'],

  /**
   * 获取聊天联系人列表
   */
  getContacts() {
    return Storage.get(this.KEY_CONTACTS, [
      { id: 'npc_system', name: '系统通知', avatar: '🔔', type: 'system', lastMessage: '欢迎来到墨境世界', lastTime: Date.now() },
      { id: 'npc_guide', name: '墨境向导', avatar: '🧙', type: 'npc', lastMessage: '有什么可以帮您的吗？', lastTime: Date.now() - 3600000 }
    ]);
  },

  saveContacts(list) {
    Storage.set(this.KEY_CONTACTS, list);
  },

  /**
   * 获取所有消息记录
   */
  getMessages() {
    return Storage.get(this.KEY_MESSAGES, {});
  },

  saveMessages(data) {
    Storage.set(this.KEY_MESSAGES, data);
  },

  /**
   * 获取某个聊天的消息列表
   */
  getChatMessages(chatId) {
    const all = this.getMessages();
    return all[chatId] || [];
  },

  /**
   * 向指定聊天添加一条消息
   */
  addMessage(chatId, message) {
    const all = this.getMessages();
    if (!all[chatId]) all[chatId] = [];
    all[chatId].push({
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      ...message,
      timestamp: Date.now()
    });
    // 限制单聊消息数量，防止localStorage溢出
    if (all[chatId].length > 500) {
      all[chatId] = all[chatId].slice(all[chatId].length - 500);
    }
    this.saveMessages(all);
  },

  getSettings() {
    return Storage.get(this.KEY_SETTINGS, { enterToSend: true, soundEnabled: true, bubbleStyle: 'default' });
  },

  saveSettings(s) {
    Storage.set(this.KEY_SETTINGS, s);
  },

  /**
   * 初始化模块
   */
  init() {
    this.renderPage();
  },

  /**
   * 进入页面时调用
   */
  onEnter() {
    this.renderChatList();
    // 如果有活跃聊天，刷新聊天窗口
    if (this._activeChatId) {
      this.renderChatWindow(this._activeChatId);
    }
  },

  /**
   * 渲染页面整体结构（左侧列表 + 右侧聊天区）
   */
  renderPage() {
    const page = document.getElementById('page-chat');
    if (!page) return;
    page.innerHTML = `
      <div style="display:flex;height:100%;overflow:hidden;border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--card-bg);">
        <!-- 左侧：聊天列表 -->
        <div id="chatListPanel" style="width:280px;min-width:280px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;background:var(--bg-secondary);">
          <div style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;font-weight:600;">💬 聊天</span>
            <button class="btn btn-sm btn-secondary" style="margin-left:auto;" onclick="AppChat.addContactPrompt()" title="添加聊天">➕</button>
          </div>
          <div id="chatList" style="flex:1;overflow-y:auto;padding:8px 0;"></div>
        </div>
        <!-- 右侧：聊天窗口 -->
        <div id="chatWindowPanel" style="flex:1;display:flex;flex-direction:column;min-width:0;background:var(--bg-primary);">
          <div id="chatWindowHeader" style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;">
            <span style="font-size:22px;">💬</span>
            <span>请选择聊天对象</span>
          </div>
          <div id="chatWindowBody" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--bg-secondary);">
            <div class="empty-state" style="margin:auto;">
              <div class="empty-icon" style="font-size:48px;">💬</div>
              <p>从左侧选择一个聊天对象开始对话</p>
            </div>
          </div>
          <div id="chatInputArea" style="padding:12px 16px;border-top:1px solid var(--border-color);display:none;align-items:center;gap:8px;background:var(--card-bg);">
            <button class="btn btn-sm btn-secondary" onclick="AppChat.toggleEmojiPicker()" title="表情">😊</button>
            <input type="text" id="chatInput" placeholder="输入消息..." style="flex:1;padding:8px 12px;border:1px solid var(--border-color);border-radius:var(--radius-md);background:var(--input-bg);color:var(--text-primary);font-size:14px;"
              onkeydown="AppChat.handleInputKey(event)">
            <button class="btn btn-primary" onclick="AppChat.sendMessage()">发送</button>
          </div>
          <!-- 表情选择器 -->
          <div id="emojiPicker" style="display:none;position:absolute;bottom:60px;left:300px;right:16px;background:var(--card-bg);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:12px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
            <div id="emojiGrid" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;"></div>
          </div>
        </div>
      </div>
    `;
    this.renderChatList();
  },

  /**
   * 渲染左侧聊天列表
   */
  renderChatList() {
    const container = document.getElementById('chatList');
    if (!container) return;
    const contacts = this.getContacts();
    if (contacts.length === 0) {
      container.innerHTML = '<div class="empty-state" style="padding:20px;"><p>暂无聊天对象</p></div>';
      return;
    }
    container.innerHTML = contacts.map(c => {
      const isActive = this._activeChatId === c.id;
      const timeStr = c.lastTime ? this.formatTime(c.lastTime) : '';
      const unreadBadge = c.unread > 0 ? `<span style="background:var(--error);color:#fff;font-size:11px;padding:1px 6px;border-radius:10px;margin-left:auto;">${c.unread}</span>` : '';
      return `
        <div class="chat-list-item ${isActive ? 'active' : ''}" data-chat-id="${c.id}" onclick="AppChat.selectChat('${c.id}')"
          style="padding:10px 16px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:background 0.2s;${isActive ? 'background:var(--primary-bg);' : ''}"
          onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background='${isActive ? 'var(--primary-bg)' : 'transparent'}'">
          <span style="font-size:32px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:var(--radius-md);flex-shrink:0;">${c.avatar || '👤'}</span>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.name}</span>
              ${unreadBadge}
            </div>
            <div style="font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">${c.lastMessage || ''}</div>
          </div>
          <span style="font-size:11px;color:var(--text-muted);flex-shrink:0;">${timeStr}</span>
        </div>
      `;
    }).join('');
  },

  /**
   * 选择某个聊天对象
   */
  selectChat(chatId) {
    this._activeChatId = chatId;
    // 清除未读标记
    const contacts = this.getContacts();
    const idx = contacts.findIndex(c => c.id === chatId);
    if (idx !== -1 && contacts[idx].unread) {
      contacts[idx].unread = 0;
      this.saveContacts(contacts);
      this.renderChatList();
    }
    this.renderChatWindow(chatId);
  },

  /**
   * 渲染右侧聊天窗口
   */
  renderChatWindow(chatId) {
    const header = document.getElementById('chatWindowHeader');
    const body = document.getElementById('chatWindowBody');
    const inputArea = document.getElementById('chatInputArea');
    const contacts = this.getContacts();
    const contact = contacts.find(c => c.id === chatId);
    if (!contact || !header || !body || !inputArea) return;

    // 渲染头部
    header.innerHTML = `
      <span style="font-size:22px;">${contact.avatar || '👤'}</span>
      <span>${contact.name}</span>
      <span style="margin-left:auto;font-size:12px;color:var(--text-muted);">${contact.type === 'npc' ? 'NPC' : contact.type === 'system' ? '系统' : '用户'}</span>
    `;

    // 显示输入区
    inputArea.style.display = 'flex';

    // 渲染消息
    const messages = this.getChatMessages(chatId);
    if (messages.length === 0) {
      body.innerHTML = `
        <div style="text-align:center;padding:40px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:12px;">${contact.avatar || '👤'}</div>
          <p>与 <strong>${contact.name}</strong> 的聊天</p>
          <p style="font-size:12px;margin-top:8px;">发送消息开始对话</p>
        </div>
      `;
    } else {
      body.innerHTML = messages.map(m => this.renderMessageBubble(m, contact)).join('');
      // 滚动到底部
      setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
    }
  },

  /**
   * 渲染单条消息气泡（微信样式）
   */
  renderMessageBubble(msg, contact) {
    const isSelf = msg.sender === 'self';
    const avatar = isSelf ? '👤' : (contact?.avatar || '🤖');
    const timeStr = this.formatTimeFull(msg.timestamp);
    // 聊天气泡样式根据设置
    const settings = this.getSettings();
    const bubbleClass = settings.bubbleStyle || 'default';
    const bubbleStyle = isSelf
      ? 'background:var(--primary);color:#fff;border-radius:12px 12px 2px 12px;'
      : 'background:var(--card-bg);color:var(--text-primary);border-radius:12px 12px 12px 2px;border:1px solid var(--border-color);';
    return `
      <div style="display:flex;align-items:flex-start;gap:8px;${isSelf ? 'flex-direction:row-reverse;' : ''}">
        <span style="font-size:28px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:var(--radius-md);flex-shrink:0;">${avatar}</span>
        <div style="max-width:70%;display:flex;flex-direction:column;${isSelf ? 'align-items:flex-end;' : 'align-items:flex-start;'}">
          <span style="font-size:11px;color:var(--text-muted);margin-bottom:2px;">${timeStr}</span>
          <div style="padding:8px 12px;font-size:14px;line-height:1.5;word-break:break-word;${bubbleStyle}">${this.escapeHtml(msg.content)}</div>
        </div>
      </div>
    `;
  },

  /**
   * 发送消息
   */
  sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;
    if (!this._activeChatId) {
      App.toast('请先选择一个聊天对象', 'info');
      return;
    }
    // 添加己方消息
    this.addMessage(this._activeChatId, { sender: 'self', content });
    input.value = '';
    // 更新联系人列表中的最新消息
    this.updateContactLastMessage(this._activeChatId, content);
    // 重新渲染
    this.renderChatWindow(this._activeChatId);
    this.renderChatList();
    // 如果是NPC，模拟NPC回复（延迟500-1500ms）
    const contacts = this.getContacts();
    const contact = contacts.find(c => c.id === this._activeChatId);
    if (contact && contact.type === 'npc') {
      setTimeout(() => this.simulateNpcReply(contact), 800 + Math.random() * 1200);
    }
    // 触发事件：消息发送
    if (window.EventBridge) {
      EventBridge.emit('chat', 'message_sent', { chatId: this._activeChatId, content }, 'AppChat');
    }
  },

  /**
   * 模拟NPC自动回复
   */
  simulateNpcReply(contact) {
    const replies = [
      '收到，我会转告其他人的。', '明白了，继续加油！', '这确实是个有趣的话题。',
      '让我想想...', '哈哈哈，说得对！', '嗯嗯，我在听。', '你说的很有道理。',
      '世界观里还有这样的设定吗？', '下次见面再聊吧。', '需要我帮你做些什么吗？',
      '这个消息很重要，感谢告知。', '我也在关注这件事。', '真期待接下来的剧情！',
      '原来如此，受教了。', '哈哈，你这人真有意思。'
    ];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    this.addMessage(contact.id, { sender: 'npc', content: reply, npcName: contact.name });
    this.updateContactLastMessage(contact.id, reply);
    // 如果当前正在查看此聊天，刷新显示
    if (this._activeChatId === contact.id) {
      this.renderChatWindow(contact.id);
    }
    this.renderChatList();
    // 播放提示音（如果开启）
    const settings = this.getSettings();
    if (settings.soundEnabled) {
      // 简单哔声
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        osc.connect(ctx.destination);
        osc.frequency.value = 800;
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) { /* 忽略音频错误 */ }
    }
  },

  /**
   * 更新联系人的最新消息和时间
   */
  updateContactLastMessage(chatId, lastMessage) {
    const contacts = this.getContacts();
    const idx = contacts.findIndex(c => c.id === chatId);
    if (idx !== -1) {
      contacts[idx].lastMessage = lastMessage.substring(0, 30);
      contacts[idx].lastTime = Date.now();
      // 如果不是当前活跃聊天，增加未读数
      if (this._activeChatId !== chatId) {
        contacts[idx].unread = (contacts[idx].unread || 0) + 1;
      }
      this.saveContacts(contacts);
    }
  },

  /**
   * 处理输入框按键事件
   */
  handleInputKey(e) {
    const settings = this.getSettings();
    if (settings.enterToSend && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  },

  /**
   * 切换表情选择器显示/隐藏
   */
  toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    const grid = document.getElementById('emojiGrid');
    if (!picker || !grid) return;
    if (picker.style.display === 'none' || !picker.style.display || picker.style.display === '') {
      // 生成表情网格
      if (grid.innerHTML === '') {
        grid.innerHTML = this._emojiList.slice(0, 80).map(emoji =>
          `<span style="font-size:22px;cursor:pointer;padding:4px;border-radius:var(--radius-sm);transition:background 0.15s;"
            onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background='transparent'"
            onclick="AppChat.insertEmoji('${emoji}')">${emoji}</span>`
        ).join('');
      }
      picker.style.display = 'block';
    } else {
      picker.style.display = 'none';
    }
  },

  /**
   * 在输入框插入表情
   */
  insertEmoji(emoji) {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
    input.focus();
    input.setSelectionRange(start + emoji.length, start + emoji.length);
  },

  /**
   * 添加联系人弹窗
   */
  addContactPrompt() {
    const content = `
      <div class="form-group"><label>昵称</label><input type="text" id="newContactName" placeholder="输入昵称"></div>
      <div class="form-group"><label>头像表情</label><input type="text" id="newContactAvatar" placeholder="如 👤 🧙 🦊" value="👤"></div>
      <div class="form-group"><label>类型</label><select id="newContactType"><option value="custom">自定义</option><option value="npc">NPC</option></select></div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px;">
        <button class="btn btn-secondary" onclick="App.closeModal()">取消</button>
        <button class="btn btn-primary" onclick="AppChat.addContact()">添加</button>
      </div>
    `;
    App.showModal('添加聊天对象', content);
  },

  /**
   * 执行添加联系人
   */
  addContact() {
    const name = document.getElementById('newContactName')?.value.trim();
    const avatar = document.getElementById('newContactAvatar')?.value.trim() || '👤';
    const type = document.getElementById('newContactType')?.value || 'custom';
    if (!name) {
      App.toast('请输入昵称', 'error');
      return;
    }
    const contacts = this.getContacts();
    const id = 'contact_' + Date.now();
    contacts.push({ id, name, avatar, type, lastMessage: '我们已经是好友啦，开始聊天吧！', lastTime: Date.now(), unread: 0 });
    this.saveContacts(contacts);
    App.closeModal();
    this.renderChatList();
    App.toast('已添加聊天对象', 'success');
    // 自动切换到新联系人
    this.selectChat(id);
  },

  /**
   * NPC主动发送消息（供外部调用，如事件触发后）
   */
  npcSendMessage(npcId, content) {
    const contacts = this.getContacts();
    let contact = contacts.find(c => c.id === npcId);
    if (!contact) {
      // 自动创建NPC联系人
      contact = { id: npcId, name: npcId.replace('npc_', ''), avatar: '🤖', type: 'npc', lastMessage: '', lastTime: Date.now(), unread: 0 };
      contacts.push(contact);
      this.saveContacts(contacts);
    }
    this.addMessage(npcId, { sender: 'npc', content, npcName: contact.name });
    this.updateContactLastMessage(npcId, content);
    // 如果当前正在查看此聊天，刷新显示
    if (this._activeChatId === npcId) {
      this.renderChatWindow(npcId);
    }
    this.renderChatList();
  },

  /**
   * 格式化时间（简略版，用于列表）
   */
  formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },

  /**
   * 格式化时间（完整版，用于气泡）
   */
  formatTimeFull(ts) {
    const d = new Date(ts);
    return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  /**
   * HTML转义，防止XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

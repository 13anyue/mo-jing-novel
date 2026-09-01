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
  _emojiList: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','👍','👎','👏','🙌','🤝','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11v4a2 2 0 002 2h6a2 2 0 002-2v-4"/><path d="M12 7v13"/><path d="M9 7a2 2 0 012-2h2a2 2 0 012 2"/><path d="M7 11h10"/></svg>','✌️','🤞','🤟','🤘','🤙','👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','☝️','👆','👇','👈','👉','👊','✊','🤛','🤜','👀','🧠','🫀','🫁','🦷','🦴','👂','👃','👅','👄','💋','🩸','🔥','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7L3 9h7z"/></svg>','🌟','💫','💥','💢','💦','💧','💤','💨','👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','👛','👜','👝','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>','🩴','👞','👟','🥾','🥿','👠','👡','🩰','👢','👑','👒','🎩','🎓','🧢','🪖','⛑️','📿','💄','💎','🔇','🔈','🔉','🔊','📢','📣','📯','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>','🔕','🎼','🎵','🎶','🎙️','🎚️','🎛️','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪕','🥁','🪘','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>','📲','☎️','📞','📟','📠','🔋','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>','💿','📀','🧮','🎥','🎞️','📽️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>','📺','📷','📸','📹','📼','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>','🔎','🕯️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-7 7c0 2.5 1.5 4.5 3 6v2h8v-2c1.5-1.5 3-3.5 3-6a7 7 0 00-7-7z"/></svg>','🔦','🏮','🪔','📔','📕','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>','📗','📘','📙','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>','📓','📒','📃','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>','📄','📰','🗞️','📑','🔖','🏷️','💰','🪙','💴','💵','💶','💷','💸','💳','🧾','💹','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>','📧','📨','📩','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>','📫','📪','📬','<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>','📮','🗳️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>','✒️','🖋️','🖊️','🖌️','🖍️','📝','💼','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>','📂','🗂️','📅','📆','🗒️','🗓️','📇','📈','📉','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>','📋','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="8"/><path d="M5 17h14v-2H5v2z"/><path d="M12 2v5"/></svg>','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>','🗡️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>','🔫','🪃','🏹','🛡️','🪚','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>','🪛','🔩','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','⚗️','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🌡️','🚪','🛗','🪞','🪟','🛏️','🛋️','🪑','🚽','🪠','🚿','🛁','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🗿','🪧','🚰','🚮','🚹','🚺','♿','🚼','🚻','🚼','🚾','🛂','🛃','🛄','🛅','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>','🚸','⛔','🚫','🚳','🚭','🚯','🚱','🚷','📵','🔞','☢️','☣️','⬆️','↗️','➡️','↘️','⬇️','↙️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🔃','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>','🔙','🔚','🔛','🔜','🔝','🛐','⚛️','🕉️','✡️','☸️','☯️','✝️','☦️','☪️','☮️','🕎','🔯','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️','🔼','⏫','🔽','⏬','⏸️','⏹️','⏺️','⏏️','🎦','🔅','🔆','📶','📳','📴','♀️','♂️','⚧️','✖️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>','➖','➗','♾️','‼️','⁉️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>','❔','❕','❗','〰️','💱','💲','⚕️','♻️','⚜️','🔱','📛','🔰','⭕','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>','☑️','✔️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>','❎','➰','➿','〽️','✳️','✴️','❇️','©️','®️','™️','#️⃣','*️⃣','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟','🔠','🔡','🔢','🔣','🔤','🅰️','🆎','🅱️','🆑','🆒','🆓','ℹ️','🆔','Ⓜ️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>','🆖','🅾️','🆗','🅿️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>','🆙','🆚','🈁','🈂️','🈷️','🈶','🈯','🉐','🈹','🈚','🈲','🉑','🈸','🈴','🈳','㊗️','㊙️','🈺','🈵','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔳','🔲','🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜','🟫','▪️','▫️','◾','◽','◼️','◻️','🀄','🃏','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>','🎭','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>','🎨','🧵','🪡','🧶','🪢','👓','🕶️','🥽','🥼','🦺','👔','👕','👖','🧣','🧤','🧥','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','👛','👜','👝','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>','🩴','👞','👟','🥾','🥿','👠','👡','🩰','👢','👑','👒','🎩','🎓','🧢','🪖','⛑️','📿','💄','💎','🔇','🔈','🔉','🔊','📢','📣','📯','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>','🔕','🎼','🎵','🎶','🎙️','🎚️','🎛️','🎤','🎧','📻','🎷','🪗','🎸','🎹','🎺','🎻','🪕','🥁','🪘','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>','📲','☎️','📞','📟','📠','🔋','🔌','💻','🖥️','🖨️','⌨️','🖱️','🖲️','💽','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>','💿','📀','🧮','🎥','🎞️','📽️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>','📺','📷','📸','📹','📼','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>','🔎','🕯️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 00-7 7c0 2.5 1.5 4.5 3 6v2h8v-2c1.5-1.5 3-3.5 3-6a7 7 0 00-7-7z"/></svg>','🔦','🏮','🪔','📔','📕','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 01-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>','📗','📘','📙','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>','📓','📒','📃','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>','📄','📰','🗞️','📑','🔖','🏷️','💰','🪙','💴','💵','💶','💷','💸','💳','🧾','💹','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>','📧','📨','📩','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>','📫','📪','📬','<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>','📮','🗳️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>','✒️','🖋️','🖊️','🖌️','🖍️','📝','💼','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>','📂','🗂️','📅','📆','🗒️','🗓️','📇','📈','📉','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>','📋','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="17" x2="12" y2="8"/><path d="M5 17h14v-2H5v2z"/><path d="M12 2v5"/></svg>','📍','📎','🖇️','📏','📐','✂️','🗃️','🗄️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','⚒️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>','🗡️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>','🔫','🪃','🏹','🛡️','🪚','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>','🪛','🔩','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.62 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>','🗜️','⚖️','🦯','🔗','⛓️','🪝','🧰','🧲','🪜','⚗️','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🌡️','🚪','🛗','🪞','🪟','🛏️','🛋️','🪑','🚽','🪠','🚿','🛁','🪤','🪒','🧴','🧷','🧹','🧺','🧻','🪣','🧼','🪥','🧽','🧯','🛒','🚬','⚰️','🪦','⚱️','🗿','🪧','🚰','🚮','🚹','🚺','♿','🚼','🚻','🚼','🚾','🛂','🛃','🛄','🛅','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>','🚸','⛔','🚫','🚳','🚭','🚯','🚱','🚷','📵','🔞','☢️','☣️','⬆️','↗️','➡️','↘️','⬇️','↙️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>️','↖️','↕️','↔️','↩️','↪️','⤴️','⤵️','🔃','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>','🔙','🔚','🔛','🔜','🔝','🛐','⚛️','🕉️','✡️','☸️','☯️','✝️','☦️','☪️','☮️','🕎','🔯','♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓','⛎','🔀','🔁','🔂','▶️','⏩','⏭️','⏯️','◀️','⏪','⏮️','🔼','⏫','🔽','⏬','⏸️','⏹️','⏺️','⏏️','🎦','🔅','🔆','📶','📳','📴','♀️','♂️','⚧️','✖️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>','➖','➗','♾️','‼️','⁉️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>','❔','❕','❗','〰️','💱','💲','⚕️','♻️','⚜️','🔱','📛','🔰','⭕','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>','☑️','✔️','<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>','❎','➰','➿','〽️','✳️','✴️','❇️','©️','®️','™️'],

  /**
   * 获取聊天联系人列表
   */
  getContacts() {
    return Storage.get(this.KEY_CONTACTS, [
      { id: 'npc_system', name: '系统通知', avatar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>', type: 'system', lastMessage: '欢迎来到墨境世界', lastTime: Date.now() },
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
    // 初始化模块入口
  init() {
    // v7: 外部模块依赖检查
    if (typeof Storage === 'undefined') { console.warn('[v7] Storage模块未加载'); return; }
    // 初始化模块入口
    this.renderPage();
  },

  /**
   * 进入页面时调用
   */
    // 页面进入时调用
  onEnter() {
    // 页面进入时调用
    this.renderChatList();
    // 如果有活跃聊天，刷新聊天窗口
    if (this._activeChatId) {
      this.renderChatWindow(this._activeChatId);
    }
  },

  /**
   * 渲染页面整体结构（左侧列表 + 右侧聊天区）
   */
    // 渲染页面主结构
  renderPage() {
    // 渲染页面主结构
    const page = document.getElementById('page-chat');
    if (!page) return;
    page.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;"><button class="btn btn-sm btn-secondary" onclick="App.navigate('home')">← 返回</button></div>
<div style="display:flex;height:100%;overflow:hidden;border-radius:var(--radius-lg);border:1px solid var(--border-color);background:var(--card-bg);">
        <!-- 左侧：聊天列表 -->
        <div id="chatListPanel" style="width:280px;min-width:280px;border-right:1px solid var(--border-color);display:flex;flex-direction:column;background:var(--bg-secondary);">
          <div style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;font-weight:600;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> 聊天</span>
            <button class="btn btn-sm btn-secondary" style="margin-left:auto;" onclick="AppChat.addContactPrompt()" title="添加聊天"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
          </div>
          <div id="chatList" style="flex:1;overflow-y:auto;padding:8px 0;"></div>
        </div>
        <!-- 右侧：聊天窗口 -->
        <div id="chatWindowPanel" style="flex:1;display:flex;flex-direction:column;min-width:0;background:var(--bg-primary);">
          <div id="chatWindowHeader" style="padding:12px 16px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:10px;font-weight:600;font-size:15px;">
            <span style="font-size:22px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></span>
            <span>请选择聊天对象</span>
          </div>
          <div id="chatWindowBody" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--bg-secondary);">
            <div class="empty-state" style="margin:auto;">
              <div class="empty-icon" style="font-size:48px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg></div>
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
          <span style="font-size:32px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--bg-secondary);border-radius:var(--radius-md);flex-shrink:0;">${c.avatar || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}</span>
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
      <span style="font-size:22px;">${contact.avatar || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}</span>
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
          <div style="font-size:48px;margin-bottom:12px;">${contact.avatar || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'}</div>
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
    const avatar = isSelf ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' : (contact?.avatar || '🤖');
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
      <div class="form-group"><label>头像表情</label><input type="text" id="newContactAvatar" placeholder="如 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> 🧙 🦊" value="<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>"></div>
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
    const avatar = document.getElementById('newContactAvatar')?.value.trim() || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
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

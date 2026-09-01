/**
 * =========================================================
 * StoryTreeRuntime v1 — 剧情分支树运行时执行系统
 * 古风墨境风格 · 与NovelRuntime深度集成
 * =========================================================
 * 
 * 功能：
 *   - 加载分支树JSON并按节点顺序执行
 *   - 6种节点类型处理：对话/选择/条件/跳转/场景/CG
 *   - 自动切换背景/音乐/立绘
 *   - 状态栏数值修改（好感度等）
 *   - 快进/回退/跳转到指定节点
 *   - 支持自动存档点
 *   - 与NovelRuntime视觉小说模式无缝融合
 */
const StoryTreeRuntime = {
  /* === 状态 === */
  _currentTree: null,
  _currentNodeId: null,
  _nodeHistory: [], // 节点执行历史，用于回退
  _isRunning: false,
  _isFastForwarding: false,
  _waitForChoice: false,
  _treeSaves: {}, // 每个分支树的存档

  /* === 数据持久化 === */
  _saveKey: 'storyTreeRuntime_v8',

  loadTree(tree) {
    this._currentTree = tree;
    this._currentNodeId = tree.startNodeId || (tree.nodes[0]?.id || null);
    this._nodeHistory = [];
    this._isRunning = false;
    this._isFastForwarding = false;
    this._waitForChoice = false;
  },

  saveTreeProgress() {
    if (!this._currentTree) return;
    const data = {
      treeId: this._currentTree.id,
      currentNodeId: this._currentNodeId,
      nodeHistory: this._nodeHistory,
      timestamp: Date.now()
    };
    try {
      const all = Storage.get(this._saveKey, {});
      all[this._currentTree.id] = data;
      Storage.set(this._saveKey, all);
    } catch(e) { console.warn('[StoryTreeRuntime] 保存进度失败:', e); }
  },

  loadTreeProgress(treeId) {
    try {
      const all = Storage.get(this._saveKey, {});
      return all[treeId] || null;
    } catch(e) { return null; }
  },

  /* === 核心执行循环 === */
  async start() {
    if (!this._currentTree || !this._currentNodeId) {
      App.toast('请先加载分支树并设置起始节点', 'warning');
      return;
    }
    this._isRunning = true;
    this._isFastForwarding = false;
    // 自动加载背景/音乐
    await this._autoLoadSceneAssets();
    // 开始执行
    await this._executeCurrentNode();
  },

  async _executeCurrentNode() {
    if (!this._isRunning || !this._currentTree) return;
    const node = this._currentTree.nodes.find(n => n.id === this._currentNodeId);
    if (!node) {
      App.toast('分支树执行完毕', 'success');
      this._isRunning = false;
      return;
    }

    // 记录历史
    this._nodeHistory.push(node.id);

    // 根据节点类型处理
    switch (node.type) {
      case 'dialog': await this._handleDialog(node); break;
      case 'choice': await this._handleChoice(node); break;
      case 'condition': await this._handleCondition(node); break;
      case 'jump': await this._handleJump(node); break;
      case 'scene': await this._handleScene(node); break;
      case 'cg': await this._handleCG(node); break;
      default:
        console.warn('[StoryTreeRuntime] 未知节点类型:', node.type);
        await this._goToNext(node);
    }
  },

  /* === 节点处理器 === */
  async _handleDialog(node) {
    const text = node.data.text || '';
    const speaker = node.data.speaker || '';
    
    // 自动加载角色立绘
    if (node.data.speaker) {
      await this._loadSpeakerPortrait(node.data.speaker);
    }
    
    // 显示对话框
    if (typeof NovelRuntime !== 'undefined' && NovelRuntime.showDialog) {
      NovelRuntime.showDialog(speaker || '??', text, true);
    }
    
    // 自动存档点
    this.saveTreeProgress();
    
    // 等待用户交互后继续（除非快进模式）
    if (!this._isFastForwarding) {
      // 在视觉小说模式下，等待用户点击继续
      // 这里我们设置一个标志，由外部事件触发继续
      this._waitForContinue = true;
    } else {
      await this._delay(500);
      await this._goToNext(node);
    }
  },

  async _handleChoice(node) {
    const choices = node.data.choices || [];
    if (choices.length === 0) {
      await this._goToNext(node);
      return;
    }
    
    // 显示选项
    const choiceTexts = choices.map(c => c.text || '选项');
    if (typeof NovelRuntime !== 'undefined' && NovelRuntime.showChoices) {
      NovelRuntime.showChoices(choiceTexts);
    }
    
    this._waitForChoice = true;
    this._currentChoices = choices;
    this._pendingChoiceNode = node;
    
    // 不自动继续，等待用户选择
    this.saveTreeProgress();
  },

  async _handleCondition(node) {
    const cond = node.data.condition || { stat: 'affection', operator: '>', value: 50 };
    const statValue = this._getStatValue(cond.stat);
    const targetValue = cond.value || 0;
    let result = false;
    
    switch (cond.operator) {
      case '>': result = statValue > targetValue; break;
      case '>=': result = statValue >= targetValue; break;
      case '=': result = statValue === targetValue; break;
      case '<=': result = statValue <= targetValue; break;
      case '<': result = statValue < targetValue; break;
      default: result = statValue > targetValue;
    }
    
    // 根据结果跳转到对应分支
    const targetId = result ? (node.data.conditionTrueTarget || '') : (node.data.conditionFalseTarget || '');
    if (targetId) {
      this._currentNodeId = targetId;
    } else {
      // 没有指定目标，走默认连接
      await this._goToNext(node);
      return;
    }
    
    await this._executeCurrentNode();
  },

  async _handleJump(node) {
    const targetId = node.data.targetId;
    if (targetId) {
      this._currentNodeId = targetId;
      await this._executeCurrentNode();
    } else {
      App.toast('跳转节点未设置目标', 'warning');
      this._isRunning = false;
    }
  },

  async _handleScene(node) {
    // 切换背景
    if (node.data.backgroundId) {
      if (typeof NovelRuntime !== 'undefined' && NovelRuntime.selectBg) {
        await NovelRuntime.selectBg(node.data.backgroundId);
      }
    }
    // 切换音乐
    if (node.data.musicId) {
      if (typeof NovelRuntime !== 'undefined' && NovelRuntime.selectMusic) {
        await NovelRuntime.selectMusic(node.data.musicId);
      }
    }
    // 场景节点自动继续
    await this._goToNext(node);
  },

  async _handleCG(node) {
    // 显示CG
    if (node.data.cgId && typeof CGGallery !== 'undefined' && CGGallery.showCG) {
      CGGallery.showCG(node.data.cgId);
    }
    // 显示CG文本
    if (node.data.text) {
      if (typeof NovelRuntime !== 'undefined' && NovelRuntime.showDialog) {
        NovelRuntime.showDialog('', node.data.text, true);
      }
    }
    this.saveTreeProgress();
    
    if (!this._isFastForwarding) {
      this._waitForContinue = true;
    } else {
      await this._delay(1000);
      await this._goToNext(node);
    }
  },

  /* === 用户交互响应 === */
  onChoiceSelected(choiceIndex) {
    if (!this._waitForChoice || !this._currentChoices) return;
    const choice = this._currentChoices[choiceIndex];
    if (!choice) return;
    
    this._waitForChoice = false;
    
    // 如果有targetId，跳转到对应节点
    if (choice.targetId) {
      this._currentNodeId = choice.targetId;
      this._executeCurrentNode();
    } else {
      // 否则走默认连接
      this._goToNext(this._pendingChoiceNode).then(() => this._executeCurrentNode());
    }
  },

  onContinueClicked() {
    if (this._waitForContinue) {
      this._waitForContinue = false;
      const currentNode = this._currentTree.nodes.find(n => n.id === this._currentNodeId);
      if (currentNode) {
        this._goToNext(currentNode).then(() => this._executeCurrentNode());
      }
    }
  },

  /* === 导航辅助 === */
  async _goToNext(node) {
    if (node.connections && node.connections.length > 0) {
      // 选择第一个连接
      this._currentNodeId = node.connections[0];
    } else {
      // 没有连接，结束
      this._isRunning = false;
      App.toast('剧情分支已结束', 'info');
    }
  },

  async _goToNode(nodeId) {
    this._currentNodeId = nodeId;
    await this._executeCurrentNode();
  },

  /* === 控制功能 === */
  pause() { this._isRunning = false; },
  resume() { 
    this._isRunning = true;
    this._executeCurrentNode();
  },
  
  async fastForward() {
    this._isFastForwarding = true;
    this._waitForContinue = false;
    this._waitForChoice = false;
    // 快进模式下自动选择第一个选项
    while (this._isRunning && this._isFastForwarding) {
      const node = this._currentTree.nodes.find(n => n.id === this._currentNodeId);
      if (!node) break;
      
      if (node.type === 'choice') {
        // 自动选择第一个选项
        const choices = node.data.choices || [];
        if (choices.length > 0 && choices[0].targetId) {
          this._currentNodeId = choices[0].targetId;
        } else {
          await this._goToNext(node);
        }
        await this._delay(200);
      } else {
        await this._executeCurrentNode();
      }
    }
    this._isFastForwarding = false;
  },

  stopFastForward() { this._isFastForwarding = false; },

  async jumpBack(steps = 1) {
    if (this._nodeHistory.length <= steps) {
      App.toast('已经是最开始', 'info');
      return;
    }
    // 回退steps步
    this._nodeHistory = this._nodeHistory.slice(0, -steps);
    this._currentNodeId = this._nodeHistory[this._nodeHistory.length - 1];
    this._nodeHistory.pop(); // 移除当前节点，因为_executeCurrentNode会重新添加
    await this._executeCurrentNode();
  },

  async jumpToNode(nodeId) {
    const node = this._currentTree.nodes.find(n => n.id === nodeId);
    if (!node) {
      App.toast('节点不存在', 'error');
      return;
    }
    this._currentNodeId = nodeId;
    this._nodeHistory.push(nodeId);
    await this._executeCurrentNode();
  },

  getCurrentProgress() {
    if (!this._currentTree || !this._currentTree.nodes.length) return 0;
    const visited = new Set(this._nodeHistory);
    return Math.round((visited.size / this._currentTree.nodes.length) * 100);
  },

  /* === 状态栏集成 === */
  _getStatValue(statKey) {
    // 尝试从NPCManager获取
    if (typeof NPCManager !== 'undefined' && NPCManager.getNPCs) {
      const npcs = NPCManager.getNPCs();
      // 假设当前交互的NPC
      const activeNPC = npcs.find(n => n.id === this._activeNPCId);
      if (activeNPC && activeNPC.data && activeNPC.data.stats) {
        return activeNPC.data.stats[statKey] || 0;
      }
      // 尝试从NPC的顶层字段获取
      return activeNPC ? (activeNPC[statKey] || 0) : 0;
    }
    // 尝试从Storage直接获取
    try {
      return Storage.get('player_' + statKey, 0);
    } catch(e) { return 0; }
  },

  async _loadSpeakerPortrait(speakerName) {
    if (typeof NPCManager !== 'undefined' && NPCManager.getNPCs) {
      const npcs = NPCManager.getNPCs();
      const npc = npcs.find(n => n.name === speakerName);
      if (npc && npc.portraitId && typeof NovelRuntime !== 'undefined' && NovelRuntime.selectNPC) {
        await NovelRuntime.selectNPC(npc.id);
      }
    }
  },

  async _autoLoadSceneAssets() {
    if (!this._currentTree) return;
    // 检查起始节点是否有背景/音乐设置
    const startNode = this._currentTree.nodes.find(n => n.id === this._currentNodeId);
    if (startNode) {
      if (startNode.data.backgroundId && typeof NovelRuntime !== 'undefined') {
        await NovelRuntime.selectBg(startNode.data.backgroundId);
      }
      if (startNode.data.musicId && typeof NovelRuntime !== 'undefined') {
        await NovelRuntime.selectMusic(startNode.data.musicId);
      }
    }
  },

  /* === 工具 === */
  _delay(ms) { return new Promise(r => setTimeout(r, ms)); },
  
  _escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

// 全局暴露
window.StoryTreeRuntime = StoryTreeRuntime;

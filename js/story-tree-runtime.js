/**
 * Story Tree Runtime v1
 * 剧情分支树运行时 —— 在游戏运行时处理分支选择与状态流转
 */
(function() {
  'use strict';

  const StoryTreeRuntime = {
    branches: [],
    currentNodeId: null,

    init(data) {
      this.branches = data && data.branches ? data.branches : [];
      this.currentNodeId = data && data.startNode ? data.startNode : null;
    },

    getCurrentNode() {
      if (!this.currentNodeId || !this.branches.length) return null;
      return this.branches.find(n => n.id === this.currentNodeId) || null;
    },

    getChoices() {
      const node = this.getCurrentNode();
      if (!node || !node.choices) return [];
      return node.choices;
    },

    choose(choiceIndex) {
      const node = this.getCurrentNode();
      if (!node || !node.choices || !node.choices[choiceIndex]) return false;
      const nextId = node.choices[choiceIndex].nextNode;
      if (nextId) {
        this.currentNodeId = nextId;
        return this.getCurrentNode();
      }
      return false;
    },

    reset(startNodeId) {
      this.currentNodeId = startNodeId || (this.branches[0] && this.branches[0].id);
    }
  };

  window.StoryTreeRuntime = StoryTreeRuntime;
})();

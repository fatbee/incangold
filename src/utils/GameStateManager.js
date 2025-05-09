/**
 * 遊戲狀態管理器 - 空實現
 * 單人遊戲模式已被移除，此文件僅保留接口以避免引用錯誤
 */

class GameStateManager {
    constructor() {
        console.log('單人遊戲模式已被移除，GameStateManager 僅保留接口');
    }

    // 保留所有方法的空實現
    initializeGameState() { return null; }
    getGameState() { return null; }
    incrementAction() { return 0; }
    isMaxActionsReached() { return false; }
    logEvent() { }
    getEventLog() { return []; }
    completeRoundAndStartNext() { return 0; }
    isMaxRoundsReached() { return false; }
    addGold() { return 0; }
    calculateCurrentRoundGold() { return 0; }
    secureGold() { return 0; }
    getTotalGold() { return 0; }
    addDanger() { return false; }
    resetGameState() { }
}

// 創建單例實例
const gameStateManager = new GameStateManager();

module.exports = gameStateManager;

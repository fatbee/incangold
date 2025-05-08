/**
 * 遊戲狀態管理器
 * 用於追蹤遊戲狀態，如回合數、行動次數、玩家寶藏等
 */

class GameStateManager {
    constructor() {
        this.gameStates = new Map();
    }

    /**
     * 初始化玩家的遊戲狀態
     * @param {string} userId - 玩家的Discord ID
     */
    initializeGameState(userId) {
        this.gameStates.set(userId, {
            currentRound: 1,
            maxRounds: 5,
            actionsInRound: 0,
            maxActionsPerRound: 30,
            treasures: 0,
            securedTreasures: 0,
            dangersEncountered: [],
            eventLog: [] // 記錄所有事件
        });
        return this.getGameState(userId);
    }

    /**
     * 獲取玩家的遊戲狀態
     * @param {string} userId - 玩家的Discord ID
     * @returns {Object|null} 遊戲狀態對象或null（如果不存在）
     */
    getGameState(userId) {
        return this.gameStates.get(userId) || null;
    }

    /**
     * 增加行動次數
     * @param {string} userId - 玩家的Discord ID
     * @returns {number} 新的行動次數
     */
    incrementAction(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return 0;

        gameState.actionsInRound += 1;
        return gameState.actionsInRound;
    }

    /**
     * 檢查是否達到最大行動次數
     * @param {string} userId - 玩家的Discord ID
     * @returns {boolean} 如果達到最大行動次數則為true
     */
    isMaxActionsReached(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return false;

        return gameState.actionsInRound >= gameState.maxActionsPerRound;
    }

    /**
     * 記錄事件
     * @param {string} userId - 玩家的Discord ID
     * @param {string} eventType - 事件類型 ('treasure' 或 'danger')
     * @param {string|number} eventValue - 事件值 (寶藏值或危險類型)
     */
    logEvent(userId, eventType, eventValue) {
        const gameState = this.getGameState(userId);
        if (!gameState) return;

        // 創建事件記錄
        const event = `${eventType}_${eventValue}`;
        gameState.eventLog.push(event);
    }

    /**
     * 獲取事件記錄
     * @param {string} userId - 玩家的Discord ID
     * @returns {string[]} 事件記錄數組
     */
    getEventLog(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return [];

        return gameState.eventLog;
    }

    /**
     * 完成當前回合並開始新回合
     * @param {string} userId - 玩家的Discord ID
     * @returns {number} 新的回合數
     */
    completeRoundAndStartNext(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return 0;

        gameState.currentRound += 1;
        gameState.actionsInRound = 0;
        gameState.treasures = 0; // 重置當前回合寶藏
        gameState.dangersEncountered = [];
        // 清除事件記錄，為新回合做準備
        gameState.eventLog = [];
        return gameState.currentRound;
    }

    /**
     * 檢查遊戲是否已達到最大回合數
     * @param {string} userId - 玩家的Discord ID
     * @returns {boolean} 如果達到最大回合數則為true
     */
    isMaxRoundsReached(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return false;

        return gameState.currentRound >= gameState.maxRounds;
    }

    /**
     * 添加寶藏到玩家的當前寶藏中
     * @param {string} userId - 玩家的Discord ID
     * @param {number} amount - 寶藏數量
     * @returns {number} 新的寶藏總數
     */
    addTreasure(userId, amount) {
        const gameState = this.getGameState(userId);
        if (!gameState) return 0;

        gameState.treasures += amount;
        return gameState.treasures;
    }

    /**
     * 計算當前回合中收集的所有寶藏總和
     * @param {string} userId - 玩家的Discord ID
     * @returns {number} 當前回合寶藏總和
     */
    calculateCurrentRoundTreasures(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return 0;

        // 如果是新回合開始（行動次數為0且不是第一回合），寶藏應該為0
        if (gameState.actionsInRound === 0 && gameState.currentRound > 1) {
            return 0;
        }

        // 獲取事件記錄
        const eventLog = gameState.eventLog || [];

        // 計算當前回合的寶藏總和
        let totalTreasure = 0;

        // 從事件記錄中找出所有寶藏事件並加總
        for (const event of eventLog) {
            if (event.startsWith('treasure_')) {
                const treasureValue = parseInt(event.split('_')[1]);
                if (!isNaN(treasureValue)) {
                    totalTreasure += treasureValue;
                }
            }
        }

        return totalTreasure;
    }

    /**
     * 將當前寶藏保存到安全的寶藏中
     * @param {string} userId - 玩家的Discord ID
     * @returns {number} 保存的寶藏總數
     */
    secureTreasures(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return 0;

        // 計算當前回合中收集的所有寶藏總和
        const currentRoundTreasures = this.calculateCurrentRoundTreasures(userId);

        // 更新遊戲狀態中的寶藏值
        gameState.treasures = currentRoundTreasures;

        // 將當前寶藏添加到已保存的寶藏中
        gameState.securedTreasures += gameState.treasures;
        const securedAmount = gameState.treasures;

        return securedAmount;
    }

    /**
     * 獲取玩家的總寶藏（只包括已保存的）
     * @param {string} userId - 玩家的Discord ID
     * @returns {number} 總寶藏數量
     */
    getTotalTreasures(userId) {
        const gameState = this.getGameState(userId);
        if (!gameState) return 0;

        return gameState.securedTreasures;
    }

    /**
     * 添加遇到的危險
     * @param {string} userId - 玩家的Discord ID
     * @param {string} dangerType - 危險類型
     * @returns {boolean} 如果這是第二次遇到相同危險則為true
     */
    addDanger(userId, dangerType) {
        const gameState = this.getGameState(userId);
        if (!gameState) return false;

        const isDuplicate = gameState.dangersEncountered.includes(dangerType);
        gameState.dangersEncountered.push(dangerType);

        return isDuplicate;
    }

    /**
     * 重置玩家的遊戲狀態
     * @param {string} userId - 玩家的Discord ID
     */
    resetGameState(userId) {
        this.gameStates.delete(userId);
    }
}

// 創建單例實例
const gameStateManager = new GameStateManager();

module.exports = gameStateManager;

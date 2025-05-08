/**
 * 遊戲計時器管理器
 * 用於管理遊戲中的計時器，例如自動繼續探索
 */

class TimerManager {
    constructor() {
        this.timers = new Map();
        this.countdowns = new Map(); // 存儲倒數計時信息
        this.defaultTimeout = 20000; // 默認20秒
        this.updateInterval = 1000; // 每秒更新一次倒數計時
    }

    /**
     * 設置一個計時器
     * @param {string} userId - 玩家的Discord ID
     * @param {Function} callback - 計時器到期時要執行的回調函數
     * @param {Function} updateCallback - 更新倒數計時顯示的回調函數
     * @param {number} timeout - 計時器超時時間（毫秒）
     * @returns {Object} 計時器信息
     */
    setTimer(userId, callback, updateCallback, timeout = this.defaultTimeout) {
        // 如果已經有計時器，先清除它
        this.clearTimer(userId);

        // 計算結束時間
        const endTime = Date.now() + timeout;

        // 創建倒數計時信息
        const countdownInfo = {
            endTime,
            remainingSeconds: Math.ceil(timeout / 1000),
            updateCallback
        };

        // 存儲倒數計時信息
        this.countdowns.set(userId, countdownInfo);

        // 設置更新倒數計時的間隔
        const updateIntervalId = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

            // 更新剩餘秒數
            countdownInfo.remainingSeconds = remaining;

            // 調用更新回調函數
            if (updateCallback && typeof updateCallback === 'function') {
                updateCallback(remaining);
            }

            // 如果倒數計時結束，清除更新間隔
            if (remaining <= 0) {
                clearInterval(updateIntervalId);
            }
        }, this.updateInterval);

        // 設置主計時器
        const timerId = setTimeout(() => {
            // 執行回調函數
            callback();
            // 清除更新間隔
            clearInterval(updateIntervalId);
            // 從Map中移除計時器和倒數計時信息
            this.timers.delete(userId);
            this.countdowns.delete(userId);
        }, timeout);

        // 將計時器ID和更新間隔ID存儲在Map中
        this.timers.set(userId, { timerId, updateIntervalId });

        return { timerId, updateIntervalId };
    }

    /**
     * 清除一個計時器
     * @param {string} userId - 玩家的Discord ID
     */
    clearTimer(userId) {
        if (this.timers.has(userId)) {
            const { timerId, updateIntervalId } = this.timers.get(userId);
            clearTimeout(timerId);
            clearInterval(updateIntervalId);
            this.timers.delete(userId);
        }

        // 清除倒數計時信息
        this.countdowns.delete(userId);
    }

    /**
     * 檢查是否有計時器
     * @param {string} userId - 玩家的Discord ID
     * @returns {boolean} 如果有計時器則為true
     */
    hasTimer(userId) {
        return this.timers.has(userId);
    }

    /**
     * 獲取剩餘時間（秒）
     * @param {string} userId - 玩家的Discord ID
     * @returns {number} 剩餘時間（秒），如果沒有計時器則返回0
     */
    getRemainingSeconds(userId) {
        if (!this.countdowns.has(userId)) return 0;
        return this.countdowns.get(userId).remainingSeconds;
    }

    /**
     * 重置計時器
     * @param {string} userId - 玩家的Discord ID
     * @param {Function} callback - 計時器到期時要執行的回調函數
     * @param {Function} updateCallback - 更新倒數計時顯示的回調函數
     * @param {number} timeout - 計時器超時時間（毫秒）
     * @returns {Object} 計時器信息
     */
    resetTimer(userId, callback, updateCallback, timeout = this.defaultTimeout) {
        return this.setTimer(userId, callback, updateCallback, timeout);
    }
}

// 創建單例實例
const timerManager = new TimerManager();

module.exports = timerManager;

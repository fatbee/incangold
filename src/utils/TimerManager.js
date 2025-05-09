/**
 * 遊戲計時器管理器
 * 用於管理遊戲中的計時器，例如自動繼續探索
 */

const configManager = require('./configManager');

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
        console.log(`開始設置計時器: userId=${userId}, timeout=${timeout}ms, 當前時間=${new Date().toLocaleTimeString()}`);

        // 檢查計時器是否啟用
        if (!configManager.isTimerEnabled()) {
            console.log(`計時器已禁用，不設置計時器: userId=${userId}`);
            return null;
        }

        // 如果已經有計時器，先清除它
        if (this.timers.has(userId)) {
            console.log(`清除已存在的計時器: userId=${userId}`);
            this.clearTimer(userId);
        }

        // 計算結束時間
        const endTime = Date.now() + timeout;
        console.log(`計時器結束時間: userId=${userId}, endTime=${new Date(endTime).toLocaleTimeString()}`);

        // 創建倒數計時信息
        const countdownInfo = {
            endTime,
            remainingSeconds: Math.ceil(timeout / 1000),
            updateCallback
        };

        // 存儲倒數計時信息
        this.countdowns.set(userId, countdownInfo);
        console.log(`倒數計時信息已存儲: userId=${userId}, remainingSeconds=${countdownInfo.remainingSeconds}`);

        // 設置更新倒數計時的間隔
        const updateIntervalId = setInterval(() => {
            try {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));

                // 更新剩餘秒數
                countdownInfo.remainingSeconds = remaining;

                // 記錄當前時間和剩餘秒數，用於調試
                //console.log(`計時器更新: userId=${userId}, 剩餘時間=${remaining}秒, 當前時間=${new Date().toLocaleTimeString()}`);

                // 調用更新回調函數
                if (updateCallback && typeof updateCallback === 'function') {
                    // 使用 try-catch 包裝回調函數，防止錯誤中斷計時器
                    try {
                        updateCallback(remaining);
                    } catch (callbackError) {
                        console.error('更新倒數計時顯示時發生錯誤:', callbackError);
                    }
                }

                // 如果倒數計時結束，清除更新間隔
                if (remaining <= 0) {
                    console.log(`計時器結束: userId=${userId}, 當前時間=${new Date().toLocaleTimeString()}`);
                    clearInterval(updateIntervalId);
                }
            } catch (error) {
                console.error('計時器更新時發生錯誤:', error);
            }
        }, this.updateInterval);

        // 設置主計時器
        const timerId = setTimeout(() => {
            console.log(`主計時器觸發: userId=${userId}, 當前時間=${new Date().toLocaleTimeString()}`);
            try {
                // 執行回調函數
                if (callback && typeof callback === 'function') {
                    callback();
                    console.log(`主計時器回調執行完成: userId=${userId}`);
                } else {
                    console.error(`主計時器回調函數無效: userId=${userId}`);
                }
            } catch (error) {
                console.error('計時器回調函數執行時發生錯誤:', error);
            } finally {
                // 無論回調函數是否成功執行，都清除資源
                // 清除更新間隔
                clearInterval(updateIntervalId);
                // 從Map中移除計時器和倒數計時信息
                this.timers.delete(userId);
                this.countdowns.delete(userId);
                console.log(`主計時器資源清理完成: userId=${userId}`);

                // 在這裡設置一個新的計時器，確保自動繼續探索
                console.log(`檢查是否需要設置新的計時器: userId=${userId}`);
            }
        }, timeout);

        // 將計時器ID和更新間隔ID存儲在Map中
        this.timers.set(userId, { timerId, updateIntervalId });
        console.log(`計時器已設置並存儲: userId=${userId}, timerId=${timerId}, updateIntervalId=${updateIntervalId}`);

        return { timerId, updateIntervalId };
    }

    /**
     * 清除一個計時器
     * @param {string} userId - 玩家的Discord ID
     */
    clearTimer(userId) {
        console.log(`嘗試清除計時器: userId=${userId}, 當前時間=${new Date().toLocaleTimeString()}`);

        if (this.timers.has(userId)) {
            const { timerId, updateIntervalId } = this.timers.get(userId);
            console.log(`找到計時器: userId=${userId}, timerId=${timerId}, updateIntervalId=${updateIntervalId}`);

            clearTimeout(timerId);
            console.log(`已清除主計時器: userId=${userId}, timerId=${timerId}`);

            clearInterval(updateIntervalId);
            console.log(`已清除更新間隔: userId=${userId}, updateIntervalId=${updateIntervalId}`);

            this.timers.delete(userId);
            console.log(`已從Map中移除計時器: userId=${userId}`);
        } else {
            console.log(`未找到計時器: userId=${userId}`);
        }

        // 清除倒數計時信息
        if (this.countdowns.has(userId)) {
            this.countdowns.delete(userId);
            console.log(`已清除倒數計時信息: userId=${userId}`);
        } else {
            console.log(`未找到倒數計時信息: userId=${userId}`);
        }

        console.log(`計時器清除完成: userId=${userId}`);
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

const fs = require('fs');
const path = require('path');
const { info, error } = require('./Console');

class MessageManager {
    constructor() {
        this.messages = {};
        this.loadMessages();
    }

    /**
     * Load messages from the properties file
     */
    loadMessages() {
        try {
            const filePath = path.join(process.cwd(), 'src', 'config', 'message.properties');
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Parse the properties file
            const lines = content.split('\n');
            for (const line of lines) {
                // Skip comments and empty lines
                if (line.trim().startsWith('#') || line.trim() === '') {
                    continue;
                }
                
                // Parse key-value pairs
                const separatorIndex = line.indexOf('=');
                if (separatorIndex > 0) {
                    const key = line.substring(0, separatorIndex).trim();
                    const value = line.substring(separatorIndex + 1).trim();
                    this.messages[key] = value;
                }
            }
            
            info('Successfully loaded messages from message.properties');
        } catch (err) {
            error('Failed to load messages from message.properties');
            error(err);
        }
    }

    /**
     * Get a message by key
     * @param {string} key - The message key
     * @param {...any} args - Arguments to format the message with
     * @returns {string} The formatted message
     */
    getMessage(key, ...args) {
        let message = this.messages[key] || key;
        
        // Format the message with arguments
        if (args && args.length > 0) {
            for (let i = 0; i < args.length; i++) {
                message = message.replace(new RegExp(`\\{${i}\\}`, 'g'), args[i]);
            }
        }
        
        return message;
    }

    /**
     * Get all messages with a specific prefix
     * @param {string} prefix - The prefix to filter by
     * @returns {Object} An object containing all messages with the prefix
     */
    getMessagesByPrefix(prefix) {
        const result = {};
        
        for (const key in this.messages) {
            if (key.startsWith(prefix)) {
                result[key] = this.messages[key];
            }
        }
        
        return result;
    }
}

// Create a singleton instance
const messageManager = new MessageManager();

module.exports = messageManager;

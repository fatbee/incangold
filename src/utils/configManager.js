/**
 * Configuration Manager Utility
 * Provides a simple interface for accessing configuration properties
 */

const messageManager = require('./MessageManager');
const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * Get a property from the message.properties file
 * @param {string} key - The property key
 * @param {...any} args - Arguments to format the property with
 * @returns {string} The property value
 */
function getProperty(key, ...args) {
    return messageManager.getMessage(key, ...args);
}

/**
 * Get all properties with a specific prefix
 * @param {string} prefix - The prefix to filter by
 * @returns {Object} An object containing all properties with the prefix
 */
function getPropertiesByPrefix(prefix) {
    return messageManager.getMessagesByPrefix(prefix);
}

/**
 * Creates an attachment from a local image path
 * @param {string} imagePath - The path to the image from message.properties
 * @returns {Object} An object with attachment and URL for Discord embeds
 */
function createImageAttachment(imagePath) {
    try {
        console.log(`嘗試創建圖片附件: ${imagePath}`);

        // Convert relative path to absolute path
        const absolutePath = path.resolve(process.cwd(), imagePath);
        console.log(`絕對路徑: ${absolutePath}`);

        // Check if file exists
        if (!fs.existsSync(absolutePath)) {
            console.error(`圖片文件未找到: ${absolutePath}`);

            // 嘗試使用不同的路徑
            const alternativePath = path.join(process.cwd(), imagePath);
            console.log(`嘗試替代路徑: ${alternativePath}`);

            if (!fs.existsSync(alternativePath)) {
                console.error(`替代路徑也未找到: ${alternativePath}`);
                return { attachment: null, url: null };
            }

            console.log(`使用替代路徑: ${alternativePath}`);

            // Create a unique filename for the attachment
            const filename = path.basename(imagePath);

            // Create the attachment
            const attachment = new AttachmentBuilder(alternativePath, { name: filename });

            // Return both the attachment and the URL to reference it in embeds
            return {
                attachment: attachment,
                url: `attachment://${filename}`
            };
        }

        // Create a unique filename for the attachment
        const filename = path.basename(imagePath);
        console.log(`文件名: ${filename}`);

        // Create the attachment
        const attachment = new AttachmentBuilder(absolutePath, { name: filename });
        console.log(`創建附件成功`);

        // Return both the attachment and the URL to reference it in embeds
        return {
            attachment: attachment,
            url: `attachment://${filename}`
        };
    } catch (error) {
        console.error('創建圖片附件時發生錯誤:', error);
        return { attachment: null, url: null };
    }
}

/**
 * Get an image attachment for a property
 * @param {string} key - The property key for the image path
 * @returns {Object} An object with attachment and URL for Discord embeds
 */
function getImageAttachment(key) {
    try {
        console.log(`獲取圖片附件: ${key}`);
        const imagePath = getProperty(key);
        console.log(`圖片路徑: ${imagePath}`);

        if (!imagePath) {
            console.error(`未找到圖片路徑: ${key}`);
            return { attachment: null, url: null };
        }

        return createImageAttachment(imagePath);
    } catch (error) {
        console.error(`獲取圖片附件時發生錯誤: ${key}`, error);
        return { attachment: null, url: null };
    }
}

module.exports = {
    getProperty,
    getPropertiesByPrefix,
    createImageAttachment,
    getImageAttachment
};

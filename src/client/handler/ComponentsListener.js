const DiscordBot = require("../DiscordBot");
const config = require("../../config");
const { error } = require("../../utils/Console");

class ComponentsListener {
    /**
     *
     * @param {DiscordBot} client
     */
    constructor(client) {
        client.on('interactionCreate', async (interaction) => {
            const checkUserPermissions = async (component) => {
                // 檢查組件是否為公共組件
                if (component.options?.public === false) {
                    // 檢查消息是否有交互屬性
                    if (!interaction.message.interaction) {
                        console.log('消息沒有交互屬性，允許所有用戶使用此組件');
                        return true;
                    }

                    // 檢查用戶ID是否與原始交互用戶ID匹配
                    if (interaction.user.id !== interaction.message.interaction.user.id) {
                        console.log(`用戶 ${interaction.user.id} 嘗試使用非公共組件，但原始用戶是 ${interaction.message.interaction.user.id}`);
                        await interaction.reply({
                            content: config.messages.COMPONENT_NOT_PUBLIC,
                            ephemeral: true
                        });
                        return false;
                    }
                }

                return true;
            }

            try {
                if (interaction.isButton()) {
                    const component = client.collection.components.buttons.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        console.log(`執行按鈕組件: ${interaction.customId}`);
                        await component.run(client, interaction);
                    } catch (err) {
                        error(`執行按鈕組件 ${interaction.customId} 時發生錯誤:`, err);
                        // 嘗試回覆一個錯誤消息
                        try {
                            if (interaction.replied || interaction.deferred) {
                                await interaction.followUp({
                                    content: '執行操作時發生錯誤，請稍後再試。',
                                    ephemeral: true
                                });
                            } else {
                                await interaction.reply({
                                    content: '執行操作時發生錯誤，請稍後再試。',
                                    ephemeral: true
                                });
                            }
                        } catch (replyError) {
                            error('無法回覆錯誤消息:', replyError);
                        }
                    }

                    return;
                }

                if (interaction.isAnySelectMenu()) {
                    const component = client.collection.components.selects.get(interaction.customId);

                    if (!component) return;

                    if (!(await checkUserPermissions(component))) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        error(err);
                    }

                    return;
                }

                if (interaction.isModalSubmit()) {
                    const component = client.collection.components.modals.get(interaction.customId);

                    if (!component) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        error(err);
                    }

                    return;
                }

                if (interaction.isAutocomplete()) {
                    const component = client.collection.components.autocomplete.get(interaction.commandName);

                    if (!component) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        error(err);
                    }

                    return;
                }
            } catch (err) {
                error(err);
            }
        });
    }
}

module.exports = ComponentsListener;
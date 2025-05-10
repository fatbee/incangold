const { ChatInputCommandInteraction, AttachmentBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const config = require("../../config");

module.exports = new ApplicationCommand({
    command: {
        name: 'reload',
        description: 'Reload every command.',
        type: 1,
        options: []
    },
    options: {
        botDevelopers: true
    },
    /**
     *
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        // Flag to track if we've responded to the interaction
        let hasResponded = false;

        try {
            // Try to respond immediately instead of deferring
            await interaction.reply({
                content: 'Reloading commands...',
                ephemeral: true
            });
            hasResponded = true;

            // Perform the reload
            client.commands_handler.reload();
            await client.commands_handler.registerApplicationCommands(config.development);

            // Edit the reply with success message
            try {
                await interaction.editReply({
                    content: 'Successfully reloaded application commands and message commands.'
                });
            } catch (editError) {
                console.error('Failed to edit reply:', editError);
                // If we can't edit, we've already responded so just log the error
            }
        } catch (initialError) {
            console.error('Initial reply failed:', initialError);

            // If we haven't responded yet, try to defer reply
            if (!hasResponded) {
                try {
                    await interaction.deferReply({ ephemeral: true });
                    hasResponded = true;

                    // Perform the reload
                    client.commands_handler.reload();
                    await client.commands_handler.registerApplicationCommands(config.development);

                    // Edit the deferred reply
                    await interaction.editReply({
                        content: 'Successfully reloaded application commands and message commands.'
                    });
                } catch (deferError) {
                    console.error('Defer reply failed:', deferError);

                    // If we still haven't responded, try one more approach
                    if (!hasResponded) {
                        try {
                            // Try to follow up instead
                            await interaction.followUp({
                                content: 'Reloading commands...',
                                ephemeral: true
                            });
                            hasResponded = true;

                            // Perform the reload
                            client.commands_handler.reload();
                            await client.commands_handler.registerApplicationCommands(config.development);

                            // Send another follow up with the result
                            await interaction.followUp({
                                content: 'Successfully reloaded application commands and message commands.',
                                ephemeral: true
                            });
                        } catch (followUpError) {
                            console.error('All response attempts failed:', followUpError);
                        }
                    }
                }
            }
        }

        // Regardless of whether we could respond to the interaction,
        // make sure the reload happens
        try {
            if (!hasResponded) {
                client.commands_handler.reload();
                await client.commands_handler.registerApplicationCommands(config.development);
                console.log('Commands reloaded successfully (but could not respond to interaction)');
            }
        } catch (finalError) {
            console.error('Command reload failed:', finalError);
        }
    }
}).toJSON();
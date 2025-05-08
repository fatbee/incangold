const { Event } = require('../../structure/builders/event.js');
const { EmbedBuilder } = require('discord.js');

module.exports = new Event({
    event: 'guildMemberAdd',
    run: async (client, member) => {
        // You can customize this to send welcome messages to a specific channel
        // For now, we'll just log it
        console.log(`New member joined: ${member.user.tag}`);

        // Example of sending a welcome message to a system channel if it exists
        const systemChannel = member.guild.systemChannel;

        if (systemChannel) {
            const welcomeEmbed = new EmbedBuilder()
                .setTitle('Welcome to the server!')
                .setDescription(`Welcome ${member.user} to **${member.guild.name}**!`)
                .setColor('#FFD700') // Gold color for Incangold
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            systemChannel.send({ embeds: [welcomeEmbed] });
        }
    }
}).toJSON();

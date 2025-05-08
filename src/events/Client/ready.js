const Event = require('../../structure/Event');
const colors = require('colors');

module.exports = new Event({
    event: 'ready',
    once: true,
    run: async (client) => {
        // Set bot status
        client.user.setActivity('Incangold Game', { type: 'PLAYING' });

        // Log bot information
        console.log(colors.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(colors.green(`${client.user.tag} is now online and ready to use!`));
        console.log(colors.green(`Bot ID: ${client.user.id}`));
        console.log(colors.green(`Guild Count: ${client.guilds.cache.size}`));
        console.log(colors.green('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    }
}).toJSON();

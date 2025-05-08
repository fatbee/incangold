const ApplicationCommand = require('../ApplicationCommand');

class ApplicationCommandBuilder {
    /**
     * @typedef {Object} ApplicationCommandOptions
     * @property {Object} command - The command data
     * @property {Object} [options] - Additional options
     * @property {Function} run - The function to run when the command is executed
     */

    /**
     * Create a new application command
     * @param {ApplicationCommandOptions} options - The command options
     * @returns {import('../ApplicationCommand')} The application command
     */
    constructor(options) {
        return new ApplicationCommand(options);
    }
}

module.exports = { ApplicationCommand: ApplicationCommandBuilder };

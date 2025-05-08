const Event = require('../Event');

class EventBuilder {
    /**
     * @typedef {Object} EventOptions
     * @property {string} event - The event name
     * @property {boolean} [once=false] - Whether the event should only be triggered once
     * @property {Function} run - The function to run when the event is triggered
     */

    /**
     * Create a new event
     * @param {EventOptions} options - The event options
     * @returns {import('../Event')} The event
     */
    constructor(options) {
        return new Event(options);
    }
}

module.exports = { Event: EventBuilder };

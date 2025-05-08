const Component = require('../Component');

class ComponentBuilder {
    /**
     * @typedef {Object} ComponentOptions
     * @property {string} customId - The component's custom ID
     * @property {string} type - The component type (button, select, modal)
     * @property {Object} [options] - Additional options
     * @property {Function} run - The function to run when the component is interacted with
     */

    /**
     * Create a new component
     * @param {ComponentOptions} options - The component options
     * @returns {import('../Component')} The component
     */
    constructor(options) {
        return new Component(options);
    }
}

module.exports = { Component: ComponentBuilder };

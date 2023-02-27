import { MapLegendTool } from './MapLegendTool';
import { MapLegendHandler } from './MapLegendHandler';

Oskari.clazz.define('Oskari.mapframework.publisher.tool.MapLegend',
    function (sandbox) {
        this.handler = null;
        this.tool = null;
        this.sandbox = sandbox;
    }, {
        bundleName: 'maplegend',
        getComponent: function () {
            return {
                component: MapLegendTool,
                handler: this.handler
            };
        },
        getInstance: function () {
            return this.sandbox.findRegisteredModuleInstance(this.bundleName);
        },
        getPlugin: function () {
            return this.getInstance().getPlugin();
        },
        /**
         * Initialise tool
         * @method init
         */
        init: function (data) {
            let enabled = false;
            if (data && data.configuration[this.bundleName]) {
                enabled = true;
                this.setEnabled(true);
            }
            this.handler = new MapLegendHandler(enabled, this.sandbox, this);
        },
        /**
         * Set enabled.
         * @method setEnabled
         * @public
         *
         * @param {Boolean} enabled is tool enabled or not
         */
        setEnabled: function (enabled) {
            if (enabled) {
                this.getInstance().createPlugin();
            } else {
                if (this.getInstance().plugin) {
                    this.getInstance().stopPlugin();
                }
            }
        },
        /**
         * Get values.
         * @method getValues
         * @public
         *
         * @returns {Object} tool value object
         */
        getValues: function () {
            if (this.handler?.getState().showLegends) {
                return {
                    [this.bundleName]: {
                        conf: this.getPlugin().getConfig(),
                        state: {}
                    }
                };
            }
            return null;
        }
    }, {
        'protocol': ['Oskari.mapframework.publisher.LayerTool']
    });

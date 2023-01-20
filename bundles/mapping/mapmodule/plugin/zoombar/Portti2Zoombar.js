import React from 'react';
import ReactDOM from 'react-dom';
import { ZoomSlider } from './ZoomSlider';

/**
 * @class Oskari.mapframework.bundle.mapmodule.plugin.Portti2Zoombar
 * Zoombar implementation with jQuery UI and refined graphics. Location can be configured,
 * but defaults on top of the map with placement details on the css-file.
 *
 * See http://www.oskari.org/trac/wiki/DocumentationBundleMapModulePluginPorttiZoombar
 */
Oskari.clazz.define('Oskari.mapframework.bundle.mapmodule.plugin.Portti2Zoombar',

    /**
     * @static @method create called automatically on construction
     *
     *
     */
    function (config) {
        // hackhack for old configs so we don't have to remove
        // with-panbuttons from them
        this._config = config;
        if (config && config.location && config.location.classes) {
            config.location.classes = config.location.classes.replace(
                'with-panbuttons',
                ''
            );
            this._config = config;
        }
        this._clazz =
            'Oskari.mapframework.bundle.mapmodule.plugin.Portti2Zoombar';
        this._defaultLocation = 'top right';
        this._index = 30;
        this._name = 'Portti2Zoombar';
        this._slider = null;
        this._suppressEvents = false;
        this.inMobileMode = false;

        this._desktopStyles = {
            plus: {
                css: {}
            },
            minus: {
                css: {}
            }
        };
    }, {
        /**
         * @private @method _createControlElement
         * Draws the zoombar on the screen.
         *
         *
         * @return {jQuery}
         * Plugin jQuery element
         */
        _createControlElement: function () {
            var el = jQuery(
                '<div class="oskariui mapplugin pzbDiv zoombar"></div>'
            );

            return el;
        },

        /**
         * @public  @method _refresh
         * Called after a configuration change.
         *
         *
         */
        refresh: function () {
            var me = this;
            var conf = me.getConfig();
            // Change the style if in the conf
            if (conf && conf.toolStyle) {
                me.changeToolStyle(conf.toolStyle, me.getElement());
            } else {
                var toolStyle = me.getToolStyleFromMapModule();
                if (!toolStyle) {
                    toolStyle = 'rounded-dark';
                }
                if (toolStyle !== null && toolStyle !== undefined) {
                    me.changeToolStyle(toolStyle, me.getElement());
                }
            }
            me._setZoombarValue(me.getMapModule().getMapZoom());
        },

        /**
         * @private @method _setZoombarValue
         * Sets the zoombar slider value
         *
         * @param {Number} value new Zoombar value
         *
         */
        _setZoombarValue: function (value) {
            var me = this;

            const div = this.getElement();

            if (!div) {
                return;
            }

            let toolStyle;
            const conf = me.getConfig();
            if (conf && conf.toolStyle) {
                me.changeToolStyle(conf.toolStyle, me.getElement());
            } else {
                toolStyle = me.getToolStyleFromMapModule();
                if (!toolStyle) {
                    toolStyle = 'rounded-dark';
                }
                if (toolStyle !== null && toolStyle !== undefined) {
                    me.changeToolStyle(toolStyle, me.getElement());
                }
            }

            me._suppressEvents = true;
            this.renderButton(toolStyle, div);
            me._suppressEvents = false;
        },

        /**
         * @method _createEventHandlers
         * Create eventhandlers.
         *
         *
         * @return {Object.<string, Function>} EventHandlers
         */
        _createEventHandlers: function () {
            var me = this;
            return {
                AfterMapMoveEvent: function (event) {
                    me._setZoombarValue(event.getZoom());
                }
            };
        },

        _setLayerToolsEditModeImpl: function () {
            if (this._slider) {
                this._slider.slider(
                    'option',
                    'disabled',
                    this.inLayerToolsEditMode()
                );
            }
        },

        setZoomLevel: function (value) {
            this.getMapModule().setZoomLevel(value);
        },

        /**
         * @public @method changeToolStyle
         * Changes the tool style of the plugin
         *
         * @param {Object} styleId
         * @param {jQuery} div
         *
         */
        changeToolStyle: function (style, div) {
            // FIXME move under _setStyle or smthn...
            div = div || this.getElement();

            if (!div) {
                return;
            }

            this.renderButton(style, div);
        },
        renderButton: function (style, element) {
            let el = element;
            if (!element) {
                el = this.getElement();
            }
            if (!element) return;

            ReactDOM.render(
                <ZoomSlider
                    changeZoom={(value) => this.setZoomLevel(value)}
                    zoom={this.getMapModule().getMapZoom()}
                    maxZoom={this.getMapModule().getMaxZoomLevel()}
                    isMobile={this.inMobileMode}
                />,
                el[0]
            );
        },
        teardownUI: function () {
            this.removeFromPluginContainer(this.getElement());
            if (this._slider) {
                this._slider.remove();
                delete this._slider;
            }
        },
        /**
         * Handle plugin UI and change it when desktop / mobile mode
         * @method  @public createPluginUI
         * @param  {Boolean} mapInMobileMode is map in mobile mode
         * @param {Boolean} forced application has started and ui should be rendered with assets that are available
         */
        redrawUI: function (mapInMobileMode, forced) {
            if (!this.isVisible()) {
                // no point in drawing the ui if we are not visible
                return;
            }
            var me = this;
            this.teardownUI();

            this.inMobileMode = mapInMobileMode;

            me._element = me._createControlElement();
            me.refresh();
            this.addToPluginContainer(me._element);
        },
        /**
         * @method _stopPluginImpl BasicMapModulePlugin method override
         * @param {Oskari.Sandbox} sandbox
         */
        _stopPluginImpl: function (sandbox) {
            this.teardownUI();
        }
    }, {
        'extend': ['Oskari.mapping.mapmodule.plugin.BasicMapModulePlugin'],
        /**
         * @static @property {string[]} protocol array of superclasses
         */
        'protocol': [
            'Oskari.mapframework.module.Module',
            'Oskari.mapframework.ui.module.common.mapmodule.Plugin'
        ]
    });

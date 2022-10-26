/**
 * @class Oskari.mapframework.bundle.publisher.view.PanelMapLayers
 *
 * Represents a layer listing view for the publisher as an Oskari.userinterface.component.AccordionPanel
 * and control for the published map layer selection plugin. Has functionality to promote layers
 * to users and let the user select base layers for the published map.
 */
Oskari.clazz.define('Oskari.mapframework.bundle.publisher2.view.PanelMapLayers',

    /**
     * @method create called automatically on construction
     * @static
     * @param {Object} sandbox
     * @param {Object} mapmodule
     * @param {Object} localization
     *       publisher localization data
     * @param {Oskari.mapframework.bundle.publisher2.insatnce} instance the instance
     */
    function (sandbox, mapmodule, localization, instance) {
        var me = this;
        me.loc = localization;
        me.instance = instance;
        me.sandbox = sandbox;
        me.isDataVisible = false;
        me._plugin = null;

        me.templateHelp = jQuery('<div class="help icon-info"></div>');
        me.templateList = jQuery(
            '<ul class="selectedLayersList sortable" ' +
            'data-sortable=\'{' + 'itemCss: "li.layer.selected", ' + 'handleCss: "div.layer-title" ' + '}\'>' +
            '</ul>'
        );
        me.templateLayer = jQuery(
            '<li class="layer selected">' +
            '  <div class="layer-info">' +
            '    <div class="layer-tool-remove icon-close"></div>' +
            '    <div class="layer-title">' +
            '      <h4></h4>' +
            '    </div>' +
            '  </div>' +
            '  <div class="layer-tools volatile"></div>' +
            '</li>'
        );
        // footers are changed based on layer state
        var layerLoc = me.instance.getLocalization('layer');
        me.templateLayerFooterTools =
            jQuery(
                '<div class="left-tools">' +
                '  <div class="layer-visibility">' +
                '    <a href="JavaScript:void(0);">' + layerLoc.hide + '</a>' +
                '    &nbsp;' + '<span class="temphidden" ' + 'style="display: none;">' + layerLoc.hidden + '</span>' +
                '  </div>' +
                '  <div class="oskariui layer-opacity">' +
                '    <div class="layout-slider" id="layout-slider"></div> ' +
                '    <div class="opacity-slider" style="display:inline-block">' +
                '      <input type="text" name="opacity-slider" class="opacity-slider opacity" />%' +
                '    </div>' +
                '  </div>' +
                '  <br/>' +
                '  </div>' +
                '  <div class="right-tools">' +
                '    <div class="layer-rights"></div>' +
                '    <div class="object-data"></div>' +
                '    <div class="layer-description"></div>' +
                '</div>'
            );
        me.templateLayerFooterHidden = jQuery(
            '<p class="layer-msg">' +
            '  <a href="JavaScript:void(0);">' + layerLoc.show + '</a> ' + layerLoc.hidden +
            '</p>'
        );
        me.templateButtonsDiv = jQuery('<div class="buttons"></div>');

        me.config = {
            layers: {
                promote: [{
                    text: me.loc.layerselection.promote,
                    id: [24] // , 203
                }],
                preselect: ['base_35']
            }
        };

        me.showLayerSelection = false;
        me._sliders = {};
    }, {
        /**
         * @property {Object} eventHandlers
         * @static
         */
        eventHandlers: {
            /**
             * @method AfterMapLayerAddEvent
             * @param {Oskari.mapframework.event.common.AfterMapLayerAddEvent} event
             *
             * Updates the layerlist
             */
            AfterMapLayerAddEvent: function (event) {
                this.handleLayerSelectionChanged();
            },

            /**
             * @method AfterMapLayerRemoveEvent
             * @param {Oskari.mapframework.event.common.AfterMapLayerRemoveEvent} event
             *
             * Updates the layerlist
             */
            AfterMapLayerRemoveEvent: function (event) {
                this.handleLayerSelectionChanged();
            },
            /**
             * @method AfterRearrangeSelectedMapLayerEvent
             * @param {Oskari.mapframework.event.common.AfterRearrangeSelectedMapLayerEvent} event
             *
             * Updates the layerlist
             */
            AfterRearrangeSelectedMapLayerEvent: function (event) {
                if (event._creator !== this.getName() && event._fromPosition !== event._toPosition) {
                    this.handleLayerOrderChanged(event._movedMapLayer, event._fromPosition, event._toPosition);
                }
            },
            /**
             * @method MapLayerEvent
             * @param {Oskari.mapframework.event.common.MapLayerEvent} event
             *
             * Calls flyouts handleLayerSelectionChanged() and handleDrawLayerSelectionChanged() functions
             */
            'MapLayerEvent': function (event) {
                if (event.getOperation() === 'update') {
                    this.handleLayerSelectionChanged();
                }
            },

            /**
             * @method MapLayerVisibilityChangedEvent
             */
            MapLayerVisibilityChangedEvent: function (event) {
                this.handleLayerVisibilityChanged(
                    event.getMapLayer(),
                    event.isInScale(),
                    event.isGeometryMatch()
                );
            }
        },
        /**
         * @method init
         * Creates the Oskari.userinterface.component.AccordionPanel where the UI is rendered
         */
        init: function () {
            var me = this;
            for (var p in me.eventHandlers) {
                if (me.eventHandlers.hasOwnProperty(p)) {
                    me.sandbox.registerForEventByName(me, p);
                }
            }

            if (!me.panel) {
                me.panel = Oskari.clazz.create(
                    'Oskari.userinterface.component.AccordionPanel'
                );
                me.panel.setTitle(me.loc.layerselection.label);

                me._populateMapLayerPanel(true /* isInit */);
            }
        },
        /**
         * @method onEvent
         * @param {Oskari.mapframework.event.Event} event a Oskari event object
         * Event is handled forwarded to correct #eventHandlers if found or discarded if not.
         */
        onEvent: function (event) {
            var handler = this.eventHandlers[event.getName()];
            if (!handler) {
                return;
            }
            return handler.apply(this, [event]);
        },
        getName: function () {
            return 'Oskari.mapframework.bundle.publisher2.view.PanelMapLayers';
        },
        /**
         * Returns the UI panel and populates it with the data that we want to show the user.
         *
         * @method getPanel
         * @return {Oskari.userinterface.component.AccordionPanel}
         */
        getPanel: function () {
            // this._populateMapLayerPanel();
            return this.panel;
        },
        /**
         * Returns the state of the plugin.
         *
         * @method isEnabled
         * @return {Boolean} true if the plugin is visible on screen.
         */
        isEnabled: function () {
            return this.showLayerSelection;
        },

        /**
         * @method getValues
         * @return {Object}
         */
        getValues: function () {
            return null;
        },
        /**
         * Returns any errors found in validation (currently doesn't check anything) or an empty
         * array if valid. Error object format is defined in Oskari.userinterface.component.FormInput
         * validate() function.
         *
         * @method validate
         * @return {Object[]}
         */
        validate: function () {
            var errors = [];
            return errors;
        },

        /**
         * Returns the published map layer selection
         *
         * @method _getLayersList
         * @private
         * @return {Oskari.mapframework.domain.WmsLayer[]/Oskari.mapframework.domain.WfsLayer[]/Oskari.mapframework.domain.VectorLayer[]/Mixed}
         */
        _getLayersList: function () {
            return this.instance.sandbox.findAllSelectedMapLayers();
        },

        /**
         * Populates the map layers panel in publisher
         *
         * @method _populateMapLayerPanel
         * @private
         */
        _populateMapLayerPanel: function (isInit) {
            var me = this,
                sandbox = this.instance.getSandbox(),
                contentPanel = this.panel.getContainer();
            contentPanel.empty();
            me.container = contentPanel;

            if (isInit) {
                // layer tooltip
                var tooltipCont = this.templateHelp.clone();
                tooltipCont.attr('title', this.loc.layerselection.tooltip);
                this.panel.getHeader().append(tooltipCont);
            }
            const builder = Oskari.requestBuilder('RemoveMapLayerRequest');
            const removeLayerFn = (e) => {
                const layerId = jQuery(e.currentTarget).parents('.layer').attr('data-id');
                sandbox.request(me.instance.getName(), builder(layerId));
            };

            const listContainer = this.templateList.clone();
            this._getLayersList().forEach(layer => {
                var layerContainer = this.templateLayer.clone();
                layerContainer.attr('data-id', layer.getId());
                // setup id
                layerContainer.find('div.layer-title h4').append(Oskari.util.sanitize(layer.getName()));
                layerContainer.find('div.layer-title').append(Oskari.util.sanitize(layer.getDescription()));

                // remove layer from selected tool
                if (!layer.isSticky()) {
                    layerContainer.find('div.layer-tool-remove').addClass('icon-close');
                    layerContainer.find('div.layer-tool-remove').on('click', removeLayerFn);
                }
                // footer tools
                me._appendLayerFooter(layerContainer, layer);
                listContainer.prepend(layerContainer);
            });
            contentPanel.append(listContainer);
            listContainer.sortable({
                stop: function (event, ui) {
                    var item = ui.item;
                    me._layerOrderChanged(item);
                }
            });

            const buttonCont = me.templateButtonsDiv.clone();
            const addBtn = Oskari.clazz.create('Oskari.userinterface.component.Button');

            addBtn.setTitle(me.loc.buttons.add);
            addBtn.addClass('block');
            addBtn.insertTo(buttonCont);
            addBtn.setHandler(() => this._openLayerList());

            contentPanel.append(buttonCont);
        },

        /**
         * Clears previous layer listing and renders a new one to the view.
         *
         * @method handleLayerSelectionChanged
         */
        handleLayerSelectionChanged: function () {
            this._populateMapLayerPanel();
        },
        /**
         * @method _layerOrderChanged
         * @private
         * Notify Oskari that layer order should be changed
         * @param {Number} newIndex index where the moved layer is now
         */
        _layerOrderChanged: function (item) {
            var allNodes = jQuery(this.container).find(
                    '.selectedLayersList li'
                ),
                movedId = item.attr('data-id'),
                newIndex = -1;

            allNodes.each(function (index, el) {
                if (jQuery(this).attr('data-id') === movedId) {
                    newIndex = index;
                    return false;
                }
                return true;
            });
            if (newIndex > -1) {
                // the layer order is reversed in presentation
                // the lowest layer has the highest index
                newIndex = (allNodes.length - 1) - newIndex;
                var sandbox = this.instance.getSandbox(),
                    reqName = 'RearrangeSelectedMapLayerRequest',
                    builder = Oskari.requestBuilder(reqName),
                    request = builder(movedId, newIndex);
                sandbox.request(this.instance.getName(), request);
            }
        },
        /**
         * @method _layerOpacityChanged
         * @private
         * @param
         * {Oskari.mapframework.domain.WmsLayer/Oskari.mapframework.domain.WfsLayer/Oskari.mapframework.domain.VectorLayer/Object}
         * layer that had its opacity changed
         * @param {Number} newOpacity layer that had its opacity changed
         *
         * Handles slider/input field for opacity on this flyout/internally
         */
        _layerOpacityChanged: function (layer, newOpacity) {
            var sandbox = this.instance.getSandbox(),
                reqName = 'ChangeMapLayerOpacityRequest',
                requestBuilder = Oskari.requestBuilder(reqName),
                request = requestBuilder(layer.getId(), newOpacity);

            sandbox.request(this.instance.getName(), request);

            var lyrSel = 'li.layer.selected[data-id=' + layer.getId() + ']',
                layerDiv = jQuery(this.container).find(lyrSel),
                opa = layerDiv.find('div.layer-opacity input.opacity');
            opa.attr('value', layer.getOpacity());
        },
        handleLayerOrderChanged: function (layer, fromPosition, toPosition) {
            if (!layer) {
                return;
            }
            if (isNaN(fromPosition)) {
                return;
            }
            if (isNaN(toPosition)) {
                return;
            }

            if (fromPosition === toPosition) {
                // Layer wasn't actually moved, ignore
                return;
            }

            // Layer order is inverted in the DOM.
            // Also note that from- and toPosition are 0-based, where nth-child
            // based, so we just subtract position from layer count
            var me = this,
                layerContainer = jQuery(me.container).find('> ul'),
                layerCount = layerContainer.find('> li').length,
                fromIndex = layerCount - fromPosition, // Order is inverted
                toIndex = layerCount - toPosition,
                el = layerContainer.find(
                    '> li:nth-child(' + fromIndex + ')'
                ).detach();

            if (layerCount === 0) {
                // No layers to move, ignore
                return;
            }

            if (toIndex > layerCount) {
                // invalid toIndex, ignore
                return;
            }

            if (toIndex === 1) {
                // First element, just add to the beginning
                layerContainer.prepend(el);
            } else if (toIndex === layerCount) {
                // Last element, just add to the end
                layerContainer.append(el);
            } else {
                // Somewhere in the middle, add before index
                // This would fail on toIndex === layerCount as we've removed one element,
                // but that case is handled above
                layerContainer.find(
                    '> li:nth-child(' + toIndex + ')'
                ).before(el);
            }
        },
        /**
         * @method handleLayerVisibilityChanged
         * Changes the container representing the layer by f.ex
         * "dimming" it and changing the footer to match current
         * layer status
         * @param
         * {Oskari.mapframework.domain.WmsLayer/Oskari.mapframework.domain.WfsLayer/Oskari.mapframework.domain.VectorLayer/Object}
         * layer to modify
         * @param {Boolean} isInScale true if map is in layers scale range
         * @param {Boolean} isGeometryMatch true if layers geometry is in map
         * viewport
         */
        handleLayerVisibilityChanged: function (layer, isInScale, isGeometryMatch) {
            var lyrSel = 'li.layer.selected[data-id=' + layer.getId() + ']',
                layerDiv = jQuery(this.container).find(lyrSel),
                footer = layerDiv.find('div.layer-tools'); // teardown previous footer & layer state classes

            footer.empty();

            layerDiv.removeClass('hidden-layer');

            this._sliders[layer.getId()] = null;

            this._appendLayerFooter(layerDiv, layer);
        },
        /**
         * @method _createLayerFooter
         * @private
         * @param
         * {Oskari.mapframework.domain.WmsLayer/Oskari.mapframework.domain.WfsLayer/Oskari.mapframework.domain.VectorLayer/Object}
         * layer
         * @return {jQuery} reference to the created footer
         *
         * Creates a footer for the given layer with the usual tools (opacity etc)
         */
        _createLayerFooter: function (layer) {
            var me = this,
                sandbox = me.instance.getSandbox(),
                tools = this.templateLayerFooterTools.clone(), // layer footer
                visibilityRequestBuilder = Oskari.requestBuilder(
                    'MapModulePlugin.MapLayerVisibilityRequest'
                );

            tools.find('div.layer-visibility a').on('click', function () {
                // send request to hide map layer
                var request = visibilityRequestBuilder(layer.getId(), false);
                sandbox.request(me.instance.getName(), request);
                return false;
            });

            return tools;
        },
        /**
         * @method _createLayerFooterHidden
         * @private
         * @param
         * {Oskari.mapframework.domain.WmsLayer/Oskari.mapframework.domain.WfsLayer/Oskari.mapframework.domain.VectorLayer/Object}
         * layer
         * @return {jQuery} reference to the created footer
         *
         * Creates footer for the given invisible layer
         */
        _createLayerFooterHidden: function (layer) {
            var me = this,
                sandbox = me.instance.getSandbox(),
                msg = this.templateLayerFooterHidden.clone(),
                visibilityRequestBuilder = Oskari.requestBuilder(
                    'MapModulePlugin.MapLayerVisibilityRequest'
                );

            msg.addClass('layer-msg-for-hidden');
            msg.find('a').on('click', function () {
                // send request to show map layer
                var request = visibilityRequestBuilder(layer.getId(), true);
                sandbox.request(me.instance.getName(), request);
                return false;
            });
            return msg;
        },

        /**
         * @method _appendLayerFooter
         * @private
         * @param {Object} container div
         * @param
         * {Oskari.mapframework.domain.WmsLayer/Oskari.mapframework.domain.WfsLayer/Oskari.mapframework.domain.VectorLayer/Object}
         * layer
         * @param {boolean} isChecked states if the layer is checked as possible base layer
         *
         * Appends layer footer to layer in publisher's manipulation panel
         */
        _appendLayerFooter: function (layerDiv, layer) {
            var toolsDiv = layerDiv.find('div.layer-tools');

            /* fix: we need this at anytime for slider to work */
            var footer = this._createLayerFooter(layer);

            if (!layer.isVisible()) {
                toolsDiv.addClass('hidden-layer');
                footer.find('.layer-visibility').css('display', 'none');
                jQuery(jQuery(footer).get(0)).prepend(
                    this._createLayerFooterHidden(layer)
                );
            } else {
                footer.css('display', '');
            }
            // isInScale & isGeometryMatch etc. are found in layerselection
            // but there is no need to add those yet - hopefully never

            toolsDiv.append(footer);

            this._addSlider(layer, layerDiv);
            var opa = layerDiv.find('div.layer-opacity input.opacity');
            opa.attr('value', layer.getOpacity());
        },

        /**
         * @method _addSlider
         * @private
         * @param
         * {Oskari.mapframework.domain.WmsLayer/Oskari.mapframework.domain.WfsLayer/Oskari.mapframework.domain.VectorLayer/Object}
         * layer
         * @param {Object} container div
         *
         * Adds slider to layer's footer to change layer opacity
         */
        _addSlider: function (layer, layerDiv) {
            var me = this,
                lyrId = layer.getId(),
                opa = layer.getOpacity(),
                sliderEl = layerDiv.find('.layout-slider'),
                slider = sliderEl.slider({
                    min: 0,
                    max: 100,
                    value: opa,
                    slide: function (event, ui) {
                        me._layerOpacityChanged(layer, ui.value);
                    },
                    stop: function (event, ui) {
                        me._layerOpacityChanged(layer, ui.value);
                    }
                });

            me._sliders[lyrId] = slider;

            return slider;
        },
        _openLayerList: function () {
            this.instance.getSandbox().postRequestByName(
                'ShowFilteredLayerListRequest',
                ['publishable', true]
            );
        }

    }
);

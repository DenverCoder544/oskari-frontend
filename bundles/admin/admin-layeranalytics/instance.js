import { Messaging } from 'oskari-ui/util';
import { Message } from 'oskari-ui';
import React from 'react';
import { NavigationAdapter } from 'oskari-ui/util/NavigationAdapter';
import { showFlyout } from 'oskari-ui/components/window';
import { styled } from 'styled-components';
import { LayerAnalyticsView } from './view/LayerAnalyticsView';

const FLYOUT_ID = 'AdminLayerAnalytics';
const FlyoutPadding = styled('div')`
    margin: 0;
    padding: 1.5em 1.5em 1.5em 1.75em;
`;

const getMessage = (key, args) => <Message messageKey={key} messageArgs={args} bundleKey='admin-layeranalytics' />;

/**
 * @class Oskari.framework.bundle.admin-layeranalytics.AdminLayerAnalyticsBundleInstance
 *
 * See Oskari.framework.bundle.admin-layeranalytics.AdminLayerAnalyticsBundleInstance for bundle definition.
 */
Oskari.clazz.define('Oskari.framework.bundle.admin-layeranalytics.AdminLayerAnalyticsBundleInstance',

    /**
    * @method create called automatically on construction
    * @static
    */
    function () {
        this.localization = null;
        this.plugins = {};
        this.sandbox = null;
        this.isLoading = true;
        this.analyticsListData = [];
        this.selectedLayerData = {};
        this.view = new LayerAnalyticsView(this, () => this.updateUI());
        this.mapLayerService = Oskari.getSandbox().getService('Oskari.mapframework.service.MapLayerService');
        this.mainNavigationControls = null;
        this.navigation = new NavigationAdapter(this, {
            createMenuItem: (navigation) => this.createMenuItem(navigation),
            onStop: () => this.closeMainNavigationFlyout()
        });
    }, {
        __name: 'admin-layeranalytics',
        /**
         * @method setSandbox
         * @param {Oskari.Sandbox} sandbox
         * Sets the sandbox reference to this component
         */
        setSandbox (sandbox) {
            this.sandbox = sandbox;
        },

        /**
         * @method getSandbox
         * @return {Oskari.Sandbox}
         */
        getSandbox () {
            return this.sandbox;
        },
        eventHandlers: {
            'userinterface.ExtensionUpdatedEvent': function (event) {
                // Not handle other extension update events
                if (this.navigation.service || event.getExtension().getName() !== this.getName()) {
                    return;
                }

                if (event.getViewState() !== 'close') {
                    this.produceAnalyticsListData();
                }
            }
        },
        /**
         * @method getLocalization
         * Returns JSON presentation of bundles localization data for
         * current language.
         * If key-parameter is not given, returns the whole localization
         * data.
         *
         * @param {String} key (optional) if given, returns the value for
         *         key
         * @return {String/Object} returns single localization string or
         *      JSON object for complete data depending on localization
         *      structure and if parameter key is given
         */
        getLocalization (key) {
            if (!this.localization) {
                this.localization = Oskari.getLocalization(this.getName());
            }
            if (key) {
                return this.localization[key];
            }
            return this.localization;
        },
        /**
         * @method start
         * implements BundleInstance protocol start method
         */
        start () {
            const me = this;

            const sandboxName = 'sandbox';
            const sandbox = Oskari.getSandbox(sandboxName);

            this.sandbox = sandbox;
            this.sandbox.register(me);

            // Let's extend UI
            this.navigation.start();

            Object.keys(this.eventHandlers).forEach(eventName => sandbox.registerForEventByName(this, eventName));

            if (!this.navigation.service) {
                me.createUi();
            }
        },
        /**
         * @method stop
         * Mainnavigation: removes the menu item. Divmanazer branch is unchanged (no cleanup).
         */
        stop () {
            if (this.navigation.service) {
                return this.navigation.stop();
            }
        },
        createMenuItem ({ MenuItem, MenuItemActivationResult }) {
            const menuItem = new MenuItem({
                bundleId: this.mediator.bundleId,
                sortOrder: 80,
                name: this.getLocalization('title'),
                tooltip: this.getLocalization('desc'),
                setActive: (isActive) => {
                    if (isActive) {
                        const opened = this.showMainNavigationFlyout(() => menuItem.onClose?.(menuItem.getMenuItemId()));
                        if (!opened) {
                            return MenuItemActivationResult.FAILED;
                        }
                        this.produceAnalyticsListData();
                        return MenuItemActivationResult.OK;
                    }
                    this.closeMainNavigationFlyout();
                    return MenuItemActivationResult.OK;
                }
            });
            return menuItem;
        },
        showMainNavigationFlyout (onClose) {
            if (this.mainNavigationControls) {
                return true;
            }
            const controls = showFlyout(this.getLocalization('flyout').title, this.getPaddedFlyoutContent(), () => {
                if (this.mainNavigationControls !== controls) {
                    return;
                }
                this.mainNavigationControls = null;
                onClose();
            }, { id: FLYOUT_ID });
            if (!controls) {
                return false;
            }
            this.mainNavigationControls = controls;
            return true;
        },
        closeMainNavigationFlyout () {
            const controls = this.mainNavigationControls;
            this.mainNavigationControls = null;
            controls?.close();
        },
        getPaddedFlyoutContent () {
            return (
                <FlyoutPadding>
                    {this.view.getContent()}
                </FlyoutPadding>
            );
        },
        updateMainNavigationFlyout () {
            this.mainNavigationControls?.update(this.getLocalization('flyout').title, this.getPaddedFlyoutContent());
        },
        /**
         * Updates the UI in both divmanazer flyout and mainnavigation flyout
         */
        updateUI () {
            if (this.navigation.service) {
                this.updateMainNavigationFlyout();
                return;
            }
            this.plugins['Oskari.userinterface.Flyout'].updateUI();
        },
        getSelectedLayerId () {
            return this.view.getSelectedLayerId();
        },
        /**
         * @memberof BasicBundle
         * @param {Oskari.mapframework.event.Event} event A Oskari event object.
         */
        onEvent (event) {
            const handler = this.eventHandlers[event.getName()];
            if (!handler) {
                return;
            }
            return handler.call(this, event);
        },
        /**
         * @method init
         * implements Module protocol init method - does nothing atm
         */
        init () {
            return null;
        },
        /**
         * @method update
         * implements BundleInstance protocol update method - does nothing atm
         */
        update () {

        },
        getName () {
            return this.__name;
        },
        /**
         * @method startExtension
         * implements Oskari.userinterface.Extension protocol
         * startExtension method
         * Creates a flyout and a tile:
         * Oskari.mapframework.bundle.publisher.Flyout
         * Oskari.mapframework.bundle.publisher.Tile
         */
        startExtension () {
            this.plugins['Oskari.userinterface.Flyout'] = Oskari.clazz.create('Oskari.framework.bundle.admin-layeranalytics.Flyout', this);
            this.plugins['Oskari.userinterface.Tile'] = Oskari.clazz.create('Oskari.framework.bundle.admin-layeranalytics.Tile', this);
        },

        /**
         * @method stopExtension
         * implements Oskari.userinterface.Extension protocol
         * stopExtension method
         * Clears references to flyout and tile
         */
        stopExtension () {
            this.plugins['Oskari.userinterface.Tile'] = null;
        },

        /**
         * @method getPlugins
         * implements Oskari.userinterface.Extension protocol getPlugins
         * method
         * @return {Object} references to flyout and tile
         */
        getPlugins () {
            return this.plugins;
        },

        createUi () {
            this.plugins['Oskari.userinterface.Tile'].refresh();
            this.plugins['Oskari.userinterface.Flyout'].createContent();
        },

        /**
         * @method fetchLayerAnalytics
         * Fetches data for layer analytics
         * @param {*} layerId null or layerId as a number. If null only list view data will be fetched
         * @param {*} callback
         * @returns
         */
        fetchLayerAnalytics (layerId, callback) {
            this.updateLoadingState(true);
            const route = layerId ? Oskari.urls.getRoute('LayerStatus', { id: layerId }) : Oskari.urls.getRoute('LayerStatus');

            return fetch(route, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            }).then(response => {
                if (!response.ok) {
                    Messaging.error(getMessage('messages.errorFetchingLayerAnalytics'));
                }
                return response.json();
            }).then(json => {
                if (callback) {
                    callback(json);
                }
            });
        },

        removeAnalyticsData (layerId, dataId) {
            this.updateLoadingState(true);
            this.updateUI(); // show spinner
            const route = dataId ? Oskari.urls.getRoute('LayerStatus', { id: layerId, dataId: dataId }) : Oskari.urls.getRoute('LayerStatus', { id: layerId });

            fetch(route, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json'
                }
            }).then(response => {
                if (!response.ok) {
                    Messaging.error(getMessage('messages.errorDeletingLayerAnalytics'));
                }

                this.updateLoadingState();
                if (!dataId) {
                    // removed whole layer data
                    this.analyticsListData = this.analyticsListData.filter(item => item.id !== layerId);
                    this.updateUI();
                } else {
                    // removed single usage data
                    this.produceAnalyticsDetailsData(this.getSelectedLayerId());
                }
            });
        },

        /**
         * @method produceAnalyticsListData
         * Produce data for analytics list view
         */
        produceAnalyticsListData () {
            this.fetchLayerAnalytics(null, (result) => {
                this.analyticsListData = [];
                for (const item in result) {
                    const itemLayer = this.mapLayerService.findMapLayer(item);
                    const title = itemLayer !== null ? itemLayer.getName() : item;
                    const dataProducer = itemLayer !== null ? itemLayer.getOrganizationName() : '';
                    let layerType = itemLayer !== null ? itemLayer.getLayerType() : '';
                    if (layerType && itemLayer.hasTimeseries()) {
                        layerType += '-t';
                    }
                    const totalDisplays = result[item].success + result[item].errors;
                    const failurePercentage = Math.round(result[item].errors / totalDisplays * 100);

                    this.analyticsListData.push({
                        ...result[item],
                        total: totalDisplays,
                        failurePercentage: failurePercentage,
                        id: item,
                        title: title,
                        dataProducer,
                        layerType
                    });
                }
                this.updateLoadingState();
                this.updateUI();
            });
        },

        /**
         * @method produceAnalyticsDetailsData
         * Produce analytics details view data by fetching data with id as parameter
         */
        produceAnalyticsDetailsData (id) {
            this.updateLoadingState(true);

            this.fetchLayerAnalytics(id, (itemData) => {
                const itemLayer = this.mapLayerService.findMapLayer(id);
                const layerOrganization = itemLayer !== 'undefined' && itemLayer !== null ? itemLayer.getOrganizationName() : null;
                const title = typeof itemLayer !== 'undefined' && itemLayer !== null ? itemLayer.getName() : id;
                const totalDisplays = itemData.success + itemData.errors;
                const successPercentage = Math.round(itemData.success / totalDisplays * 100);

                this.selectedLayerData = {
                    ...itemData,
                    id: id,
                    successPercentage: successPercentage,
                    title: title,
                    layerOrganization: layerOrganization
                };
                this.updateLoadingState();
                this.updateUI();
            });
        },

        getAnalyticsListData () {
            return this.analyticsListData;
        },

        getAnalyticsDetailsData () {
            return this.selectedLayerData;
        },

        /**
         * @method updateLoadingState
         * Updates loading state of bundle for progress spinner usage
         */
        updateLoadingState (loadingState = false) {
            this.isLoading = loadingState;
        },

        getLoadingState () {
            return this.isLoading;
        }
    }, {
        protocol: [
            'Oskari.bundle.BundleInstance',
            'Oskari.mapframework.module.Module',
            'Oskari.userinterface.Extension'
        ]
    }
);

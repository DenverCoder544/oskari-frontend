import React from 'react';
import { LocaleProvider, ThemeProvider } from 'oskari-ui/util';
import { LayerAnalyticsList } from '../LayerAnalyticsList';
import { LayerAnalyticsDetails } from '../LayerAnalyticsDetails';

const BUNDLE_KEY = 'admin-layeranalytics';

export class LayerAnalyticsView {
    constructor (instance, consumer) {
        this.instance = instance;
        this.consumer = consumer;
        this.selectedLayerId = null;
    }

    getSelectedLayerId () {
        return this.selectedLayerId;
    }

    openLayerEditor (id) {
        if (typeof id !== 'undefined') {
            Oskari.getSandbox().postRequestByName('ShowLayerEditorRequest', [id]);
        }
    }

    toggleLayerDetails (selectedId) {
        if (typeof selectedId !== 'undefined') {
            this.selectedLayerId = selectedId;
            this.instance.produceAnalyticsDetailsData(selectedId);
        } else {
            this.selectedLayerId = null;
        }
        this.consumer();
    }

    getContent () {
        return (
            <LocaleProvider value={{ bundleKey: BUNDLE_KEY }}>
                { !this.selectedLayerId
                    ? <ThemeProvider>
                        <LayerAnalyticsList
                            analyticsData={[...this.instance.getAnalyticsListData()]}
                            isLoading={ this.instance.getLoadingState() }
                            layerEditorCallback={ this.openLayerEditor }
                            removeAnalyticsCallback={ (id) => this.instance.removeAnalyticsData(id) }
                            layerDetailsCallback={ (id) => this.toggleLayerDetails(id) }
                        />
                    </ThemeProvider>
                    : <LayerAnalyticsDetails
                        layerData={ this.instance.getAnalyticsDetailsData() }
                        isLoading={ this.instance.getLoadingState() }
                        closeDetailsCallback={ () => this.toggleLayerDetails() }
                        removeAnalyticsCallback={ (id, dataId) => this.instance.removeAnalyticsData(id, dataId) }
                    />
                }
            </LocaleProvider>
        );
    }
}

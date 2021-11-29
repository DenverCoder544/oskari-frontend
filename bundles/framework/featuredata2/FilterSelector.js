
import { WFS_ID_KEY, WFS_FTR_ID_KEY } from '../../mapping/mapmodule/domain/constants';
import { getFilterAlternativesAsArray, filterFeaturesByAttribute } from '../../mapping/mapmodule/util/vectorfeatures/filter';

const getFeatureId = (feature) => feature.id || feature.properties[WFS_ID_KEY] || feature.properties[WFS_FTR_ID_KEY];

export class FilterSelector {
    constructor(featureQueryFn, selectionService) {
        this.featureQueryFn = featureQueryFn;
        this.selectionService = selectionService;
    }
    selectWithProperties (filters = [], layerId) {
        if (!this.selectionService) {
            Oskari.log('FeatureData').error('VectorFeatureSelectionService is not available in appsetup');
            return;
        }
        if (!filters || !filters.length === 0 || !layerId) {
            Oskari.log('FeatureData').info('Requested filtering without filters or layer id');
            return;
        }
        const result = this.featureQueryFn(null, { layers: [layerId] });
        const { error, ...layerData } = result;
        if (error) {
            Oskari.log('FeatureData').warn('Error querying features:', error);
            return;
        }

        const records = layerData[layerId].features || [];
        if (!records.length) {
            Oskari.log('FeatureData').debug('No features on layer:', layerId);
            return;
        }
        const filteredIds = new Set();
        const alternatives = getFilterAlternativesAsArray(filters);
        alternatives.forEach(attributeFilters => {
            let filteredList = records;
            attributeFilters.forEach(filter => {
                filteredList = filterFeaturesByAttribute(filteredList, filter);
            });
            filteredList
                .map(getFeatureId)
                .filter(id => !!id)
                .forEach(id => filteredIds.add(id));
        });
        this.selectionService.setSelectedFeatureIds(layerId, [...filteredIds]);

    }

    selectWithGeometry (filterFeature = {}, layers = []) {
        if (!this.selectionService) {
            Oskari.log('FeatureData').error('VectorFeatureSelectionService is not available in appsetup');
            return;
        }
        const result = this.featureQueryFn({ geometry: filterFeature.geometry }, { layers });
        const { error, ...layerData } = result;
        if (error) {
            Oskari.log('FeatureData').warn('Error querying features:', error);
            return;
        }

        Object.keys(layerData).forEach(layerId => {
            const layerFeatures = layerData[layerId].features || [];
            const selectedFeatureIds = layerFeatures.map(getFeatureId);
            this.selectionService.setSelectedFeatureIds(layerId, selectedFeatureIds);
        });
    }

    getLayersToQuery(selectedLayers = [], fromAllLayers = false) {
        const selectedVectorLayers = selectedLayers
            .filter(l => l.hasFeatureData())
            .map(l => l.getId());
        if (!selectedVectorLayers.length) {
            Oskari.log('FeatureData').debug('No vector layers to select from');
            return;
        }

        if (fromAllLayers) {
            return selectedVectorLayers;
        }
        return [selectedVectorLayers[0]];
    }
};
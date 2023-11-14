import { StateHandler, controllerMixin, Messaging } from 'oskari-ui/util';
import { showTableFlyout } from '../view/Table/TableFlyout';

class TableController extends StateHandler {
    constructor (stateHandler, service, sandbox) {
        super();
        this.stateHandler = stateHandler;
        this.service = service;
        this.sandbox = sandbox;
        this.setState({
            ...this.stateHandler.getState(),
            selectedRegionset: null,
            indicatorData: [],
            regionsetOptions: [],
            regions: [],
            flyout: null,
            loading: false
        });
        this.loc = Oskari.getMsg.bind(null, 'StatsGrid');
        this.addStateListener(() => this.updateFlyout());
        this.eventHandlers = this.createEventHandlers();
    };

    getName () {
        return 'TableHandler';
    }

    toggleFlyout (show, extraOnClose) {
        if (show) {
            if (!this.state.flyout) {
                this.showTableFlyout(extraOnClose);
            }
        } else {
            this.closeTableFlyout();
        }
    }

    showTableFlyout (extraOnClose) {
        this.fetchTableRegionsets();
        const currentRegionset = this.service.getRegionsets(this.service.getStateService().getRegionset());
        this.updateState({
            flyout: showTableFlyout(this.getState(), this.getController(), () => {
                this.closeTableFlyout();
                if (extraOnClose) extraOnClose();
            }),
            selectedRegionset: currentRegionset
        });
        this.fetchIndicatorData();
    }

    closeTableFlyout () {
        if (this.state.flyout) {
            this.state.flyout.close();
            this.updateState({
                selectedRegionset: null,
                flyout: null
            });
        }
    }

    updateFlyout () {
        if (this.state.flyout) {
            this.state.flyout.update(this.getState());
        }
    }

    setSelectedRegionset (value) {
        this.service.getStateService().setRegionset(value);
        this.updateState({
            selectedRegionset: this.service.getRegionsets(value)
        });
        this.fetchIndicatorData();
    }

    fetchTableRegionsets () {
        this.updateState({
            regionsetOptions: this.service.getRegionsets(this.service.getSelectedIndicatorsRegions())
        });
    }

    fetchIndicatorData () {
        if (!this.state.indicators || this.state.indicators.length < 1) return;
        this.updateState({
            loading: true
        });
        const updateIndicatorData = (regions) => {
            let data = {};
            regions.forEach(reg => {
                data[reg.id] = {};
            });
            const promises = this.state.indicators.map(ind => {
                return new Promise((resolve, reject) => {
                    this.service.getIndicatorData(ind.datasource, ind.indicator, ind.selections, ind.series, this.state.selectedRegionset?.id, (err, indicatorData) => {
                        if (err) {
                            Messaging.error(this.loc('errors.regionsDataError'));
                            this.updateState({
                                loading: false,
                                indicatorData: [],
                                regions: []
                            });
                            return;
                        }
                        for (const key in indicatorData) {
                            const region = data[key];
                            if (!region) {
                                continue;
                            }
                            region[ind.hash] = indicatorData[key];
                            data[key] = {
                                ...data[key],
                                ...region
                            };
                        }
                        resolve();
                    });
                });
            });
            Promise.all(promises).then(() => {
                this.updateState({
                    loading: false,
                    indicatorData: regions.map(region => ({
                        key: region.id,
                        regionName: region.name,
                        data: data[region.id]
                    }))
                });
            });
        };
        this.service.getRegions(this.state.selectedRegionset?.id, (err, regions) => {
            if (err) {
                // notify error!!
                Messaging.error(this.loc('errors.regionsDataError'));
                this.updateState({
                    loading: false,
                    indicatorData: [],
                    regions: []
                });
                return;
            }

            if (regions.length === 0) {
                Messaging.error(this.loc('errors.regionsDataIsEmpty'));
            }

            updateIndicatorData(regions);
            this.updateState({
                regions: regions
            });
        });
    }

    removeIndicator (indicator) {
        this.stateHandler.getController().removeIndicator(indicator);
    }

    setActiveIndicator (hash) {
        this.stateHandler.getController().setActiveIndicator(hash);
    }

    createEventHandlers () {
        const handlers = {
            'StatsGrid.ParameterChangedEvent': (event) => {
                if (this.state.flyout) {
                    this.fetchIndicatorData();
                }
            },
            'StatsGrid.ClassificationChangedEvent': (event) => {
                if (event.getChanged().hasOwnProperty('fractionDigits')) {
                    if (this.state.flyout) {
                        this.fetchIndicatorData();
                    }
                }
            }
        };
        Object.getOwnPropertyNames(handlers).forEach(p => this.sandbox.registerForEventByName(this, p));
        return handlers;
    }

    onEvent (e) {
        var handler = this.eventHandlers[e.getName()];
        if (!handler) {
            return;
        }

        return handler.apply(this, [e]);
    }
}

const wrapped = controllerMixin(TableController, [
    'toggleFlyout',
    'closeTableFlyout',
    'setSelectedRegionset',
    'removeIndicator',
    'setActiveIndicator'
]);

export { wrapped as TableHandler };

import React from 'react';
import { styled } from 'styled-components';
import { NavigationAdapter } from 'oskari-ui/util/NavigationAdapter';
import { showFlyout } from 'oskari-ui/components/window';
import { GenericAdminFlyout } from './Flyout.js';
import { BasicBundleInstance } from 'oskari-ui/BasicBundleInstance';
import { ADD_TAB_NAME } from './request/AddTabRequest.js';
import { AdminView } from './view/AdminView.js';
const BUNDLE_NAME = 'GenericAdmin';
const FLYOUT_ID = 'GenericAdmin';
const FlyoutPadding = styled('div')`
    margin: 0;
    padding: 1.5em 1.5em 1.5em 1.75em;
`;

export class GenericAdmin extends BasicBundleInstance {
    constructor () {
        super(BUNDLE_NAME);
        this.plugins = {};
        this.mainNavigationControls = null;
        this.adminView = null;
        this.navigation = new NavigationAdapter(this, {
            createMenuItem: (navigation) => this.createMenuItem(navigation),
            onStart: () => {
                this.adminView = new AdminView();
            },
            onStop: () => {
                this.closeMainNavigationFlyout();
                this.adminView = null;
            }
        });
    }

    start (sandbox) {
        super.start(sandbox);
        this.on('userinterface.ExtensionUpdatedEvent', (event) => {
            if (this.navigation.service) {
                return;
            }
            if (event.getExtension().getName() !== this.getName()) {
                return;
            }
            if (event.getViewState() !== 'close') {
                this.getFlyout().createUI();
            }
        });
        this.navigation.start();
        this.addRequestHandler(ADD_TAB_NAME, (req) => this.addTab({
            title: req.getTitle(),
            content: req.getContent(),
            priority: req.getPriority(),
            id: req.getId()
        }));
    }

    // Called by divmanazer when AddExtensionRequest is processed
    startExtension () {
        const tileConfig = Oskari.getMsg(this.getName(), 'tile', null, {});
        this.plugins['Oskari.userinterface.Flyout'] = new GenericAdminFlyout(this);
        this.plugins['Oskari.userinterface.Tile'] = Oskari.clazz.create(
            'Oskari.userinterface.extension.DefaultTile',
            this,
            tileConfig
        );
    }

    createMenuItem ({ MenuItem, MenuItemActivationResult }) {
        const menuItem = new MenuItem({
            bundleId: this.mediator.bundleId,
            sortOrder: 90,
            name: this.getTitle(),
            tooltip: this.getDescription(),
            setActive: (isActive) => {
                if (isActive) {
                    const opened = this.showMainNavigationFlyout(() => menuItem.onClose?.(menuItem.getMenuItemId()));
                    return opened ? MenuItemActivationResult.OK : MenuItemActivationResult.FAILED;
                }
                this.closeMainNavigationFlyout();
                return MenuItemActivationResult.OK;
            }
        });
        return menuItem;
    }

    showMainNavigationFlyout (onClose) {
        if (this.mainNavigationControls) {
            return true;
        }
        const controls = showFlyout(this.getTitle(), this.getPaddedFlyoutContent(), () => {
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
    }

    closeMainNavigationFlyout () {
        const controls = this.mainNavigationControls;
        this.mainNavigationControls = null;
        controls?.close();
    }

    getPaddedFlyoutContent () {
        return (
            <FlyoutPadding>
                {this.adminView.getContent()}
            </FlyoutPadding>
        );
    }

    updateMainNavigationFlyout () {
        this.mainNavigationControls?.update(this.getTitle(), this.getPaddedFlyoutContent());
    }

    addTab (item) {
        if (this.navigation.service) {
            this.adminView.addTab(item);
            this.updateMainNavigationFlyout();
            return;
        }
        this.getFlyout().addTab(item);
    }

    getPlugins () {
        return this.plugins;
    }

    getFlyout () {
        return this.plugins['Oskari.userinterface.Flyout'];
    }

    getTitle () {
        return Oskari.getMsg(this.getName(), 'title');
    }

    getDescription () {
        return Oskari.getMsg(this.getName(), 'desc');
    }

    stop () {
        const result = this.navigation.stop();
        if (this.navigation.service) {
            return result;
        }
        super.stop();
    }
}

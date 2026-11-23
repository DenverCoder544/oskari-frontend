import React from 'react';
import { Tabs } from 'oskari-ui';
import { ThemeProvider, LocaleProvider } from 'oskari-ui/util';
import { DefaultViewsContent } from '../DefaultViews.js';

const BUNDLE_KEY = 'GenericAdmin';

export class AdminView {
    constructor () {
        this.dynamicTabs = [];
    }

    addTab (item) {
        this.dynamicTabs.push(item);
    }

    getContent () {
        const items = [
            {
                key: 'defaultviews',
                label: Oskari.getMsg(BUNDLE_KEY, 'flyout.defaultviews.title'),
                children: <DefaultViewsContent />
            },
            ...this.dynamicTabs.map((tab) => ({
                key: tab.id,
                label: tab.title,
                children: tab.content
            }))
        ];
        return (
            <LocaleProvider value={{ bundleKey: BUNDLE_KEY }}>
                <ThemeProvider>
                    <Tabs items={items} />
                </ThemeProvider>
            </LocaleProvider>
        );
    }
}

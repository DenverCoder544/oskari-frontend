import { getReactRoot } from 'oskari-ui/components/window';

Oskari.clazz.define('Oskari.framework.bundle.admin-layeranalytics.Flyout',

    function (instance) {
        this.instance = instance;
        this.container = null;
        this.flyout = null;
    }, {
        __name: 'Oskari.framework.bundle.admin-layeranalytics.Flyout',
        getName () {
            return this.__name;
        },
        getTitle () {
            return this.instance.getLocalization('flyout').title;
        },
        setEl (el, flyout, width, height) {
            this.container = el[0];
            this.flyout = flyout;
            this.container.classList.add('admin-layeranalytics');
            this.flyout.addClass('admin-layeranalytics');
        },
        /**
         * Renders content for flyout UI
         * @method createContent
         */
        createContent () {
            const root = this.container;
            if (!root) {
                return;
            }

            this.updateUI();
        },
        updateUI () {
            getReactRoot(this.container).render(this.instance.view.getContent());
        },
        startPlugin () {}
    }
);

import { getReactRoot } from 'oskari-ui/components/window';
import { AdminView } from './view/AdminView.js';

const BUNDLE_KEY = 'GenericAdmin';

export class GenericAdminFlyout {
    constructor (instance) {
        this.instance = instance;
        this.container = null;
        this.view = new AdminView();
    }

    setEl (el, flyout) {
        this.container = el[0];
        this.container.classList.add('admin');
        flyout[0].classList.add('admin');
    }

    getTitle () {
        return Oskari.getMsg(BUNDLE_KEY, 'flyout.title');
    }

    startPlugin () {}

    createUI () {
        this.render();
    }

    addTab (item) {
        this.view.addTab(item);
        if (this.container) {
            this.render();
        }
    }

    render () {
        getReactRoot(this.container).render(this.view.getContent());
    }
}

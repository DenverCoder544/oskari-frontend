
Oskari.clazz.define('Oskari.statistics.statsgrid.Tile',

/**
 * @method create called automatically on construction
 * @static
 * @param
 * {Oskari.mapframework.bundle.layerselection2.LayerSelectionBundleInstance}
 * instance
 *      reference to component that created the tile
 */
function(instance, service) {
    this.instance = instance;
    this.sb = this.instance.getSandbox();
    this.loc = this.instance.getLocalization();
    this.statsService = service;
    this.container = null;
    this.template = null;
    this._tileExtensions = {};
    this._flyoutManager = Oskari.clazz.create('Oskari.statistics.statsgrid.FlyoutManager', instance, service);
    this._templates = {
        extraSelection : _.template('<div class="statsgrid-functionality ${ id }" data-view="${ id }"><div class="icon"></div><div class="text">${ label }</div><div class="clear"></div></div>')
    };
}, {
    /**
     * @method getName
     * @return {String} the name for the component
     */
    getName : function() {
        return 'Oskari.statistics.statsgrid.Tile';
    },
    /**
     * @method setEl
     * @param {Object} el
     *      reference to the container in browser
     * @param {Number} width
     *      container size(?) - not used
     * @param {Number} height
     *      container size(?) - not used
     *
     * Interface method implementation
     */
    setEl : function(el, width, height) {
        this.container = jQuery(el);
    },
    /**
     * @method startPlugin
     * Interface method implementation, calls #createUi()
     */
    startPlugin : function() {
        this._addTileStyleClasses();
        var me = this;
        var instance = me.instance;
        var sandbox = instance.getSandbox();
        var tpl = this._templates.extraSelection;
        this.getFlyoutManager().flyoutInfo.forEach(function(flyout) {
            var tileExtension = jQuery(tpl({
                id: flyout.id,
                label : flyout.title
            }));
            me.extendTile(tileExtension, flyout.id);
            tileExtension.bind('click', function(event) {
                event.stopPropagation();
                me.toggleExtensionClass(flyout.id);
                me.toggleFlyout(flyout.id);
            });
        });
        this.hideExtensions();
    },
    _addTileStyleClasses: function() {
        var isContainer = (this.container && this.instance.mediator) ? true : false;
        var isBundleId = (isContainer && this.instance.mediator.bundleId) ? true : false;
        var isInstanceId = (isContainer && this.instance.mediator.instanceId) ? true : false;

        if (isInstanceId && !this.container.hasClass(this.instance.mediator.instanceId)) {
            this.container.addClass(this.instance.mediator.instanceId);
        }
        if (isBundleId && !this.container.hasClass(this.instance.mediator.bundleId)) {
            this.container.addClass(this.instance.mediator.bundleId);
        }
    },
    /**
     * @method stopPlugin
     * Interface method implementation, clears the container
     */
    stopPlugin : function() {
        this.container.empty();
    },
    /**
     * @method getTitle
     * @return {String} localized text for the title of the tile
     */
    getTitle : function() {
        return this.loc.flyout.title;
    },
    /**
     * @method getDescription
     * @return {String} localized text for the description of the tile
     */
    getDescription : function() {
        return this.instance.getLocalization('desc');
    },
    extendTile: function (el,type) {
          var container = this.container.append(el);
          var extension = container.find(el);
          this._tileExtensions[type] = extension;
    },
    hideExtensions: function () {
        var me = this;
        var extraOptions = me.getExtensions();
        Object.keys(extraOptions).forEach(function(key) {
            // hide all flyout
            me.getFlyoutManager().hide( key );
            // hide the tile "extra selection"
            var extension = extraOptions[key];
            extension.removeClass('material-selected');
            extension.hide();
        });
    },
    toggleExtensionClass: function(type, wasClosed) {
        var me = this;
        var el = this.getExtensions()[type];
        //jQuery('.statsgrid-functionality.'+type);
        if(wasClosed) {
            el.removeClass('material-selected');
            me.getFlyoutManager().hide(type);
            return;
        }
        if (el.hasClass('material-selected') ) {
            el.removeClass('material-selected');
        } else {
            el.addClass('material-selected');
        }
    },
    showExtensions: function () {
        var me = this;
        var extraOptions = me.getExtensions();
        this.getFlyoutManager().init();
        Object.keys(extraOptions).forEach(function(key) {
            extraOptions[key].show();
        });
    },
    getExtensions: function () {
        return this._tileExtensions;
    },
    getFlyoutManager: function () {
        return this._flyoutManager;
    },
    getFlyout: function (type) {
        return this.getFlyoutManager().getFlyout(type);
    },
    toggleFlyout: function (type) {
        var flyout = this.getFlyoutManager().getFlyout(type);
        if(!flyout) {
            // unrecognized flyout
            return;
        }
        if(flyout.isVisible()) {
            flyout.hide();
            return;
        }
        // open flyout
        this.getFlyoutManager().open(type);
    }
}, {
    /**
     * @property {String[]} protocol
     * @static
     */
    'protocol' : ['Oskari.userinterface.Tile']
});

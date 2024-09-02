/*
 * @class Oskari.admin.bundle.admin-layerrights.Tile
 *
 * Renders the layer rights management tile.
 */
Oskari.clazz.define('Oskari.admin.bundle.admin-permissions.Tile',

    /**
       * @method create called automatically on construction
       * @static
       * @param {Oskari.mapframework.bundle.search.SearchBundleInstance} instance
       *        reference to component that created the tile
       */
    function (instance) {
        var me = this;
        me.instance = instance;
        me.container = null;
        me.template = null;
    }, {
        /**
         * @method getName
         * @return {String} the name for the component
         */
        getName: function () {
            return 'Oskari.admin.bundle.admin-permissions.Tile';
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
        setEl: function (el, width, height) {
            this.container = jQuery(el);
        },
        /**
         * @method startPlugin
         * Interface method implementation, calls #refresh()
         */
        startPlugin: function () {
            this._addTileStyleClasses();
        },
        _addTileStyleClasses: function () {
            var isContainer = !!((this.container && this.instance.mediator));
            var isBundleId = !!((isContainer && this.instance.mediator.bundleId));
            var isInstanceId = !!((isContainer && this.instance.mediator.instanceId));

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
        stopPlugin: function () {
            this.container.empty();
        },
        /**
         * @method getTitle
         * @return {String} localized text for the title of the tile
         */
        getTitle: function () {
            return Oskari.getMsg('admin-permissions', 'title');
        },
        /**
         * @method getDescription
         * @return {String} localized text for the description of the tile
         */
        getDescription: function () {
            return Oskari.getMsg('admin-permissions', 'desc');
        }
    }, {
        /**
         * @property {String[]} protocol
         * @static
         */
        'protocol': ['Oskari.userinterface.Tile']
    });


const sortGroupsAlphabetically = (groups = []) => {
    if (!Array.isArray(groups)) {
        return null;
    }
    const sorted = [...groups].sort((a, b) => {
        // ensure that empty groups are at the top
        // not sure if this is requested functionality or not
        const layerCountA = a.layers.length;
        const layerCountB = b.layers.length;
        if (layerCountA === 0 && layerCountB !== 0) {
            return -1;
        }
        if (layerCountA !== 0 && layerCountB === 0) {
            return 1;
        }
        // sort by name (for most cases use this)
        return Oskari.util.naturalSort(a.getTitle(), b.getTitle());
    });
    sorted.forEach(group => {
        group.setGroups(sortGroupsAlphabetically(group.getGroups()));
    });
    return sorted;
};

/*
const group = {
    id: -1,
    name: '',
    layers: [{id}],
    groups: []
};
createGroupModel(group, ...)
*/
const createGroupModel = (group, method, allLayers, tools, admin) => {
    const groupLayers = group.layers || [];
    // TODO: check if subgroups have layers?
    if (groupLayers.length === 0 && !admin) {
        // non-admin users get only groups with layers
        return;
    }
    // check that group has layers
    const name = group.name;
    // const name = group.getName();
    const newGroup = Oskari.clazz.create(
        'Oskari.mapframework.bundle.layerselector2.model.LayerGroup',
        group.id, method, name
    );
    newGroup.setTools(tools);
    // attach layers to group
    const groupLayerIds = groupLayers.map(l => l.id);
    const layerModels = allLayers.filter(layer => {
        if (typeof layer.getId !== 'function') {
            return false;
        }
        return groupLayerIds.includes(layer.getId());
    });
    layerModels.sort((a, b) => Oskari.util.naturalSort(a.getName(), b.getName()));
    newGroup.setLayers(layerModels);
    // TODO: should we check if we got the referenced layers?
    //  or if the group doesn't have layers at this point?
    //  or sort them based on or groupLayers.orderNumber/alphabetically?

    // group has subgroups
    if (!group.groups.length) {
        return newGroup;
    }
    const mappedSubgroups = group.groups
        // recursion for subgroups
        .map(subgroup => createGroupModel(subgroup, method, allLayers, tools, admin))
        // remove any subgroups that mapped to null:
        //  (groups without layers for non-admins etc)
        .filter(g => typeof g !== 'undefined');
    newGroup.setGroups(mappedSubgroups);
    return newGroup;
};

/**
 * Function to construct layer groups based on information included in layers and given grouping method.
 * Possible empty groups are included if allGroups and / or allDataProviders parameters are provided.
 *
 * @param {Oskari.mapframework.domain.AbstractLayer[]} layers layers to group
 * @param {String} method layer method name to sort by
 * @param {Oskari.mapframework.domain.Tool[]} tools tools to group
 * @param {Object[]} allGroups all layer groups or all dataproviders available in Oskari
 */
export const groupLayers = (layers, method, tools, allGroups = [], noGroupTitle) => {
    let groupForOrphans = null;
    const isUserAdmin = tools.length > 0;
    // generate a group for layers without "natural" grouping if needed
    layers
        .filter(layer => !layer.getMetaType || layer.getMetaType() !== 'published')
        // if method call returns a value we can map it to a group, filter ones we can't
        .filter(layer => !layer[method]())
        .forEach(layer => {
            if (groupForOrphans) {
                // add layer to runtime generated orphan group
                groupForOrphans.addLayer(layer);
                return;
            }
            // Create group for orphan layers if not already created
            const newGroup = {
                // My map layers, my places, own analysis and 'orphan' groups don't have id so use negated random number
                // as unique Id (with positive id group is interpret as editable and group tools are shown in layer list).
                id: -Math.random(),
                name: '(' + noGroupTitle + ')',
                layers: [{ id: layer.getId() }],
                groups: []
            };
            groupForOrphans = createGroupModel(newGroup, method, layers, tools, isUserAdmin);
        });
    // recursively map groups and layers together
    const groupList = allGroups
        .map(rootGroup => createGroupModel(rootGroup, method, layers, tools, isUserAdmin))
        .filter(group => typeof group !== 'undefined');
    const sortedGroups = sortGroupsAlphabetically(groupList);

    const result = [...sortedGroups];
    if (groupForOrphans) {
        // if there's an orphan group, make it the first one
        result.unshift(groupForOrphans);
    }
    return result;
};

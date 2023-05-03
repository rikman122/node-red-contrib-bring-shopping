const bringApi = require('bring-shopping');

module.exports = function(RED) {
    function bringCredentials(config) {
        RED.nodes.createNode(this,config);
        this.name   = config.name;

        this.getBring = async function(){
            if (this.bring === undefined) {
                this.bring = new bringApi({ mail: this.credentials.email, password: this.credentials.password});
                await this.bring.login();
            }

            return this.bring;
        }

        this.loadLists = async function() {
            const bring = await this.getBring();
            return await bring.loadLists();
        }

        this.getItems = async function (listUUID) {
            const bring = await this.getBring();
            return await bring.getItems(listUUID);
        }

        this.loadTranslations = async function (locale) {
            const bring = await this.getBring();
            return await bring.loadTranslations(locale);
        }

        this.loadCatalog = async function (locale) {
            const bring = await this.getBring();
            return await bring.loadCatalog(locale);
        }

        this.getItemsDetails = async function(listUUID) {
            const bring = await this.getBring();
            return await bring.getItemsDetails(listUUID);
        }

        this.removeItem = async function(listUUID, itemName) {
            const bring = await this.getBring();
            return await bring.removeItem(listUUID, itemName);
        }

        this.moveToRecently = async function(listUUID, itemName) {
            const bring = await this.getBring();
            return await bring.moveToRecentList(listUUID, itemName);
        }

        this.saveItem = async function(listUUID, itemName, specification) {
            const bring = await this.getBring();
            return await bring.saveItem(listUUID, itemName, specification);
        }
    }
    RED.nodes.registerType('bringCredentials',bringCredentials, {
		credentials: {
			email:           { type:"text", required: true },
            password:        { type:"text", required: true }
		}
    });


    function loadListsNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                msg.lists = await bringCredentials.loadLists();
                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('loadLists',loadListsNode);


    function getItemsNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                msg.items = await bringCredentials.getItems(config.listUUID);
                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('getItems',getItemsNode);


    function loadTranslationsNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                msg.translations = await bringCredentials.loadTranslations(config.locale);
                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('loadTranslations',loadTranslationsNode);


    function loadCatalogNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                msg.catalog = await bringCredentials.loadCatalog(config.locale);
                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('loadCatalog',loadCatalogNode);


    function removeItemNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                if (!msg.payload) {
                    node.error("No payload given");
                } else if (!msg.payload.listUUID) {
                    node.error("No listUUID given");
                } else if (!msg.payload.itemName) {
                    node.error("No itemName given");
                }
                
                setErrorOrResult(msg, await bringCredentials.removeItem(msg.payload.listUUID, msg.payload.itemName));

                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('removeItem',removeItemNode);


    function moveToRecentlyNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                if (!msg.payload) {
                    node.error("No payload given");
                } else if (!msg.payload.listUUID) {
                    node.error("No listUUID given");
                } else if (!msg.payload.itemName) {
                    node.error("No itemName given");
                }
                
                setErrorOrResult(msg, await bringCredentials.moveToRecently(msg.payload.listUUID, msg.payload.itemName));

                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('moveToRecently',moveToRecentlyNode);


    function saveItemNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                if (!msg.payload) {
                    node.error("No payload given");
                } else if (!msg.payload.listUUID) {
                    node.error("No listUUID given");
                } else if (!msg.payload.itemName) {
                    node.error("No itemName given");
                }

                setErrorOrResult(msg, await bringCredentials.saveItem(msg.payload.listUUID, msg.payload.itemName, msg.payload.specification || ""));

                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('saveItem',saveItemNode);


    function getItemsDetailedNode(config) {
        RED.nodes.createNode(this,config);
        var bringCredentials = RED.nodes.getNode(config.bringCredentials);
        var node = this;

        node.on('input', async (msg) => {
            try {          
                msg.translations = await bringCredentials.loadTranslations(config.locale);
                msg.items = await bringCredentials.getItems(config.listUUID);
                msg.details = await bringCredentials.getItemsDetails(config.listUUID);
                msg.catalog = await bringCredentials.loadCatalog(config.locale);

                msg.itemsPurchase = [];
                msg.items.purchase.forEach(item => {
                    msg.itemsPurchase.push(toItemDetailed(item));
                });
                
                msg.itemsRecently = [];
                msg.items.recently.forEach(item => {
                    msg.itemsRecently.push(toItemDetailed(item));
                });

                if (!msg.debug) {
                    msg.translations = undefined;
                    msg.items = undefined;
                    msg.details = undefined;
                    msg.catalog = undefined;
                }

                function toItemDetailed(item) {
                    var itemDetailed = {
                        name: item.name,
                        displayName: msg.translations[item.name],
                        specification: item.specification
                    };
                    itemDetailed.detailByName = msg.details.find(d => d.itemId === itemDetailed.name);
                    itemDetailed.detailByDisplayName = itemDetailed.displayName ? msg.details.find(d => d.itemId === itemDetailed.displayName) : undefined;

                    itemDetailed.iconUrl = 'https://web.getbring.com/assets/images/items/';
                    if (itemDetailed.detailByName && itemDetailed.detailByName.userIconItemId != "") {
                        itemDetailed.iconUrl += toUrlName(itemDetailed.detailByName.userIconItemId);
                    } else if (itemDetailed.detailByDisplayName && itemDetailed.detailByDisplayName.userIconItemId != "") {
                        itemDetailed.iconUrl += toUrlName(itemDetailed.detailByDisplayName.userIconItemId);
                    } else {
                        // CHECK CATALOG
                        var found = false;
                        msg.catalog.catalog.sections.forEach(section => {
                            if (section.items.includes(itemDetailed.name)) {      
                                itemDetailed.iconUrl += toUrlName(itemDetailed.name);
                                found = true;
                            }
                        });

                        if (!found) {
                            itemDetailed.iconUrl += toUrlName(itemDetailed.name.substr(0,1));
                        }
                    }
                    itemDetailed.iconUrl += '.png';

                    if (!msg.debug) {
                        itemDetailed.detailByName = undefined;
                        itemDetailed.detailByDisplayName = undefined;
                    }

                    // set displayName to name if not set
                    itemDetailed.displayName = itemDetailed.displayName ? itemDetailed.displayName : itemDetailed.name;

                    return itemDetailed;
                }

                function toUrlName(name) {
                    name = name.toLowerCase();
                    name = name.replace('ä','ae');
                    name = name.replace('ö','oe');
                    name = name.replace('ü','ue');
                    return name;
                }

                msg.payload = undefined;

                node.send(msg);
            } catch (err) {
                node.error(err);
            }
        });
    }
    RED.nodes.registerType('getItemsDetailed',getItemsDetailedNode);
};

function setErrorOrResult(msg, result) {
    if (result.length > 0) {
        msg.error = result;
    }
}
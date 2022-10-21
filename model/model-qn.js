sap.ui.define([
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/Device",
	"sap/ui/model/Filter"
],


	/**
	 * Model Constructors.
	 * 
	 * --by_Serge_Breslaw(n88977),@//www.linkedin.com/in/sergebreslaw
	 * 
	 * @memberOf z_ces_rpt2.model.models
	 */
	function(oDataModel, Device, _filter ) {
		"use strict";


		return {
			'id': "qNoteBackend",
			'x-csrf-token': null,
			'owner': null,
			'guid': null,
			'dirty': !0,
			'messages': [],
			'create': function(owner,oConfig) {
				var oSrvPath = (window.location.hostname == "localhost") ? "proxy" + oConfig.serviceConfig.serviceUrl : oConfig.serviceConfig.serviceUrl;

				var oCallParams = {
					defaultBindingMode: sap.ui.model.BindingMode.TwoWay,
					defaultUpdateMethod: sap.ui.model.odata.UpdateMethod.Put,
					defaultCountMode: "None",
					sequentializeRequests: true,
					useBatch: true
				};
				var d = new Date().getTime();
				this.guid = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
					var r = (d + Math.random() * 16) % 16 | 0;
					d = Math.floor(d / 16);
					return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
				});

				return $.Deferred().resolve(
					new oDataModel(oSrvPath, oCallParams)
					//new oDataModel()
				);

			},
			'init': function(param) {
				var _param = param || {};
				var _self = this;
				var _promise = _param.Promise || $.Deferred();
				this.get().setSizeLimit(10000);
				OData.request({
					requestUri: this['get']().sServiceUrl,
					method: "GET",
					async: true,
					headers: {
						"X-Requested-With": "XMLHttpRequest",
						"Content-Type": "application/atom+xml",
						"DataServiceVersion": "2.0",
						"X-CSRF-Token": "Fetch"
					}
				}, function(data, response) {
					_self["x-csrf-token"] = response.headers['x-csrf-token'];
					_promise.resolve(data, response);
				});
				
				return _promise.resolve();

			},
			'setDirty': function() {
				this.dirty = !0;
			},
			'clearDirty': function() {
				this.dirty = !1;
			},
			'isDirty': function() {
				return this.dirty;
			},
			'set': function(model, owner) {
				this['owner'] = owner || sap.ui.getCore();
				this['owner']['setModel'](model, this.id)
			},
			'get': function() {
				return this['owner']['getModel'](this.id);
			},
			'getByPath': function(sPath) {
				return this['get']().getProperty(sPath);
			},
			'setProperty': function(prop, value) {
				this.grid[prop] = value;
			},
			'getProperty': function(prop) {
				return this.grid[prop] || null;
			},

			'initializeErrorMessages': function() {
				this.messages = [];
			},


		};
	});
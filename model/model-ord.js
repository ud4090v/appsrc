sap.ui.define([
	"sap/ui/model/odata/v2/ODataModel",
	"sap/ui/Device",
	"sap/ui/model/Filter"
],

	function(oDataModel, Device, _filter) {
		"use strict";


		return {
			'id': "backend",
			'x-csrf-token': null,
			'owner': null,
			'guid': null,
			'dirty': !0,
			'messages': [],
			'create': function(owner, oConfig) {
				var oSrvPath = (window.location.hostname == "localhost") ? "proxy" + oConfig.serviceConfig.serviceUrl : oConfig.serviceConfig.serviceUrl;

				var oCallParams = {
					defaultBindingMode: sap.ui.model.BindingMode.TwoWay,
					defaultUpdateMethod: sap.ui.model.odata.UpdateMethod.Put,
					loadMetadataAsync : false,
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
				return _promise;

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
			'addRevision': function(param) {
				var _stream = this['get']();
				var _data = param.Data;
				var self = this;
				//this.initializeErrorMessages();
				var _promise = param.Promise || $.Deferred();

				_stream.create("/OrderSet", _data, {
					async: false,
					success: function(oData, response) {
						_promise.resolve(oData, response);
					},
					error: function(oError, response) {
						//self.processErrorMessages(oError);
						_promise.reject(oError, response);
					},
				});
				return _promise;
			},
			'getContext': function(param) {
				var _param = param || {};
				var _model = this.get();
				var _filters = [];
				var _promise = (_param && _param.Promise) || $.Deferred();
				var _ordid = (_param && _param.OrderNo) || '';
				var _revid = (_param && _param.OrderRevNo) || '';

				//var _sp = _model.createKey('/OrderSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid });
				
				var _sp = "/OrderSet(OrderNo='" + _ordid + "',OrderRevNo='" +_revid + "')";

				_model
					.read(_sp, {
						success: function(oData, response) {
							_promise.resolve(oData, response);
						},
						error: function(oError, response) {
							_promise.reject(oError, response);
						},
					});
				return _promise;

			},
			
			'getContent': function(param) {
				var _param = param || {};
				var _model = this.get();
				var _filters = [];
				var _promise = (_param && _param.Promise) || $.Deferred();
				var _ordid = (_param && _param.OrderNo) || '';
				var _revid = (_param && _param.OrderRevNo) || '';
				var _activity = (_param && _param.Activity) || '';
				var _workstep = (_param && _param.WorkStep) || '';


				//var _sp = _model.createKey('/OrderSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid });
				
				//var _sp = _model.createKey('/StepContentSet', { 'OrderNo': _ordid, 'OrderRevno': _revid, 'Activity': _activity, 'WorkStep': _workstep  });
				
				//var _sp = "/StepContentSet(OrderNo='" + _ordid + "',OrderRevNo='" +_revid + "')";

				_model
					.read(_sp, {
						success: function(oData, response) {
							_promise.resolve(oData, response);
						},
						error: function(oError, response) {
							_promise.reject(oError, response);
						},
					});
				return _promise;

			},

			'addOperation': function(param) {
				var _stream = this['get']();
				var _data = param.Data;
				var self = this;
				//this.initializeErrorMessages();
				var _promise = param.Promise || $.Deferred();

				_stream.create("/OperationSet", _data, {
					async: false,
					success: function(oData, response) {
						_promise.resolve(oData, response);
					},
					error: function(oError, response) {
						//self.processErrorMessages(oError);
						_promise.reject(oError, response);
					},
				});
				return _promise;
			},
			'addSubOperation': function(param) {
				var _stream = this['get']();
				var _data = param.Data;
				var self = this;
				//this.initializeErrorMessages();
				var _promise = param.Promise || $.Deferred();

				_stream.create("/SuboperationSet", _data, {
					async: false,
					success: function(oData, response) {
						_promise.resolve(oData, response);
					},
					error: function(oError, response) {
						//self.processErrorMessages(oError);
						_promise.reject(oError, response);
					},
				});
				return _promise;
			},
			'changeSubOperation': function(param) {
				var _stream = this['get']();
				var _param = param.Data;
				var self = this;
				//this.initializeErrorMessages();
				var _promise = param.Promise || $.Deferred();

				var _ordid = (_param && _param.OrderNo) || '';
				var _revid = (_param && _param.OrderRevNo) || '';
				var _vornr = (_param && _param.OperationNo) || '';
				var _uvorn = (_param && _param.SubOperationNo) || '';

				var _sp = _stream.createKey('/SuboperationSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid, 'OperationNo': _vornr, 'SubOperationNo': _uvorn });

				_stream.update(_sp, _param, {
					async: false,
					success: function(oData, response) {
						_promise.resolve(oData, response);
					},
					error: function(oError, response) {
						//self.processErrorMessages(oError);
						_promise.reject(oError, response);
					},
				});
				return _promise;
			},
			'changeOperation': function(param) {
				var _stream = this['get']();
				var _param = param.Data;
				var self = this;
				//this.initializeErrorMessages();
				var _promise = param.Promise || $.Deferred();

				var _ordid = (_param && _param.OrderNo) || '';
				var _revid = (_param && _param.OrderRevNo) || '';
				var _vornr = (_param && _param.OperationNo) || '';

				var _sp = _stream.createKey('/OperationSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid, 'OperationNo': _vornr });

				_stream.update(_sp, _param, {
					async: false,
					success: function(oData, response) {
						_promise.resolve(oData, response);
					},
					error: function(oError, response) {
						//self.processErrorMessages(oError);
						_promise.reject(oError, response);
					},
				});
				return _promise;
			},

			'changeOrder': function(param) {
				var _stream = this['get']();
				var _param = param.Data;
				var self = this;
				//this.initializeErrorMessages();
				var _promise = param.Promise || $.Deferred();

				var _ordid = (_param && _param.OrderNo) || '';
				var _revid = (_param && _param.OrderRevNo) || '';

				var _sp = _stream.createKey('/OrderSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid });

				_stream.update(_sp, _param, {
					async: false,
					success: function(oData, response) {
						_promise.resolve(oData, response);
					},
					error: function(oError, response) {
						//self.processErrorMessages(oError);
						_promise.reject(oError, response);
					},
				});
				return _promise;
			},

			'deleteOperation': function(param) {
				var _param = param || {};
				var _model = this.get();
				var _filters = [];
				var _promise = (_param && _param.Promise) || $.Deferred();
				var _ordid = (_param && _param.Data.OrderNo) || '';
				var _revid = (_param && _param.Data.OrderRevNo) || '';
				var _vornr = (_param && _param.Data.OperationNo) || '';

				var _sp = _model.createKey('/OperationSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid, 'OperationNo': _vornr });


				_model
					.remove(_sp, {
						success: function(oData, response) {
							_promise.resolve(oData, response);
						},
						error: function(oError, response) {
							_promise.reject(oError, response);
						},
					});
				return _promise;

			},

			'deleteSubOperation': function(param) {
				var _param = param || {};
				var _model = this.get();
				var _filters = [];
				var _promise = (_param && _param.Promise) || $.Deferred();
				var _ordid = (_param && _param.Data.OrderNo) || '';
				var _revid = (_param && _param.Data.OrderRevNo) || '';
				var _vornr = (_param && _param.Data.OperationNo) || '';
				var _uvorn = (_param && _param.Data.SubOperationNo) || '';

				var _sp = _model.createKey('/SuboperationSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid, 'OperationNo': _vornr, 'SubOperationNo': _uvorn });


				_model
					.remove(_sp, {
						success: function(oData, response) {
							_promise.resolve(oData, response);
						},
						error: function(oError, response) {
							_promise.reject(oError, response);
						},
					});
				return _promise;

			},

			'reviseSubOperation': function(param) {
				var _param = param || {};
				var _model = this.get();
				var _promise = (_param && _param.Promise) || $.Deferred();
				var _ordid = (_param && _param.Data.OrderNo) || '';
				var _revid = (_param && _param.Data.OrderRevNo) || '';
				var _vornr = (_param && _param.Data.OperationNo) || '';
				var _uvorn = (_param && _param.Data.SubOperationNo) || '';

				var _sp = _model.createKey('/SuboperationSet', { 'OrderNo': _ordid, 'OrderRevNo': _revid, 'OperationNo': _vornr, 'SubOperationNo': _uvorn });


				_model.update(_sp, {
						Revise: true
					}, 
					{
						async: false,
						success: function(oData, response) {
							_promise.resolve(oData, response);
						},
						error: function(oError, response) {
							//self.processErrorMessages(oError);
							_promise.reject(oError, response);
						},
					}
				);
				return _promise;

			},

			'readOrderDetails': function(OrderNo, Revision){ 
				var _model = this.get(); 
				var _promise = $.Deferred(); 
				//Order Details service call 
				var _sp = _model.createKey("/OrderDetailsSet", { 'OrderNo': OrderNo, "Revision":Revision });
				_model
					.read(_sp, { 
						success: function(oData, response) {
							_promise.resolve(oData, response);
						},
						error: function(oError, response) {
							_promise.reject(oError, response);
						},
					});
				return _promise;
			},

			'readOperation': function(OrderNo, Revision, Vornr){ 
				var _model = this.get(); 
				var _promise = $.Deferred(); 
				//Order Details service call 
				var _sp = _model.createKey("/OperationSet", { 'OrderNo': OrderNo, "OrderRevNo":Revision, 'OperationNo':Vornr });
				_model
					.read(_sp, { 
						success: function(oData, response) {
							_promise.resolve(oData, response);
						},
						error: function(oError, response) {
							_promise.reject(oError, response);
						},
					});
				return _promise;
			},

			'initializeErrorMessages': function() {
				this.messages = [];
			},


		};
	});
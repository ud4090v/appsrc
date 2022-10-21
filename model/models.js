sap.ui.define([
	"ula/mes/order/maint/model/model-app",
	"ula/mes/order/maint/model/model-ord",
	"ula/mes/order/maint/model/model-qn",
	"ula/mes/order/maint/model/model-nav",
	"ula/mes/common/model/modelsController"
],

	function(mApp, mOrd, mQn, mNav, mController) {
		"use strict";

		return {
			initializeModels: function(controller) {

				var _promise = $.Deferred();
				var _modelsInitialized = [];
				var _root = controller;

				_modelsInitialized.push(mController.init({model:mNav, owner: _root, param:_root.getComponentData()["startupParameters"]}));
				_modelsInitialized.push(mController.init({model:mApp, owner: _root, param:_root.getComponentData()["startupParameters"]}));

				_modelsInitialized.push(
					mController.init({ model: mOrd, param: _root.getMetadata().getConfig() })
					.done(function(model) {
						model.init();
					})
				);

				_modelsInitialized.push(
				mController.init({ model: mQn, param: _root.getMetadata().getConfig() })
					.done(function(model) {
						model.init();
					})
				);



				$.when.apply($, _modelsInitialized).then(function(data) {
					_promise.resolve(data);
				})

				return _promise;

			},

			getMain: function() {
				return mOrd;
			},
			getApp: function() {
				return mApp;
			},
			getQn: function() {
				return mQn;
			},
			getContext(){
				var _promise = $.Deferred();
				mOrd.getContext({'OrderNo':mApp.order_id, 'OrderRevNo':mApp.rev_id})
					.done(function(oData, response) {
						_promise.resolve(oData, response);
					});
				return _promise;	
			}
		};
	});
jQuery.sap.registerModulePath("ula/mes/common", "/sap/bc/ui5_ui5/sap/zmes_common");
sap.ui.define([
	"sap/base/util/UriParameters",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"ula/mes/order/maint/model/models",
	"sap/f/library"
], function(UriParameters, UIComponent, JSONModel, modelController, library) {
	"use strict";

	var Component = UIComponent.extend("ula.mes.order.maint.Component", {
		metadata: {
			manifest: "json"
		},

		init: function() {
			var self = this;
			
			UIComponent.prototype.init.apply(this, arguments);

			//var socket = new WebSocket("wss://" + location.host + "/sap/bc/apc/sap/zmes_apc");

//			socket.onmessage = function(runFeed) {
//				if (runFeed.data) {
//					jQuery.sap.require("sap.m.MessageBox");
//					sap.m.MessageBox.show(dunningRunFeed.data, sap.m.MessageBox.Icon.INFORMATION, "APC Notification", [sap.m.MessageBox.Action.OK]);
//				}
//			};
			jQuery.sap.includeStyleSheet(sap.ui.resource("ula/mes/common", "css/mes.css"));
			$.when(modelController.initializeModels(this))
				.then(function(response) {

					modelController.getMain().get().attachRequestCompleted(function(oEvent) {
						sap.ui.getCore().getEventBus().publish("mesOM", "loadCompleted");
					})

					
					modelController.getContext()
						.done(function(oData, response) {
							var _ctx = modelController.getApp();
							_ctx.setContextData(oData);
							
							self.getRouter().initialize();
						})
						
				});
		},
		destroy : function () {
			//this.oListSelector.destroy();
			//this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},
		getContentDensityClass : function () {
			if (!this._sContentDensityClass) {
				if (!sap.ui.Device.support.touch) {
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		},
		onPressRefresh: function(){
            location.reload();
        }

	});
	return Component;
});

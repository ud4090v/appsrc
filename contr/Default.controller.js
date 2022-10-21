sap.ui.define([
	"ula/mes/common/controller/baseController",
	"ula/mes/order/maint/model/model-app",
], function(Controller, mApp) {
	"use strict";

	return Controller.extend("ula.mes.order.maint.controller.Default", {
		onInit: function() {
			var a = this.getOwnerComponent().getRouter();
			a.getRoute("query").attachMatched(this._onLoadQuery, this);
			a.getRoute("blank").attachMatched(this._onLoadBlank, this);

		},

		_onLoadQuery: function(a) {
			var a = null;
			var self = this;
			if (mApp.order_id) {
				this.getOwnerComponent().getRouter().navTo("master",{'OrderNo':mApp.order_id,"OperationNo": '00000'});
			} else {
				this.getOwnerComponent().getRouter().navTo("blank");
			}
		},
		_onLoadBlank: function(a) {
			sap.m.MessageToast.show('Unsupported Mode.');
		},
		
	});
});

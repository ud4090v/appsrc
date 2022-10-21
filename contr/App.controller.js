sap.ui.define([
	'ula/mes/common/controller/baseController',
	"ula/mes/order/maint/model/model-app",
	"ula/mes/order/maint/model/model-ord",
	"ula/mes/order/maint/model/model-nav",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageToast',	
	"ula/mes/common/Teamcenter/tc",
	"jquery.sap.storage",
], function(BaseController, mApp, mOrd, mNav, JSONModel, mToast,tcApi, Storage) {
	"use strict";
//Allen change
	var appController = BaseController.extend("ula.mes.order.maint.controller.App", {

		onInit: function() {
			var self = this;

			this.formatter.loadPersonalization( this.formatter.PersonalizationID, this.getOwnerComponent() );

			this.getOwnerComponent().getService("ShellUIService").then(
				function(oService) {
					oService.setTitle(self.getResourceBundle().getText("appTitle") + mApp.order_id);
				}
			)
			this.getOwnerComponent().getService("ShellUIService").then(
				function(oService) {
					oService.setBackNavigation(function(oEvent) {
						if (mOrd.get().hasPendingChanges()) {
							sap.m.MessageBox.confirm(self.getResourceBundle().getText("navBackText"), {
								title: self.getResourceBundle().getText("navBackTitle"),
								actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
								//	styleClass: bCompact ? "sapUiSizeCompact" : "",
								onClose: function(oAction) {
									if (oAction === sap.m.MessageBox.Action.YES) {
										sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({ target: { semanticObject: mNav.getSemObject(), action: mNav.getIntent() }, params: { area: mApp.area } });
									}
								}
							});

						} else {
							sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({ target: { semanticObject: mNav.getSemObject(), action: mNav.getIntent() }, params: { area: mApp.area } });
						}
					})
				}
			)

			this.setAppControl(this.byId("fcl"));

			this.openLoader();

			// var 	oViewModel,
			//		fnSetAppNotBusy;
			//		oListSelector = this.getOwnerComponent().oListSelector,
			//		iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			//   oViewModel = new JSONModel({
			//	   busy : true,
			//	   delay : 0
			//  });
			//   this.setModel(oViewModel, "appView");

			//fnSetAppNotBusy = function() {
			//	oViewModel.setProperty("/busy", false);
			//	oViewModel.setProperty("/delay", iOriginalBusyDelay);
			//};

			//mRep.get().metadataLoaded().then(fnSetAppNotBusy);

			// Makes sure that master view is hidden in split app
			// after a new list entry has been selected.
			//oListSelector.attachListSelectionChange(function () {
			//	this.byId("idAppControl").hideMaster();
			//}, this);

			// apply content density mode to root view
			//this.byId("idAppControl").hideMaster();
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this.validateAccessTCToken(); 

		},

		validateAccessTCToken: function(){ 
			var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local),
				AccessKeyObj = oStorage.get("g_accessData_local_" + tcApi.getSystemName());
		 
		  if(AccessKeyObj){
			tcApi.validateToken().then(function(data){
				   if(data.search('true') === -1 || !data){
					tcApi.getAccessToken();
				   }
			   });
		   }else{
			tcApi.getAccessToken();
		   }			
		}, 

		onExit: function() {

		},
		onOrientationChange: function(oEvent) {

		},
		onBeforeRendering: function(oEvent) {
			//this.getView().byId('TPOMgrReportTable').getBinding("items").filter(config.getFilters());
		},

		onAfterRendering: function(oEvent) {
			var _self = this;

		},
		doAfterRendering: function() {
		},

		onNavBack: function(oEvent) {
			var self = this;
			sap.m.MessageBox.confirm(self.getResourceBundle().getText("navBackText"), {
				title: self.getResourceBundle().getText("navBackTitle"),
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				//	styleClass: bCompact ? "sapUiSizeCompact" : "",
				onClose: function(oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {
						sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({ target: { semanticObject: mNav.getSemObject(), action: mNav.getIntent() }, params: { area: mApp.area } });
					}
				}
			})
		}


	});
	return appController;
});
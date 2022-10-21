sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"ula/mes/common/model/Utils",
	"sap/ui/model/xml/XMLModel",
],
	function(JSONModel, Utils, XMLModel) {
		"use strict";

		return {
			'id': "app",
			'owner': null,
			'order_id':null,
			'rev_id':null,
			'oFilter':null,
			'create': function(owner, params) {
				var _p=(params) ? params : [];
				var _model = this;
				this["order_id"]= (_p["OrderNo"])?_p["OrderNo"][0]:null;
				this["rev_id"]= (_p["OrderRevNo"])?_p["OrderRevNo"][0]:null;
				this["oFilter"]=new JSONModel();

				this.orbitsPlanLoaded = new Promise( function(resolve, reject) {
					var orbitsAPIMOdel = new XMLModel();

					orbitsAPIMOdel.attachRequestCompleted( function (oEvent) {
						var _e = oEvent.getParameters();
						orbitsAPIMOdel.oData.success=_e.success;
						resolve( orbitsAPIMOdel );
					} );
						
					// orbitsAPIMOdel.loadData( Utils.PROXY + "/sap/bc/zorbits_api/CAMS-ws/plans/" + _model.order_id);
				} );


				return $.Deferred().resolve(new JSONModel({
					cssClass: sap.ui.Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact",
					busy: false,
					delay: 0,
					layout: "OneColumn",
					//layout : "TwoColumnsMidExpanded",
					previousLayout: "",
					actionButtonsInfo: {
						midColumn: {
							fullScreen: false
						}
					}					
				})
				);
				

				
			},
			'set': function(model, owner) {
				this['owner'] = owner || sap.ui.getCore();
				this['owner']['setModel'](model, this.id);
				this['owner']['setModel'](this.oFilter,'flt');
			},
			'setContextData': function(oData) {
				this.get().oData = oData;
				// this.get().oData.OrderNo=this.order_id;
				// this.get().oData.OrderRevNo=this.rev_id;
				this.get().oData.busy = false;
				this.get().oData.delay = 0;
				this.get().oData.editMode = false;	
				this.get().oData.orderLocked = true;	
				this.get().oData.reorg=false;
				
				this.get().oData.fullScreen = false;			
				this['get']()['oData'].layout = "OneColumn";
				this['get']()['oData'].previousLayout = "";
				this['get']()['oData'].actionButtonsInfo = {
					midColumn: {
						fullScreen: false
					}
				};

				this['get']().refresh(true);
			},
			'setEditMode': function(oEvent){
				this.get().oData.editMode = true;	
				this.get().refresh(true);
			},
			'setOrderUnlock': function(oEvent){
				this.get().oData.orderLocked = false;	
				this.get().refresh(true);
			},
			'setOrderLock': function(oEvent){
				this.get().oData.orderLocked = true;	
				this.get().refresh(true);
			},
			'setDisplayMode': function(oEvent){
				this.get().oData.editMode = false;	
				this.get().refresh(true);
			},			
			'getMasterFilter': function(){
				return [
					new sap.ui.model.Filter("OrderNo", sap.ui.model.FilterOperator.EQ, this.order_id),
					new sap.ui.model.Filter("OrderRevNo", sap.ui.model.FilterOperator.EQ, this.rev_id)
					]
			},
			'getMasterOrderSelFilter': function(){
				return [
					new sap.ui.model.Filter("OrderNo", sap.ui.model.FilterOperator.EQ, this.order_id)
					]
			},
			'get': function() {
				return this['owner']['getModel'](this.id);
			},
			'setAppNotBusy': function() {
				this['get']().setProperty("/busy", false);
				this['get']().setProperty("/delay", false);
			},
			'setLayoutTwoColumns': function() {
				this['get']().setProperty("/layout", "TwoColumnsMidExpanded");
			},
			'setLayoutOneColumn': function() {
				this['get']().setProperty("/layout", "OneColumn");
				//				this.get().setProperty("/layout", "TwoColumnsMidExpanded");
			},
			'toggleFullScreen': function() {
				var _layout = this['get']();
				var bFullScreen = _layout.getProperty("/actionButtonsInfo/midColumn/fullScreen");
				_layout.setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
				if (!bFullScreen) {
					_layout.setProperty("/previousLayout", _layout.getProperty("/layout"));
					_layout.setProperty("/layout", "MidColumnFullScreen");
				} else {
					// reset to previous layout
					_layout.setProperty("/layout", _layout.getProperty("/previousLayout"));
				}
			},
			'closeDetail': function() {
				var _layout = this['get']();
				var bFullScreen = _layout.getProperty("/actionButtonsInfo/midColumn/fullScreen");
				if (bFullScreen) {
					_layout.setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
				}
				_layout.setProperty("/previousLayout", _layout.getProperty("/layout"));
				_layout.setProperty("/layout", "OneColumn");
			},


		};
	});
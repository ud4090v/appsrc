sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"ula/mes/common/controller/baseController",
	// "sap/ui/model/Filter",
	// "sap/ui/model/FilterOperator",
	// "sap/ui/model/odata/UpdateMethod",
	// "sap/m/Image",
	// "sap/m/Button",
	// "sap/m/FormattedText",
	// "sap/m/VBox",
	"sap/ui/core/format/DateFormat",
	//	"ula/mes/common/model/Utils",
	//	"ula/mes/common/controller/mixins/ContentRenderer",
	//	"ula/mes/common/controller/mixins/BuyoffHandler",
	//	"ula/mes/common/controller/mixins/PartsHandler",
	//	"ula/mes/common/controller/mixins/SpecificationHandler",
	//	"ula/mes/common/controller/mixins/ToolHandler",
	//	"ula/mes/common/controller/mixins/LaborHandler",
	//	"ula/mes/common/controller/mixins/ThumbnailHandler",
	//	"ula/mes/common/controller/mixins/RichTextHandler",
	//	"ula/mes/common/controller/mixins/StandardTextHandler",
	//	"ula/mes/common/controller/mixins/NotesHandler",
	//	"ula/mes/common/controller/mixins/AttachmentHandler",
	//"ula/mes/maint/controller/mixins/subopbysubop/OrderHandler"
	//	"ula/mes/common/controller/mixins/wholeorder/OrderHandler",
	"ula/mes/order/maint/model/model-app",
	"ula/mes/order/maint/model/model-ord",
	"ula/mes/order/maint/controller/mixins/WorkStepHandler",
	"ula/mes/order/maint/controller/mixins/OperationHandler",
	"ula/mes/order/maint/controller/mixins/OrderHandler",
	"ula/mes/order/maint/controller/mixins/OrderCreateRevision",
	//	"ula/mes/common/controller/mixins/QNoteHandler"

], function (JSONModel, Controller,
	// Filter, FilterOperator, UpdateMethod,

	// Image, Button, FormattedText, VBox,

	DateFormat,
	//	Utils,
	//    ContentRenderer,
	//	BuyoffHandler, 
	//	PartsHandler, 
	//SpecificationHandler, ToolHandler, LaborHandler, 
	//	ThumbnailHandler, 
	//	RichTextHandler, 
	//StandardTextHandler, NotesHandler, 
	//	AttachmentsHandler, 
	//OrderHandler, 
	mApp,
	mOrd,
	WorkStepHandler,
	OperationHandler,
	OrderHandler,
	oCRev
	// selectedStep,
	//QNoteHandler
) {
	"use strict";

	var controller;
	//printTemplate;

	var xmlfragment = function (name) {
		return controller.Fragments[name] = controller.Fragments[name] || sap.ui.xmlfragment(name, controller);
	};

	return Controller.extend("ula.mes.order.maint.controller.Main", $.extend({

		onInit: function () {
			controller = this;
			this.renderer.init(this);
			sap.ui.getCore().getEventBus().subscribe("ContentPanel", "reload", this.evOnPanelReload, this);
			sap.ui.getCore().getEventBus().subscribe("ContentPanel", "reorgStart", this.evOnPanelReorgStart, this);
			sap.ui.getCore().getEventBus().subscribe("ContentPanel", "reorgEnd", this.evOnPanelReorgEnd, this);

			//this.initPrintHandler();

			controller.Fragments = {};

			mOrd.set(mOrd.get(), this.getView());
			this.oModel = mOrd;

			var jModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(jModel, 'detail');



			//		if (!controller.getView().getModel("qNoteBackend")) {
			//			controller.getOwnerComponent().setModel(new sap.ui.model.odata.v2.ODataModel(this.formatter.PROXY + "/sap/opu/odata/sap/ZGW_QM_NOTIF_SRV/", {
			//				defaultUpdateMethod: sap.ui.model.odata.UpdateMethod.Put,
			//				defaultBindingMode: sap.ui.model.BindingMode.TwoWay
			//			}), "qNoteBackend");
			//		}
			//
			//

			var StepSubSection = controller.byId("StepSubSection");

			StepSubSection.addDelegate({
				onAfterRendering: function (oEvent) {
					controller.formatter.walkThroughUI(oEvent.srcControl, controller.formatter.includeByData("SubOperationNo", "0000", function (control) {
						control.addStyleClass("ulaOperationHeader");
					}));
				}
			}, false, StepSubSection, true);

			// this.getRouter().getRoute("stepDetail").attachPatternMatched(this._onStepMatched, this);

			this.getOwnerComponent().getRouter().attachRouteMatched(function (oEvent) {
				var _ev = oEvent.getParameter("name");
				var _list = controller.getOpList();
				// if (oEvent.getParameter("name") === "detail" || oEvent.getParameter("name") === "stepDetail") {
				if (oEvent.getParameter("name") === "detail") {

					var _op = oEvent.getParameter('arguments').OperationNo;
					var _selectedStep = (parseInt(oEvent.getParameter('arguments').SubOperationNo) === 0) ? null : oEvent.getParameter('arguments').SubOperationNo;

					if (parseInt(_op) !== 0) {

						mOrd.readOperation(mApp.get().oData.OrderNo, mApp.get().oData.OrderRevNo, _op)
							.done(function (oData) {
								controller.getView().getModel('detail').setData(oData);
								controller.getView().getModel('detail').refresh(true);
								var status = controller.getModel('detail').oData.Status;
								controller.formatter.applyOperationStyle(status, controller.byId("OpStatInfoLabel"));
		
								var StepStatusInfoLabel = controller.byId("StepStatInfoLabel");
								StepStatusInfoLabel
									.addDelegate({
										onAfterRendering: function (oEvent) {
											var
												control = oEvent.srcControl,
												_ctx = control.getBindingContext('backend'),
												status = (_ctx) ? _ctx.getObject().Status : '';
		
											controller.formatter.applyOperationStyle(status, control);
										}
									}, false, StepStatusInfoLabel, true);
		
								var SectionPage = controller.byId("OperationSteps");
		
								SectionPage.bindAggregation("subSections", {
									path: "backend>/SuboperationSet",
									template: StepSubSection,
									filters: [
										new sap.ui.model.Filter("OrderNo", sap.ui.model.FilterOperator.EQ, mApp.get().oData.OrderNo),
										new sap.ui.model.Filter("OrderRevNo", sap.ui.model.FilterOperator.EQ, mApp.get().oData.OrderRevNo),
										new sap.ui.model.Filter("OperationNo", sap.ui.model.FilterOperator.EQ, controller.getView().getModel('detail').oData.OperationNo)
									],
								});
		
							})

					}

				}
			})
		},

		// _onStepMatched: function (oEvent) {
		// 	var _op = oEvent.getParameter('arguments').OperationNo;
		// 	this.selectedStep = (parseInt(oEvent.getParameter('arguments').SubOperationNo) === 0) ? null : oEvent.getParameter('arguments').SubOperationNo;

		// 	var SectionPage = controller.byId("OperationSteps");


		// 	// if (controller.getView().getModel('detail')) {
		// 		SectionPage.bindAggregation("subSections", {
		// 			path: "backend>/SuboperationSet", template: StepSubSection, filters: [
		// 				new sap.ui.model.Filter("OrderNo", sap.ui.model.FilterOperator.EQ, mApp.get().oData.OrderNo),
		// 				new sap.ui.model.Filter("OrderRevNo", sap.ui.model.FilterOperator.EQ, mApp.get().oData.OrderRevNo),
		// 				new sap.ui.model.Filter("OperationNo", sap.ui.model.FilterOperator.EQ, controller.getView().getModel('detail').oData.OperationNo)
		// 			]
		// 		});
		// 	// } else {
		// 	// 	sap.ui.core.Component.getOwnerComponentFor(controller.getView().getParent()).getRouter().navTo("master", {
		// 	// 		OrderNo: mApp.get().oData.OrderNo,
		// 	// 		OperationNo: _op
		// 	// 	}, true);
		// 	// }
		// },



		onExit: function () {
			sap.ui.getCore().getEventBus().unsubscribe("ContentPanel", "reload", this.evOnPanelReload, this);
			sap.ui.getCore().getEventBus().unsubscribe("ContentPanel", "reorgStart", this.evOnPanelReorgStart, this);
			sap.ui.getCore().getEventBus().unsubscribe("ContentPanel", "reorgEnd", this.evOnPanelReorgEnd, this);

			//	this.getView().byId('actionSheet').destroy();
			//	this.getView().byId('OperationSteps').destroy();
			//	this.getView().byId('ObjectPageLayout').destroy();

		},

		evOnPanelReload: function (channel, event, data) {
			//	this.getView().byId('ContentPanel').fireExpand({ 'expand': true });
			this.getView().byId('ContentPanel').setExpanded(false);
			this.getView().byId('ContentPanel').setExpanded(true);
		},


		evOnPanelReorgStart: function (channel, event, data) {
			mApp.get().oData.reorg = true;
			mApp.get().refresh(true);
		},

		evOnPanelReorgEnd: function (channel, event, data) {
			mApp.get().oData.reorg = false;
			mApp.get().refresh(true);
		},



		timeFormat: DateFormat.getTimeInstance({
			pattern: "hh:mm:ss"
		}),

		dateFormat: DateFormat.getDateInstance(),

		formatTime: function (time) {
			if (time)
				return controller.timeFormat.format(new Date(time.ms));
			else
				return "";
		},

		formatDate: function (date) {
			return controller.dateFormat.format(date);
		},

		applySubOperationStyle: function (status, control) {
			var styleClass = "";

			control.removeStyleClass("ulaActionMenuBlue");
			control.removeStyleClass("ulaActionMenuGreen");
			control.removeStyleClass("ulaActionMenuBrown");
			control.removeStyleClass("ulaActionMenuGray");
			control.removeStyleClass("ulaActionMenuRed");

			switch (status) {
				case "":
					styleClass = "ulaActionMenuBlue";
					break;
				case "N":
					styleClass = "ulaActionMenuBlue";
					break;
				case "S":
					styleClass = "ulaActionMenuGreen";
					break;
				case "K":
					styleClass = "ulaActionMenuBrown";
					break;
				case "C":
					styleClass = "ulaActionMenuGray";
					break;
				case "H":
					styleClass = "ulaActionMenuRed";
					break;
			}

			control.addStyleClass(styleClass);
		},


		getMenuButtonStyle: function (status, control) {
			var styleClass = "";

			switch (status) {
				case "":
					styleClass = "background: rgb(9, 96, 183) !important;color: white !important;";
					break;
				case "N":
					styleClass = "background: rgb(9, 96, 183) !important;color: white !important;";
					break;
				case "S":
					styleClass = "background: rgb(66, 106, 2) !important;color: white !important;";
					break;
				case "K":
					styleClass = "background: rgb(108, 67, 16) !important;color: white !important;";
					break;
				case "C":
					styleClass = "background: rgb(111, 111, 111) !important;color: white !important;";
					break;
				case "H":
					styleClass = "background: rgb(190, 0, 24) !important;color : white !important;";
					break;
			}

			return styleClass;
		},

		onToggleFullScreen: function (oEvent) {
			mApp.toggleFullScreen(oEvent);
		},
		onCloseDetail: function (oEvent) {
			sap.ui.getCore().getEventBus().publish("TocList", "itemClosed", null);
			mApp.closeDetail(oEvent);
		},

		fmtShowStepActionButton: function (d) {
			var _a = mApp.get().oData;
			return this.formatter.fmtShowStepActionButton(d, _a);
		},

		fmtShowStepActionMenuButton: function (d) {
			var _a = mApp.get().oData;
			return this.formatter.fmtShowStepActionMenuButton(d, _a);
		},
		fmtShowOpReviseAction: function (d) {
			var _a = mApp.get().oData;
			//var _d = this.getModel('detail').oData;
			return this.formatter.fmtShowOpReviseAction(d, _a);
		},
		fmtShowOpAddStep: function (d) {
			var _a = mApp.get().oData;
			//var _d = this.getModel('detail').oData;
			return this.formatter.fmtShowOpAddStepAction(d, _a);
		},
		fmtShowOpEditAction: function (d) {
			var _a = mApp.get().oData;
			//var _d = this.getModel('detail').oData;
			return this.formatter.fmtShowOpEditAction(d, _a);
		},
		fmtShowOpDeleteAction: function (d) {
			var _a = mApp.get().oData;
			//var _d = this.getModel('detail').oData;
			return this.formatter.fmtShowOpDeleteAction(d, _a);
		},
		doAddOperation: function (oEvent) {
			sap.ui.getCore().getEventBus().publish("TocList", "addOperation", oEvent);
		},
		doCopyOperation: function (oEvent) {
			sap.ui.getCore().getEventBus().publish("TocList", "copyOperation", oEvent);
		},
		doDeleteOperation: function (oEvent) {
			sap.ui.getCore().getEventBus().publish("TocList", "deleteOperation", oEvent);
		},
		doReviseOperation: function (oEvent) {
			sap.ui.getCore().getEventBus().publish("TocList", "reviseOperation", oEvent);
		},
		doChangeOperation: function (oEvent) {
			sap.ui.getCore().getEventBus().publish("TocList", "changeOperation", oEvent);
		},


		//		createContentControl: function(sId, oContext) {
		//			return ContentRenderer.createContentControl(sId, oContext);
		//		}




	},
		WorkStepHandler,
		OperationHandler,
		OrderHandler,
		oCRev,
		//ContentRenderer,
		//BuyoffHandler, 
		//PartsHandler, 
		//SpecificationHandler, ToolHandler, LaborHandler, 
		//ThumbnailHandler, 
		//RichTextHandler, 
		//StandardTextHandler, NotesHandler, 
		//AttachmentsHandler, 
		//OrderHandler, 
		//	QNoteHandler
	)
	);

	// return newController;

});
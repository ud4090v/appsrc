sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"ula/mes/common/controller/baseController",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	"sap/ui/core/Fragment",
	'ula/mes/order/maint/model/model-app',
	'ula/mes/order/maint/model/model-ord',
	"ula/mes/common/Teamcenter/tc",
	"ula/mes/order/maint/controller/mixins/OperationHandler",
	"ula/mes/order/maint/controller/mixins/OrderHandler",
	"ula/mes/order/maint/controller/mixins/OrderCreateRevision",
	'sap/m/MessageBox',
	"ula/mes/common/model/Utils",
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, Fragment, mApp, mOrd, tcApi,
	OperationHandler,
	OrderHandler,
	OrderCreateRevision,
	MessageBox,
	CommonUtils) {
	"use strict";

	return Controller.extend("ula.mes.order.maint.controller.Master", $.extend({
		// selectedItem: null,
		// selectedStep: null,
		_eventMenu: null,
		_sPath: null,
		Hdr: null,
		SubHdr: null,
		// selectedIndex: 0,
		// selectedOp: '00000',
		currentItem: null,
		newItemId: null,
		searchDialog: {
			Type: null,
			Context: null,
			NoCommit: false,
			Model: null,
			Control: null,
			eventSelector: null
		},
		newRevDlg: {
			Model: null,
			Control: null,
		},


		onInit: function () {
			var _self = this;
			// this.List = this.getView().byId('MESOrdOps');
			this.setOpList();
			// this.opList = this.getView().byId('MESOrdOps');

			this.getView().setModel(mOrd.get());
			//this.oRouter = this.getOwnerComponent().getRouter();
			this._bDescendingSort = false;
			// this.selectedItem = this.List.getSelectedItem();
			this._setSelectedItem(this._listGetSelectedItem());
			// this.selectedItem = this._listGetSelectedItem();

			sap.ui.getCore().getEventBus().subscribe("TocList", "itemClosed", this.evOnItemClosed, this);
			sap.ui.getCore().getEventBus().subscribe("TocList", "itemAdded", this.evOnItemAdded, this);
			sap.ui.getCore().getEventBus().subscribe("TocList", "itemSelected", this.evOnItemSelected, this);
			sap.ui.getCore().getEventBus().subscribe("TocList", "addOperation", this.evOnAddOperation, this);
			sap.ui.getCore().getEventBus().subscribe("TocList", "copyOperation", this.evOnCopyOperation, this);
			sap.ui.getCore().getEventBus().subscribe("TocList", "deleteOperation", this.evOnDeleteOperation, this);
			sap.ui.getCore().getEventBus().subscribe("TocList", "changeOperation", this.evOnChangeOperation, this);
			sap.ui.getCore().getEventBus().subscribe("TocList", "reviseOperation", this.evOnReviseOperation, this);

			$(window).bind('beforeunload', function () {
				console.log('before unload');
				_self.onExit();
			});

			var component = this.getOwnerComponent();
			component.setModel(new JSONModel(), "FavouritesModel");
			CommonUtils.getPersonalizationValue("Favourites").then(function (data) {
				component.getModel("FavouritesModel").setProperty("/Map", data);
			});

			var OperationStatusInfoLabel = this.byId("OperationStatusInfoLabel");

			OperationStatusInfoLabel.addDelegate({
				onAfterRendering: function (oEvent) {
					var
						control = oEvent.srcControl,
						_ctx = control.getBindingContext(),
						status = (_ctx) ? _ctx.getObject().Status : '';

					_self.formatter.applyOperationStyle(status, control);
				}
			}, false, OperationStatusInfoLabel, true);



			// this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			// this.getRouter().getRoute("stepmaster").attachPatternMatched(this._onMasterMatched, this);

			this.getOwnerComponent().getRouter().attachRouteMatched(this._onMasterMatched, this);

		},
		_onMasterMatched: function (oEvent) {

			// if (oEvent.getParameter("name") === "master" || oEvent.getParameter("name") === "stepmaster") {
				var oFilter = mApp.getMasterFilter();

				var _selItem = (parseInt(oEvent.getParameter('arguments').OperationNo) === 0) ? null : oEvent.getParameter('arguments').OperationNo;
				var _selStep = (parseInt(oEvent.getParameter('arguments').SubOperationNo) === 0) ? null : oEvent.getParameter('arguments').SubOperationNo;

				this._setSelectedItem(_selItem);
				this._setSelectedStep(_selStep);

				this.renderer.initializeContent();

				var oFilter = mApp.getMasterFilter();
				this._listBindItems(oFilter);

				mApp.get().oData.OrderRevNo = mApp.rev_id;

				this.byId('MESOrdRevSel').bindItems({
					path: "/OrderRevisionSet",
					template: this.byId('MESSelTpl'),
					filters: mApp.getMasterOrderSelFilter()
				});
			// }

		},

		evOnAddOperation: function (channel, event, data) {
			this.onAddOper(data);
		},
		evOnCopyOperation: function (channel, event, data) {
			this.onCopyOper(data);
		},
		evOnDeleteOperation: function (channel, event, data) {
			this.onDeleteOper(data);
		},
		evOnReviseOperation: function (channel, event, data) {
			this.onReviseOper(data);
		},
		evOnChangeOperation: function (channel, event, data) {
			this.onChangeOper(data);
		},


		evOnItemSelected: function (channel, event, data) {
			var _selItem = data.OperationNo || null;
			this._setSelectedItem(_selItem);
			// this.selectedItem = data.OperationNo || null;
		},

		handleMessagePopoverPress: function (oEvent) {
			var oMessageTemplate = new sap.m.MessageItem({
				type: '{app>type}',
				title: '{app>Title}',
				activeTitle: "{app>active}",
				description: '{app>Description}',
				subtitle: '{app>Location}',
				counter: '{app>counter}'
			});
			var oMessagePopover = new sap.m.MessagePopover({
				items: {
					path: 'app>/Errors',
					template: oMessageTemplate,
				},
				itemSelect: this.onMessagePopoverSelect
			})
			oEvent.oSource.addDependent(oMessagePopover);
			oMessagePopover.toggle(oEvent.getSource());
		},

		onMessagePopoverSelect: function (oEvent) {
			var oItem = oEvent.getParameter("item"),
				object = oItem.getBindingContext("app").getObject();

			if (object.Link) {
				var link = new Link({
					text: 'Go to Teamcenter',
					href: object.Link,
					target: "_blank"
				});
				oItem.setLink(link);
			}
		},

		// _renderHeader: function() {
		// 	var _self = this;

		// 	if (this.Hdr) {
		// 		this.Hdr.removeAllContent();
		// 		this.Hdr = null;
		// 	}

		// 	this._getHdrFragment('order_header').then(function(oVBox) {
		// 		sap.ui.getCore().byId('mPage').insertContent(oVBox);
		// 		//_self.Hdr=oVBox;
		// 	});


		// },



		setSelected: function (oEvent) {
			var _list = this.getOpList();
			var _selItem = this._getSelectedItem();
			var _sel = _list.getSelectedItem();
			var _lstSelItm = (_sel)?_sel.getBindingContext().getObject().OperationNo:null;

			if (_selItem && parseInt(_selItem) !== 0 && _selItem !== _lstSelItm) {
				var _arr = this._listGetItems();
				var found = (_arr) ? _arr.find(function (element) {
					return (element.getBindingContextPath()) ? (element.getBindingContext().oModel.getProperty(element.getBindingContextPath() + "/OperationNo") == _selItem) : false;
				}) : false;
				if (found) {
					this._listSetSelectedItem(found);
				}
			} else {
				if(_lstSelItm && parseInt(_lstSelItm)!==0) {
					this._setSelectedItem(_lstSelItm);
				} else {
					this._listSelectFirstItem();
				}
			}
		},

		evOnItemClosed: function (channel, event, data) {
			this._listClearSelection();
			// this.List.removeSelections();
			// this._clearSelectedItem();
			// this.selectedItem = null;
			// this.selectedIndex = 0;
			this.currentItem = null;
		},

		evOnItemAdded: function (channel, event, data) {
			this._setSelectedItem(data.item.Guid);
			// this.selectedItem = data.item.Guid;
		},


		onUpdateFinished: function (oEvent) {
			var self = this;
			setTimeout(function (handler) {
				self.closeLoader();
				//handler.initList();   "Implement later - set auto-selected item and such"
			}, 0, this);

		},

		handleSelectedItem: function (oEvent) {
			// this.selectedIndex = this._listGetItems().indexOf(oEvent.getParameter('listItem'));
			// this.selectedIndex = this.List.getItems().indexOf(oEvent.getParameter('listItem'));
			this.newItem = null;
			this.processSelectedItem(oEvent.getParameter('listItem'))
		},

		onRefreshSubmitPress: function (oEvent) {
			mOrd.get().refresh();
		},
		processSelectedItem: function (item) {

			var item = item || this._listGetSelectedItem();
			this.currentItem = this._listGetSelectedItem();
			this._clearSelectedStep();

			var sPath = item.getBindingContextPath();
			var selectedRecord = mOrd.getByPath(sPath);
			selectedRecord["sPath"] = sPath;
			var repId = selectedRecord.OperationNo;
			//if(sap.ui.Device.system.desktop) {
			mApp.setLayoutTwoColumns();
			// var jModel = new sap.ui.model.json.JSONModel(selectedRecord);
			// sap.ui.core.Component.getOwnerComponentFor(this.getView().getParent()).setModel(jModel, 'detail');

			// if(_step){
			// 	sap.ui.core.Component.getOwnerComponentFor(this.getView().getParent()).getRouter().navTo("stepDetail", {
			// 		OperationNo: repId,
			// 		SubOperationNo: _step
			// 	}, true);
			// } else {
			// sap.ui.core.Component.getOwnerComponentFor(this.getView().getParent()).getRouter().navTo("master", {
			// 	OrderNo: mApp.get().oData.OrderNo,
			// 	OperationNo: repId
			// }, true);

			this.getOwnerComponent().getRouter().navTo("detail", {
				OperationNo: repId
			}, true);

		},

		addItemDialog: function (oEvent) {

			//		this.searchDialog.Control
			//			|| (this.searchDialog.Control = sap.ui
			//				//.jsfragment("z_ces_rpt.fragment.addLine", this));
			//				.jsfragment("ula.mes.order.maint.fragment.newItem", this));
			//		this.searchDialog.NoCommit = !1;
			//		_d.openDialog(this.searchDialog, this.searchDialog.NoCommit);

		},

		onSaveNewItem: function (oEvent) {
			// used in newItem fragment
			//			var _self = this;
			//			var itemData = {
			//				Guid: "",
			//				MasterId: _self.searchDialog.Model.oData.reportId,
			//				ReportName: '',
			//				EventId: _self.searchDialog.Model.oData.eventId,
			//				VariantTitle: _self.searchDialog.Model.oData.title,
			//				NotifyEmail: mApp.get().oData.Email
			//			}
			//
			//			mOrd.addItem({ "Data": itemData })
			//				.done(function(data) {
			//					_self.selectedIndex = -1;
			//					_self.newItemId = data.GP_ID;
			//					_d.destroyDialog(_self.searchDialog);
			//				});
		},

		onSearch: function (oEvent) {
			//	var oTableSearchState = [],
			//		sQuery = oEvent.getParameter("query");
			//
			//		if (sQuery && sQuery.length > 0) {
			//			oTableSearchState = [new Filter("Name", FilterOperator.Contains, sQuery)];
			//		}

			//		this.getView().byId("opTable").getBinding("items").filter(oTableSearchState, "Application");
		},

		onAdd: function (oEvent) {
			//		MessageBox.show("This functionality is not ready yet.", {
			//			icon: MessageBox.Icon.INFORMATION,
			//			title: "Aw, Snap!",
			//			actions: [MessageBox.Action.OK]
			//		});
		},
		onOpListUpdateFinished: function (oEvent) {
			this.closeLoader();
			if (oEvent.getParameter('reason') === 'Growing') {
				jQuery('#' + oEvent.oSource.getItems()[oEvent.oSource.getItems().length - 1].sId).focus()
			}
			this.setSelected(oEvent);
		},

		onOperationSelected: function (oEvent) {
			if (!mOrd.get().hasPendingChanges()) {
				this.handleSelectedItem(oEvent);
				//oController.selectedIndex = oController.List.getItems().indexOf(oEvent.getParameter('listItem'));
				//oController.newItem=null;
				//oController.selectedItem(oEvent.getParameter('listItem'));					
			} else {
				sap.m.MessageBox.confirm(
					this.getResourceText('dataLossWarning'), {
					title: this.getResourceText('dataLossTitle'),
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							this.handleSelectedItem(oEvent);
						} else {
							this._listSetSelectedItem(this.currentItem);
							// this.List.setSelectedItem(this.currentItem, true);
						}
					}

				})
			}
		},

		onSort: function (oEvent) {
			this._bDescendingSort = !this._bDescendingSort;
			var oView = this.getView(),
				oTable = oView.byId("opTable"),
				oBinding = oTable.getBinding("items"),
				oSorter = new Sorter("OperationNo", this._bDescendingSort);

			oBinding.sort(oSorter);
		},
		onExit: function () {
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "itemClosed", this.evOnItemClosed, this);
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "itemAdded", this.evOnItemAdded, this);
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "itemSelected", this.evOnItemSelected, this);
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "addOperation", this.evOnAddOperation, this);
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "copyOperation", this.evOnCopyOperation, this);
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "deleteOperation", this.evOnDeleteOperation, this);
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "changeOperation", this.evOnChangeOperation, this);
			sap.ui.getCore().getEventBus().unsubscribe("TocList", "reviseOperation", this.evOnReviseOperation, this);

			this.unlockOrder();

		},


		onRevMenuAction: function (oEvent) {
		},
		handleFavorite: function () {
			CommonUtils.setPersonalizationValue("Favourites", this.getModel("uiModel").getData().Group);
		},
		isGroupFavourite: function (group) {
			return !!this.getView().getModel("FavouritesModel").getProperty("/Map/" + group);
		},
		isFavorite: function (group) {
			return !!this.getModel("FavouritesModel").getProperty("/Map/" + group) ? "sap-icon://favorite" : "sap-icon://unfavorite";
		},
		fmtRevStat: function (status) {
			switch (status) {
				case 'REVISE': return sap.ui.core.ValueState.Success; break;
				case 'REVIEW': return sap.ui.core.ValueState.Warning; break;
				case 'RELEASED': return sap.ui.core.ValueState.Information; break;
				case 'ARCHIVED': return sap.ui.core.ValueState.None; break;
				default: return sap.ui.core.ValueState.None;
			}
		},
		toggleFavourites: function (oEvent) {
			var controller = this;
			var map = controller.getView().getModel("FavouritesModel").getProperty("/Map") || {},
				group = mApp.get().oData.Group;

			if (map[group]) {
				delete map[group];
			} else {
				map[group] = {};
			}

			CommonUtils.setPersonalizationValue("Favourites", map);

			oEvent.getSource().getBinding("icon").checkUpdate(true);
		},



	},
		OperationHandler,
		OrderHandler,
		OrderCreateRevision
	));
});


sap.ui.define(
	[
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		'sap/ui/model/json/JSONModel',
		"sap/ui/core/Fragment",
		"ula/mes/order/maint/model/model-app",
		"ula/mes/order/maint/model/model-ord",
		"ula/mes/common/Teamcenter/tc",
		'sap/m/MessageBox'
	],
	function (Filter, FilterOperator, JSONModel, Fragment, mApp, mOrd, tcApi, MessageBox) {

		'use strict';

		return {

			handleCreateRevision: function (oEvent) {

				var _self = this;

				this.lockOrderForRevise()
				.done(function (oData) {
					_self.oApproveDialog = new sap.m.Dialog({
						type: sap.m.DialogType.Message,
						title: _self.getResourceText('confDevTitle'),
						content: new sap.m.Text({ text: _self.getResourceText('confDevtype') })
					});
	
					_self.oApproveDialog.addButton(new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "Permanent",
						enabled: true,
						press: function () {
							_self.newRevisionDialog({ type: 'PERMANENT' });
							_self.oApproveDialog.close();
						}.bind(_self)
					}));
	
					_self.oApproveDialog.addButton(new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "Temporary",
						press: function () {
							_self.newRevisionDialog({ type: 'TEMPORARY' });
							_self.oApproveDialog.close();
						}.bind(_self)
					}));
	
					_self.oApproveDialog.addButton(new sap.m.Button({
						text: "Cancel",
						press: function () {
							_self.unlockOrder();
							_self.oApproveDialog.close();
						}.bind(_self)
					}));
	
					sap.ui.core.BusyIndicator.hide();
					_self.oApproveDialog.open();
	
					return;
					
				})
				.fail(function (oError) {

					sap.ui.core.BusyIndicator.hide();

					_self.showLockMsg({'error':oError,'cb':function(sAction){
						controller.oReviewSubmitDialog.close();
						sap.ui.core.BusyIndicator.hide();
					}})

				})

			},


			newRevisionDialog: function (data) {
				var _self = this;
				var _app = mApp.get().oData;
				var _rev = (Number(_app.OrderRevNo) + 1).toFixed(0);
				sap.ui.core.BusyIndicator.show();
				//		debugger;

				this.newRevDlg.model = new sap.ui.model.json.JSONModel({
					deviation: data.type,
					DevTxt: data.type,
					OrderNo: mApp.get().oData.OrderNo,
					OrbitsMCN: null,
					RevNo: mApp.get().oData.OrderRevNo,
					NewRevNo: _rev,
					createTCRev: true,
					createOrder: false,
					mcn: null,
					title: null,
					instructions: null
				});

				tcApi.call('MBE_GetOrderRevisions', {
					"plan_sap_group": _app.Group,		//(SAP Group)
					"plan_sap_order": _app.OrderNo
				}, true)
					.done(function (data) {
						// loop through revisions and see if the revision already exist
						sap.ui.core.BusyIndicator.hide();
						if(data){
							_self.newRevDlg.model.oData.createOrder = false;
							var i = data[0].revisions.find(function (v, i) { return v.plan_revision === _rev });
							if (i) {
								_self.newRevDlg.model.oData.createTCRev = false;
								_self.newRevDlg.model.oData.OrbitsMCN = i.cn_item_id;
								_self.newRevDlg.model.refresh(true);
								_self.byId("navCon").to(_self.byId("p4"));
							} else {
								//						data[0].revisions.sort(function(a,b){
								//							var _a = Number(a.plan_revision); 
								//							var _b = Number(b.plan_revision); 
								//							return b-a;
								//						});
								var _last = data[0].revisions.pop();
								var _r = Number(_last.plan_revision);
								_last.release_status = _last.release_status || 'RELEASED';
								if (_r === Number(_app.OrderRevNo)) {
									if (_last.release_status.toUpperCase() === 'RELEASED') {
										// revisions in synch - all good
									} else {
										sap.m.MessageToast.show('TC Order Revision(' + data[0].revisions[0].plan_revision + ') status is not Released.', {
											duration: 10000
										});
										_self.unlockOrder();
										_self.byId("NewRevDialog").close();
									}
								} else {
									sap.m.MessageToast.show('SAP Order Revision is not the same as TC Order Revision. Manual adjustment is needed.', {
										duration: 10000
									});
									_self.unlockOrder();
									_self.byId("NewRevDialog").close();
	
								}
							}	
						} else {
							_self.newRevDlg.model.oData.createOrder = true;
							_self.newRevDlg.model.refresh(true);
							_self.byId("navCon").to(_self.byId("p3"));    //create New MCN	
							_self.byId("PlanRevMCNCreate").setVisible(true);
						    _self.byId("PlanRevMCNEdit").setVisible(false);
						}
					})
					.fail(function (e) {
						sap.ui.core.BusyIndicator.hide();
						_self.newRevDlg.model.oData.createOrder = true;
						_self.newRevDlg.model.refresh(true);
						_self.byId("navCon").to(_self.byId("p3"));    //create New MCN
						_self.byId("PlanRevMCNCreate").setVisible(true);
						_self.byId("PlanRevMCNEdit").setVisible(false);
					})


				var fnOpenDialog = function () {
					_self.byId("NewRevDialog").bindElement({
						path: '/',
						model: "ctx"
					});

					_self.byId("NewRevDialog").open();
					_self.byId("navCon").to(_self.byId("p1"));
				};

				if (!_self.byId("NewRevDialog")) {
					Fragment.load({
						id: _self.getView().getId(),
						name: "ula.mes.order.maint.view.fragments.AddPlanRev",
						controller: _self
					}).then(function (oDialog) {
						oDialog.setModel(_self.newRevDlg.model, 'ctx');
						_self.getView().addDependent(oDialog);
						fnOpenDialog();
					});
				} else {
					fnOpenDialog();
				}


			},

			useExisitngMCN: function (oEvent) {
				var _self = this;
				sap.ui.core.BusyIndicator.show();
				var _m = mApp.get().oData;

				tcApi.call('MBE_GetMCNForOrder', {
					"plan_sap_order": _m.OrderNo,
					"plan_revision": _m.OrderRevNo,
				}, true)
					.done(function (data) {
						sap.ui.core.BusyIndicator.hide();
						_self.byId("MCNList").setModel(new JSONModel(data[0].MCN), "mcnListModel");
					})
					.fail(function (e) {
						sap.m.MessageBox.show("There was a problem processing the request. \n Server has responded with the following message: \n " + e.errorCategory + ":" + e.errorDesc + " \n Severity: " + e.errorSeverity, {
							icon: e.errorCategory,
							title: "Operation Failed"
						});

						sap.ui.core.BusyIndicator.hide();

					})

				_self.byId("navCon").to(_self.byId("p2"));

			},
			createNewMCN: function (oEvent) {
				this.byId("navCon").to(this.byId("p3"));
			    this.byId("PlanRevMCNCreate").setVisible(true);
				this.byId("PlanRevMCNEdit").setVisible(false);
			},

			navToPage1NewPlanDialog: function (oEvent) {
				this.byId("navCon").to(this.byId("p1"));
			},

			cancelNewPlanDialog: function () {
				this.unlockOrder();
				this.byId("NewRevDialog").close();
			},

			onCreateRev: function (data) {
				var _self = this;

				this.oMCNDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: this.getResourceText('mcnTitle'),
					content: new sap.m.Text({ text: _self.getResourceText('mcnText') })
				});

				this.oMCNDialog.addButton(new sap.m.Button({
					type: sap.m.ButtonType.Emphasized,
					text: "Use Existing MCN",
					press: function () {
						data.op = 'E';
						this.onCreateMCN(data);
						this.oMCNDialog.close();
					}.bind(this)
				}));

				this.oMCNDialog.addButton(new sap.m.Button({
					type: sap.m.ButtonType.Emphasized,
					text: "Create New MCN",
					press: function () {
						data.op = 'C';
						this.onCreateMCN(data);
						this.oMCNDialog.close();
					}.bind(this)
				}));

				this.oMCNDialog.addButton(new sap.m.Button({
					text: "Cancel",
					press: function () {
						this.unlockOrder();
						this.oMCNDialog.close();
					}.bind(this)
				}));

				sap.ui.core.BusyIndicator.hide();
				this.oMCNDialog.open();

				return;


			},

			saveNewMCN: function (oEvent) {
				var _self = this;
				var //title = _self.byId("Title").getValue(),
					title = "",	
					instructions = _self.byId("Instructions").getValue();

				var backendCtx = oEvent.getSource().getBindingContext("backend");

				if(instructions.trim().length < 3){
					sap.m.MessageBox.show("Description is empty. To create a new MCN please provide a description of the change", {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Missing Description"
					});
					_self.unlockOrder();
					return false;
				}




				sap.ui.core.BusyIndicator.show();

				tcApi.call('MBE_CreateMCN', {
				//	"cn_title": title,
					"cn_instructions": instructions,
					"cn_sap_plant": mApp.get().oData.Plant
				})
					//				tcApi.createMCN({
					//					"cn_title": title,
					//					"cn_instructions": instructions,
					//					"cn_sap_plant": mApp.get().oData.Plant
					//				})
					.done(function (data) {
						sap.ui.core.BusyIndicator.hide();
						_self.byId("NewRevDialog").getModel('ctx').oData.OrbitsMCN = data[0].item_id;
						_self.byId("NewRevDialog").getModel('ctx').oData.mcnUID = data[0].UID;
						_self.byId("NewRevDialog").getModel('ctx').refresh(true);
						_self.createNewPlanRevision();
						//_self.byId("navCon").to(_self.byId("p4"));
					})
					.fail(function (e) {
						sap.m.MessageBox.show("There was a problem processing the request. \n Server has responded with the following message: \n " + e.errorCategory + ":" + e.errorDesc + " \n Severity: " + e.errorSeverity, {
							icon: e.errorCategory,
							title: "Operation Failed"
						});
						_self.unlockOrder();
						sap.ui.core.BusyIndicator.hide();
						//						sap.m.MessageToast.show(e.errorDesc, {
						//							duration: 10000
						//						});
					})


			},
			navToPage2NewPlanDialog: function (oEvent) {
				this.byId("navCon").to(this.byId("p2"));
			},

            handleMCNEdit: function(oEvent){
	            var _self = this;
	            var fnOpenDialog = function () {
						_self.byId("NewRevDialog").bindElement({
							path: '/',
							model: "ctx"
						});
	                    
						_self.byId("NewRevDialog").open();
						_self.byId("navCon").to(_self.byId("p3"));
						_self.byId("PlanRevMCNCreate").setVisible(false);
						_self.byId("PlanRevMCNEdit").setVisible(true);
					};
	
					if (!_self.byId("NewRevDialog")) {
						Fragment.load({
							id: _self.getView().getId(),
							name: "ula.mes.order.maint.view.fragments.AddPlanRev",
							controller: _self
						}).then(function (oDialog) {
							oDialog.setModel(_self.newRevDlg.model, 'ctx');
							_self.getView().addDependent(oDialog);
							fnOpenDialog();
						});
					} else {
						fnOpenDialog();
					}
            },
            
			createNewPlanRevision: function (oEvent) {
				var _self = this;
				var _app = mApp.get().oData;
				var _m = _self.byId("NewRevDialog").getModel('ctx').oData;
				var _rev = (Number(_app.OrderRevNo) + 1).toFixed(0);
				var revData = {
					OrderNo: _m.OrderNo,
					Mcn: _m.OrbitsMCN,
					McnUID: _m.mcnUID,
					DevType: _m.deviation,
					OrderRevNo: _m.NewRevNo
				}

				sap.ui.core.BusyIndicator.show();

				this.createNewOrderRevision({
					"plan_item_id": _app.Material, 	//(SAP Material Number)
					"plan_sap_group": _app.Group,		//(SAP Group)
					"plan_sap_plant": _app.Plant,
					"plan_sap_type": "N",
					"plan_sap_order": _app.OrderNo,
					"sap_order_revision": revData.OrderRevNo,
					"plan_revision": _app.GroupCounter,
					"sap_order_revision": revData.OrderRevNo,
					"plan_object_name": _app.MaterialDescription, 	//(SAP Material Name)
					"cn_item_id": _m.OrbitsMCN,
					"plan_sap_subtype": _app.PlanSubtype,
					"createNewOrder": _m.createOrder,
					"createNewRevision": _m.createTCRev,
					"cn_item_uid":_m.mcnUID
				})
					.done(function (data) {

						mOrd.addRevision({ "Data": revData })

							.done(function (data) {
								sap.ui.core.BusyIndicator.hide();
								var confirmationDialog = new sap.m.Dialog({
									type: sap.m.DialogType.Message,
									title: "Order Revision Created",
									draggable: true,
									content: new sap.m.VBox(
										{
											items: [
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Order:" }), new sap.m.Text({ text: data.OrderNo })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Plan Number:" }), new sap.m.Text({ text: data.Material })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Site:" }), new sap.m.Text({ text: data.Plant })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Type:" }), new sap.m.Text({ text: data.PlanSubtype })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Order Revision:" }), new sap.m.Text({ text: data.OrderRevNo })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "MCN:" }), new sap.m.Link({ text: data.Mcn, href:data.TCLink.concat('uid=',revData.McnUID), target:"_blank" })] }),
											]
										}
									),

									endButton: new sap.m.Button({
										text: 'Close',
										press: function () {
											_self.byId("NewRevDialog").close();
											_self.unlockOrder();
											confirmationDialog.close();
											mApp.order_id = data.OrderNo;
											mApp.rev_id = data.OrderRevNo;

											mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
												.done(function (oData, response) {
													mApp.setContextData(oData);
													// sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
													// 	OrderNo: mApp.get().oData.OrderNo,
													// 	OperationNo: '00000'
													// }, true);
													var _nav = _self.getOwnerComponent().getModel('xnav').oData;

													var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");

													return oCrossAppNav.toExternal({
														target: { semanticObject: 'ZMES_ORDER', action: 'maintain' },
														params: { "OrderNo": mApp.order_id, "OrderRevNo": mApp.rev_id,  caller:_nav.caller }
													});
									
												});

										}
									})
								});

								confirmationDialog.open();
							})
							.fail(function (e) {
								sap.m.MessageBox.show("There was an error creating the order.", {
									icon: e.errorCategory,
									title: "Operation Failed"
								});
								_self.unlockOrder();
								sap.ui.core.BusyIndicator.hide();
							})
		
							
					})
					.fail(function (e) {
						sap.m.MessageBox.show("There was a problem processing the request. \n Server has responded with the following message: \n " + e.errorCategory + " :" + e.errorDesc + " \n Severity: " + e.errorSeverity, {
							icon: e.errorCategory,
							title: "Operation Failed"
						});
						_self.unlockOrder();

						sap.ui.core.BusyIndicator.hide();


					})

			},

			addPlanRevision: function (oEvent) {
				var _self = this;
				// var _app = mApp.get().oData;
				var _m = _self.byId("NewRevDialog").getModel('ctx').oData;
				// var _rev = (Number(_app.OrderRevNo) + 1).toFixed(0);
				var revData = {
					OrderNo: _m.OrderNo,
					Mcn: _m.OrbitsMCN,
					McnUID: _m.mcnUID,
					DevType: _m.deviation,
					OrderRevNo: _m.NewRevNo
				}

				sap.ui.core.BusyIndicator.show();

				// this.createNewOrderRevision({
				// 	"plan_item_id": _app.Material, 	//(SAP Material Number)
				// 	"plan_sap_group": _app.Group,		//(SAP Group)
				// 	"plan_sap_plant": _app.Plant,
				// 	"plan_sap_type": "N",
				// 	"plan_sap_order": _app.OrderNo,
				// 	"sap_order_revision": revData.OrderRevNo,
				// 	"plan_revision": _app.GroupCounter,
				// 	"sap_order_revision": revData.OrderRevNo,
				// 	"plan_object_name": _app.MaterialDescription, 	//(SAP Material Name)
				// 	"cn_item_id": _m.OrbitsMCN,
				// 	"plan_sap_subtype": _app.PlanSubtype,
				// 	"createNewOrder": _m.createOrder,
				// 	"createNewRevision": _m.createTCRev,
				// 	"cn_item_uid":_m.mcnUID
				// })
				 	// .done(function (data) {

						mOrd.addRevision({ "Data": revData })

							.done(function (data) {
								sap.ui.core.BusyIndicator.hide();
								var confirmationDialog = new sap.m.Dialog({
									type: sap.m.DialogType.Message,
									title: "Order Revision Created",
									draggable: true,
									content: new sap.m.VBox(
										{
											items: [
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Order:" }), new sap.m.Text({ text: data.OrderNo })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Plan Number:" }), new sap.m.Text({ text: data.Material })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Site:" }), new sap.m.Text({ text: data.Plant })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Type:" }), new sap.m.Text({ text: data.PlanSubtype })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "Order Revision:" }), new sap.m.Text({ text: data.OrderRevNo })] }),
												new sap.m.HBox({ items: [new sap.m.Label({ text: "MCN:" }), new sap.m.Link({ text: data.Mcn, href:data.TCLink.concat('uid=',revData.McnUID), target:"_blank" })] }),
											]
										}
									),

									endButton: new sap.m.Button({
										text: 'Close',
										press: function () {
											_self.byId("NewRevDialog").close();
											_self.unlockOrder();
											confirmationDialog.close();
											mApp.order_id = data.OrderNo;
											mApp.rev_id = data.OrderRevNo;

											mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
												.done(function (oData, response) {
													mApp.setContextData(oData);
													// sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
													// 	OrderNo: mApp.get().oData.OrderNo,
													// 	OperationNo: '00000'
													// }, true);
													var _nav = _self.getOwnerComponent().getModel('xnav').oData;

													var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");

													return oCrossAppNav.toExternal({
														target: { semanticObject: 'ZMES_ORDER', action: 'maintain' },
														params: { "OrderNo": mApp.order_id, "OrderRevNo": mApp.rev_id,  caller:_nav.caller }
													});
									
												});

										}
									})
								});

								confirmationDialog.open();
							})
							.fail(function (e) {
								sap.m.MessageBox.show("There was an error creating the order.", {
									icon: e.errorCategory,
									title: "Operation Failed"
								});
								_self.unlockOrder();
								sap.ui.core.BusyIndicator.hide();
							})
		
							
					// })
					// .fail(function (e) {
					// 	sap.m.MessageBox.show("There was a problem processing the request. \n Server has responded with the following message: \n " + e.errorCategory + " :" + e.errorDesc + " \n Severity: " + e.errorSeverity, {
					// 		icon: e.errorCategory,
					// 		title: "Operation Failed"
					// 	});
					// 	_self.unlockOrder();

					// 	sap.ui.core.BusyIndicator.hide();


					// })

			},


			onCreateMCN: function (data) {
				var _self = this;
				var _devType = null;

				var _sForm = new sap.ui.layout.form.SimpleForm({
					layout: "ResponsiveGridLayout",
					//title : "Charge Information",
					adjustLabelSpan: false,
					content: [
						new sap.m.Label({
							text: "Title"
						}),
						new sap.m.Input({
							type: "Text",
							value: "{input>/title}",
						}),
						new sap.m.Label({
							text: "Instructions"
						}),
						new sap.m.TextArea({
							value: "{input>/instr}",
							width: "100%"
						}),
					],

				});

				this.mcnDetDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: this.getResourceText('mcnTitle'),
					content: [_sForm]
				});

				this.mcnDetDialog.addButton(new sap.m.Button({
					type: sap.m.ButtonType.Emphasized,
					text: "Create",
					press: function () {
						//data.op='E';
						//this.onCreateMCN(data);
						this.mcnDetDialog.close();
					}.bind(this)
				}));

				this.mcnDetDialog.addButton(new sap.m.Button({
					type: sap.m.ButtonType.Emphasized,
					text: "Back",
					press: function () {
						//data.op='C';
						//this.onCreateMCN(data);
						// navigate to previous dialog
						this.mcnDetDialog.close();
					}.bind(this)
				}));

				this.mcnDetDialog.addButton(new sap.m.Button({
					text: "Cancel",
					press: function () {
						this.mcnDetDialog.close();
					}.bind(this)
				}));

				sap.ui.core.BusyIndicator.hide();
				this.mcnDetDialog.open();

				return;

			},


			createNewOrderRevision: function (data) {
				var newOrder = data.createNewOrder || false;

				return (newOrder) ? this._createNewOrder(data) : this._createOrderRevision(data);

			},
			_createNewOrder: function (dataObject) {
				var _promise = $.Deferred();

				tcApi.call('MBE_CreateOrder', dataObject)
					//		tcApi.createOrder(dataObject)
					.done(function (data) {
						_promise.resolve(data);
					})
					.fail(function (e) {
						_promise.reject(e);
					})

				return _promise;

			},

			_createOrderRevision: function (dataObject) {
				var _promise = $.Deferred();

				tcApi.call('MBE_CreateOrderRevision', dataObject)
					//				tcApi.createOrderRevision(dataObject)
					.done(function (data) {
						_promise.resolve(data);
					})
					.fail(function (e) {
						_promise.reject(e);
					})

				return _promise;
			}

		};
	}
);
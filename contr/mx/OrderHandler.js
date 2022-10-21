
sap.ui.define(
	[
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		'sap/ui/model/json/JSONModel',
		"sap/ui/core/Fragment",
		"ula/mes/order/maint/model/model-app",
		"ula/mes/order/maint/model/model-ord",
		"ula/mes/common/Teamcenter/tc",
		"ula/mes/common/model/Utils",
		'sap/m/MessageBox'
	],
	function (Filter, FilterOperator, JSONModel, Fragment, mApp, mOrd, tcApi, Utils, MessageBox) {

		'use strict';

		var printTemplate,
			controller;

		return {

			handleEditRevision: function (oevent) {
				mApp.setEditMode();
			},

			initPrintHandler: function () {
				$.get(jQuery.sap.getModulePath("ula.mes.order.maint") + "/print/PrintTemplate.html", function (template) {
					printTemplate = template;
				});

			},


			//			handleSaveOrder: function(oevent) {
			//				//sap.m.MessageToast.show('Toggle Edit Mode for the Order Revision');
			//				var _self = this;
			//
			//
			//				var _m = this.getView().getModel('detail').oData;
			//				var _opData = {
			//					OrderNo: mApp.get().oData.OrderNo,
			//					OrderRevNo: mApp.get().oData.OrderRevNo,
			//					OperationNo: _m.OperationNo,
			//					WorkCenter: _m.WorkCenter,
			//					OpText: _m.OpText,
			//					OpSetupTime: _m.OpSetupTime,
			//					OpRunTime: _m.OpRunTime,
			//					OpLaborTime: _m.OpLaborTime,
			//					Plant: _m.Plant,
			//					ControlKey: _m.ControlKey
			//				}
			//
			//				mOrd.changeOperation({ "Data": _opData })
			//
			//					.done(function(data) {
			//						mApp.setDisplayMode();
			//						sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
			//							OrderNo: mApp.get().oData.OrderNo
			//						}, true);
			//					})
			//					.fail(function(oError, oResponse) {
			//						sap.m.MessageToast.show("Error", {
			//							duration: 10000
			//						});
			//
			//					})
			//
			//
			//
			//			},
			_getHdrFragment: function (sFragmentName) {
				var pFormFragment = this.SubHdr,
					oView = this.getView();

				if (!pFormFragment) {
					pFormFragment = sap.ui.core.Fragment.load({
						id: oView.getId(),
						name: "ula.mes.order.maint.view.fragments." + sFragmentName,
						controller: this
					});
					this.SubHdr = pFormFragment;
				}

				return pFormFragment;
			},

			onRevChange: function (oEvent) {
				// var _revno = oEvent.getParameter('selectedItem').getKey();

				// var _item = oEvent.oSource.getSelectedItem();
				// var _sp = _item.getBindingContext().sPath;
				// var _data = _item.getBindingContext().oModel.getProperty(_sp);
				var _self = this;
				// var _ord = { "OrderNo": mApp.get().oData.OrderNo, "OrderRevNo": mApp.get().oData.OrderRevNo };


				mApp.rev_id = oEvent.getParameter('selectedItem').getKey();
				mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
					.done(function (oData, response) {
						mApp.setContextData(oData);
						sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
							OrderNo: mApp.get().oData.OrderNo,
							OperationNo: '00000'
						}, true);

					});



			},

			handleOrderRevisionsSelectPress: function (oEvent) {

				var oSourceControl = oEvent.getSource(),
					oControlDomRef = oEvent.oSource,
					oView = this.getView();

				controller = this;

				if (!this.oSelPopover) {
					sap.ui.core.Fragment.load({
						id: oView.getId(),
						type: "XML",
						name: "ula.mes.order.maint.view.fragments.revSelectPopover",
						controller: this
					}).then(function (oPopover) {
						controller.oSelPopover = oPopover;
						oView.addDependent(oPopover);
						oPopover.setModel(oSourceControl.getModel());
						oView.byId("oRevSel").getBinding('items').filter(mApp.getMasterOrderSelFilter());
						oPopover.openBy(oControlDomRef);
						//return oPopover;
					});
				}
				// this._pPopover.then(function (oPopover) {
				// 	oPopover.setModel(oSourceControl.getModel());
				// 	oPopover.openBy(oControlDomRef);
				// });

			},
			closeRevSelectionDialog: function () {
				//var oDialog = this.getView().byId('orderRevSel');
				if (controller.oSelPopover) {
					controller.oSelPopover.close();
					controller.oSelPopover.destroy();
					controller.oSelPopover = null;

				}

			},
			handleRevisionSelCancel: function (oEvent) {
				this.closeRevSelectionDialog();
			},

			handleRevisionSelect: function (oEvent) {
				var _item = oEvent.oSource.getSelectedItem();
				var _sp = _item.getBindingContext().sPath;
				var _data = _item.getBindingContext().oModel.getProperty(_sp);
				var _self = this;
				var _ord = { "OrderNo": mApp.get().oData.OrderNo, "OrderRevNo": mApp.get().oData.OrderRevNo };

				this.closeRevSelectionDialog();

				mApp.rev_id = _data.RevNo;
				mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
					.done(function (oData, response) {
						mApp.setContextData(oData);
						sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
							OrderNo: mApp.get().oData.OrderNo,
							OperationNo: '00000'
						}, true);

					});

				//				this.byId("orderRevSel").close();
			},
			onShowRevHistory: function (oEvent) {
				var _app = mApp.get().oData;

				controller = this;

				sap.ui.core.BusyIndicator.show();

				tcApi.call('MBE_GetMfgPlanRevisions', {
					"plan_sap_order": _app.OrderNo
				})
					.then(
						function (data) {
							sap.ui.core.BusyIndicator.hide();

							if (!controller.RevisionHistoryDialog) {
								controller.RevisionHistoryDialog = sap.ui.xmlfragment("ula.mes.common.view.fragments.RevisionHistoryDialog", controller);
								controller.getView().addDependent(controller.RevisionHistoryDialog);
							}

							controller.RevisionHistoryDialog.setModel(new JSONModel(data[0].revisions), "revisionHistory");

							controller.RevisionHistoryDialog.open();

						}, function (error) {
							sap.ui.core.BusyIndicator.hide();
						}
					);
			},

			onCloseRevisionHistoryDialog: function () {
				controller.RevisionHistoryDialog.close();
				controller.RevisionHistoryDialog.destroy();
				controller.RevisionHistoryDialog = null;
			},

			onEditMCN: function (oEvent) {
				var _app = mApp.get().oData;
				controller = this;

				sap.ui.core.BusyIndicator.show();

				tcApi.call('MBE_GetMCNDetails', {
					"OrbitsMCN": _app.Mcn,
				})
					.then(function (data) {
						controller.getView().setModel(new JSONModel({
							Material: _app.Material,
							Plant: _app.Plant,
							Group: _app.Group,
							GrpCntr: _app.GroupCounter,
							OrbitsMCN: _app.Mcn,
							editFlag: true,
							errorFlag: false,
							createFl: false,
							instructions: data.cn_list[0].CMSpecialInstruction
						}), "EditNewRevisionModel");

						if (!controller.byId("EditMCNDialog")) {
							Fragment.load({
								id: controller.getView().getId(),
								name: "ula.mes.common.view.fragments.EditMCN",
								controller: controller
							}).then(function (oDialog) {
								controller.getView().addDependent(oDialog);
								oDialog.bindElement({
									path: "/",
									model: "EditNewRevisionModel"
								});
								oDialog.open();
								sap.ui.core.BusyIndicator.hide();
							});
						} else {
							controller.byId("EditMCNDialog").open();
							sap.ui.core.BusyIndicator.hide();
						}
					});
			},

			editMCN: function (oEvent) {
				var _app = mApp.get().oData;
				var NewRevisionModel = oEvent.getSource().getModel("EditNewRevisionModel"),
					instructions = controller.byId("InstructionsEditMCN").getValue(),
					object = NewRevisionModel.getData();

				if (instructions === "") {
					controller.byId("InstructionsEditMCN").setValueState(sap.ui.core.ValueState.Error);
					controller.byId("InstructionsEditMCN").setValueStateText("Change Details is a required field.");
				} else {
					sap.ui.core.BusyIndicator.show();
					tcApi.call('MBE_EditMCN', {
						"OrbitsMCN": _app.Mcn,
						"instructions": instructions
					})
						.then(function (data) {
							data.status === "SUCCESS" ? sap.m.MessageToast.show("MCN Details Changed Successfully") : sap.m.MessageToast.show("MCN Details Change Failed");
							sap.ui.core.BusyIndicator.hide();
							controller.closeEditMCNDialog();
						}
							, function (error) {
								sap.ui.core.BusyIndicator.hide();
							}
						);
				}
			},

			closeEditMCNDialog: function () {
				if (controller.byId("EditMCNDialog")) {
					controller.byId("EditMCNDialog").close();
					controller.byId("EditMCNDialog").destroy();
				}
			},

			handleOrderDetails: function (oEvent) {
				var _app = mApp.get().oData,
					controller = this;
				var oView = controller.getView();
				mOrd.readOrderDetails(_app.OrderNo, _app.OrderRevNo)
					.done(function (oData, response) {
						var _mdl = new JSONModel();
						_mdl.setData(oData);
						if (!controller.byId("DisplayOrderDetailsDialog")) {
							// load asynchronous XML fragment
							Fragment.load({
								id: oView.getId(),
								name: "ula.mes.order.maint.view.fragments.DisplayOrderDetails",
								controller: controller
							}).then(function (oDialog) {
								oView.addDependent(oDialog);
								oDialog.setModel(_mdl);
								// oDialog.bindElement( {
								// 	path : "/orderHdrDet",
								// 	model : "uiModel"
								// } );			
								sap.ui.core.BusyIndicator.hide();
								oDialog.open();
							});
						} else {
							sap.ui.core.BusyIndicator.hide();
							controller.byId("DisplayOrderDetailsDialog").setModel(_mdl);
							controller.byId("DisplayOrderDetailsDialog").open();
						}
					})
					.fail(function (oError) {

					});
			},

			closeDisplayOrderDetailsDialog: function () {
				var controller = this;
				sap.ui.core.BusyIndicator.hide();
				controller.byId("DisplayOrderDetailsDialog").close();
			},

			onReviewSubmitPress: function (oEvent) {
				if (!this.oReviewSubmitDialog) {
					this.oReviewSubmitDialog = new sap.m.Dialog({
						type: sap.m.DialogType.Message,
						title: "Submit for Review",
						content: [
							new sap.m.Text({
								text: "\nSubmit this revision for review? This will lock  \n " +
									"editing of the revision and open Teamcenter to \n initiate review process.\n"
							})
						],
						beginButton: new sap.m.Button({
							type: sap.m.ButtonType.Emphasized,
							text: "Submit",
							press: this.onSubmitToReviewPress.bind(this)
						}),
						endButton: new sap.m.Button({
							text: "Cancel",
							press: function () {
								this.oReviewSubmitDialog.close();
								this.oReviewSubmitDialog.destroy();
								this.oReviewSubmitDialog = null;
							}.bind(this)
						})
					});
				}
				this.oReviewSubmitDialog.open();
			},

			onValidateSubmitPress: function (oEvent) {
				if (!this.oReviewSubmitDialog) {
					this.oReviewSubmitDialog = new sap.m.Dialog({
						type: sap.m.DialogType.Message,
						title: "Validate Order",
						content: [
							new sap.m.Text({
								text: "Validate this revision?"
							})
						],
						beginButton: new sap.m.Button({
							type: sap.m.ButtonType.Emphasized,
							text: "Validate",
							press: this.onSubmitToValidatePress.bind(this)
						}),
						endButton: new sap.m.Button({
							text: "Cancel",
							press: function () {
								this.oReviewSubmitDialog.close();
								this.oReviewSubmitDialog.destroy();
								this.oReviewSubmitDialog = null;
							}.bind(this)
						})
					});
				}
				this.oReviewSubmitDialog.open();
			},

			onSubmitToReviewPress: function (oEvent) {

				this.doSubmitForReview();


			},

			doSubmitForReview: function (forceLock = false) {
				var _self = this;
				var controller = this,
					_app = mApp.get().oData;

				sap.ui.core.BusyIndicator.show();

				this.lockOrderForReview({ 'ForceLock': forceLock })
					.done(function (oData) {
						tcApi.call('MBE_ValidateMCN', {
							"cn_item_id": _app.Mcn,
						})
							.done(function (data) {
								if (parseInt(data[0].total_violations) !== 0) {
									sap.m.MessageToast.show("Validation Not Passed");
									console.log("Exception1: " + data[0].error);
									sap.ui.core.BusyIndicator.hide();
									if (controller.oReviewSubmitDialog) {
										controller.oReviewSubmitDialog.close();
										controller.oReviewSubmitDialog.destroy();
										controller.oReviewSubmitDialog = null;
									}
								} else {
									var _opData = {
										OrderNo: mApp.get().oData.OrderNo,
										OrderRevNo: mApp.get().oData.OrderRevNo,
										Revstat: 'REVIEW'
									};

									mOrd.changeOrder({ "Data": _opData })
										.done(function (data) {
											tcApi.call('MBE_SubmitWorkflow', {
												"cn_item_id": _app.Mcn,
											})
												//							tcApi.MBE_SubmitWorkflow({
												//								"cn_item_id": _app.Mcn
												//							})
												.done(function (oData) {
													//if (data.error) {
													//	MessageToast.show(data.error.errorDesc);
													//	console.log("Exception1: " + data.error.errorDesc);
													//}
													mApp.setDisplayMode();
													if (controller.oReviewSubmitDialog) {
														controller.oReviewSubmitDialog.close();
														controller.oReviewSubmitDialog.destroy();
														controller.oReviewSubmitDialog = null;
													}

													mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
														.done(function (oData, response) {
															sap.ui.core.BusyIndicator.hide();
															_self.unlockOrder();
															mApp.setContextData(oData);
															sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
																OrderNo: mApp.get().oData.OrderNo,
																OperationNo: '00000'
															}, true);
														});

												})
												.fail(function (oError) {
													_self.unlockOrder()
													if (controller.oReviewSubmitDialog) {
														controller.oReviewSubmitDialog.close();
														controller.oReviewSubmitDialog.destroy();
														controller.oReviewSubmitDialog = null;
													}
													sap.ui.core.BusyIndicator.hide();
												})
										})
										.fail(function (oError) {
											var _msg = JSON.parse(oError.responseText);
											var aErrors = [];
											_self.unlockOrder();
											_msg.error.innererror.errordetails.forEach((err) => {
												if (!err.code.includes('/IWBEP')) {
													var _type;
													switch (err.severity) {
														case 'error': _type = sap.ui.core.MessageType.Error; break;
														case 'warning': _type = sap.ui.core.MessageType.Warning; break;
														case 'success': _type = sap.ui.core.MessageType.Success; break;
														case 'information': _type = sap.ui.core.MessageType.Information; break;
														default: _type = sap.ui.core.MessageType.Information; break;
													}
													aErrors.push({
														'type': _type,
														'Title': err.message,
														'active': true,
														'Description': err.message,
														'Location': err.target
													});
												}
											})

											mApp.get().setProperty("/Errors", aErrors);
											mApp.get().setProperty("/ErrorCount", aErrors.length);

											if (controller.oReviewSubmitDialog) {
												controller.oReviewSubmitDialog.close();
												controller.oReviewSubmitDialog.destroy();
												controller.oReviewSubmitDialog = null;
											}

											sap.ui.core.BusyIndicator.hide();
										})

								}
							})
							.fail(function (oError) {
								_self.unlockOrder();
								if (controller.oReviewSubmitDialog) {
									controller.oReviewSubmitDialog.close();
									controller.oReviewSubmitDialog.destroy();
									controller.oReviewSubmitDialog = null;
								}

								sap.ui.core.BusyIndicator.hide();
							})

					})
					.fail(function (oError) {
						if (controller.oReviewSubmitDialog) {
							controller.oReviewSubmitDialog.close();
							controller.oReviewSubmitDialog.destroy();
							controller.oReviewSubmitDialog = null;
						}

						sap.ui.core.BusyIndicator.hide();

						_self.showLockMsg({
							'error': oError, 'cb': function (sAction) {
								switch (sAction) {
									case 'Unlock':
										_self.doSubmitForReview(true);
										// controller.oReviewSubmitDialog.close();
										// sap.ui.core.BusyIndicator.hide();
										break;
									case sap.m.MessageBox.Action.CLOSE:

										if (controller.oReviewSubmitDialog) {
											controller.oReviewSubmitDialog.close();
											controller.oReviewSubmitDialog.destroy();
											controller.oReviewSubmitDialog = null;
										}
										sap.ui.core.BusyIndicator.hide();
										break;
								}


							}
						})

					})

			},

			onSubmitToValidatePress: function (oEvent) {

				var _self = this;
				var controller = this,
					_app = mApp.get().oData;

				sap.ui.core.BusyIndicator.show();

				var _opData = {
					OrderNo: mApp.get().oData.OrderNo,
					OrderRevNo: mApp.get().oData.OrderRevNo,
					Revstat: 'CHECK'
				};

				mOrd.changeOrder({ "Data": _opData })
					.done(function (data) {
						mApp.setDisplayMode();

						mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
							.done(function (oData, response) {
								MessageBox.success("Order has been validated successfully", {
									onClose: function (sAction) {
										controller.oReviewSubmitDialog.close();
										controller.oReviewSubmitDialog.destroy();
										controller.oReviewSubmitDialog = null;
										sap.ui.core.BusyIndicator.hide();
										// mApp.setContextData(oData);
										// sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
										// 	OrderNo: mApp.get().oData.OrderNo,
										// 	OperationNo: '00000'
										// }, true);
									}
								});
							});
					})
					.fail(function (oError) {
						var _msg = JSON.parse(oError.responseText);
						var aErrors = [];
						// _self.unlockOrder();
						_msg.error.innererror.errordetails.forEach((err) => {
							if (!err.code.includes('/IWBEP')) {
								var _type;
								switch (err.severity) {
									case 'error': _type = sap.ui.core.MessageType.Error; break;
									case 'warning': _type = sap.ui.core.MessageType.Warning; break;
									case 'success': _type = sap.ui.core.MessageType.Success; break;
									case 'information': _type = sap.ui.core.MessageType.Information; break;
									default: _type = sap.ui.core.MessageType.Information; break;
								}
								aErrors.push({
									'type': _type,
									'Title': err.message,
									'active': true,
									'Description': err.message,
									'Location': err.target
								});
							}
						})

						mApp.get().setProperty("/Errors", aErrors);
						mApp.get().setProperty("/ErrorCount", aErrors.length);

						MessageBox.error("We have found some issues with this order. \n Please check validation messages for more information.", {
							onClose: function (sAction) {
								controller.oReviewSubmitDialog.close();
								controller.oReviewSubmitDialog.destroy();
								controller.oReviewSubmitDialog = null;
								sap.ui.core.BusyIndicator.hide();
							}
						});

					})

			},


			submitForReviewOrder: function (oevent) {
				var _self = this;
				var _m = mApp.get().oData;
				var _opData = {
					OrderNo: mApp.get().oData.OrderNo,
					OrderRevNo: mApp.get().oData.OrderRevNo,
				}

				mOrd.changeOrder({ "Data": _opData })

					.done(function (data) {
						mApp.setDisplayMode();

						mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
							.done(function (oData, response) {
								mApp.setContextData(oData);
								sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
									OrderNo: mApp.get().oData.OrderNo,
									OperationNo: '00000'
								}, true);
							});

					})
					.fail(function (oError, oResponse) {
						sap.m.MessageToast.show("Error", {
							duration: 10000
						});

					})



			},


			handleReviewOrder: function (oevent) {
				//sap.m.MessageToast.show('Toggle Edit Mode for the Order Revision');
				var _self = this;


				var _m = mApp.get().oData;
				var _opData = {
					OrderNo: mApp.get().oData.OrderNo,
					OrderRevNo: mApp.get().oData.OrderRevNo
				}

				mOrd.changeOrder({ "Data": _opData })

					.done(function (data) {
						mApp.setDisplayMode();

						mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
							.done(function (oData, response) {
								mApp.setContextData(oData);
								sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
									OrderNo: mApp.get().oData.OrderNo,
									OperationNo: '00000'
								}, true);
							});

					})
					.fail(function (oError, oResponse) {
						sap.m.MessageToast.show("Error", {
							duration: 10000
						});

					})



			},

			handleEditRevision: function (oevent) {
				//sap.m.MessageToast.show('Toggle Edit Mode for the Order Revision');
				mApp.setEditMode();
			},

			handleUnlockRevision: function (oevent) {
				this.doUnlockOrder(false);
				//sap.m.MessageToast.show('Toggle Edit Mode for the Order Revision');
			},

			doUnlockOrder: function (forceLock = false) {
				var _self = this;
				var controller = this;
				var _d = _self.renderer.CallerController.getModel('detail').oData;
				this.lockOrder({ 'ForceLock': forceLock })
					.done(function (oData) {
						mApp.setOrderUnlock();
						_self.renderer.setOrderLock(mApp.get().oData.orderLocked);
						// if (_self.renderer.contentModel) {
						// 	_self.renderer.contentModel.oData.OrderLock = mApp.get().oData.orderLocked;								
						// }
						sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
							OrderNo: _d.OrderNo,
							OperationNo: _d.OperationNo
						}, true);

						//	mOrd.get().refresh(true);
					})
					.fail(function (oError) {
						_self.showLockMsg({
							'error': oError, 'cb': function (sAction) {
								switch (sAction) {
									case 'Unlock':
										_self.doUnlockOrder(true);
										// controller.oReviewSubmitDialog.close();
										// sap.ui.core.BusyIndicator.hide();
										break;
									case sap.m.MessageBox.Action.CLOSE:
										sap.ui.core.BusyIndicator.hide();
										break;
								}

							}
						})

					})

			},


			handleLockRevision: function (oevent) {
				//sap.m.MessageToast.show('Toggle Edit Mode for the Order Revision');
				var _self = this;
				var _d = _self.renderer.CallerController.getModel('detail').oData;
				this.unlockOrder()
					.done(function (oData) {
						mApp.setOrderLock();
						_self.renderer.setOrderLock(mApp.get().oData.orderLocked);
						sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
							OrderNo: _d.OrderNo,
							OperationNo: _d.OperationNo
						}, true);

						// if (_self.renderer.contentModel) {
						// 	_self.renderer.contentModel.oData.OrderLock = mApp.get().oData.orderLocked;
						// 	//_self.renderer.contentModel.refresh(true);
						// 	sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
						// 		OrderNo: _d.OrderNo,
						// 		OperationNo: _d.OperationNo
						// 	}, true);
						// }
						//mOrd.get().refresh(true);
					})
					.fail(function (oError) {


						var _msg = JSON.parse(oError.responseText),
							_err = _msg.error.innererror.errordetails[0];
						sap.m.MessageBox[_err.severity](_err.message, {
							title: "Lock Order"
						});
					})
			},


			handleReviseRevision: function (oevent) {

				sap.m.MessageBox.information("To move this Order Revision back to Revise status to edit, perform the following steps in Teamcenter: \n\n\u0009\u2022\u0009Assign Yourself as a Reviewer\n\u0009\u2022\tReject the Order Revision\n\u0009\u2022\tRefresh the page in NGME to see the updated Revise Status", { title: 'Edit Order Revision' });

				// if (!this.oReviewReviseDialog) {
				// 	this.oReviewReviseDialog = new sap.m.Dialog({
				// 		type: sap.m.DialogType.Message,
				// 		title: "Edit Revision",
				// 		content: [
				// 			new sap.m.Text({
				// 				text: "Move this Work Order Revision back to Revise status to edit?"
				// 			})
				// 		],
				// 		beginButton: new sap.m.Button({
				// 			type: sap.m.ButtonType.Emphasized,
				// 			text: "Edit Revision",
				// 			press: this.onReviseReviewedOrder.bind(this)
				// 		}),
				// 		endButton: new sap.m.Button({
				// 			text: "Cancel",
				// 			press: function () {
				// 				this.oReviewReviseDialog.close();
				// 			}.bind(this)
				// 		})
				// 	});
				// }
				// this.oReviewReviseDialog.open();
			},


			// onReviseReviewedOrder: function (oEvent) {
			// 	var _self = this;
			// 	var controller = this,
			// 		_app = mApp.get().oData;

			// 	sap.ui.core.BusyIndicator.show();

			// 	this.lockOrderForRevise()
			// 		.done(function (oData) {

			// 			var _opData = {
			// 				OrderNo: mApp.get().oData.OrderNo,
			// 				OrderRevNo: mApp.get().oData.OrderRevNo,
			// 				Revstat: 'REVISE'
			// 			};

			// 			mOrd.changeOrder({ "Data": _opData })
			// 				.done(function (data) {
			// 					controller.oReviewReviseDialog.close();
			// 					_self.unlockOrder();
			// 					sap.ui.core.BusyIndicator.hide();
			// 					sap.m.MessageBox.information("To move this Order Revision back to Revise status to edit, perform the following steps in Teamcenter: \n\n\u0009\u2022\u0009Assign Yourself as a Reviewer\n\u0009\u2022\tReject the Order Revision\n\u0009\u2022\tRefresh the page in NGME to see the updated Revise Status", {
			// 						title: 'Edit Order Revision',
			// 						onClose: function (oEvent) {
			// 							mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
			// 								.done(function (oData, response) {
			// 									sap.ui.core.BusyIndicator.hide();
			// 									_self.unlockOrder();
			// 									mApp.setContextData(oData);
			// 									sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
			// 										OrderNo: mApp.get().oData.OrderNo,
			// 										OperationNo: '00000'
			// 									}, true);
			// 								});
			// 						}
			// 					});

			// 					//sap.m.MessageBox.information("A validation error has occurred. Complete your input first.");

			// 					// tcApi.call('MBE_SubmitWorkflow', {
			// 					// 	"cn_item_id": _app.Mcn,
			// 					// })
			// 					// 	.done(function (oData) {
			// 					// 		mApp.setDisplayMode();
			// 					// 		controller.oReviewSubmitDialog.close();

			// 					// 		mOrd.getContext({ 'OrderNo': mApp.order_id, 'OrderRevNo': mApp.rev_id })
			// 					// 			.done(function (oData, response) {
			// 					// 				sap.ui.core.BusyIndicator.hide();
			// 					// 				_self.unlockOrder();
			// 					// 				mApp.setContextData(oData);
			// 					// 				sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
			// 					// 					OrderNo: mApp.get().oData.OrderNo,
			// 					// 					OperationNo: '00000'
			// 					// 				}, true);
			// 					// 			});

			// 					// 	})
			// 					// 	.fail(function (oError) {
			// 					// 		_self.unlockOrder();
			// 					// 		controller.oReviewReviseDialog.Close();
			// 					// 		//controller.oReviewSubmitDialog.close();
			// 					// 		sap.ui.core.BusyIndicator.hide();
			// 					// 	})
			// 				})
			// 				.fail(function (oError) {
			// 					_self.unlockOrder();
			// 					controller.oReviewReviseDialog.close();
			// 					//controller.oReviewSubmitDialog.close();
			// 					sap.ui.core.BusyIndicator.hide();
			// 				})

			// 		})
			// 		.fail(function (oError) {

			// 			//controller.oReviewSubmitDialog.close();
			// 			controller.oReviewReviseDialog.close();
			// 			sap.ui.core.BusyIndicator.hide();

			// 			_self.showLockMsg({
			// 				'error': oError, 'cb': function (sAction) {
			// 					//controller.oReviewSubmitDialog.close();
			// 					sap.ui.core.BusyIndicator.hide();
			// 				}
			// 			})

			// 		})

			// },

			'lockOrder': function (param) {
				var _param = param || {};
				var _mApp = mApp.get().oData;
				var deferred = _param.Promise || $.Deferred();
				var self = this;

				var _data = {
					"OrderNo": _param.OrderNo || _mApp.OrderNo,
					"OrderRevNo": _param.OrderRevNo || _mApp.OrderRevNo,
					'GUID': mOrd.guid.toString(),
					'ForceLock': _param.ForceLock || false,
					"Source": 'E'
				}
				mOrd.get().callFunction("/LockOrder", {

					urlParameters: _data,
					success: function (oData, response) {
						mApp.get().oData.OrderLocked = oData.OrderLocked;
						mApp.get().oData.LockedBy = oData.LockedBy;
						mApp.get().oData.LockedByName = oData.LockedByName;
						mApp.get().refresh();
						deferred.resolve(oData, response);
					},
					error: function (oError) {
						deferred.reject(oError);
					},
				});
				return deferred.promise();
			},
			'lockOrderForReview': function (param) {
				var _param = param || {};
				var _mApp = mApp.get().oData;
				var deferred = _param.Promise || $.Deferred();
				var self = this;

				var _data = {
					"OrderNo": _param.OrderNo || _mApp.OrderNo,
					"OrderRevNo": _param.OrderRevNo || _mApp.OrderRevNo,
					'GUID': mOrd.guid.toString(),
					'ForceLock': _param.ForceLock || false,
					"Source": 'R'
				}
				mOrd.get().callFunction("/LockOrder", {

					urlParameters: _data,
					success: function (oData, response) {
						mApp.get().oData.OrderLocked = oData.OrderLocked;
						mApp.get().oData.LockedBy = oData.LockedBy;
						mApp.get().oData.LockedByName = oData.LockedByName;
						mApp.get().refresh();
						deferred.resolve(oData, response);
					},
					error: function (oError) {
						deferred.reject(oError);
					},
				});
				return deferred.promise();
			},
			'lockOrderForRevise': function (param) {
				var _param = param || mApp.get().oData;
				var deferred = _param.Promise || $.Deferred();
				var self = this;

				var _data = {
					"OrderNo": _param.OrderNo,
					"OrderRevNo": _param.OrderRevNo,
					'ForceLock': _param.ForceLock || false,
					'GUID': mOrd.guid.toString(),
					"Source": 'C'
				}
				mOrd.get().callFunction("/LockOrder", {

					urlParameters: _data,
					success: function (oData, response) {
						mApp.get().oData.OrderLocked = oData.OrderLocked;
						mApp.get().oData.LockedBy = oData.LockedBy;
						mApp.get().oData.LockedByName = oData.LockedByName;
						mApp.get().refresh();
						deferred.resolve(oData, response);
					},
					error: function (oError) {
						deferred.reject(oError);
					},
				});
				return deferred.promise();
			},
			'unlockOrder': function (param) {
				var _param = param || mApp.get().oData;
				var deferred = _param.Promise || $.Deferred();
				var self = this;

				var _data = {
					"OrderNo": _param.OrderNo,
					"OrderRevNo": _param.OrderRevNo,
					"GUID": mOrd.guid.toString()
				}
				mOrd.get().callFunction("/UnlockOrder", {

					urlParameters: _data,
					success: function (oData, response) {
						mApp.get().oData.OrderLocked = oData.OrderLocked;
						mApp.get().oData.LockedBy = oData.LockedBy;
						mApp.get().oData.LockedByName = oData.LockedByName;
						mApp.get().refresh();
						deferred.resolve(oData, response);
					},
					error: function (oError) {
						deferred.reject(oError);
					},
				});
				return deferred.promise();
			},



		};
	}
);
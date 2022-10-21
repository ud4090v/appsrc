
sap.ui.define(
	[
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		'sap/ui/model/json/JSONModel',
		'sap/ui/core/Fragment',
		"ula/mes/order/maint/model/model-app",
		"ula/mes/order/maint/model/model-ord",
	],
	function (Filter, FilterOperator, JSONModel, Fragment, mApp, mOrd) {

		'use strict';

		var controller, uploadCollection, selectedSubOperation, printTemplate;

		return {
			onStepActionMenu: function (oEvent) {
				var oView = this.getView(),
					oButton = oEvent.oSource;
				var oCtx = oEvent.oSource.getBindingContext(mOrd.id);

				var _mdl = new JSONModel();
				//_mdl.setData(oCtx.oModel.getProperty(oCtx.sPath));
				_mdl.setData(this.getView().getModel('detail').oData);

				var _mdls = new JSONModel();
				_mdls.setData(oCtx.oModel.getProperty(oCtx.sPath));

				sap.ui.core.Fragment.load({
					id: oEvent.oSource.sId + '_menu',
					name: "ula.mes.order.maint.view.fragments.OMStepMenu",
					controller: this
				}).then(function (oMenu) {
					oMenu.setModel(_mdl);
					oMenu.setModel(_mdls, 'step');
					oMenu.setModel(mApp.get(), 'app');
					oMenu.openBy(oButton);
					return oMenu;
				}.bind(this));

			},
			onStepHeaderActionMenu: function (oEvent) {
				var oView = this.getView(),
					oButton = oEvent.oSource;
				//var oCtx = oEvent.oSource.getBindingContext(mOrd.id);

				var _mdl = new JSONModel();
				//_mdl.setData(oCtx.oModel.getProperty(oCtx.sPath));
				_mdl.setData(this.getView().getModel('detail').oData);

				sap.ui.core.Fragment.load({
					id: oEvent.oSource.sId + '_menu',
					name: "ula.mes.order.maint.view.fragments.OMStepHdrMenu",
					controller: this
				}).then(function (oMenu) {
					oMenu.setModel(_mdl);
					oMenu.setModel(mApp.get(), 'app');
					oMenu.openBy(oButton);
					return oMenu;
				}.bind(this));

			},

			onAddStep: function (oEvent) {
				var oView = this.getView(),
					oButton = oEvent.oSource,
					_self = this;

				controller = this;


				var worksteplength = this.getView().byId("OperationSteps").getSubSections().length;
				console.log("length: " + worksteplength);

				if (worksteplength == 0) {
					var number = "0000";
				} else {
					var number = this.getView().byId("OperationSteps").getSubSections()[worksteplength - 1].getBindingContext("backend").sPath.split("'")[7];
				}
				var nextNumber = this.roundUp(number);

				var _mdl = new JSONModel();

				_mdl.setData(JSON.parse(JSON.stringify(this.getView().getModel('detail').oData)));
				_mdl.oData.WorkstepNo = nextNumber;
				_mdl.oData.WorkstepText = '';
				_mdl.oData.Skippable = false;
				_mdl.oData.AddOperationSkippableText = '';


				if (!this._oDlgAddWS) {
					this._oDlgAddWS = sap.ui.core.Fragment.load({
						id: controller.getView().getId(),
						name: "ula.mes.common.view.fragments.AddStep",
						controller: controller
					}).then(function (oDlg) {
						controller.getView().addDependent(oDlg);
						oDlg.setModel(_mdl, "input");
						oDlg.open();
						_self._oDlgAddWS = oDlg;
						return _self._oDlgAddWS;
					}.bind(this));
				} else {
					this._oDlgAddWS.setModel(_mdl, "input");
					this._oDlgAddWS.open();
				}

			},

			onCopyStep: function (oEvent) {
				var oView = this.getView(),
					oButton = oEvent.oSource;
				var _step = oEvent.oSource.getModel('step').oData;
				controller = this;
				var selectedSubOperation = oEvent.getSource().getBindingContext(mOrd.id);

				var worksteplength = this.getView().byId("OperationSteps").getSubSections().length;

				if (worksteplength == 0) {
					var number = "0000";
				} else {
					var number = this.getView().byId("OperationSteps").getSubSections()[worksteplength - 1].getBindingContext("backend").sPath.split("'")[7];
				}
				var nextNumber = this.roundUp(number);

				var _self = this;
				var _obj = oEvent.oSource.getModel('step').oData;


				var _fnSetDialog = function (oDlg) {
					var _mdl = new JSONModel();

					_mdl.setData(JSON.parse(JSON.stringify(_step)));
					// _mdl.setData(JSON.parse(JSON.stringify(controller.getView().getModel('detail').oData)));
					_mdl.oData.AddOperationTask = _obj.Activity;  // store source op no in Task
					_mdl.oData.AddOperationStep = _obj.SubOperationNo;  // store source op no in Task
					_mdl.oData.WorkstepText = _obj.SubOpText;
					_mdl.oData.WorkstepNo = _obj.SubOperationNo;
					_mdl.oData.AddOperationSkippableText = _obj.SkipTxt;
					_mdl.oData.Opcode = 'C'; // C - Copy Op

					var oFilter = mApp.getMasterFilter();


					controller.getView().byId("SelOperationNumber").bindItems({
						path: "/OperationSet",
						model: "backend",
						template: controller.getView().byId("OpSelTpl"),
						filters: oFilter
					});

					oDlg.setModel(_mdl, "input");

				};


				if (!this._oDlgAddWS) {
					this._oDlgAddWS = sap.ui.core.Fragment.load({
						id: controller.getView().getId(),
						name: "ula.mes.common.view.fragments.CopyStep",
						controller: controller
					}).then(function (oDlg) {
						controller.getView().addDependent(oDlg);
						_fnSetDialog(oDlg);
						oDlg.open();
						_self._oDlgAddWS = oDlg;
						return _self._oDlgAddWS;
					}.bind(this));
				} else {
					_fnSetDialog(_self._oDlgAddWS);
					_self._oDlgAddWS.open();
				}

			},

			onCopyWorkStep: function (oEvent) {
				var _self = this;

				if (this._oDlgAddWS) {

					var _m = this._oDlgAddWS.getModel('input').oData;


					var _opData = {
						OrderNo: mApp.get().oData.OrderNo,
						OrderRevNo: mApp.get().oData.OrderRevNo,
						OperationNo: _m.OperationNo,
						ZtcOperid: _m.AddOperationTask,
						ZTCWsid: _m.AddOperationStep,
						SubOperationNo: _m.WorkstepNo.trim(),
						SubOpText: _m.WorkstepText,
						Skippable: _m.Skippable,
						SkipTxt: _m.AddOperationSkippableText,
						Opcode: _m.Opcode || 'C'
					}

					if (this.validateStepInput(_opData)) {
						sap.m.MessageBox.alert("A validation error has occurred. Complete your input first.");
						return false;
					} else {
						this.getOpCode(_opData)
							.done(function (result) {
								_opData.Opcode = result.opcode;
								_opData.ReviseOp = result.ReviseOp;
								var _handler = (_opData.Opcode === 'U') ? 'changeSubOperation' : 'addSubOperation';
								if (typeof mOrd[_handler] === 'function') {
									mOrd[_handler]({ "Data": _opData })
										// mOrd.addSubOperation({ "Data": _opData })
										.done(function (data) {
											sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
												OrderNo: mApp.get().oData.OrderNo,
												OperationNo: _opData.OperationNo
											}, true);
										})
										.fail(function (oError, oResponse) {
											var _response = JSON.parse(oError.responseText);
											var aErrors = [];
											var _messages = jQuery.grep(_response.error.innererror.errordetails, function (n, i) { return (n.code.includes('/IWBEP')) ? false : true })
											sap.m.MessageBox.alert(_messages[0].message);
										})

								}
							})
							.fail(function (oError) {

							})
						this.closeAddWSDialog();
						// var _handler = (_m.Opcode==='U')?'changeSubOperation':'addSubOperation';
						// if(typeof mOrd[_handler] === 'function'){
						// 	mOrd[_handler]({ "Data": _opData })
						// 	.done(function(data) {
						// 		sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
						// 			OrderNo: mApp.get().oData.OrderNo,
						// 			OperationNo: data.OperationNo
						// 		}, true);
						// 		_self.closeAddWSDialog();
						// 		//					mOrd.get().refresh(true);
						// 	})
						// 	.fail(function(oError, oResponse) {
						// 		var _response = JSON.parse(oError.responseText);
						// 		var aErrors = [];
						// 		var _messages = jQuery.grep(_response.error.innererror.errordetails, function (n, i) { return (n.code.includes('/IWBEP')) ? false : true })
						// 		sap.m.MessageBox.alert(_messages[0].message);
						// 	})
						// }	

					}

				}

			},

			onEditStep: function (oEvent) {
				var oView = this.getView(),
					oButton = oEvent.oSource,
					_self = this;

				controller = this;

				//controller.stepPanel=this.getView().byId("ContentPanel");

				// controller.stepPanel=this.renderer.findParentPanel(this.getView().byId("ContentPanel"))

				var _mdl = new JSONModel();
				var _ctx = oEvent.oSource.getModel('step').oData;

				_mdl.setData(_ctx);

				_mdl.oData.WorkstepNo = _ctx.SubOperationNo;
				_mdl.oData.WorkstepText = _ctx.SubOpText;
				_mdl.oData.Skippable = _ctx.Skippable;
				_mdl.oData.AddOperationSkippableText = _ctx.SkipTxt;

				var _stepPanel = this.getView().byId("OperationSteps").getSubSections().find(item => {
					var _id = item.getBindingContext('backend').getObject().WorkStep;
					return (_id === _ctx.SubOperationNo) ? true : false;
				}).getBlocks()[0];
				controller.isExpanded = _stepPanel.getExpanded();


				if (!this._oDlgAddWS) {
					this._oDlgAddWS = sap.ui.core.Fragment.load({
						id: controller.getView().getId(),
						name: "ula.mes.common.view.fragments.ChangeStep",
						controller: controller
					}).then(function (oDlg) {
						controller.getView().addDependent(oDlg);
						oDlg.setModel(_mdl, "input");
						oDlg.open();
						_self._oDlgAddWS = oDlg;
						return _self._oDlgAddWS;
					}.bind(this));
				} else {
					this._oDlgAddWS.setModel(_mdl, "input");
					this._oDlgAddWS.open();
				}

			},

			onRenumberStep: function (oEvent) {
				this.renderer.renumberContent(oEvent, this);
			},

			validateStepInput(iData) {
				var _hasErrors = false;
				var _ierrors = [], _iErrTxt = [];

				_ierrors["AddStepNumber"] = (!iData.SubOperationNo) ? true : false;
				_ierrors["AddStepTitle"] = (!iData.SubOpText) ? true : false;

				_iErrTxt["AddStepNumber"] = (!iData.SubOperationNo) ? "Step Number is mandatory" : "";
				_iErrTxt["AddStepTitle"] = (!iData.SubOpText) ? "Step Title is mandatory" : "";
				_iErrTxt["opSkippableText"] = (!iData.SkipTxt) ? "Skippable Rationale is mandatory" : "";

				_ierrors["opSkippableText"] = (iData.Skippable && !iData.SkipTxt) ? true : false;

				var isnum = /^\d+$/.test(iData.SubOperationNo.trim());
				if (isnum) {
					if (iData.Opcode === 'A') {
						if (this.getView().byId("OperationSteps").getSubSections().find(step => parseInt(step.getBindingContext("backend").getObject().SubOperationNo) === parseInt(iData.SubOperationNo))) {
							_ierrors["AddStepNumber"] = true;
							_iErrTxt["AddStepNumber"] = "Step Number already exists";
						}
					}
				} else {
					_ierrors["AddStepNumber"] = true;
					_iErrTxt["AddStepNumber"] = "Step Number must contain numbers only";
				}

				for (var key in _ierrors) {
					var _state = (_ierrors[key]) ? "Error" : "None";
					var _text = _iErrTxt[key];
					controller.byId(key).setValueState(_state);
					controller.byId(key).setValueStateText(_text);
					_hasErrors = _hasErrors || _ierrors[key];
				}

				return _hasErrors;
			},


			onAddWorkStep: function (oEvent) {
				var _self = this;

				if (this._oDlgAddWS) {
					var _m = this._oDlgAddWS.getModel('input').oData;
					var _opData = {
						OrderNo: mApp.get().oData.OrderNo,
						OrderRevNo: mApp.get().oData.OrderRevNo,
						OperationNo: _m.OperationNo,
						SubOperationNo: _m.WorkstepNo.trim(),
						SubOpText: _m.WorkstepText,
						Skippable: _m.Skippable,
						SkipTxt: _m.AddOperationSkippableText,
						ZTCWsid: _m.AddOperationTask,
						Opcode: 'A'
					}

					if (this.validateStepInput(_opData)) {
						sap.m.MessageBox.alert("A validation error has occurred. Complete your input first.");
						return false;
					} else {
						this.getOpCode(_opData)
							.done(function (result) {
								_opData.Opcode = result.opcode;
								_opData.ReviseOp = result.ReviseOp;
								mOrd.addSubOperation({ "Data": _opData })
									.done(function (data) {
										sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
											OrderNo: mApp.get().oData.OrderNo,
											OperationNo: _opData.OperationNo
										}, true);

									})
									.fail(function (oError, oResponse) {
										var _response = JSON.parse(oError.responseText);
										var aErrors = [];
										var _messages = jQuery.grep(_response.error.innererror.errordetails, function (n, i) { return (n.code.includes('/IWBEP')) ? false : true })
										sap.m.MessageBox.alert(_messages[0].message);
									})

							})
							.fail(function (oError) {

							})
						this.closeAddWSDialog();
					}

					// 	var _handler = (_m.Opcode === 'U') ? 'changeSubOperation' : 'addSubOperation';

					// 	if (typeof mOrd[_handler] === 'function') {
					// 		mOrd[_handler]({ "Data": _opData })
					// 			.done(function (data) {
					// 				sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
					// 					OrderNo: mApp.get().oData.OrderNo,
					// 					OperationNo: data.OperationNo
					// 				}, true);

					// 				//					mOrd.get().refresh(true);
					// 			})
					// 			.fail(function (oError, oResponse) {
					// 				var _response = JSON.parse(oError.responseText);
					// 				var aErrors = [];
					// 				var _messages = jQuery.grep(_response.error.innererror.errordetails, function (n, i) { return (n.code.includes('/IWBEP')) ? false : true })
					// 				sap.m.MessageBox.alert(_messages[0].message);
					// 			})
					// 		this.closeAddWSDialog();
					// 	}
					// }

				}

			},

			onChangeWorkStep: function (oEvent) {
				var _self = this;
				var _ss = controller.byId("AddStepNumber").getValue();


				if (this._oDlgAddWS) {
					var _m = this._oDlgAddWS.getModel('input').oData;

					var _opData = {
						OrderNo: mApp.get().oData.OrderNo,
						OrderRevNo: mApp.get().oData.OrderRevNo,
						OperationNo: _m.OperationNo,
						SubOperationNo: _m.WorkstepNo,
						SubOpText: _m.WorkstepText,
						Skippable: _m.Skippable,
						SkipTxt: _m.AddOperationSkippableText,
						Opcode: 'U'
					}

					if (this.validateStepInput(_opData)) {
						sap.m.MessageBox.alert("A validation error has occurred. Complete your input first.");
						return false;
					} else {
						// _validateSkip(_opData)
						this.getOpCode(_opData)
							.done(function (result) {
								_opData.Opcode = result.opcode;
								_opData.ReviseOp = result.ReviseOp;
								mOrd.changeSubOperation({ "Data": _opData })
									.done(function (data) {
										sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
											OrderNo: mApp.get().oData.OrderNo,
											OperationNo: _opData.OperationNo
										}, true);

									})
									.fail(function (oError, oResponse) {

									})

							})
							.fail(function (oError) {

							})
						this.closeAddWSDialog();
					}

				}

			},

			getOpCode: function (data) {
				var _promise = $.Deferred();
				var _self = this;
				var _opSkippable = true;
				var _stepCnt=0;

				var _opKey = this.oModel.get().createKey('/OperationSet', { 'OrderNo': data.OrderNo, 'OrderRevNo': data.OrderRevNo, 'OperationNo': data.OperationNo });
				// var _targetOp = this.oModel.get().getProperty(_targetKey);

				// var _detail = this.getView().getModel('detail').oData;

				var _detail = this.oModel.get().getProperty(_opKey);
				var _steps = [];

				if(data.Opcode==='D') {
					_steps = _self.getView().byId("OperationSteps").getSubSections().filter(function(step){
						return step.getBindingContext("backend").getObject().SubOperationNo != data.SubOperationNo;
					})
				} else {
					_steps = _self.getView().byId("OperationSteps").getSubSections();
				}

				if(_steps.length>0){
					_steps.forEach(step => {
					// _self.getView().byId("OperationSteps").getSubSections().forEach(step => {
						if (step.getBindingContext("backend").getObject().SubOperationNo === data.SubOperationNo) {
						// _opSkippable = (data.Opcode !== 'D')?_opSkippable && data.Skippable:_opSkippable;
							_opSkippable = _opSkippable && data.Skippable;
						} else {
							_opSkippable = _opSkippable && step.getBindingContext("backend").getObject().Skippable;
						}
					});	
				} else {
					_opSkippable = (data.Opcode==='D')?_detail.Skippable:data.Skippable;
				}

				if(data.Opcode==='A') {
					_opSkippable = _opSkippable && data.Skippable;
				}

				if (_opSkippable !== _detail.Skippable) {
					if (_detail.ControlKey === 'EXTP' || !_detail.sXCNF) {
						if (!_detail.Revise) {
							sap.m.MessageBox.confirm('Change will set Operation to Revise status, continue?', {
								title: 'Change Step',
								actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
								//	styleClass: bCompact ? "sapUiSizeCompact" : "",
								onClose: function (oAction) {
									if (oAction === sap.m.MessageBox.Action.YES) {
										_promise.resolve({ "opcode": data.Opcode, "ReviseOp": true })
									} else {
										_promise.reject();
									}
								}
							});
						} else {
							_promise.resolve({ "opcode": data.Opcode, "ReviseOp": false });
						}
					} else {
						sap.m.MessageBox.alert("Operation already has confirmations, action not allowed.");
						_promise.reject();
					}
				} else {
					_promise.resolve({ "opcode": data.Opcode, "ReviseOp": false });
				}

				return _promise;

			},


			onReviseStep: function (oEvent) {
				var _self = this;
				var _op = oEvent.oSource.getModel('step').oData;
				var _text;


				var _stepPanel = this.getView().byId("OperationSteps").getSubSections().find(item => {
					var _id = item.getBindingContext('backend').getObject().WorkStep;
					return (_id === _op.SubOperationNo) ? true : false;
				}).getBlocks()[0];
				var _isExpanded = _stepPanel.getExpanded();

				var _parentPanel = this.renderer.findParentPanel(_stepPanel);


				//var _op = {};
				if (_op.Status === 'S') {
					_text = 'This step has already been started. Editing this step will void any associated buyoffs';
				} else {
					_text = 'Revise this step?';
				}
				sap.m.MessageBox.confirm(_text, {
					title: 'Revise Workstep',
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					//	styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function (oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							_op.Revise = true;
							_op.Opcode = 'R';
							mOrd.changeSubOperation({ "Data": _op })
								.done(function (data) {
									setTimeout(function () {
										// _self.renderer.loadContent(_panel,true);
										if (_isExpanded) {
											var _panel = _self.getView().byId("OperationSteps").getSubSections().find(item => {
												var _id = item.getBindingContext('backend').getObject().WorkStep;
												return (_id === _op.SubOperationNo) ? true : false;
											}).getBlocks()[0];
											_self.renderer.loadContent(_panel, true, true);
											if (_panel) {
												_panel.setExpanded(true);
												_panel.fireExpand({ 'expand': true });
											}

										}
									}, 0)

									// sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
									// 	OrderNo: _op.OrderNo,
									// 	OperationNo: _op.OperationNo
									// }, true);
								})
								.fail(function (oError, oResponse) {

								})

						}
					}
				});

			},

			onShowQNotesActionSheet: function (oEvent) {
				var oParent = oEvent.getSource();
				oParent.getDependents()[0].openBy(oParent);
			},


			onDeleteStep: function (oEvent) {
				var _self = this;
				var _op = oEvent.oSource.getModel('step').oData;

				var _opData = {
					OrderNo: mApp.get().oData.OrderNo,
					OrderRevNo: mApp.get().oData.OrderRevNo,
					OperationNo: _op.OperationNo,
					SubOperationNo: _op.SubOperationNo,
					SubOpText: _op.WorkstepText,
					Skippable: _op.Skippable,
					SkipTxt: _op.AddOperationSkippableText,
					Opcode: 'D'
				}

				this.getOpCode(_opData)
					.done(function (result) {

						_opData.Opcode = result.opcode;
						_opData.ReviseOp = result.ReviseOp;

						sap.m.MessageBox.confirm('Delete Work Step?', {
							title: 'Remove Workstep',
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							//	styleClass: bCompact ? "sapUiSizeCompact" : "",
							onClose: function (oAction) {
								if (oAction === sap.m.MessageBox.Action.YES) {

									mOrd.changeSubOperation({ "Data": _opData })
									.done(function (data) {
										sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
											OrderNo: _opData.OrderNo,
											OperationNo: _opData.OperationNo
										}, true);

									})
									.fail(function (oError, oResponse) {

									})


									// mOrd.deleteSubOperation({ "Data": _opData })
									// 	.done(function (data) {
									// 		sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
									// 			OrderNo: _opData.OrderNo,
									// 			OperationNo: _opData.OperationNo
									// 		}, true);

									// 		// sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("detail", {
									// 		// 	OperationNo: _op.OperationNo
									// 		// }, true);
									// 	})
									// 	.fail(function (oError, oResponse) {

									// 	})

								}
							}
						});
					})
					.fail(function (oError) {

					})



			},
			roundUp: function (stringNumber) {
				var shortNumber = stringNumber.substring(0, 3);
				//console.log("shorNumber: "+ shortNumber);

				var shortNumberInt = parseInt(shortNumber);
				// console.log("shortNumberInt: "+ shortNumberInt);

				var realNumber = shortNumberInt * 10 + 10;
				//console.log("realNumber1: "+ realNumber);

				var realNumberString = realNumber.toString();

				if (realNumberString.length == 2) {
					realNumberString = "00" + realNumberString;
				} else if (realNumberString.length == 3) {
					realNumberString = "0" + realNumberString;
				}

				//console.log("realNumber2: "+ realNumberString);
				return realNumberString;
			},
			onShowShopAttachmentsButtonPress: function (oEvent) {
				var _self = this;

				var selectedSubOperation = oEvent.getSource().getBindingContext(mOrd.id).getObject();

				var fnOnBeforeOpen = function () {
					var key = selectedSubOperation.__metadata.id,
						index = key.lastIndexOf("/");
					key = key.substring(index) + "/HdrAtt";

					uploadCollection.bindItems({
						path: key,
						model: "backend",
						template: _self.byId("AttachmentsDialog").getDependents()[0]
					});



					uploadCollection.attachBeforeUploadStarts(function (oEvent) {
						sap.ui.core.BusyIndicator.show();
						var sFileName = oEvent.getParameter("fileName")

						uploadCollection.destroyHeaderParameters();

						if (!oEvent.getParameters().getHeaderParameter("slug")) {
							oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
								name: "slug",
								value: sFileName
							}));
						};

						if (!oEvent.getParameters().getHeaderParameter("x-csrf-token")) {
							oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
								name: "x-csrf-token",
								value: _self.getOwnerComponent().getModel("backend").getSecurityToken()
							}));
						};

						if (!oEvent.getParameters().getHeaderParameter("OrderNo")) {
							oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
								name: "OrderNo",
								value: selectedSubOperation.OrderNo
							}));
						};

						if (!oEvent.getParameters().getHeaderParameter("OperationNo")) {
							oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
								name: "OperationNo",
								value: selectedSubOperation.OperationNo
							}));
						};

						if (!oEvent.getParameters().getHeaderParameter("SubOperation")) {
							oEvent.getParameters().addHeaderParameter(new UploadCollectionParameter({
								name: "SubOperation",
								value: selectedSubOperation.SubOperationNo
							}));
						}
						//filedescription doctype activity workstep
					}.bind(this));

					_self.byId("AttachmentsDialog").open();
				};

				if (!this.byId("AttachmentsDialog")) {
					Fragment.load({
						id: this.getView().getId(),
						name: "ula.mes.common.view.fragments.AttachmentsDialog",
						controller: this
					}).then(function (oDialog) {
						uploadCollection = _self.byId("UploadCollection");

						this.getView().addDependent(oDialog);

						//   uploadCollection.setUploadUrl( mOrd.get().sServiceUrl.sServiceUrl + "/StepHdrAttachmentSet");

						//Disable the file uploadcollection based editable status                        
						uploadCollection.addDelegate({
							onAfterRendering: function (oEvent) {
								if (selectedSubOperation.Status !== 'K' && selectedSubOperation.Status !== 'C') {
									oEvent.srcControl.setUploadEnabled(true);
								} else {
									oEvent.srcControl.setUploadEnabled(false);
								}
							}
						}, false, uploadCollection, true);

						fnOnBeforeOpen();
					}.bind(this));
				} else {
					fnOnBeforeOpen();
				}

			},
			cancelAttachmentsDialog: function (oEvent) {
				this.byId("AttachmentsDialog").close();
			},
			formatDocumentURL: function (attachmentObject) {
				if (!attachmentObject) {
					return "";
				}

				var key = mOrd.get().createKey("OexStepMediaSet", {
					"Filename": encodeURIComponent(attachmentObject.Filename),
					"OrderNo": attachmentObject.Aufnr,
					"Activity": attachmentObject.Vornr,
					"WorkStep": attachmentObject.Uvorn,
					"OrderRevNo": '000',
					"SeqNo": attachmentObject.Zseqno,
				});

				return mOrd.get().sServiceUrl + "/" + key + "/$value";
			},

			closeAddWSDialog: function (oEvent) {
				if (this._oDlgAddWS) {
					this._oDlgAddWS.close();
					this._oDlgAddWS.destroy();
					this._oDlgAddWS = null;
				}
			},
			showStepSkippableRationaleDialog: function (oEvent) {
				var controller = this,
					oContext = oEvent.oSource.getBindingContext(mOrd.id),
					// data = oContext.getObject(),
					oView = controller.getView();
				var oPath = oContext.getPath();

				// var backendModel = controller.getView().getModel("backend");
				// var oContext = backendModel.createEntry("/SuboperationSet", {
				// 	properties: {
				// 		Activity: data.Activity,
				// 		Material: data.Material,
				// 		Group: data.Group,
				// 		GrpCntr: data.GrpCntr,
				// 		Plant: data.Plant,

				// 		WorkStep: data.WorkStep,

				// 		NewActivity: data.Activity,
				// 		NewWorkStep: data.WorkStep,

				// 		ControlKey: "CON2",
				// 		WorkCenter: data.WorkCenter,
				// 		ShortText: "",

				// 		OpSetupTime: "1.000",
				// 		OpRunTime: "1.000",
				// 		OpLaborTime: "1.000",
				// 		OpMoveTime: "1.000",
				// 		OpQueueTime: "1.000",
				// 		Skippable: data.Skippable === "X",
				// 		SkipTxt: data.SkipTxt,
				// 	}
				// });

				var fnOpenDialog = function () {

					controller.byId("StepSkippableRationaleDialog").bindElement({
						//path    : oContext.getPath(),
						path: oPath,
						model: "backend"
					});
					controller.byId("StepSkippableRationaleDialog").open();
				};

				if (!controller.byId("StepSkippableRationaleDialog")) {
					// load asynchronous XML fragment
					Fragment.load({
						id: oView.getId(),
						name: "ula.mes.order.maint.view.fragments.StepSkippableRationale",
						controller: controller
					}).then(function (oDialog) {
						oView.addDependent(oDialog);
						fnOpenDialog();
					});
				} else {
					fnOpenDialog();
				}

			},
			closeStepSkippableRationaleDialog: function () {
				this.byId("StepSkippableRationaleDialog").close();
			},
		};
	}
);
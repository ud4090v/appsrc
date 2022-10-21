
sap.ui.define(
	[
		'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		'sap/ui/model/json/JSONModel',
		"ula/mes/order/maint/model/model-app",
		"ula/mes/common/model/FilterUtil",
		"ula/mes/order/maint/model/model-ord"
	],
	function(Filter, FilterOperator, JSONModel, mApp, FilterUtil, mOrd) {

		'use strict';

		var controller;

		return {
            OPERATION_TYPES : ["P", "X", "E", "C"],

			onChangeOper: function(oEvent) {
				controller = this;

				var _self = this;
				var _obj = this.getView().getModel('detail').oData;
				// var _obj = oEvent.oSource.getModel().oData;

				var _fnSetDialog = function(oDlg) {
					var _mdl = new JSONModel();
					var _opIndex = _self.OPERATION_TYPES.findIndex(type => type === _obj.Optype);
					_mdl.setData(_obj);
                    _mdl.oData.AddOperationOperationType = (_opIndex <0)?0:_opIndex;

					_mdl.oData.AddOperationVendorName = _obj.VendorName;
					_mdl.oData.AddOperationSkippable = _obj.Skippable;
					_mdl.oData.AddOperationSkippableText = _obj.SkipTxt;
					_mdl.oData.AddOperationSubcon = _obj.Subcon;
					_mdl.oData.AddOperationTask = _obj.Task;
					_mdl.Opcode= 'U';
					controller.byId("AddOperationPIR").setValue(_obj.PIR);
					controller.byId("workCenterCB").setValue(_obj.WorkCenter);
                    //_mdl.oData.AddOperationSkippable =  _obj.Skippable;
					oDlg.setModel(_mdl, "input");

					controller.byId("workCenterCB").getBinding("items").filter([
                        new Filter("Plant", FilterOperator.EQ, _obj.Plant)
                    ]);

                };


				if (!this._oDlgAddOp) {
					this._oDlgAddOp = sap.ui.core.Fragment.load({
						id: controller.getView().getId(),
						name: "ula.mes.common.view.fragments.EditOperation",
						controller: controller
					}).then(function(oDlg) {
						controller.getView().addDependent(oDlg);
						oDlg.setModel(controller.getView().getModel(),'backend');
						_fnSetDialog(oDlg);
						oDlg.open();
						_self._oDlgAddOp = oDlg;
						return _self._oDlgAddOp;
					}.bind(this));
				} else {
					_fnSetDialog(_self._oDlgAddOp);
					_self._oDlgAddOp.open();
				}
			},

			onReviseOper: function(oEvent) {
				var _self = this;
				//var _op = oEvent.oSource.getModel().oData;
				var _op = JSON.parse(JSON.stringify(oEvent.oSource.getModel().oData));
				var _text = 'Revise this operation?';

				delete _op.sPath;

				if(_op.Status === 'S') {
					_text = 'This operation has already been started. Revise Operation?';
				} else {
					_text = 'Revise this operation?';
				}

				
				sap.m.MessageBox.confirm(_text, {
					title: 'Revise Operation',
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					//	styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							_op.Revise = true;
							_op.Opcode = 'R';
							mOrd.changeOperation({ "Data": _op })
								.done(function(data) {
									sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
										OrderNo: mApp.get().oData.OrderNo,
										OperationNo: _op.OperationNo
									}, true);
									
									// sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("detail", {
									// 	OperationNo: _op.OperationNo
									// }, true);
								})
								.fail(function(oError, oResponse) {

								})

						}
					}
				});

			},

			onOperActionMenu: function(oEvent) {
				var oView = this.getView(),
				_self = this,
					oButton = oEvent.oSource;
				//var oCtx = oEvent.oSource.getBindingContext(mOrd.id);

				var _mdl = new JSONModel();
				//_mdl.setData(oCtx.oModel.getProperty(oCtx.sPath));
				_mdl.setData(this.getView().getModel('detail').oData);

				sap.ui.core.Fragment.load({
					id: oEvent.oSource.sId + '_menu',
					name: "ula.mes.order.maint.view.fragments.OMOpMenu",
					controller: this
				}).then(function(oMenu) {
					// _self.getView().addDependent(oMenu);
					oMenu.setModel(_mdl);
					oMenu.setModel(mApp.get(),'app');
					oMenu.openBy(oButton);
					return oMenu;
				}.bind(this));

			},
			
			__D_handleSaveOperation: function(oEvent) {
			},

			closeChangeOpDialog: function(oEvent) {
				return (this._oDlgChangeOp) ? this._oDlgChangeOp.close() : false;
			},



			onChangeOperation: function(oEvent) {
				var _self = this;
				// var _op = JSON.parse(JSON.stringify(oEvent.oSource.getModel().oData));


				if (this._oDlgAddOp) {
					var _m = this._oDlgAddOp.getModel('input').oData;
					var _opData = {
						OrderNo: mApp.get().oData.OrderNo,
						OrderRevNo: mApp.get().oData.OrderRevNo,
						OperationNo: _m.OperationNo,
						WorkCenter: controller.byId("workCenterCB").getValue(),
						PIR: _m.PIR,
						Optype: controller.OPERATION_TYPES[_m.AddOperationOperationType],
						OpText: _m.OpText,
						OpSetupTime: _m.OpSetupTime,
						OpRunTime: _m.OpRunTime,
						Vendor: _m.Vendor,
						VendorName: _m.AddOperationVendorName,
						Task: _m.AddOperationTask,
						OpLaborTime: _m.OpLaborTime,
						Plant: _m.Plant,
						ControlKey: _m.ControlKey,
						Skippable: _m.AddOperationSkippable,
						SkipTxt: _m.AddOperationSkippableText,
						Subcon: _m.AddOperationSubcon,
						Opcode: 'U',
					}

					if(this.validateOpInput(_opData)){
						sap.m.MessageBox.alert("A validation error has occurred. Complete your input first.");
						return false;
					} else {
						mOrd.changeOperation({ "Data": _opData })

						.done(function(data) {
							sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
								OrderNo: mApp.get().oData.OrderNo,
								OperationNo: _m.OperationNo
							}, true);


						})
						.fail(function(oError, oResponse) {

						})
						this.closeAddOpDialog();
					}

					//this._oDlgAddOp.close();

				}

			},

			validateOpInput(iData){
				var _hasErrors = false;
				var _ierrors = [];

				Object.keys(iData).forEach(_ii => {
					switch(_ii){
						case 'WorkCenter' : 
							_ierrors["workCenterCB"] = (!iData.WorkCenter)?true:false; break;
						case 'OpText' : 
							_ierrors["opInputTitle"] = (!iData.OpText)?true:false; break;
						case 'OperationNo' : 
							_ierrors["opInputNumber"] = (!iData.OperationNo)?true:false; break;
						// case 'SkipTxt' :
						// 	_ierrors["opSkippableText"] = (iData.Skippable && !iData.SkipTxt)?true:false; break;
						case 'OpSetupTime' : 
							_ierrors["AddOperationSetupHr"] = (!iData.OpSetupTime)?true:false; break;
						case 'OpRunTime' : 
							_ierrors["AddOperationRunHr"] = (!iData.OpRunTime)?true:false; break;
					}
				})
				
				for(var key in _ierrors) {
					var _state = (_ierrors[key])?"Error":"None";
					controller.byId(key).setValueState(_state);
					_hasErrors = _hasErrors || _ierrors[key];
				} 

				return _hasErrors; 
			},

			onDeleteOper: function(oEvent) {
				var _self = this;
				var _op = this.getView().getModel('detail').oData;
				// var _op = oEvent.oSource.getModel().oData;

				sap.m.MessageBox.confirm('Delete Operation?', {
					title: 'Remove Operation',
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					//	styleClass: bCompact ? "sapUiSizeCompact" : "",
					onClose: function(oAction) {
						if (oAction === sap.m.MessageBox.Action.YES) {
							mOrd.deleteOperation({ "Data": _op })
								.done(function(data) {
									sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
										OrderNo: mApp.get().oData.OrderNo,
										OperationNo: '00000'
									}, true);
								})
								.fail(function(oError, oResponse) {

								})

						}
					}
				});


			},
			onAddOper: function(oEvent) {
				var oView = this.getView(),
					oButton = oEvent.oSource;
				controller = this;

				var _self = this;
				// var _obj = this.getView().getModel('detail').oData;
				var _obj = oEvent.oSource.getModel().oData;
				// var _nextOp = (sap.ui.getCore().byId("MESOrdOps").getItems().length+1) * 10;

				// sap.ui.getCore().byId('MESOrdOps').getItems().forEach(function(item){
				// 	if(_nextOp===parseInt(item.getBindingContext().getObject().OperationNo)) _nextOp+=10;
				// });
				// sap.ui.getCore().byId('MESOrdOps').getItems().forEach(function(item){_nextOp += 10;});
				// sap.ui.getCore().byId("MESOrdOps").getItems().length
				// var _ll = this.getOpList();
                var _nextOp  = this.byId("MESOrdOps").getItems().reduce(function(max, item) {
					var activity = item.getBindingContext().getObject().OperationNo;
                    return parseInt( activity ) > max && parseInt( activity ) < 9000 ? parseInt( activity ) : max;
                },  0);
                
                _nextOp  = Math.floor(_nextOp/10)*10 + 10;

                if( _nextOp  >= 10000 ) {
                    _nextOp  = 9999;
                }
				
				var _fnSetDialog = function(oDlg) {
					var _mdl = new JSONModel();
					
					_mdl.setData(JSON.parse(JSON.stringify(_obj)));
					_mdl.oData.OpSetupTime = '0.000';
					_mdl.oData.OpRunTime = '0.000';
					_mdl.oData.OpLaborTime = '0.000';					
                    _mdl.oData.AddOperationOperationType = 0;
                    _mdl.oData.AddOperationSkippable =  false;
					_mdl.oData.AddOperationSkippableText = '';
					_mdl.oData.OperationNo = _nextOp.toFixed().padStart(4,'0');
					_mdl.oData.OpText = "";
					_mdl.oData.Vendor = "";
					_mdl.oData.VendorName = "";
					_mdl.oData.WorkCenter = "";
					_mdl.oData.Status = 'N';
					_mdl.oData.PIR = "";
					_mdl.oData.PRItem = "";
					_mdl.oData.OpType = "P";
					_mdl.oData.Opcode= 'A'; // A - Add Op
				
					oDlg.setModel(_mdl, "input");


                    // controller.byId("WorkCenterDropDown").getBinding("items").filter([
                    //     new Filter("Plant", FilterOperator.EQ, _obj.Plant)
                    // ]);

					controller.byId("workCenterCB").getBinding("items").filter([
                        new Filter("Plant", FilterOperator.EQ, _obj.Plant)
                    ]);



                };


				if (!this._oDlgAddOp) {
					this._oDlgAddOp = sap.ui.core.Fragment.load({
						id: controller.getView().getId(),
						name: "ula.mes.common.view.fragments.AddOperation",
						controller: controller
					}).then(function(oDlg) {
						controller.getView().addDependent(oDlg);
						oDlg.setModel(controller.getView().getModel(),'backend');
						_fnSetDialog(oDlg);
						oDlg.open();
						_self._oDlgAddOp = oDlg;
						return _self._oDlgAddOp;
					}.bind(this));
				} else {
					_fnSetDialog(_self._oDlgAddOp);
					_self._oDlgAddOp.open();
				}

			},

			onAddOperation: function(oEvent) {
				var _self = this;


				if (this._oDlgAddOp) {
					var _m = this._oDlgAddOp.getModel('input').oData;
					var _opData = {
						OrderNo: mApp.get().oData.OrderNo,
						OrderRevNo: mApp.get().oData.OrderRevNo,
						OperationNo: _m.OperationNo,
						WorkCenter: controller.byId("workCenterCB").getValue(),
						PIR: _m.PIR,
						Vendor: _m.Vendor,
						VendorName: _m.AddOperationVendorName,
						Task: _m.AddOperationTask,
						OpText: _m.OpText,
						OpSetupTime: _m.OpSetupTime,
						OpRunTime: _m.OpRunTime,
						OpLaborTime: _m.OpLaborTime,
						Plant: _m.Plant,
						Optype: controller.OPERATION_TYPES[_m.AddOperationOperationType],
						ControlKey: _m.ControlKey,
						Opcode: _m.Opcode || 'A',
						Skippable: _m.AddOperationSkippable,
						SkipTxt: _m.AddOperationSkippableText,
						Subcon: _m.AddOperationSubcon
					}

					if(this.validateOpInput(_opData)){
						sap.m.MessageBox.alert("A validation error has occurred. Complete your input first.");
						return false;
					} else {
						var _handler = (_m.Opcode==='U')?'changeOperation':'addOperation';

						if(typeof mOrd[_handler] === 'function'){
							mOrd[_handler]({ "Data": _opData })
							.done(function(data) {
								sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
									OrderNo: mApp.get().oData.OrderNo,
									OperationNo: data.OperationNo
								}, true);
	
								//					mOrd.get().refresh(true);
							})
							.fail(function(oError, oResponse) {
								var _response = JSON.parse(oError.responseText);
								var aErrors = [];
								var _messages=jQuery.grep(_response.error.innererror.errordetails, function( n,i) { return(n.code.includes('/IWBEP'))?false:true })
								sap.m.MessageBox.alert(_messages[0].message);
							})
							this.closeAddOpDialog();
						}	
					}

				}

			},

			onCopyOperation: function(oEvent) {
				var _self = this;


				if (this._oDlgAddOp) {
					var _m = this._oDlgAddOp.getModel('input').oData;
					var _opData = {
						OrderNo: mApp.get().oData.OrderNo,
						OrderRevNo: mApp.get().oData.OrderRevNo,
						OperationNo: _m.OperationNo,
						Task: _m.AddOperationTask,
						OpText: _m.OpText,
						Opcode: _m.Opcode || 'C'
					}

					if(this.validateOpInput(_opData)){
						sap.m.MessageBox.alert("A validation error has occurred. Complete your input first.");
						return false;
					} else {
						var _handler = (_m.Opcode==='U')?'changeOperation':'addOperation';

						if(typeof mOrd[_handler] === 'function'){
							mOrd[_handler]({ "Data": _opData })
							.done(function(data) {
								sap.ui.core.Component.getOwnerComponentFor(_self.getView().getParent()).getRouter().navTo("master", {
									OrderNo: mApp.get().oData.OrderNo,
									OperationNo: data.OperationNo
								}, true);
	
								//					mOrd.get().refresh(true);
							})
							.fail(function(oError, oResponse) {
								var _response = JSON.parse(oError.responseText);
								var aErrors = [];
								var _messages=jQuery.grep(_response.error.innererror.errordetails, function( n,i) { return(n.code.includes('/IWBEP'))?false:true })
								sap.m.MessageBox.alert(_messages[0].message);
	
							})
							this.closeAddOpDialog();
						}	
					}

				}

			},

			closeAddOpDialog: function(oEvent) {
				if (this._oDlgAddOp) {
					this._oDlgAddOp.close();
					this._oDlgAddOp.destroy();
					this._oDlgAddOp = null;
				}
			},

			onCopyOper: function(oEvent) {
				var oView = this.getView(),
					oButton = oEvent.oSource;
					controller = this;

				var _self = this;
				// var _obj = this.getView().getModel('detail').oData;
				var _obj = oEvent.oSource.getModel().oData;
				var _nextOp = this.byId("MESOrdOps").getItems().length * 10;

				this.byId('MESOrdOps').getItems().forEach(function(item){
					if(_nextOp===parseInt(item.getBindingContext().getObject().OperationNo)) _nextOp+=10;
				});
				// sap.ui.getCore().byId('MESOrdOps').getItems().forEach(function(item){_nextOp += 10;});
				// sap.ui.getCore().byId("MESOrdOps").getItems().length
				_nextOp += 10;


				var _fnSetDialog = function(oDlg) {
					var _mdl = new JSONModel();
					
					_mdl.setData(JSON.parse(JSON.stringify(_obj)));
					_mdl.oData.AddOperationTask = _obj.OperationNo;  // store source op no in Task
					_mdl.oData.Opcode= 'C'; // C - Copy Op
				
					oDlg.setModel(_mdl, "input");

                };


				if (!this._oDlgAddOp) {
					this._oDlgAddOp = sap.ui.core.Fragment.load({
						id: controller.getView().getId(),
						name: "ula.mes.common.view.fragments.CopyOperation",
						controller: controller
					}).then(function(oDlg) {
						controller.getView().addDependent(oDlg);
						oDlg.setModel(controller.getView().getModel(),'backend');
						_fnSetDialog(oDlg);
						oDlg.open();
						_self._oDlgAddOp = oDlg;
						return _self._oDlgAddOp;
					}.bind(this));
				} else {
					_fnSetDialog(_self._oDlgAddOp);
					_self._oDlgAddOp.open();
				}

			},



			showPIRSelectDialog : function(oEvent) {
                var 
                // backendObject = this.getView().getModel('detail').oData,
                backendObject = oEvent.oSource.getModel('input').oData,

                fnOpenDialog = function() {

                    controller.byId("PIRSelectionDialog").setModel(new JSONModel({
                        PIR	        : "",
                        VendorName 	: "",
                        Task	    : "",
                        Plant       : backendObject.Plant,
                    }), "FilterModel");
                    
					var aFilters = FilterUtil.prepareFilters( controller.byId("PIRSelectionDialog").getModel("FilterModel").getData() );

                    controller.byId("searchPIRTable").getBinding("items").filter(aFilters);

                    controller.byId("PIRSelectionDialog").open();
                };
    
                if (!controller.byId("PIRSelectionDialog")) {
                    sap.ui.core.Fragment.load({
                        id: controller.getView().getId(),
                        name: "ula.mes.common.view.fragments.PIRSelection",
                        controller: controller
                    }).then(function (oDialog) {
                        controller.getView().addDependent(oDialog);
						oDialog.setModel(controller.getView().getModel(),'backend')
                        fnOpenDialog();
                    });
                } else {
                    fnOpenDialog();
                }
   
            },
            closePIRSelectionDialog : function() {
                if (controller.byId("PIRSelectionDialog")) {
                    controller.byId("PIRSelectionDialog").close();
                    controller.byId("PIRSelectionDialog").destroy();
                }
            },
            onSearchPIR : function() {
                //if(""== controller.byId("PIRSelectionDialog").getModel("FilterModel").getData().PIR && ""== controller.byId("PIRSelectionDialog").getModel("FilterModel").getData().Task
                //    && "" == controller.byId("PIRSelectionDialog").getModel("FilterModel").getData().VendorName){
                            // sap.ui.core.BusyIndicator.show();
                            // var errorDialog = new sap.m.Dialog({
                            //     type: sap.m.DialogType.Message,
                            //     //icon: "sap-icon://message-error",
                            //     state: sap.ui.core.ValueState.Error,
                            //     title: "Search Criteria Required",
                            //     content: new sap.m.Text({ text: "You must enter at least one criteria to perform\n this search.\n"
                            //  }),
                            //     endButton: new sap.m.Button({
                            //         text: "Close",
                            //         press: function () {
                            //             errorDialog.close();
                            //         }
                            //     })
                            // });
                            // errorDialog.open();
                            // sap.ui.core.BusyIndicator.hide();								

                  //  } else if (controller.byId("PIRSelectionDialog")) {
                            var aFilters = FilterUtil.prepareFilters( controller.byId("PIRSelectionDialog").getModel("FilterModel").getData() );
                            controller.byId("searchPIRTable").getBinding("items").filter(aFilters);
                //}
            },
			onChangeAddOperationPIR: function(oEvent){
                if (oEvent.getSource().getValue() === "") {
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);  
                    oEvent.getSource().setValueStateText("PIR is a required field.");
                }else{
                    oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
                }
            },


            onPIRListItemPress : function(oEvent) {
                controller.byId("AddOperationPIR").setValueState(sap.ui.core.ValueState.None);
				var _dModel = controller._oDlgAddOp.getModel("input").oData,
					_sel = oEvent.oSource.getBindingContext('backend').getObject();

				_dModel.PIR = _sel.PIR;
				_dModel.Vendor = _sel.Vendor;
				_dModel.MatlGroup = _sel.MatlGroup;
				_dModel.InfoType = _sel.InfoType;
				_dModel.AddOperationSubcon = (_sel.InfoType==='3')?true:false;
				_dModel.AddOperationVendorName = _sel.VendorName;
				_dModel.AddOperationTask = _sel.Task;

				controller.byId("AddOperationPIR").setValue(_dModel.PIR);

				controller._oDlgAddOp.getModel("input").refresh(true);

//				controller._oDlgAddOp.getModel("input").refresh(true);

				//controller.byId("AddOperationPIR").setDOMValue(_dModel.PIR);

				//controller.byId("productInput").setValue(_dModel.PIR);


                // var backendSelectedObject = this.getView().getModel('detail').oData,
                // dialogBindingContext      = controller.byId("NewOperationDialog").getBindingContext("backend"),
                // backendModel              = controller.getView().getModel("backend"),
                // component                 = controller.getOwnerComponent(),
                // backend                   = component.getModel("backend" );
                

                // backendModel.setProperty("PIR",         backendSelectedObject.PIR,       dialogBindingContext);
                // backendModel.setProperty("Vendor",      backendSelectedObject.Vendor,    dialogBindingContext);
                // backendModel.setProperty("MatlGrpText", backendSelectedObject.MatlGroup, dialogBindingContext);
                // backendModel.setProperty("SubConFlag",  backendSelectedObject.InfoType === "3",  dialogBindingContext);

                // backend.setProperty("/AddOperationVendorName", backendSelectedObject.VendorName);
                // backend.setProperty("/AddOperationTask", backendSelectedObject.Task);

                controller.closePIRSelectionDialog();

            },

			workCenterSelectionChange : function(oEvent) {

                if (""==controller.byId("workCenterCB").getValue()&&oEvent.getSource().getSelectedItem()==null) {
                        oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);  
                        oEvent.getSource().setValueStateText("Work Center is a required field.");
                    }else{
                        controller.byId("workCenterCB").setValueState(sap.ui.core.ValueState.None);
                        var _sel   = oEvent.getParameter("selectedItem").getBindingContext("backend").getObject(),
							_dModel = controller._oDlgAddOp.getModel("input").oData;

						_dModel.WorkCenter = _sel.WorkCenter;
                    }
            }



		};
	}
);
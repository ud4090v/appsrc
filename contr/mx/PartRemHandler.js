sap.ui.define(
    [
        'sap/ui/model/Filter',
        'sap/ui/model/FilterOperator',
        'sap/ui/core/Fragment',
        'sap/ui/model/json/JSONModel',
        "ula/mes/common/Teamcenter/tc",
        "ula/mes/common/model/FilterUtil",
        "ula/mes/common/model/Utils"
    ],
    function (Filter, FilterOperator, Fragment, JSONModel, tc, FilterUtil, Utils) {

        'use strict';

        const cType = 'Parts Removal';
        const tabType = "PREM";
        const moveBack = false;

        var controller;


        return {

            getHandler: function (oCtx) {
                var _self = oCtx;
                return {
                    isActive: true,
                    tabType: tabType,
                    role:'SC',
                    visible:true,
					addMenu: function(itemExist,itm){
						return !itemExist;
					},
                    ContentTypeName: cType,
                    Template: function (sId, oContext) {
                        return oCtx.getPremTemplate(sId, oContext);
                    },
					add: function(oEvent,oContext) {
                        return oCtx.addPremTable(oEvent, oContext);
                    },    
                    toolIcon: "sap-icon://cart-2",
                    load: function (oContext) {
                        return oCtx.loadPrems(oContext);
                    },
                    delete: function (oEvent) {
                        return oCtx.deletePrem(oEvent);
                    },                    
                    handler: _self
                };
            },

            loadPrems: function (oContext) {
                controller = this;
                var _self = this;

                var _sp = oContext.sPath + '/PartsRem';

                //				this.content.push({
                //					ContentTypeName: cType,
                //					Template: function(sId, oContext) {
                //						return _self.getPartsTemplate(sId, oContext);
                //					},
                //					add: function(oEvent) {
                //						return _self.addSpecification(oEvent);
                //					},
                //					toolIcon: "sap-icon://puzzle",
                //				});


                return new Promise(function (resolve) {
                    _self.Model.read(_sp, {
                        success: function (oData) {
                            if (oData.results.length === 0) {
                                resolve();
                                return;
                            }

                            var seqNos = {};

                            oData.results.forEach(function (item) {
                                seqNos[item.SeqNo] = seqNos[item.SeqNo] || [];
                                seqNos[item.SeqNo].push(item);
                            });



                            resolve(
                                Object.keys(seqNos).map(function (SeqNo) {
                                    seqNos[SeqNo].sort((a, b) => { return parseInt(a.RowNo) - parseInt(b.RowNo) });
                                    return {
                                        ContentTypeName: cType,
                                        ControlData: {
                                            Entries: seqNos[SeqNo].filter(function (item) {
                                                return item.RowNo !== "00000";
                                            }).map(function (item) {
                                                // item.Idrnk = item.Type;
                                                // item.Number = item.Number;
                                                // item.Description = item.Description;
                                                return item;
                                            })
                                        },
                                        toolIcon: "sap-icon://cart-2",
                                        DispSeqNo: seqNos[SeqNo][0].DispSeqNo,
                                        DeleteAllowed: true,
										EditAllowed: true,	
                                        EditMenu: false,
                                        SeqNo: seqNos[SeqNo][0].SeqNo,
                                        TableType: seqNos[SeqNo][0].TableType
                                    };
                                })
                            );
                        }
                    });
                });
            },

            getPremTemplate: function (sId) {
                return sap.ui.xmlfragment("ula.mes.common.view.fragments.PartsRemTable", this).clone(sId);
            },


            addPremRow: function (oEvent) {
                controller = this.CallerController;
                self = this;
                self.Caller = oEvent.oSource;
                this.addNewTable = false;

                var fnOpenDialog = function() {

                    var _dlg = self.CallerController.getView().byId("PremSelectionDialog");
                    var _tbl = self.CallerController.getView().byId("searchPremTable");

                    _dlg.setModel(new JSONModel({
                        Idnrk       : "",
                        Aufnr 	    : "",
                        Model	    : "",
                        Unit        : "",
                        Mission     : "",
                        OrdHdrSernr : "",
                        Sernr       : "",
                        Charg       : "",
                        RefDes      : ""
                    }), "FilterModel");
                    
					// var aFilters = FilterUtil.prepareFilters( _dlg.getModel("FilterModel").getData() );

                    // _tbl.getBinding("items").filter(aFilters);

                    _dlg.open();
                };

                //      controller.parentTable = oEvent.getSource().getParent().getParent();
                self.parentPanel = self.findParentPanel(oEvent.oSource);
                self.parentTable = oEvent.getSource().getParent().getParent();
                if (!controller.byId("PremSelectionDialog")) {
                    Fragment.load({
                        id: controller.getView().getId(),
                        name: "ula.mes.common.view.fragments.PremSelectionDialog",
                        controller: this
                    }).then(function (oDialog) {
                        controller.getView().addDependent(oDialog);
                        fnOpenDialog();
                        // oDialog.open();
                    }.bind(this));

                } else {
                    controller.byId("PremSelectionDialog").open();
                }

            },

            onPremListItemPress : function(oEvent) {
                var _self = this;
				// var _sel = oEvent.oSource.getBindingContext('backend').getObject();

                var aSelectedCtxs = this.CallerController.getView().byId("searchPremTable").getSelectedItems(),
                    tableDataModel = (self.parentTable) ? self.parentTable.getModel("contentModel") : null,
                    _ctx = self.Caller.getBindingContext(this.mId).getObject(),
                    path = (self.parentTable) ? self.parentTable.getBindingContext("contentModel").getPath() : null,
                    _self = this;

                var _pendingUpdates = [];
                var _panel = _self.findParentPanel(_self.parentPanel);

                path = (path) ? path.substring(0, path.indexOf("/ControlData")) : null;
                var parentObject = (tableDataModel) ? tableDataModel.getObject(path) : null;

                aSelectedCtxs.forEach(function (context) {
                    var ctxObject = context.getBindingContext('backend').getObject();
                    var _promise = $.Deferred();
                    var newLocalObject = {
                        SpecType: ctxObject.uid,
                        SpecNumber: ctxObject.item_id,
                        SpecDescription: ctxObject.object_name,
                        TableType: "SPEC",
                        DispSeqNo: (parentObject) ? parentObject.DispSeqNo : (_self.NewIndexToInsert).toString().padStart(5, "0"),
                        SeqNo: (parentObject) ? parentObject.SeqNo : (99999).toString().padStart(5, "0"),
                        RowNo: (0).toString().padStart(5, "0")
                    };


                    _pendingUpdates.push(_self.Model.create("/PartsRemSet", {
                        "OrderNo": _ctx.OrderNo,
                        "OrderRevNo": _ctx.OrderRevNo,
                        "Activity": _ctx.Activity,
                        "WorkStep": _ctx.WorkStep,

                        "Idnrk": ctxObject.Idnrk,
                        "Aufnr": ctxObject.Aufnr,
                        "Vornr": ctxObject.Vornr,
                        "Uvorn": ctxObject.Uvorn,
                        // "Werks": ctxObject.Werks,
                        "Zordhdrsernr": ctxObject.OrdHdrSernr,
                        "Zrefdesig": ctxObject.RefDes,
                        "Sernr": ctxObject.Sernr,
                        "Charg": ctxObject.Charg,
                        "Descr": ctxObject.Maktx,
                        "Unit": ctxObject.Unit,
                        "Model": ctxObject.Model,
                        "Mission": ctxObject.Mission,
                        // "ParentSernum": ctxObject.OrdHdrSernr,
                        "Imeng": ctxObject.Imeng,
                        "Imein": ctxObject.Imein,
                        "Serialized": ctxObject.Serialized,

                        "SeqNo": newLocalObject.SeqNo,
                        "RowNo": newLocalObject.RowNo,
                        "DispSeqNo": newLocalObject.DispSeqNo,
                        "TableType": tabType,

                    }, {
                        async: false,
                        success: function (oData) {
                            _promise.resolve(oData);
                        },
                        error: function (oError, response) {
                            _promise.reject(oError, response);
                        }
                    }));
                });

                $.when.apply($, _pendingUpdates).then(function () {

                    _self.closePremSelectionDialog();
                    _self.reloadContent(_panel, tabType)
                    .done(function(d){
                        _panel.setBusy(false);
                    })


                })

            },

            onQtyChange: function(oEvent){
            	var selectedTextContextObject = oEvent.getSource().getBindingContext("contentModel").getObject(),
					_panel = this.findParentPanel(oEvent.oSource),
					oCtx = oEvent.oSource.getBindingContext(controller.mId).getObject(),
				    _self = this;

            	var oSource = oEvent.getSource();

                var key = _self.Model.createKey("PartsRemSet", { 
					"OrderNo": selectedTextContextObject.OrderNo,
					"OrderRevNo": selectedTextContextObject.OrderRevNo,
					"Activity": selectedTextContextObject.Activity,
					"WorkStep": selectedTextContextObject.WorkStep,
					"SeqNo": selectedTextContextObject.SeqNo,
					"RowNo": selectedTextContextObject.RowNo  
                });
                
                var oPayload = {
					"OrderNo": selectedTextContextObject.OrderNo,
					"OrderRevNo": selectedTextContextObject.OrderRevNo,
					"Activity": selectedTextContextObject.Activity,
					"WorkStep": selectedTextContextObject.WorkStep,
					"SeqNo": selectedTextContextObject.SeqNo,
					"RowNo": selectedTextContextObject.RowNo,  
					"Imeng"	: selectedTextContextObject.Imeng
                };
                
                _self.Model.update('/'+key, oPayload, {
                	success: function(){
                		oSource.setValueState();
						_self.reloadContent(_panel, tabType)
						.done(function(d){
							controller.contentModel[oCtx.Activity][oCtx.WorkStep].refresh(true);
						})
	

                	}.bind(this),
                	error: function(oError){
                		oSource.setValueState("Error");
                		oSource.setValueStateText("Error occurred during update");
                	}.bind(this),
                });            	

            },
            onSearchPrem: function(oEvent){
                var _win = this.CallerController.getView().byId("PremSelectionDialog");
                var _tbl = self.CallerController.getView().byId("searchPremTable");
                var _item = controller.byId("premTabItem");
                var _ctx = self.Caller.getBindingContext(this.mId).getObject();
                var aFilters = FilterUtil.prepareFilters( _win.getModel("FilterModel").getData() );

                // Add Current order filters

                aFilters.push(new sap.ui.model.Filter("TargetAufnr", sap.ui.model.FilterOperator.EQ, _ctx.OrderNo));
                aFilters.push(new sap.ui.model.Filter("TargetRevno", sap.ui.model.FilterOperator.EQ, _ctx.OrderRevNo));
                aFilters.push(new sap.ui.model.Filter("TargetVornr", sap.ui.model.FilterOperator.EQ, _ctx.OperationNo));
                aFilters.push(new sap.ui.model.Filter("TargetAufnr", sap.ui.model.FilterOperator.EQ, _ctx.SubOperationNo));

                _tbl.bindAggregation("items", {
                    path: "backend>/RemPartsSet",
                    template: _item,
                    filters: aFilters,
                });

            },

            onMovePartRemDown: function(oEvent){

                this._doMoveItem(oEvent);

            },



            onMovePartRemUp: function(oEvent){

                this._doMoveItem(oEvent,true);

            },

            _doMoveItem: function(oEvent,fReverse){

				var _cModel = oEvent.oSource.getBindingContext('contentModel').getModel();
				var _self = this;
				var _promise = $.Deferred();

                var _sp = oEvent.oSource.getBindingContext('contentModel').sPath;
                var _tp = (_sp) ? _sp.substring(0, _sp.indexOf("/Entries")) + '/Entries': null;
                var _cList = (_tp)?_cModel.getProperty(_tp):[];
                var _cItem = _cModel.getProperty(_sp);
				var _cInd = parseInt(_cItem.RowNo);
                var _arrInd = _cList.findIndex( el => el.RowNo === _cItem.RowNo);


				var _pendingUpdates = [];

                var _moveAllowed = (fReverse)?(_arrInd > 0):(_arrInd < _cList.length-1);
                
				if (_moveAllowed) {
                    // var _cNew = parseInt(_cList[_arrInd+1].RowNo);
                    var _cNew = (fReverse)?parseInt(_cList[_arrInd-1].RowNo):parseInt(_cList[_arrInd+1].RowNo);

                    var aContent = [];

					_cList.forEach(function(item) {
						var _seq = parseInt(item.RowNo);
                        var _oKey = item;
						if (_seq === _cNew) {
							_oKey.RowNo = _cInd.toString().padStart(5, "0");
							_pendingUpdates.push(_self.updatePremSequence(_oKey,item));
						} else if (_seq === _cInd) {
							_oKey.RowNo = _cNew.toString().padStart(5, "0");
							_pendingUpdates.push(_self.updatePremSequence(_oKey,item));
						}
						aContent.push(item);
					});
					
					$.when.apply($, _pendingUpdates).then(function(data) {
                        // _cModel.refresh(true);
						_promise.resolve(data);
					})

					aContent.sort((a, b) => { return parseInt(a.RowNo) - parseInt(b.RowNo) });
					_cModel.setProperty(_tp, aContent);
					_cModel.refresh(true);
					return _promise;
				}

            },


			updatePremSequence: function (oKey, oItem) {

                var _self = this;

                var _iKey = { 
                    "OrderNo": oKey.OrderNo,
                    "OrderRevNo": oKey.OrderRevNo,
                    "Activity": oKey.Activity,
                    "WorkStep": oKey.WorkStep,
                    "SeqNo": oKey.SeqNo,
                    "RowNo": oKey.RowNo  
                };

                var _aKeys = Object.keys(_iKey);

                var key = _self.Model.createKey("/PartsRemSet", _iKey);

				var _promise = $.Deferred();
                var _data = {};

                var _keys = Object.keys(oItem);

                _keys = jQuery.grep(_keys, function(n,i) { return _aKeys.find(el => el === n)?false:true});
                _keys = jQuery.grep(_keys, function(n,i) { return n==='__metadata'?false:true});


                _keys.forEach( iKey => {
                    _data[iKey] = oItem[iKey];
                })

				this.Model.update(key, _data, {
					asynch: false,
					success: function (oData, response) {
						_promise.resolve(oData, response);
					},
					error: function (oError, response) {
						_promise.reject(oError, response);
					}
				});

				return _promise;

			},


            onNavToOrder: function(oEvent){

                var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
                var _sel = oEvent.oSource.getBindingContext('contentModel').getObject();


				// var _href = oCrossAppNav.hrefForExternal({
				// 	target: { semanticObject: 'ZSEM_OBJ_MES', action: 'display' },
				// 	params: { "OrderNo": oCtx.OrderNo, "OrderRevNo": oCtx.OrderRevNo,  caller: lza.compressToEncodedURIComponent(this.owner.sId) }
				// });


                // var _href = oCrossAppNav.toExternal({
				// 	target: { semanticObject: 'ZSEM_OBJ_MES', action: 'display' },
                //     params: {'OrderNo':_sel.Aufnr, 'OperationNo':_sel.Activity, 'Ts': Date.now()}
				// });

                var _ts = Date.now();

                var _href = oCrossAppNav.hrefForExternal({
					target: { semanticObject: 'ZSEM_OBJ_MES', action: 'display' },
                    params: {'OrderNo':_sel.Aufnr, 'OperationNo':_sel.Activity, 'Ts': _ts}
				});

                if(_href) {
                    _href += '&/detail/'+_sel.Aufnr+'/'+_sel.Activity+'/'+_ts;
                    window.open(_href,'_blank');                   
                }
    


            },


        //     handlePremSearch: function (oEvent) {
        //         var searchTerm = (oEvent.getParameter("value") || '').trim();
        //         var _results = [];
        //         var _pendingSearch = [];

        //         if (controller.SpecSrcRequest) {
        //             controller.SpecSrcRequest.abort();
        //             controller.SpecSrcRequest = null;
        //         }


        //         if(searchTerm.length<3) {
        //             sap.m.MessageToast.show("At least 3 characters are required to perform the search.");
        //             return;                   
        //         }

        //         if (controller.byId("SpecSelectDialog")) {

        //             controller.byId("SpecSelectDialog")._oTable.setBusy(true);
        //             controller.byId("SpecSelectDialog")._oOkButton.setEnabled(false);

        //             // controller.byId("SpecSelectDialog").setBusy(true);

        //             controller.SpecSrcRequest = tc.call2('MBE_QuerySpec', {
        //                 SearchTerm: searchTerm
        //             },
        //             function(aResults){
        //                 controller.SpecSrcRequest = null;
        //                 if (aResults) {
        //                     aResults.forEach(function (oHit) {
        //                     _results.push(oHit);
        //                     })
        //                 }

        //                 controller.byId("SpecSelectDialog").setModel(new JSONModel({ results: _results }), "Specs");
        //                 controller.byId("SpecSelectDialog")._oTable.setBusy(false);
        //                 controller.byId("SpecSelectDialog")._oOkButton.setEnabled(true);
        //                 // controller.byId("SpecSelectDialog").setBusy(false);

        //             },
        //             function(error){
        //                 controller.SpecSrcRequest = null;
        //                 controller.byId("SpecSelectDialog")._oTable.setBusy(false);
        //                 controller.byId("SpecSelectDialog")._oOkButton.setEnabled(true);
        //             },
        //             true)

        //             // _pendingSearch.push(tc.call('MBE_QuerySpec', {
        //             //     SearchTerm: searchTerm
        //             // },true));

        //             // Promise.all(_pendingSearch)
        //             // .then(function (oResults) {
        //             //     oResults.forEach(function (aResults) {
        //             //         if (aResults) {
        //             //             aResults.forEach(function (oHit) {
        //             //                 _results.push(oHit);
        //             //             })
        //             //         }
        //             //     });

        //             //     controller.byId("SpecSelectDialog").setModel(new JSONModel({ results: _results }), "Specs");
        //             //     controller.byId("SpecSelectDialog").setBusy(false);
        //             // })

        //         }
        //     },

        //     handleConfirmPremSelectDialog: function (oEvent) {
        //         var aSelectedCtxs = oEvent.getParameter("selectedContexts"),
        //             tableDataModel = (self.parentTable) ? self.parentTable.getModel("contentModel") : null,
        //             _ctx = self.Caller.getBindingContext(this.mId).getObject(),
        //             path = (self.parentTable) ? self.parentTable.getBindingContext("contentModel").getPath() : null,
        //             _self = this;

        //         var _pendingUpdates = [];
        //         var _panel = _self.findParentPanel(_self.parentPanel);

        //         path = (path) ? path.substring(0, path.indexOf("/ControlData")) : null;
        //         var parentObject = (tableDataModel) ? tableDataModel.getObject(path) : null;

        //         aSelectedCtxs.forEach(function (context) {
        //             var ctxObject = context.getObject();
        //             var _promise = $.Deferred();
        //             var newLocalObject = {
        //                 SpecType: ctxObject.uid,
        //                 SpecNumber: ctxObject.item_id,
        //                 //SpecDescription: ctxObject.object_name.substr(1, 39),
        //                 SpecDescription: ctxObject.object_name,
        //                 TableType: "SPEC",
        //                 DispSeqNo: (parentObject) ? parentObject.DispSeqNo : (_self.NewIndexToInsert).toString().padStart(5, "0"),
        //                 SeqNo: (parentObject) ? parentObject.SeqNo : (99999).toString().padStart(5, "0"),
        //                 RowNo: (0).toString().padStart(5, "0")
        //             };

        //             // var _key = _self.Model.createKey("/SpecificationsSet", {
        //             //     "OrderNo": _ctx.OrderNo,
        //             //     "OrderRevNo": _ctx.OrderRevNo,
        //             //     "Activity": _ctx.Activity,
        //             //     "WorkStep": _ctx.WorkStep,

        //             //     "SeqNo": newLocalObject.SeqNo,
        //             //     "RowNo": newLocalObject.RowNo,
        //             //     "DispSeqNo": newLocalObject.DispSeqNo,
        //             //     "TableType": "SPEC",

        //             //     "Type": newLocalObject.SpecType,
        //             //     "Number": newLocalObject.SpecNumber,
        //             //     "Description": newLocalObject.SpecDescription
        //             // });


        //             _pendingUpdates.push(_self.Model.create("/SpecificationsSet", {
        //                 "OrderNo": _ctx.OrderNo,
        //                 "OrderRevNo": _ctx.OrderRevNo,
        //                 "Activity": _ctx.Activity,
        //                 "WorkStep": _ctx.WorkStep,

        //                 "SeqNo": newLocalObject.SeqNo,
        //                 "RowNo": newLocalObject.RowNo,
        //                 "DispSeqNo": newLocalObject.DispSeqNo,
        //                 "TableType": "SPEC",

        //                 "Type": newLocalObject.SpecType,
        //                 "Number": newLocalObject.SpecNumber,
        //                 "Description": newLocalObject.SpecDescription
        //             }, {
        //                 async: false,
        //                 success: function (oData) {
        //                     _promise.resolve(oData);
        //                 },
        //                 error: function (oError, response) {
        //                     _promise.reject(oError, response);
        //                 }
        //             }));
        //         });

        //         $.when.apply($, _pendingUpdates).then(function () {

        //             _self.reloadContent(_panel, tabType)
        //             .done(function(d){
        //                 _panel.setBusy(false);
        //             })


        //             // var _ind = _panel.getBindingContext('backend').getObject().WorkStep;
        //             // delete _self.contentModel[_ind];

        //             // return (typeof _panel['fireExpand'] === 'function') ? _panel.fireExpand({ 'expand': true }) : false;
        //         })

        //     },

            addPremTable: function(oEvent, oContext) {
				var _self = this;
                _self.NewIndexToInsert = (oContext)?Number(oContext.getBindingContext("contentModel").getObject().DispSeqNo)+1:_self.NewIndexToInsert;

                // _self.NewIndexToInsert = (oContext)?oContext.getBindingContext("contentModel").getObject().DispSeqNo:(this.NewIndexToInsert).toString().padStart(5, "0");

                var newLocalObject = {
                    TableType: tabType,
                    DispSeqNo: (_self.NewIndexToInsert).toString().padStart(5, "0"),
                    SeqNo: (99999).toString().padStart(5, "0"),
                    RowNo: (0).toString().padStart(5, "0")
                };

				_self.ParentTable = _self.findParentPanel(oEvent.oSource);
				
				var contentModel = oEvent.getSource().getModel("contentModel"),
					aContent = contentModel.getProperty("/Content");

				var parentTable = oEvent.getSource().getParent().getParent();

				if (!parentTable.getBindingContext(this.mId)) {
					parentTable = oEvent.getSource().getParent();
				}

				var _ctx = oEvent.oSource.getBindingContext(this.mId).getObject();

				this.Model.create("/PartsRemSet", {
                    "OrderNo": _ctx.OrderNo,
                    "OrderRevNo": _ctx.OrderRevNo,
                    "Activity": _ctx.Activity,
                    "WorkStep": _ctx.WorkStep,

                    "SeqNo": newLocalObject.SeqNo,
                    "RowNo": newLocalObject.RowNo,
                    "DispSeqNo": newLocalObject.DispSeqNo,
                    "TableType": tabType,

        }, {
					async: false,
					success: function(oData, response) {
						var _c = _self.findParentPanel(_self.ParentTable);

                        _self.reloadContent(_self.ParentTable, tabType)

                        // var _ind = _self.ParentTable.getBindingContext('backend').getObject().WorkStep;
						// delete _self.contentModel[_ind];

						// return (typeof _c['fireExpand']==='function')?_c.fireExpand({'expand':true}):false;
					},
					error: function(oError, response) {
						//self.processErrorMessages(oError);
						//	_promise.reject(oError, response);
					},
				})
			},

            closePremSelectionDialog: function () {
                if (controller.byId("PremSelectionDialog")) {
                    // controller.byId("PremSelectionDialog")._dialog.close();
                    controller.byId("PremSelectionDialog").destroy();

                }
            },

            deletePrem: function (oEvent) {

                var selectedContentContextObject = oEvent.getSource().getBindingContext("contentModel").getObject();
                var _self = this;
                var _panel = this.findParentPanel(oEvent.oSource);

                var _ctx = oEvent.oSource.getBindingContext(this.mId).getObject();
                var selectedContentContextObject = oEvent.getSource().getBindingContext("contentModel").getObject();

                _panel.setBusy(true);

                _self.deletePremItem({
                    "OrderNo": _ctx.OrderNo,
                    "OrderRevNo": _ctx.OrderRevNo,
                    "Activity": _ctx.Activity,
                    "WorkStep": _ctx.WorkStep,
                    "SeqNo" : selectedContentContextObject.SeqNo,
                    "RowNo" : '99999'
                })
                .done(function(oData){
                    _panel.setBusy(false);
                    _self.reloadContent(_panel, tabType);

                });

            },

            deletePremItem: function (oItem) {

                var _key = this.Model.createKey("/PartsRemSet", {
                    "OrderNo": oItem.OrderNo,
                    "OrderRevNo": oItem.OrderRevNo,
                    "Activity": oItem.Activity,
                    "WorkStep": oItem.WorkStep,
                    "SeqNo": oItem.SeqNo,
                    "RowNo": oItem.RowNo
                });

                var oPromise = $.Deferred();

                this.Model
                    .remove(_key, {
                        success: function (oData) {
                            oPromise.resolve(oData);
                        },
                        error: function (oError, response) {
                            oPromise.reject(oError, response);
                        },
                    });
                return oPromise;
            },


            getSpecLink: function (uid) {
                var _app = this.CallerController.getModel('app').oData;
                return _app.TCLink + "uid=" + uid;
            },
            getSpecLinkEnabled: function (uid) {
                return(uid)?true:false;
            },

            deletePremRow: function (oEvent) {
                controller = this.CallerController;
                self = this;
                self.Caller = oEvent.oSource;

                self.parentPanel = self.findParentPanel(oEvent.oSource);

                var backendModel = this.Model;

                var _parentPanel = self.findParentPanel(oEvent.oSource);

                var contentModel = oEvent.getSource().getModel("contentModel");

                var _parentTable = oEvent.getSource().getParent().getParent();

                if (_parentTable.getSelectedItems().length === 0) {
                    sap.m.MessageToast.show("Please select row to delete");
                    return;
                }

                var _delParts = [];

                var selectedTextContextObject = oEvent.getSource().getBindingContext(this.mId).getObject();

                _parentTable.getSelectedItems().reverse().forEach(function (item) {

                    var _promise = $.Deferred();

                    var ctxItemObject = item.getBindingContext("contentModel").getObject();

                    var _key = backendModel.createKey("/PartsRemSet", {
                        "OrderNo": selectedTextContextObject.OrderNo,
                        "OrderRevNo": selectedTextContextObject.OrderRevNo,
                        "Activity": selectedTextContextObject.Activity,
                        "WorkStep": selectedTextContextObject.WorkStep,
                        "SeqNo": ctxItemObject.SeqNo,
                        "RowNo": ctxItemObject.RowNo
                    });
    
                    _delParts.push(self.Model.remove(_key, {
                        async: false,
                        success: function (oData, response) {
                            _promise.resolve(oData, response);
                        },
                        error: function (oError, response) {
                            //self.processErrorMessages(oError);
                            _promise.reject(oError, response);
                        }
                    }));

                    return _promise;

                });

                $.when.apply($, _delParts).then(function () {
                    var _c = self.findParentPanel(_parentPanel);

                    self.reloadContent(_parentPanel, tabType);

                    // var _ind = _parentPanel.getBindingContext('backend').getObject().WorkStep;
                    // delete self.contentModel[_ind];

                    // return (typeof _c['fireExpand'] === 'function') ? _c.fireExpand({ 'expand': true }) : false;
                })

            },

        };
    }
);

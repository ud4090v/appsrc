sap.ui.define([
    "sap/ui/model/json/JSONModel", 
	"ula/mes/common/crypt/lza"
	],

		/**
		 * Model Constructors.
		 * 
		 * --by_Serge_Breslaw(n88977),@//www.linkedin.com/in/sergebreslaw
		 * 
		 * @memberOf z_tpo_mgrrep.model.models
		 */ 
		
function(JSONModel, lza) {
	"use strict";

	return {
			'id' : "xnav",
			'owner' : null,
			'create' : function(owner, params) {
				var _promise =  $.Deferred();
				var _cb = (params.caller) ? lza.decompressFromEncodedURIComponent(params.caller[0]).split('-') : [];
				var _model = new JSONModel({
					caller : params.caller[0],
					semObj :(_cb.length === 4) ? _cb[1] : "",
					intent :(_cb.length === 4) ? _cb[2] : "",
					navEnabled : false,
				});
				
				if (_model['oData'].semObj.length > 0 && _model['oData'].intent.length > 0) {
					  _model['oData'].navEnabled = !0;
				}	  					
				return $.Deferred().resolve(_model);
			},

			'set' : function(model, owner) {
				this['owner'] = owner || sap.ui.getCore();
				this['owner']['setModel'](model,this.id)
			},
			'get' : function() {
				return this['owner']['getModel'](this.id);
			},
			getSemObject : function() {
				return this.get().oData.semObj;
			},
			getIntent : function() {
				return this.get().oData.intent;
			}
	};
});
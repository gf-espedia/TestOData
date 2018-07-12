sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("comm.espedia.TestOdata.controller.View1", {

		onInit: function () {
			this.formModel = new sap.ui.model.json.JSONModel({
				"Nome": "",
				"Cognome": "",
				"DataNascita": new Date()
			});
			this.getView().byId("form").setModel(this.formModel);

			this.getView().setModel(new sap.ui.model.json.JSONModel({
				globalFilter: "",
				availabilityFilterOn: false,
				cellFilterOn: false
			}), "ui");
			this._oGlobalFilter = null;
		},

		_filter: function () {
			var oFilter = null;
			oFilter = this._oGlobalFilter;
			var oItems = this.byId("idDipendenti").getBinding("items");
			oItems.filter(oFilter, "Application");
		},
		
		filterGlobally : function(oEvent) {
			var sQuery = oEvent.getParameter("query");
			this._oGlobalFilter = null;
			if (sQuery) {
				this._oGlobalFilter = new Filter([
					new Filter("Nome", FilterOperator.Contains, sQuery),
					new Filter("Cognome", FilterOperator.Contains, sQuery)
				], true);
			}
			this._filter();
		},

		delRow: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var oModel = this.getView().getModel();
			oModel.remove(sPath, {
				"success": function () {
					sap.m.MessageToast.show("yeeeeeh, cancellato!");
				},
				"error": function () {
					sap.m.MessageToast.show("schifo!");
				}
			});
		},

		onAdd: function (oEvent) {
			var newRow = this.formModel.getData();
			var oModel = this.getView().getModel();
			var sPath = this.getView().byId("idDipendenti").getBindingInfo("items").path;
			oModel.create(sPath, newRow, {
				"success": function () {
					sap.m.MessageToast.show("yeeeeeh, aggiunto!");
					this.setGridVisible("nuovoDipendente", false);
				},
				"error": function () {
					sap.m.MessageToast.show("schifo!");
				}
			});
		},

		onCancel: function (oEvent) {
			this.setGridVisible("nuovoDipendente", false);
		},

		setGridVisible: function (ID, sValue) {
			var grid = this.getView().byId(ID);
			grid.setVisible(sValue);
		},

		onCreate: function (oEvent) {
			this.setGridVisible("nuovoDipendente", true);
		},

		onClick: function (oEvent) {
			// al click della riga della tabella carico informazioni di testate e di posizione nella nuova pagina, 
			// devo passare ID della riga selezionata al router

			//SENZA PARAMETRI
			//var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			//oRouter.navTo("Detail");

			//CON PARAMETRI
			//var sPath = oEvent.getParameter("listItem").getBindingContext().getPath(); //chiamata da Table
			var sPath = oEvent.getSource().getBindingContext().getPath(); // chiamata da ColumnListItem 
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Detail", {
				Path: sPath.substr(1)
			});

		}

	});
});
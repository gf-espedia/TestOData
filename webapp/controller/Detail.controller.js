sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"jquery.sap.global",
	"sap/ui/core/routing/History",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function (Controller, jQuery, History, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("comm.espedia.TestOdata.controller.Detail", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf comm.espedia.TestOdata.view.Detail
		 */
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Detail").attachPatternMatched(this._onObjectMatched, this);
			this.tableModel = new sap.ui.model.json.JSONModel({
				"results": [{
					"Evento": "Evento",
					"Data": new Date()
				}]
			});
			this.oTable = this.getView().byId("idProductsTable");
			this.oTable.setModel(this.tableModel);
			this.oReadOnlyTemplate = this.oTable.removeItem(0);
			this.oEditableTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Input({
						value: "{Evento}"
					}),
					new sap.m.DatePicker({
						value: "{path : 'Data', type : 'sap.ui.model.odata.type.DateTime', constraints : {displayFormat : 'Date'}}"
							//type: "sap.ui.model.odata.type.DateTime",
							//constraints: {
							//	displayFormat: "Date"
							//}
					})
				]
			});
		},

		_onObjectMatched: function (oEvent) {
			this.sPath = "/" + oEvent.getParameter("arguments").Path;
			this.id = this.getID(this.sPath);

			var oViewModel = this.getOwnerComponent().getModel();
			oViewModel.read('/PosizioneDipendentiSet', {
				"filters": [new Filter({
					path: "Id",
					operator: FilterOperator.EQ,
					value1: this.id
				})],
				"success": function (oData) {
					this.tableModel.setData(oData);
					this.rebindTable(this.oReadOnlyTemplate, "Navigation");
				}.bind(this),
				"error": function (err) {
					sap.m.MessageToast.show("schifo!");
				}
			});
		},

		getID: function (string) {
			var regExp = /\('([A-Z0-9]+)'\)/;
			var match = regExp.exec(string);
			return match[1];
		},

		onNavBack: function () {
			// check sono in edit?
			var saveButtonVisible = this.byId("saveButton").getVisible();
			//if (saveButtonVisible) {
			//};
			//var oHistory = History.getInstance();
			//var sPreviousHash = oHistory.getPreviousHash();
			//if (sPreviousHash !== undefined) {
			//	window.history.go(-1);
			//} else {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteView1", {}, true);
			//}

		},

		rebindTable: function (oTemplate, sKeyboardMode) {
			debugger;
			this.oTable.bindItems({
				path: "/results",
				template: oTemplate
			}).setKeyboardMode(sKeyboardMode);
		},

		onAddEvento: function () {
			var aResult = {
				"Id": this.id,
				"IdEvento": "00000",
				"Evento": " ",
				"Data": Date()
			};
			var data = this.tableModel.getData().results;
			data.push(aResult);
			this.tableModel.setData({
				"results": data
			});

		},

		onEdit: function () {
			this.aCollection = jQuery.extend(true, [], this.tableModel.getProperty("/results"));
			this.byId("editButton").setVisible(false);
			this.byId("saveButton").setVisible(true);
			this.byId("cancelButton").setVisible(true);
			this.rebindTable(this.oEditableTemplate, "Edit");
		},

		onSave: function () {
			this.byId("saveButton").setVisible(false);
			this.byId("cancelButton").setVisible(false);
			this.byId("editButton").setVisible(true);
			debugger;
			var oViewModel = this.getView().getModel();
			var results = this.oTable.getModel().getData().results;
			for (var aData of results) {
// COMMENTO GITHUB
				if (aData.IdEvento === "00000") {
					var sPath = "/PosizioneDipendentiSet"; 
					oViewModel.create(sPath, aData, {
						"success": function () {
							this.rebindTable(this.oReadOnlyTemplate, "Navigation");
						}.bind(this),
						"error": function (err) {
							sap.m.MessageToast.show("Dati non salvati per: " + aData.Evento);
						}
					});
				} 
				else {
					var sPath = "/PosizioneDipendentiSet(Id='" + aData.Id + "',IdEvento='" + aData.IdEvento + "')";
					oViewModel.update(sPath, aData, {
						"success": function () {
							this.rebindTable(this.oReadOnlyTemplate, "Navigation");
						}.bind(this),
						"error": function (err) {
							sap.m.MessageToast.show("schifo!");
						}
					});
				}
			}
		},

		onCancel: function () {
			this.byId("cancelButton").setVisible(false);
			this.byId("saveButton").setVisible(false);
			this.byId("editButton").setVisible(true);
			this.tableModel.setProperty("/results", this.aCollection);
			this.rebindTable(this.oReadOnlyTemplate, "Navigation");
		}

	});

});
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
			this.byId("AddEvento").setVisible(true);
			this.byId("DeleteAll").setVisible(true);
			this.byId("editButton").setVisible(false);
			this.byId("saveButton").setVisible(true);
			this.byId("cancelButton").setVisible(true);
			this.rebindTable(this.oEditableTemplate, "Edit");
		},

		onSave: function () {
			this.getView().setBusyIndicatorDelay(0);
			this.getView().setBusy(true);
			//layout
			this.byId("AddEvento").setVisible(false);
			this.byId("DeleteAll").setVisible(false);
			this.byId("saveButton").setVisible(false);
			this.byId("cancelButton").setVisible(false);
			this.byId("editButton").setVisible(true);
			// gestione batch
			var oViewModel = this.getView().getModel();
			oViewModel.setUseBatch(true);
			var changeSetId = "SetId";
			oViewModel.setDeferredGroups([changeSetId]);
			var mParameters = {
				"groupId": changeSetId,
				"changeSetId": changeSetId
			};
			var batchSuccess = function (oData) {
				this.getView().setBusy(false);
				sap.m.MessageToast.show("Data Saved");
				this.rebindTable(this.oReadOnlyTemplate, "Navigation");
			}.bind(this);
			var batchError = function (err) {
				this.getView().setBusy(false);
				MessageBox.error(err.message);
				this.rebindTable(this.oReadOnlyTemplate, "Navigation");
			}.bind(this);
			// dati
			var results = this.oTable.getModel().getData().results;
			for (var aData of results) {

				if (aData.IdEvento === "00000") {
					var sPath = "/PosizioneDipendentiSet";
					// non va bene su chiamate multiple... devo gestirmi il batch
					/*oViewModel.create(sPath, aData, {
						"success": function () {
							this.rebindTable(this.oReadOnlyTemplate, "Navigation");
						}.bind(this),
						"error": function (err) {
							this.rebindTable(this.oReadOnlyTemplate, "Navigation");
							sap.m.MessageToast.show("Dati non salvati per: " + aData.Evento);
						}
					}); */
					oViewModel.create(sPath, aData, mParameters);
				} else {
					var sPath = "/PosizioneDipendentiSet(Id='" + aData.Id + "',IdEvento='" + aData.IdEvento + "')";
					// non va bene su chiamate multiple... devo gestirmi il batch
					/*oViewModel.update(sPath, aData, {
						"success": function () {
							this.rebindTable(this.oReadOnlyTemplate, "Navigation");
						}.bind(this),
						"error": function (err) {
							this.rebindTable(this.oReadOnlyTemplate, "Navigation");
							sap.m.MessageToast.show("schifo!");
						}
					});*/
					oViewModel.update(sPath, aData, mParameters);
				}
			}
			//lancio l'esecuzione del batch
			oViewModel.submitChanges({
				"groupId": changeSetId,
				"changeSetId": changeSetId,
				"success": batchSuccess,
				"error": batchError
			});
		},

		onCancel: function () {
			this.byId("AddEvento").setVisible(false);
			this.byId("DeleteAll").setVisible(false);
			this.byId("cancelButton").setVisible(false);
			this.byId("saveButton").setVisible(false);
			this.byId("editButton").setVisible(true);
			this.tableModel.setProperty("/results", this.aCollection);
			this.rebindTable(this.oReadOnlyTemplate, "Navigation");
		},

		onDeleteAll: function () {
			var oViewModel = this.getView().getModel();
			oViewModel.callFunction("/DeleteAllEvents", {
				method: 'POST',
				urlParameters: {
					"Id": this.id
				},
				success:
					(oData) => {
						this.tableModel.setData({
							"results": []
						});
						this.rebindTable(this.oReadOnlyTemplate, "Navigation")
					},
				/*function (oData) {
					this.rebindTable(this.oReadOnlyTemplate, "Navigation")
				}.bind(this),*/
				error: function (err) {
					sap.m.MessageToast.show("schifo!");
					this.rebindTable(this.oReadOnlyTemplate, "Navigation");
				}.bind(this),
			})
		}

	});

});
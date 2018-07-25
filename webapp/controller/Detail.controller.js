sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"comm/espedia/TestOdata/controller/Function/SearchHelp",
	"jquery.sap.global",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, SearchHelp, jQuery, History, Filter, FilterOperator) {
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
					"Evento": "",
					"Data": new Date()
				}]
			});

			this.oTable = this.getView().byId("idEventiTable");
			this.oTable.setModel(this.tableModel);
			this.oReadOnlyTemplate = this.oTable.removeItem(0);
			this.oEditableTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Input({
						value: "{Evento}",
						id: "eventoInput",
						type: "Text",
						placeholder: "Enter event ...",
						showValueHelp: true,
						valueHelpRequest: this.handleValueHelp.bind(this)
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

			var pageModel = new sap.ui.model.json.JSONModel({
				"dipendente": "Dipendente"
			});
			var oPage = this.getView().byId("pageDetail");
			oPage.setModel(pageModel);
		},

		// ------------------------------------------------------------------------------ SearchHelp

		handleValueHelp: function (oEvent) {
			SearchHelp.handleValueHelp(oEvent, this);
		},

		handleValueHelpSearch: function (oEvent) {
			SearchHelp._handleValueHelpSearch(oEvent);
		},

		handleValueHelpClose: function (oEvent) {
			SearchHelp._handleValueHelpClose(oEvent);
		},

		// ------------------------------------------------------------------------------ Utilities
		_onObjectMatched: function (oEvent) {
			this.sPath = "/" + oEvent.getParameter("arguments").Path;
			this.id = this.getID(this.sPath);

			var oViewModel = this.getOwnerComponent().getModel();
			// Sostituisco con chiamata tramite Navigation Property - vanno bene entrambi i metodi
			/*oViewModel.read('/PosizioneDipendentiSet', {
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
			});*/
			var sPath = this.sPath + "/header2posizione";
			oViewModel.read(sPath, {
				"success": function (oData) {
					this.tableModel.setData(oData);
					this.rebindTable(this.oReadOnlyTemplate, "Navigation");
				}.bind(this),
				"error": function (err) {
					sap.m.MessageToast.show("schifo!");
				}
			});

			var pageModel = new sap.ui.model.json.JSONModel({
				"dipendente": "Dipendente"
			});
			var oPage = this.getView().byId("pageDetail");
			var oPageModel = oPage.getModel();

			oViewModel.read(this.sPath, {
				"success": function (oData) {
					var oPageData = {
						"dipendente": oData.Nome + " " + oData.Cognome
					};
					oPageModel.setData(oPageData);
				},
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

		rebindTable: function (oTemplate, sKeyboardMode) {
			this.oTable.bindItems({
				path: "/results",
				template: oTemplate
			}).setKeyboardMode(sKeyboardMode);
			//layout
			if (sKeyboardMode === 'Edit') {
				this.byId("AddEvento").setVisible(true);
				this.byId("DeleteAll").setVisible(true);
				this.byId("editButton").setVisible(false);
				this.byId("saveButton").setVisible(true);
				this.byId("cancelButton").setVisible(true);
			} else {
				this.byId("AddEvento").setVisible(false);
				this.byId("DeleteAll").setVisible(false);
				this.byId("cancelButton").setVisible(false);
				this.byId("saveButton").setVisible(false);
				this.byId("editButton").setVisible(true);
			}
		},

		onNavBack: function () {
			// check sono in edit?
			var saveButtonVisible = this.byId("saveButton").getVisible();
			if (saveButtonVisible) {
				var dialog = new sap.m.Dialog({
					title: 'Confirm',
					type: 'Message',
					content: new sap.m.Text({
						text: 'Are you sure you want to exit? Data not saved will be lost'
					}),
					buttons: [new sap.m.Button({
						text: 'Continue',
						press: function () {
							this._confirmNavBack();
							dialog.close();
						}.bind(this)
					}), new sap.m.Button({
						text: 'Save',
						press: function () {
							this.onSave();
							this._confirmNavBack();
							dialog.close();
						}.bind(this)
					}), new sap.m.Button({
						text: 'Cancel',
						press: function () {
							dialog.close();
						}
					})],
					afterClose: function () {
						dialog.destroy();
					}
				});
				dialog.open();
			} else {
				this._confirmNavBack();
			}
		},

		_confirmNavBack: function () {
			//var oHistory = History.getInstance();
			//var sPreviousHash = oHistory.getPreviousHash();
			//if (sPreviousHash !== undefined) {
			//	window.history.go(-1);
			//} else {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteView1", {}, true);
			//}
		},

		// ------------------------------------------------------------------------------ Eventi Bottoni
		onAddEvento: function () {
			var aResult = {
				"Id": this.id,
				"IdEvento": "00000",
				"Evento": "",
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
			this.rebindTable(this.oEditableTemplate, "Edit");
		},

		onSave: function () {
			this.getView().setBusyIndicatorDelay(0);
			this.getView().setBusy(true);
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
				//MessageBox.error(err.message);
				this.rebindTable(this.oReadOnlyTemplate, "Navigation");
			}.bind(this);
			// dati
			var results = this.oTable.getModel().getData().results;
			var aData;
			for (var i in results) { //aData of results non gli piace

				aData = results[i];
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
			this.tableModel.setProperty("/results", this.aCollection);
			this.rebindTable(this.oReadOnlyTemplate, "Navigation");
		},

		onDeleteAll: function () {
			var dialog = new sap.m.Dialog({
				title: 'Confirm',
				type: 'Message',
				content: new sap.m.Text({
					text: 'Are you sure you want to delete all event?'
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function () {
						this._deleteAll();
						dialog.close();
					}.bind(this)
				}),
				endButton: new sap.m.Button({
					text: 'Cancel',
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		_deleteAll: function () {
			var oViewModel = this.getView().getModel();
			oViewModel.callFunction("/DeleteAllEvents", {
				method: 'POST',
				urlParameters: {
					"Id": this.id
				},
				success:
				// funzione con bind
					function (oData) {
					this.tableModel.setData({
						"results": []
					});
					this.rebindTable(this.oReadOnlyTemplate, "Navigation");
				}.bind(this),
				// funzione senza bind ma che funziona ugualmente (solo per funzioni dichiarate al volo)
				/*	(oData) => {
					this.tableModel.setData({
						"results": []
					});
					this.rebindTable(this.oReadOnlyTemplate, "Navigation");
				},*/
				error: function (err) {
					sap.m.MessageToast.show("Errore");
					this.rebindTable(this.oReadOnlyTemplate, "Navigation");
				}.bind(this)
			});
		}

	});

});
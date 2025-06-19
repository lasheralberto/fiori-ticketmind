sap.ui.define([
    "sap/ui/base/ManagedObject", // Hereda de ManagedObject para tener funcionalidades básicas de UI5
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (ManagedObject, Fragment, MessageToast, MessageBox) {
    "use strict";

    return ManagedObject.extend("ticketmind.controller.FileUploader", {

        _file: null, // Variable para almacenar el archivo seleccionado
        _oDialog: null, // Instancia del Dialog
        _oOwnerComponent: null, // Referencia al componente que lo creó
        _oOwnerView: null, // Referencia a la vista que lo usa
        _oDataModel: null, // Referencia al modelo OData para la llamada create

        /**
         * Constructor del helper.
         * @param {sap.ui.core.Control} oOwnerView La vista que está abriendo el diálogo.
         * @param {sap.ui.model.odata.v2.ODataModel} oDataModel El modelo OData a usar para la creación de la entidad.
         */
        constructor: function (oOwnerView, oDataModel) {
            ManagedObject.apply(this, arguments); // Llama al constructor de la clase base
            this._oOwnerView = oOwnerView;
            this._oOwnerComponent = oOwnerView.getController().getOwnerComponent(); // Asume que la vista tiene un controlador que a su vez tiene un componente
            this._oDataModel = oDataModel;
        },

        /**
         * Abre el diálogo del FileUploader.
         */
        open: function () {
            if (!this._oDialog) {
                // Cargar el fragmento solo la primera vez
                Fragment.load({
                    id: this._oOwnerView.getId(), // Usar el ID de la vista como prefijo
                    name: "ticketmind.view.fragments.FileUploaderDialog",
                    controller: this // ¡IMPORTANTE! Pasar esta instancia del helper como controlador del fragmento
                }).then(function (oDialog) {
                    this._oDialog = oDialog;
                    this._oOwnerView.addDependent(this._oDialog); // Añadir el diálogo como dependiente de la vista
                    this._oDialog.open();
                }.bind(this));
            } else {
                // Si el diálogo ya existe, simplemente ábrelo y limpia los campos
                this._oDialog.open();
                this._getControlById("fileUploader").clear();
                this._getControlById("txtContentDisplay").setValue("");
                this._file = null;
            }
        },

        /**
         * Cierra el diálogo del FileUploader.
         */
        close: function () {
            if (this._oDialog) {
                this._oDialog.close();
            }
        },

        /**
         * Método auxiliar para obtener controles del diálogo por su ID, con prefijo.
         * @param {string} sId El ID del control dentro del fragmento.
         * @returns {sap.ui.core.Control} El control encontrado.
         */
        _getControlById: function (sId) {
            // El ID del diálogo se construye con el ID de la vista + el ID del control dentro del fragmento
            return this._oOwnerView.byId(sId);
        },

        // --- MÉTODOS MANEJADORES DE EVENTOS DEL FRAGMENTO ---

        onFileChange: function (oEvent) {
            this._file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
            var oTextArea = this._getControlById("txtContentDisplay");
            if (this._file) {
                MessageToast.show("Archivo '" + this._file.name + "' seleccionado.");
                // Leer y mostrar el contenido del archivo
                var oReader = new FileReader();
                oReader.onload = function (e) {
                    oTextArea.setValue(e.target.result);
                };
                oReader.onerror = function (e) {
                    oTextArea.setValue("Error al leer el archivo.");
                };
                oReader.readAsText(this._file);
            } else {
                oTextArea.setValue("");
            }
        },

        onUploadPress: function () {
            if (!this._file) {
                MessageBox.error("Por favor, selecciona un archivo TXT primero.");
                return;
            }
            var sFileContent = this._getControlById("txtContentDisplay").getValue();
            this._createEntityWithTxtContent(sFileContent, this._file.name);
        },

        _createEntityWithTxtContent: function (sContent, sFileName) {
            const sPath = "/YourTextFilesSet"; // Tu EntitySet en el servicio OData

            this._oDataModel.create(sPath, { FileName: sFileName, FileContent: sContent }, {
                success: function (oData, oResponse) {
                    MessageBox.success("Archivo TXT subido y recuperado con éxito. ID de Entidad: " + (oData.ID || "N/A"));
                    this.close(); // Cerrar el diálogo
                    this._getControlById("fileUploader").clear();
                    this._getControlById("txtContentDisplay").setValue("");
                    this._file = null;
                }.bind(this),
                error: function (oError) {
                    const sErrorMessage = oError.responseText ? JSON.parse(oError.responseText).error.message.value : oError.message;
                    MessageBox.error("Error al subir el archivo TXT: " + sErrorMessage);
                }.bind(this)
            });
        },

        onCancelUploadPress: function () {
            if (this._oDialog) {
                this._oDialog.close();
            }
        },

        onDialogClose: function () {
            // Este método se llama después de que el diálogo se cierra (por cualquier motivo)
            // Puedes limpiar variables o hacer otras acciones de limpieza aquí
            this._getControlById("fileUploader").clear();
            this._getControlById("txtContentDisplay").setValue("");
            this._file = null;
            this._oDialog.close();
        },

        /**
         * Destruye el diálogo y limpia referencias cuando el helper ya no es necesario.
         * Debería llamarse, por ejemplo, en el onExit de la vista principal.
         */
        destroy: function() {
            if (this._oDialog) {
                this._oDialog.destroy();
                this._oDialog = null;
            }
            this._file = null;
            this._oOwnerView = null;
            this._oOwnerComponent = null;
            this._oDataModel = null;
            ManagedObject.prototype.destroy.apply(this, arguments); // Llama al método destroy de la clase base
        }
    });
});
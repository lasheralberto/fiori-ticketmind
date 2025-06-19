sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "../model/formatter",
    //"ticketmind/controller/Fileuploader.controller" // Asegúrate de que la ruta al helper sea correcta
], function (Controller, JSONModel, MessageToast, DateFormat, formatter) {
    "use strict";

    return Controller.extend("ticketmind.controller.MainView", {
        formatter: formatter, // Asegúrate de que el formatter esté correctamente importado
        onInit: function () {
            var oMainModel = new JSONModel({
                newPrediction: {
                    inputText: "",
                    processing: false
                },
                recentPredictions: [],
                training: {
                    isProcessing: false
                }
            });
            this.getView().setModel(oMainModel, "mainModel");

            this.byId("predictionsTable").attachEvent("updateFinished", this._createTeamFilterButtons, this);

            //this._loadRecentPredictions();
        },
        //
        onAnalyzeFeedback: function () {
            var oMainModel = this.getView().getModel("mainModel");
            var sInputText = oMainModel.getProperty("/newPrediction/inputText");

            if (!sInputText || sInputText.trim().length === 0) {
                MessageToast.show("Please enter feedback text to analyze");
                return;
            }

            oMainModel.setProperty("/newPrediction/processing", true);

            // Simulación de procesamiento
            setTimeout(() => {
                this._processFeedback(sInputText);
            }, 1500);
        },

        _processFeedback: function (sInputText) {
            var oMainModel = this.getView().getModel("mainModel");
            var oDataModel = this.getView().getModel(); // Asumiendo que el modelo OData default está configurado

            // Crear nueva predicción simulada
            var oNewPrediction = {
                PredictionId: this._generateGuid(),
                InputText: sInputText,
                ProcessingStatus: "IN_PROGRESS"
            };

            // Preparar payload para la llamada OData
            var oPayload = {
                PredictionId: oNewPrediction.PredictionId,
                InputText: sInputText
            };

            // Realizar llamada OData UPDATE
            oDataModel.create("/FeedbackPredictions", oPayload, null, {
                success: function (oData, response) {
                    // Actualizar lista de predicciones
                    var aPredictions = oMainModel.getProperty("/recentPredictions");
                    aPredictions.unshift(oNewPrediction);
                    oMainModel.setProperty("/recentPredictions", aPredictions);

                    // Resetear estado
                    oMainModel.setProperty("/newPrediction/inputText", "");
                    oMainModel.setProperty("/newPrediction/processing", false);

                    MessageToast.show("Analysis started successfully!");
                },
                error: function (oError) {
                    // Manejar el error
                    MessageToast.show("Error processing feedback: " + oError.message);
                    oMainModel.setProperty("/newPrediction/processing", false);
                }
            });
        },

        _loadRecentPredictions: function () {

            var oModel = this.getOwnerComponent().getModel(); // Obtener el modelo OData configurado

            oModel.read("/FeedbackPredictions", {
                success: function (oData) {
                    // Asume que oData.results contiene los registros


                    this.getView().getModel("mainModel").setProperty("/recentPredictions", oData.results);
                }.bind(this),
                error: function (oError) {
                    //MessageBox.error("Error al cargar predicciones recientes.");
                    // console.error(oError);
                }
            });


            // Simulación de datos
            // var aMockPredictions = [
            //     {
            //         PredictionId: "1",
            //         InputText: "This is a great product!",
            //         CreatedAt: new Date(),
            //         SentimentClass: "positive",
            //         ProcessingStatus: "COMPLETED"
            //     },
            //     {
            //         PredictionId: "2",
            //         InputText: "I am having issues with this.",
            //         CreatedAt: new Date(),
            //         SentimentClass: "negative",
            //         ProcessingStatus: "COMPLETED"
            //     }
            // ];

            // this.getView().getModel("mainModel").setProperty("/recentPredictions", aMockPredictions);
        },

        _openFileUploaderDialog: function () {
            var oView = this.getView();

            // Solo crea el fragmento una vez
            if (!this._pFileUploaderDialog) {
                this._pFileUploaderDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "ticketmind.view.fragments.FileUploaderDialog",
                    controller: this // Usa el mismo controlador para manejar eventos
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    return oDialog;
                });
            }

            this._pFileUploaderDialog.then(function (oDialog) {
                oDialog.open();
            });
        },

        onTrainModel: function () {
            var oMainModel = this.getView().getModel("mainModel");
            var oDataModel = this.getView().getModel();

            // Preparar payload para el entrenamiento
            var oPayload = {
                DatasetId: "model.txt"
            };

            // Actualizar UI
            oMainModel.setProperty("/training/isProcessing", true);

            // Llamada OData para iniciar entrenamiento
            oDataModel.create("/ModelTrainings", oPayload, {
                success: function (oData) {
                    MessageToast.show("Model training started successfully!");
                    oMainModel.setProperty("/training/isProcessing", false);
                },
                error: function (oError) {
                    MessageToast.show("Error starting model training: " + oError.message);
                    oMainModel.setProperty("/training/isProcessing", false);
                }
            });
        },

        // Helpers y formatters
        _mockSentimentAnalysis: function (sText) {
            var lowerText = sText.toLowerCase();
            if (lowerText.includes("good") || lowerText.includes("great") || lowerText.includes("love")) {
                return "positive";
            } else if (lowerText.includes("bad") || lowerText.includes("hate") || lowerText.includes("issue")) {
                return "negative";
            }
            return "neutral";
        },

        _generateGuid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },

        formatDateTime: function (oDate) {
            if (!oDate) return "";
            return DateFormat.getDateTimeInstance({ pattern: "dd/MM/yyyy HH:mm" }).format(new Date(oDate));
        },

        formatInputPreview: function (sText) {
            if (!sText) return "";
            return sText.length <= 50 ? sText : sText.substring(0, 47) + "...";
        },

        formatCharacterCount: function (sText) {
            return (sText ? sText.length : 0) + " / 5000";
        },

        getSentimentState: function (sSentiment) {
            switch (sSentiment) {
                case "positive": return "Success";
                case "negative": return "Error";
                default: return "None";
            }
        },

        getProcessingState: function (sStatus) {
            switch (sStatus) {
                case "COMPLETED": return "Success";
                case "PROCESSING": return "Warning";
                case "ERROR": return "Error";
                default: return "None";
            }
        },

        getPriorityState: function (sPriority) {
            if (!sPriority) return "None";

            switch (sPriority.toLowerCase()) {
                case "high":
                    return "Error";
                case "medium":
                    return "Warning";
                case "low":
                    return "Success";
                default:
                    return "None";
            }
        },

        formatPercentage: function (value) {
            return value ? Math.round(value * 100) : 0;
        },

        formatTextPreview: function (text) {
            if (!text) return "";
            return text.length > 100 ? text.substring(0, 97) + "..." : text;
        },

        onInputTextPress: function (oEvent) {
            const text = oEvent.getSource().getBindingContext().getProperty("InputText");

            if (!this._oDialog) {
                this._oDialog = new sap.m.Dialog({
                    title: "Feedback Text",
                    content: new sap.m.Text({
                        text: text,
                        wrapping: true
                    }),
                    beginButton: new sap.m.Button({
                        text: "Close",
                        press: function () {
                            this._oDialog.close();
                        }.bind(this)
                    }),
                    contentHeight: "50%",
                    contentWidth: "50%"
                });
            } else {
                this._oDialog.getContent()[0].setText(text);
            }

            this._oDialog.open();
        },

        onRowPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            const oData = oContext.getObject();

            // Solo crea el diálogo una vez y reutilízalo
            if (!this._oDetailDialog) {
                let teamFormatted = formatter.formatTeamClass(oData.TeamClass);
                let dateFormatted = formatter.formatDateTime(oData.CreatedAt);
       
                this._oDetailDialog = new sap.m.Dialog({
                    title: "Prediction Details",
                    contentWidth: "600px", // Ancho ajustado para un mejor espaciado
                    contentHeight: "auto", // Altura automática para adaptarse al contenido

                    // Contenedor principal para todo el contenido del diálogo
                    content: new sap.m.VBox({
                        fitContainer: true,
                        class: "sapUiResponsiveMargin", // Margen adaptable alrededor de todo el contenido
                        items: [
                            // --- SECCIÓN DE CABECERA ---
                            // Muestra el ID de la predicción y el estado de procesamiento

                            new sap.m.Panel({

                                expandable: true,
                                expanded: true,
                                headerText: "ID",
                                class: "sapUiSmallMarginBottom",
                                content: new sap.m.Text({
                                    text: "{PredictionId}",
                                    wrapping: true
                                }).addStyleClass("sapUiSmallMargin")
                            }),

                            // --- SECCIÓN DE TEXTO DE ENTRADA ---
                            // Panel para mostrar el texto de entrada completo
                            new sap.m.Panel({

                                expandable: true,
                                expanded: true,
                                headerText: "Input Text",
                                class: "sapUiSmallMarginBottom",
                                content: new sap.m.Text({
                                    text: "{InputText}",
                                    wrapping: true
                                }).addStyleClass("sapUiSmallMargin")
                            }),

                            // --- SECCIÓN DE RESULTADOS DEL ANÁLISIS (CON GRID LAYOUT) ---
                            // Panel que contiene una cuadrícula para los resultados del análisis
                            
                            new sap.m.Panel({
                                expandable: true,
                                expanded: true,
                                headerText: "Analysis Results",
                                content: new sap.ui.layout.Grid({
                                    defaultSpan: "L6 M6 S12", // 2 columnas en pantallas grandes/medianas, 1 en pequeñas
                                    vSpacing: 1,
                                    hSpacing: 1,
                                    containerQuery: true,
                                    content: [
                                        // Elemento de la cuadrícula: Sentimiento
                                        this._createGridItem("Sentiment", "{SentimentClass}", "{= ${SentimentClass} === 'POSITIVE' ? 'Success' : (${SentimentClass} === 'NEGATIVE' ? 'Error' : 'None')}"),

                                        // Elemento de la cuadrícula: Prioridad
                                        this._createGridItem("Priority", "{PriorityClass}", "{= ${PriorityClass} === 'HIGH' ? 'Error' : (${PriorityClass} === 'MEDIUM' ? 'Warning' : 'Success')}"),

                                        // Elemento de la cuadrícula: Categoría
                                        this._createGridItem("Category", "{CategoryClass}", "Information"),

                                        // Elemento de la cuadrícula: Equipo
                                        
                                        this._createGridItem("Team", teamFormatted, "Information")
                                    ]
                                }).addStyleClass("sapUiSmallMargin")
                            }),

                            // --- SECCIÓN DE DETALLES TÉCNICOS ---
                            new sap.m.Panel({
                                expandable: true,
                                expanded: true,
                                headerText: "Prediction Details",
                                content: new sap.ui.layout.Grid({
                                    defaultSpan: "L6 M6 S12",
                                    vSpacing: 1,
                                    hSpacing: 1,
                                    containerQuery: true,
                                    content: [

                                        this._createGridItem("Sentiment", "{SentimentConfidence}"),


                                        this._createGridItem("Priority", "{PriorityConfidence} ms"),
                                        this._createGridItem("Category", "{CategoryConfidence} ms"),
                                        this._createGridItem("Team", "{TeamConfidence} ms")
                                    ]
                                }).addStyleClass("sapUiSmallMargin")
                            }),

                            // --- SECCIÓN DE PIE DE PÁGINA ---
                            // Muestra el creador y la fecha de creación
                            new sap.m.Toolbar({
                                content: [
                                    new sap.m.Text({ text: "Created by: {CreatedBy}" }),
                                    new sap.m.ToolbarSpacer(),
                                    new sap.m.Text({ text: dateFormatted })
                                ]
                            }).addStyleClass("sapUiTinyMarginTop")
                        ]
                    }),

                    // Botón para cerrar el diálogo
                    beginButton: new sap.m.Button({
                        text: "Close",
                        type: "Emphasized",
                        press: function () {
                            this._oDetailDialog.close();
                        }.bind(this)
                    })
                });

                // Agrega el diálogo a la vista para que herede el modelo de datos
                this.getView().addDependent(this._oDetailDialog);
            }

            // Vincula el contexto de la fila seleccionada al diálogo y lo abre
            this._oDetailDialog.setBindingContext(oContext);
            this._oDetailDialog.open();
        },

        /**
         * Función auxiliar para crear un item de la cuadrícula de forma consistente.
         * @param {string} sLabel El texto para la etiqueta.
         * @param {string} sTextBinding El binding para el texto del valor.
         * @param {string} [sStateBinding] El binding opcional para el estado del ObjectStatus.
         * @returns {sap.m.VBox} El control VBox para ser insertado en la cuadrícula.
         */
        _createGridItem: function (sLabel, sTextBinding, sStateBinding) {
            var oControl;

            // Si se proporciona un binding de estado, usamos ObjectStatus para colorear el texto.
            // De lo contrario, usamos un simple sap.m.Text.
            if (sStateBinding) {
                oControl = new sap.m.ObjectStatus({
                    text: sTextBinding,
                    state: sStateBinding
                });
            } else {
                oControl = new sap.m.Text({
                    text: sTextBinding
                });
            }

            return new sap.m.VBox({
                // Centra el contenido verticalmente y horizontalmente
                justifyContent: "Center",
                alignItems: "Center",
                items: [
                    new sap.m.Label({
                        text: sLabel,
                        class: "sapUiTinyMarginBottom"
                    }),
                    oControl
                ]
            });
        },



        mapSentimentLevel: function (iValue) {
            switch (parseInt(iValue, 10)) {
                case 0: return "Muy satisfecho";
                case 1: return "Satisfecho";
                case 2: return "Neutral";
                case 3: return "Insatisfecho";
                case 4: return "Muy insatisfecho";
                default: return "Sin clasificar";

            }
        },

        onCancelUploadPress: function (oEvent) {
            // Encuentra el diálogo padre del botón pulsado y ciérralo
            oEvent.getSource().getParent().close();
        },
        onTeamFilterChange: function (oEvent) {
            var sTeam = oEvent.getSource().getSelectedKey();
            var oTable = this.byId("idDeTuTabla"); // Pon el ID real de tu tabla aquí
            var oBinding = oTable.getBinding("items");
            var aFilters = [];
            if (sTeam) {
                aFilters.push(new sap.ui.model.Filter("TeamClass", sap.ui.model.FilterOperator.EQ, sTeam));
            }
            oBinding.filter(aFilters);
        },

        onAfterRendering: function () {
            // Llama a la función para crear los botones después de renderizar la vista
            this._createTeamFilterButtons();
        },

        _createTeamFilterButtons: function () {
            var oTable = this.byId("predictionsTable");
            var oBinding = oTable.getBinding("items");
            var aContexts = oBinding ? oBinding.getContexts() : [];
            var aTeams = [];

            const oUniqueTeams = new Set();

            aContexts.forEach(function (oCtx) {
                var sTeam = oCtx.getObject().TeamClass;
                if (sTeam) {
                    let team = formatter.formatTeamClass(sTeam); // Formatea el nombre del equipo
                    oUniqueTeams.add(team); // Solo se añade si no existe
                }
            });

             aTeams = Array.from(oUniqueTeams); // Convertimos el Set a Array


            // Ordenar alfabéticamente o numéricamente según el tipo
            aTeams.sort(function (a, b) {
                // Si ambos son números
                if (!isNaN(a) && !isNaN(b)) {
                    return Number(a) - Number(b);
                }
                // Si son strings (alfabéticamente)
                return a.toString().localeCompare(b.toString());
            });


            var oHBox = this.byId("teamFilterBox");
            oHBox.removeAllItems();

            // Botón "Todos"
            oHBox.addItem(new sap.m.Button({
                text: "Todos",
                type: "Default",
                press: this._onTeamPushFilter.bind(this, ""),
                class: "teamFilterButton"
            }));

            // Un botón por equipo
            aTeams.forEach(function (sTeam) {
                oHBox.addItem(new sap.m.Button({
                    text: sTeam,
                    type: "Emphasized",
                    press: this._onTeamPushFilter.bind(this, sTeam),
                    class: "teamFilterButton"
                }));
            }.bind(this));
        },

        _onTeamPushFilter: function (sTeam) {
            var oTable = this.byId("predictionsTable"); // Cambia por el ID real de tu tabla
            var oBinding = oTable.getBinding("items");
            var aFilters = [];
            let teamParsed = 0;
            if (sTeam) {
                teamParsed = formatter.parseTeamClass(sTeam); // Asegúrate de que el nombre del equipo se parsea correctamente
                aFilters.push(new sap.ui.model.Filter("TeamClass", sap.ui.model.FilterOperator.EQ, teamParsed));
            }
            oBinding.filter(aFilters);
        },


    });
});
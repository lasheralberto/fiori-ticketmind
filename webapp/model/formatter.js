sap.ui.define([], function () {
    "use strict";

    return {
        /**
         * Formatea el valor numérico del equipo a su nombre legible.
         * @param {int|string} iValue - Código del equipo
         * @returns {string} Nombre del equipo
         */
        formatTeamClass: function (iValue) {
            switch (parseInt(iValue, 10)) {
                case 0: return "Hardware";
                case 1: return "Software";
                case 2: return "Cuentas y Seguridad";
                case 3: return "Redes e Infraestructura";
                default: return "Equipo Desconocido";
            }
        },
        parseTeamClass: function (sLabel) {
            switch (sLabel.toLowerCase()) {
                case "hardware":
                    return 0;
                case "software":
                    return 1;
                case "cuentas y seguridad":
                    return 2;
                case "redes e infraestructura":
                    return 3;
                default:
                    return -1; // o null si prefieres indicar que no se encontró
            }
        },

        formatDateTime: function (value) {
            if (!value || value.length < 14) {
                return "";
            }

            const year = value.substring(0, 4);
            const month = value.substring(4, 6);
            const day = value.substring(6, 8);
            const hour = value.substring(8, 10);
            const minute = value.substring(10, 12);
            const second = value.substring(12, 14);

            return `${day}-${month}-${year} ${hour}:${minute}:${second}`;
        },

        /**
         * Formatea fecha SAP (yyyymmddhhmmss) a "dd-mm-yyyy hh:mm"
         * @param {string} sDateTime - Fecha en formato SAP
         * @returns {string} Fecha formateada
         */
        _formatSapDateTime: function (sDateTime) {
            if (!sDateTime || sDateTime.length < 14) {
                return "";
            }
            var yyyy = sDateTime.substring(0, 4);
            var mm = sDateTime.substring(4, 6);
            var dd = sDateTime.substring(6, 8);
            var hh = sDateTime.substring(8, 10);
            var mi = sDateTime.substring(10, 12);
            return dd + "-" + mm + "-" + yyyy + " " + hh + ":" + mi;
        },

        /**
         * Capitaliza la primera letra de una cadena.
         * @param {string} sText - Texto de entrada
         * @returns {string} Texto capitalizado
         */
        _capitalizeFirstLetter: function (sText) {
            if (!sText) return "";
            return sText.charAt(0).toUpperCase() + sText.slice(1).toLowerCase();
        }
    };
});

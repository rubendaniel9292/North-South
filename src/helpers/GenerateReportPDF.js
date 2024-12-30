import alerts from "./Alerts";
import http from "./Http";

/**
 * Genera y descarga un reporte en PDF.
 * @param {Object} data - Los datos que se enviarán al servidor para generar el PDF.
 * @param {string} endpoint - La URL del endpoint para generar el PDF.
 * @param {string} fileName - El nombre del archivo PDF a descargar.
 * @param {Function} setIsLoading - Función para establecer el estado de carga.
 */
const generateReport = async (data, endpoint, fileName, setIsLoading) => {
  try {
    setIsLoading(true);
    console.log("Generando PDF para:", data);
    console.log("tipo de datos: ", typeof data);

    const response = await http.post(endpoint, data, {
      responseType: "blob", // Objeto Blob, que es la representación binaria del PDF.
      headers: {
        Accept: "application/pdf", // Encabezado "Accept" para indicar que estás esperando una respuesta en formato PDF.
      },
    });

    console.log("Respuesta recibida:", response.status);

    // Crear un URL para el blob
    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );

    // Crear elemento de descarga
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);

    // Descargar el archivo
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    alerts("Éxito", "PDF generado correctamente", "success");
  } catch (error) {
    console.error("Error durante la generación del PDF:", error);
    alerts("Error", "No se pudo generar el PDF", "error");
  } finally {
    setIsLoading(false);
  }
};

export default generateReport;
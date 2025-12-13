import { PDFViewer as ReactPDFViewer } from "@react-pdf/renderer";
import PropTypes from "prop-types";

/**
 * Componente opcional para previsualizar PDFs antes de descargar
 * Solo se debe usar en desarrollo o cuando el usuario quiera ver antes de descargar
 */
const PDFViewer = ({ document }) => {
  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ReactPDFViewer width="100%" height="100%">
        {document}
      </ReactPDFViewer>
    </div>
  );
};

PDFViewer.propTypes = {
  document: PropTypes.element.isRequired,
};

export default PDFViewer;

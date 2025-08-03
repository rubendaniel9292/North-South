import Swal from "sweetalert2";

const alerts = (title, message, ico, options = {}) => {
  console.log("🔍 Alerts.jsx - Parámetros recibidos:", { title, message, ico, options });
  
  return Swal.fire({
    title: title,
    text: message,
    icon: ico,
    ...options
  });
};

export default alerts;


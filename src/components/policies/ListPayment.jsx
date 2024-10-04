import { useEffect, useState } from "react";
import alerts from "../../helpers/Alerts";
import http from "../../helpers/Http";
import dayjs from "dayjs";
import "dayjs/locale/es";
export const ListPayment = () => {
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    getAllPayments();
  }, []);
  dayjs.locale("es");

  const getAllPayments = async () => {
    try {
      const response = await http.get("payment/get-all-payment");
      if (response.data.status === "success") {
        console.log(response.data);
        setPayments(response.data.allPayments);
      } else {
        alerts("Error", "No existen pagos registrados", "error");
        console.error("Error fetching polizas:", response.message);
      }
    } catch (error) {
      //setError(error);
      alerts("Error", "No se pudo ejecutar la consulta", "error");
      console.error("Error fetching póilzas:", error);
    }
  };
  return (
    <>
      <h2>Listado geneneral de los pagos</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>N°</th>
            <th>Número de Póliza</th>
            <th>Número de Pago</th>
            <th>Valor</th>
            <th>Abono</th>
            <th>Saldo</th>
            <th>Total</th>
            <th>Fecha de pago</th>
            <th>Observaciones</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment, index) => (
            <tr key={payment.id}>
              <td>{index + 1}</td>
              <td>{payment.policies.numberPolicy}</td>
              <td>{payment.number_payment}</td>
              <td>{payment.value || "0.00"}</td>
              <td>{payment.credit || "0.00"}</td>
              <td>{payment.balance || "0.00"}</td>
              <td>{payment.total}</td>
              <td>{dayjs(payment.startDate).format("DD/MM/YYYY")}</td>
              <td>{payment.observations || "N/A"}</td>
              <td>
                <button className="btn btn-success text-white fw-bold">
                  Actualizar
                </button>
               
              </td>

            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

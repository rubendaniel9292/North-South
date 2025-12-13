import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

const styles = StyleSheet.create({
    page: {
        paddingTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 50,
        fontSize: 10,
        fontFamily: "Helvetica",
    },
    header: {
        textAlign: "center",
        backgroundColor: "#122144",
        padding: 10,

    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ffffff",
    },
    subtitle: {
        fontSize: 10,
        color: "#cccccc",
        marginTop: 3,
    },
    table: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#000000",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#122144",
        color: "#ffffff",
        padding: 5,
        fontWeight: "bold",
        fontSize: 9,
        borderBottomWidth: 2,
        borderBottomColor: "#000000",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#cccccc",
        padding: 4,
    },
    tableRowAlt: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#cccccc",
        backgroundColor: "#f2f2f2",
        padding: 4,
    },
    tableCell: {
        fontSize: 8,
        padding: 2,
    },
    badge: {
        padding: 3,
        fontSize: 7,
        fontWeight: "bold",
        textAlign: "center",
    },
    badgeWarning: {
        backgroundColor: "#ffc107",
        color: "#000000",
    },
    footer: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: "center",
        fontSize: 8,
        color: "#777777",
        borderTopWidth: 1,
        borderTopColor: "#cccccc",
        paddingTop: 5,
    },
});

const PaymentsPDFDocument = ({ payments }) => {
    const getCustomerFullName = (customer) => {
        return `${customer.firstName} ${customer.secondName || ""} ${customer.surname} ${customer.secondSurname || ""}`.replace(/\s+/g, " ");
    };

    const getAdvisorFullName = (advisor) => {
        return `${advisor.firstName} ${advisor.secondName || ""} ${advisor.surname} ${advisor.secondSurname || ""}`.replace(/\s+/g, " ");
    };

    return (
        <Document>
            <Page size="A4" style={styles.page} orientation="landscape" wrap>
                <View style={styles.header} wrap={false}>
                    <Text style={styles.title}>
                        REPORTE DE PÓLIZAS CON PAGOS ATRASADOS
                    </Text>
                    <Text style={styles.subtitle}>
                        Generado el {dayjs().format("DD/MM/YYYY HH:mm")}
                    </Text>
                    <Text style={styles.subtitle}>
                        Total de registros: {payments.length}
                    </Text>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeader} fixed>
                        <Text style={[styles.tableCell, { width: "5%" }]}>N°</Text>
                        <Text style={[styles.tableCell, { width: "11%" }]}>
                            N° Póliza
                        </Text>
                        <Text style={[styles.tableCell, { width: "9%" }]}>
                            Teléfono
                        </Text>
                        <Text style={[styles.tableCell, { width: "18%" }]}>
                            Cliente
                        </Text>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                            Compañía
                        </Text>
                        <Text style={[styles.tableCell, { width: "13%" }]}>
                            Asesor
                        </Text>
                        <Text style={[styles.tableCell, { width: "9%" }]}>
                            Valor Pend.
                        </Text>
                        <Text style={[styles.tableCell, { width: "9%" }]}>
                            Valor Póliza
                        </Text>
                        <Text style={[styles.tableCell, { width: "9%" }]}>
                            Fecha Pago
                        </Text>
                        <Text style={[styles.tableCell, { width: "9%" }]}>
                            Estado
                        </Text>
                    </View>

                    {payments.map((payment, index) => (
                        <View
                            key={payment.id}
                            style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                            wrap={false}
                        >
                            <Text style={[styles.tableCell, { width: "5%" }]}>
                                {index + 1}
                            </Text>
                            <Text style={[styles.tableCell, { width: "11%" }]}>
                                {payment.policies.numberPolicy}
                            </Text>
                            <Text style={[styles.tableCell, { width: "9%" }]}>
                                {payment.policies.customer.numberPhone}
                            </Text>
                            <Text style={[styles.tableCell, { width: "18%" }]}>
                                {getCustomerFullName(payment.policies.customer)}
                            </Text>
                            <Text style={[styles.tableCell, { width: "13%" }]}>
                                {payment.policies.company.companyName}
                            </Text>
                            <Text style={[styles.tableCell, { width: "13%" }]}>
                                {getAdvisorFullName(payment.policies.advisor)}
                            </Text>
                            <Text
                                style={[
                                    styles.tableCell,
                                    styles.badge,
                                    styles.badgeWarning,
                                    { width: "9%" },
                                ]}
                            >
                                ${payment.value}
                            </Text>
                            <Text style={[styles.tableCell, { width: "9%" }]}>
                                ${payment.policies.policyValue}
                            </Text>
                            <Text style={[styles.tableCell, { width: "9%" }]}>
                                {dayjs(payment.createdAt).format("DD/MM/YYYY")}
                            </Text>
                            <Text
                                style={[
                                    styles.tableCell,
                                    styles.badge,
                                    styles.badgeWarning,
                                    { width: "9%" },
                                ]}
                            >
                                {payment.paymentStatus.statusNamePayment}
                            </Text>
                        </View>
                    ))}
                </View>

                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) =>
                        `Reporte de Pagos Atrasados - Página ${pageNumber} de ${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    );
};

export default PaymentsPDFDocument;

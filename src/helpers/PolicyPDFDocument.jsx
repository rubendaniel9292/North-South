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
        fontSize: 12,
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
        marginBottom: 5,
        color: "#ffffff",
    },
    subtitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 5,
        backgroundColor: "#122144",
        color: "#ffffff",
        padding: 8,
    },
    section: {
        marginBottom: 10,
        padding: 8,
    },
    row: {
        flexDirection: "row",
        marginBottom: 5,
        paddingVertical: 2,
    },
    label: {
        fontWeight: "bold",
        width: "45%",
        color: "#2c3e50",
        fontSize: 10,
    },
    value: {
        width: "55%",
        color: "#000000",
        fontSize: 12,
    },
    table: {
        marginTop: 5,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#000000",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#122144",
        color: "#ffffff",
        padding: 5,
        fontWeight: "bold",
        fontSize: 12,
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
        fontSize: 12,
        padding: 2,
    },
    badge: {
        padding: 3,
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "center",
    },
    badgeSuccess: {
        backgroundColor: "rgb(60, 203, 20)",
        color: "#ffffff",
    },
    badgeWarning: {
        backgroundColor: "#ffc107",
        color: "#000000",
    },
    badgeDanger: {
        backgroundColor: "#dc3545",
        color: "#ffffff",
    },
    badgeSecondary: {
        backgroundColor: "#777777",
        color: "#ffffff",
    },
    badgeInfo: {
        backgroundColor: "#5bc0de",
        color: "#ffffff",
    },
    badgeDark: {
        backgroundColor: "#292b2c",
        color: "#ffffff",
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
    infoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 8,
    },
    infoItem: {
        width: "50%",
        marginBottom: 5,
        paddingHorizontal: 5,
    },
    advisorSection: {
        padding: 8,
        marginBottom: 10,
    },
});

const PolicyPDFDocument = ({ policy }) => {
    const lastPeriod = policy.periods.reduce((a, b) =>
        a.year > b.year ? a : b
    );

    const getCustomerFullName = (customer) => {
        return `${customer.firstName} ${customer.secondName || ""} ${customer.surname
            } ${customer.secondSurname || ""}`.replace(/\s+/g, " ");
    };

    const getAdvisorFullName = (advisor) => {
        return `${advisor.firstName} ${advisor.secondName || ""} ${advisor.surname
            } ${advisor.secondSurname || ""}`.replace(/\s+/g, " ");
    };

    return (
        <Document>
            <Page size="A4" style={styles.page} orientation="landscape" wrap>

                <View style={styles.header} wrap={false}>
                    <Text style={styles.title}>
                        REPORTE DE PÓLIZA N° {policy.numberPolicy}
                    </Text>
                    <Text style={{ fontSize: 10, color: "#cccccc", marginTop: 3 }}>
                        Generado el {dayjs().format("DD/MM/YYYY HH:mm")}
                    </Text>
                </View>

                <Text style={styles.subtitle} wrap={false}>INFORMACIÓN GENERAL</Text>
                <View style={styles.infoGrid} wrap={false}>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Cliente:</Text>
                            <Text style={styles.value}>
                                {getCustomerFullName(policy.customer)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>CI/RUC:</Text>
                            <Text style={styles.value}>{policy.customer.ci_ruc}</Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Compañía:</Text>
                            <Text style={styles.value}>{policy.company.companyName}</Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Tipo de Póliza:</Text>
                            <Text style={styles.value}>{policy.policyType.policyName}</Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Fecha de Inicio:</Text>
                            <Text style={styles.value}>
                                {dayjs.utc(policy.startDate).format("DD/MM/YYYY")}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Fecha de Fin:</Text>
                            <Text style={styles.value}>
                                {dayjs.utc(policy.endDate).format("DD/MM/YYYY")}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Método de Pago:</Text>
                            <Text style={styles.value}>
                                {policy.paymentMethod.methodName}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Banco:</Text>
                            <Text style={styles.value}>
                                {policy.bankAccount?.bank?.bankName ||
                                    policy.creditCard?.bank?.bankName ||
                                    "NO APLICA"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Frecuencia de Pago:</Text>
                            <Text style={styles.value}>
                                {policy.paymentFrequency.frequencyName}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Estado:</Text>
                            <Text
                                style={[
                                    styles.badge,
                                    policy.policyStatus.id == 1
                                        ? styles.badgeSuccess
                                        : policy.policyStatus.id == 2
                                            ? styles.badgeDanger
                                            : policy.policyStatus.id == 3
                                                ? styles.badgeSecondary
                                                : policy.policyStatus.id == 4
                                                    ? styles.badgeWarning
                                                    : styles.badgeSecondary,
                                ]}
                            >
                                {policy.policyStatus.statusName}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Monto de Cobertura:</Text>
                            <Text style={styles.value}>${policy.coverageAmount}</Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Valor de Póliza:</Text>
                            <Text style={styles.value}>${lastPeriod.policyValue}</Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Derecho de Póliza:</Text>
                            <Text style={styles.value}>
                                ${lastPeriod.policyFee || "0.00"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Número de Pagos:</Text>
                            <Text style={styles.value}>{policy.numberOfPayments}</Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>N° de Períodos:</Text>
                            <Text style={styles.value}>
                                {(policy.renewals?.length || 0) + 1}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Comisión por Renovación:</Text>
                            <Text
                                style={[
                                    styles.badge,
                                    policy.renewalCommission
                                        ? styles.badgeDark
                                        : styles.badgeDanger,
                                ]}
                            >
                                {policy.renewalCommission ? "SÍ" : "NO"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Comisiones Anualizadas:</Text>
                            <Text
                                style={[
                                    styles.badge,
                                    policy.isCommissionAnnualized
                                        ? styles.badgeSecondary
                                        : styles.badgeInfo,
                                ]}
                            >
                                {policy.isCommissionAnnualized ? "ANUALIZADA" : "NORMAL"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.infoItem}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Asesor:</Text>
                            <Text style={styles.value}>{getAdvisorFullName(policy.advisor)}</Text>
                        </View>
                    </View>
                </View>

                {policy.observations && (
                    <View wrap={false}>
                        <Text style={styles.subtitle}>OBSERVACIONES</Text>
                        <View style={styles.section}>
                            <Text style={{ fontSize: 10 }}>{policy.observations}</Text>
                        </View>
                    </View>
                )}

                <Text style={styles.subtitle} break>HISTORIAL DE PAGOS</Text>
                <View style={styles.table}>
                    <View style={styles.tableHeader} fixed>
                        <Text style={[styles.tableCell, { width: "6%" }]}>N°</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>
                            Saldo Pend.
                        </Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>Valor</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>Abono</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>Saldo</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>Total</Text>
                        <Text style={[styles.tableCell, { width: "12%" }]}>
                            Fecha Pago
                        </Text>
                        {/** 
                        <Text style={[styles.tableCell, { width: "12%" }]}>
                            Actualización
                        </Text>
                        */}
                        <Text style={[styles.tableCell, { width: "10%" }]}>Estado</Text>
                        <Text style={[styles.tableCell, { width: "10%" }]}>Obs.</Text>
                    </View>

                    {policy.payments
                        .sort((a, b) => a.number_payment - b.number_payment)
                        .map((payment, index) => (
                            <View
                                key={payment.id}
                                style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                                wrap={false}
                            >
                                <Text style={[styles.tableCell, { width: "6%" }]}>
                                    {payment.number_payment}
                                </Text>
                                <Text style={[styles.tableCell, { width: "10%" }]}>
                                    ${payment.pending_value}
                                </Text>
                                <Text style={[styles.tableCell, { width: "10%" }]}>
                                    ${payment.value}
                                </Text>
                                <Text style={[styles.tableCell, { width: "10%" }]}>
                                    ${payment.credit}
                                </Text>
                                <Text style={[styles.tableCell, { width: "10%" }]}>
                                    ${payment.balance}
                                </Text>
                                <Text style={[styles.tableCell, { width: "10%" }]}>
                                    ${payment.total}
                                </Text>
                                <Text style={[styles.tableCell, { width: "12%" }]}>
                                    {dayjs.utc(payment.createdAt).format("DD/MM/YYYY")}
                                </Text>
                                {/*
                                <Text style={[styles.tableCell, { width: "12%" }]}>
                                    {payment.updatedAt
                                        ? dayjs.utc(payment.updatedAt).format("DD/MM/YYYY")
                                        : "-"}
                                </Text>
                                */}
                                <Text
                                    style={[
                                        styles.tableCell,
                                        {
                                            width: "10%",
                                            fontSize: 7,
                                            fontWeight: "bold",
                                        },
                                        styles.badge,
                                        payment.paymentStatus.id == 1
                                            ? styles.badgeWarning
                                            : payment.paymentStatus.id == 2
                                                ? styles.badgeSuccess
                                                : styles.badgeSecondary,
                                    ]}
                                >
                                    {payment.paymentStatus.statusNamePayment}
                                </Text>
                                <Text style={[styles.tableCell, { width: "20%", fontSize: 10 }]}>
                                    {payment.observations || "N/A"}
                                </Text>
                            </View>
                        ))}
                </View>

                <View wrap={false}>
                    <Text style={styles.subtitle}>HISTORIAL DE RENOVACIONES</Text>
                    {policy.renewals && policy.renewals.length > 0 ? (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableCell, { width: "20%" }]}>
                                    N° Renovación
                                </Text>
                                <Text style={[styles.tableCell, { width: "30%" }]}>
                                    Fecha de Renovación
                                </Text>
                                <Text style={[styles.tableCell, { width: "50%" }]}>
                                    Observaciones
                                </Text>
                            </View>

                            {policy.renewals.map((renewal, index) => (
                                <View
                                    key={renewal.id}
                                    style={index % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                                >
                                    <Text style={[styles.tableCell, { width: "20%" }]}>
                                        {renewal.renewalNumber}
                                    </Text>
                                    <Text style={[styles.tableCell, { width: "30%" }]}>
                                        {dayjs.utc(renewal.createdAt).format("DD/MM/YYYY")}
                                    </Text>
                                    <Text style={[styles.tableCell, { width: "50%" }]}>
                                        {renewal.observations || "N/A"}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={styles.section}>
                            <Text
                                style={{
                                    textAlign: "center",
                                    color: "#777777",
                                    fontStyle: "italic",
                                    fontSize: 8,
                                }}
                            >
                                Aún no se han registrado renovaciones
                            </Text>
                        </View>
                    )}
                </View>

                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) =>
                        `Reporte de Póliza N° ${policy.numberPolicy} - Página ${pageNumber} de ${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    );
};

export default PolicyPDFDocument;

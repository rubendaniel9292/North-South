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
        paddingHorizontal: 15,
        paddingBottom: 60,
        fontSize: 9,
        fontFamily: "Helvetica",
        backgroundColor: "#ffffff",
    },
    header: {
        textAlign: "center",
        backgroundColor: "#122144",
        padding: 8,
        marginBottom: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#ffffff",
    },
    subtitle: {
        fontSize: 8,
        color: "#cccccc",
        marginTop: 3,
    },
    infoSection: {
        marginBottom: 8,
        padding: 6,
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#dee2e6",
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 3,
    },
    infoLabel: {
        fontWeight: "bold",
        width: "30%",
        fontSize: 9,
        color: "#495057",
    },
    infoValue: {
        width: "70%",
        fontSize: 9,
        color: "#212529",
    },
    totalsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 8,
        gap: 6,
    },
    totalCard: {
        width: "32%",
        marginBottom: 6,
    },
    totalCardInner: {
        backgroundColor: "#ffffff",
        padding: 6,
        borderWidth: 2,
        borderColor: "#dee2e6",
        textAlign: "center",
    },
    totalLabel: {
        fontSize: 9,
        color: "#6c757d",
        marginBottom: 4,
        fontWeight: "bold",
    },
    totalValue: {
        fontSize: 11,
        fontWeight: "bold",
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "bold",
        marginTop: 5,
        marginBottom: 5,
        backgroundColor: "#6c757d",
        color: "#ffffff",
        padding: 8,
        textAlign: "center",
    },
    policySection: {
        marginBottom: 10,
    },
    policyHeader: {
        backgroundColor: "#122144",
        padding: 8,
        marginBottom: 5,
    },
    policyTitle: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#ffffff",
    },
    policyDetails: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "#f8f9fa",
        padding: 8,
        marginBottom: 5,
        borderWidth: 1,
        borderColor: "#dee2e6",
    },
    detailItem: {
        width: "33.33%",
        marginBottom: 4,
    },
    detailLabel: {
        fontSize: 9,
        color: "#6c757d",
        fontWeight: "bold",
    },
    detailValue: {
        fontSize: 11,
        color: "#212529",
    },
    subTable: {
        marginTop: 5,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#dee2e6",
    },
    subTableHeader: {
        flexDirection: "row",
        backgroundColor: "#495057",
        color: "#ffffff",
        padding: 5,
        fontWeight: "bold",
        fontSize: 9,
    },
    table: {
        marginTop: 5,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#dee2e6",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#122144",
        color: "#ffffff",
        padding: 6,
        fontWeight: "bold",
        fontSize: 10,
        borderBottomWidth: 2,
        borderBottomColor: "#122144",
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#dee2e6",
        padding: 5,
        backgroundColor: "#ffffff",
    },
    tableRowAlt: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#dee2e6",
        padding: 5,
        backgroundColor: "#f8f9fa",
    },
    tableCell: {
        fontSize: 9,
        padding: 3,
        color: "#212529",
    },
    badge: {
        padding: 3,
        fontSize: 8,
        fontWeight: "bold",
        textAlign: "center",
    },
    badgeInfo: {
        backgroundColor: "#17a2b8",
        color: "#ffffff",
    },
    badgeSecondary: {
        backgroundColor: "#6c757d",
        color: "#ffffff",
    },
    badgeSuccess: {
        backgroundColor: "#28a745",
        color: "#ffffff",
    },
    badgeDanger: {
        backgroundColor: "#dc3545",
        color: "#ffffff",
    },
    footer: {
        position: "absolute",
        bottom: 20,
        left: 20,
        right: 20,
        textAlign: "center",
        fontSize: 9,
        color: "#6c757d",
        borderTopWidth: 1,
        borderTopColor: "#dee2e6",
        paddingTop: 8,
    },
});

const CommissionsPDFDocument = ({ advisor, policies, totals, customerName }) => {
    const getAdvisorFullName = (adv) => {
        return `${adv.firstName} ${adv.secondName || ""} ${adv.surname} ${adv.secondSurname || ""}`.replace(/\s+/g, " ");
    };

    const getCustomerFullName = (customer) => {
        return `${customer.firstName} ${customer.secondName || ""} ${customer.surname} ${customer.secondSurname || ""}`.replace(/\s+/g, " ");
    };

    return (
        <Document>
            <Page size="A4" style={styles.page} orientation="landscape" wrap>
                <View style={styles.header} wrap={false}>
                    <Text style={styles.title}>
                        HISTORIAL DE ANTICIPOS Y COMISIONES
                    </Text>
                    <Text style={styles.subtitle}>
                        Generado el {dayjs().format("DD/MM/YYYY HH:mm")}
                    </Text>
                </View>

                <View style={styles.infoSection} wrap={false}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Asesor:</Text>
                        <Text style={styles.infoValue}>{getAdvisorFullName(advisor)}</Text>
                    </View>
                    {customerName && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Cliente:</Text>
                            <Text style={styles.infoValue}>{customerName}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Total de pólizas:</Text>
                        <Text style={styles.infoValue}>{policies.length}</Text>
                    </View>
                </View>

                <View style={styles.totalsGrid} wrap={false}>
                    <View style={styles.totalCard}>
                        <View style={styles.totalCardInner}>
                            <Text style={styles.totalLabel}>Com. Proyectada</Text>
                            <Text style={[styles.totalValue, { color: "#5bc0de" }]}>
                                ${totals.projectedTotal.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.totalCard}>
                        <View style={styles.totalCardInner}>
                            <Text style={styles.totalLabel}>Com. Generadas</Text>
                            <Text style={[styles.totalValue, { color: "#0275d8" }]}>
                                ${totals.commissionTotal.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.totalCard}>
                        <View style={styles.totalCardInner}>
                            <Text style={styles.totalLabel}>Com. Liberadas</Text>
                            <Text style={[styles.totalValue, { color: "#ffc107" }]}>
                                ${totals.released.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.totalCard}>
                        <View style={styles.totalCardInner}>
                            <Text style={styles.totalLabel}>Descuentos</Text>
                            <Text style={[styles.totalValue, { color: "#dc3545" }]}>
                                ${totals.refundsAmount.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.totalCard}>
                        <View style={styles.totalCardInner}>
                            <Text style={styles.totalLabel}>Com. Pagadas</Text>
                            <Text style={[styles.totalValue, { color: "#5cb85c" }]}>
                                ${totals.paid.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.totalCard}>
                        <View style={styles.totalCardInner}>
                            <Text style={styles.totalLabel}>A Favor</Text>
                            <Text style={[styles.totalValue, { color: "#a259ff" }]}>
                                ${totals.commissionInFavor.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* LISTADO DE PÓLIZAS CON SU HISTORIAL */}
                <Text style={styles.sectionTitle}>DETALLE POR PÓLIZA</Text>
                {policies.map((policy, policyIndex) => {
                    // Calcular pagos liberados
                    let releasedPayments, totalPayments;
                    if (policy.isCommissionAnnualized === true) {
                        if (policy.renewalCommission === false) {
                            releasedPayments = 1;
                            totalPayments = 1;
                        } else {
                            const totalPeriods = 1 + (Array.isArray(policy.renewals) ? policy.renewals.length : 0);
                            releasedPayments = totalPeriods;
                            totalPayments = totalPeriods;
                        }
                    } else {
                        const lastPeriod = policy.periods?.reduce((max, curr) =>
                            curr.year > max.year ? curr : max,
                            policy.periods[0]
                        );
                        const releasedInPeriod = policy.commissions?.filter(c =>
                            c.period_id === lastPeriod?.id &&
                            c.paymentReleased === true
                        ).length || 0;
                        releasedPayments = releasedInPeriod;
                        totalPayments = policy.numberOfPayments || 0;
                    }

                    return (
                        <View key={policy.id} style={styles.policySection} wrap={false}>
                            {/* Encabezado de póliza */}
                            <View style={styles.policyHeader}>
                                <Text style={styles.policyTitle}>
                                    PÓLIZA N° {policy.numberPolicy} - {policy.customer ? getCustomerFullName(policy.customer) : "N/A"}
                                </Text>
                            </View>

                            {/* Detalles de la póliza */}
                            <View style={styles.policyDetails}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Compañía:</Text>
                                    <Text style={styles.detailValue}>{policy.company?.companyName || "N/A"}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Frecuencia:</Text>
                                    <Text style={[styles.detailValue, styles.badge, policy.isCommissionAnnualized === false ? styles.badgeInfo : styles.badgeSecondary]}>
                                        {policy.isCommissionAnnualized === false ? "Normal" : "Anualizada"}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Renovación:</Text>
                                    <Text style={[styles.detailValue, styles.badge, policy.renewalCommission ? styles.badgeSuccess : styles.badgeDanger]}>
                                        {policy.renewalCommission ? "SÍ" : "NO"}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Com. Generadas:</Text>
                                    <Text style={styles.detailValue}>${(policy.commissionTotal || 0).toFixed(2)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Com. Liberadas:</Text>
                                    <Text style={[styles.detailValue, { color: "#ffc107", fontWeight: "bold" }]}>
                                        ${(policy.released || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Com. Pagadas:</Text>
                                    <Text style={[styles.detailValue, { color: "#28a745", fontWeight: "bold" }]}>
                                        ${(policy.paid || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Descuentos:</Text>
                                    <Text style={[styles.detailValue, { color: "#dc3545", fontWeight: "bold" }]}>
                                        ${(policy.refundsAmount || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>A Favor:</Text>
                                    <Text style={[styles.detailValue, { color: "#a259ff", fontWeight: "bold" }]}>
                                        ${(policy.commissionInFavor || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>N° Com. Lib.:</Text>
                                    <Text style={styles.detailValue}>{releasedPayments}/{totalPayments}</Text>
                                </View>
                            </View>

                            {/* Historial de pagos de esta póliza */}
                            {policy.commissions && policy.commissions.length > 0 && (
                                <View style={styles.subTable}>
                                    <View style={styles.subTableHeader}>
                                        <Text style={[styles.tableCell, { width: "20%", color: "#ffffff" }]}>Fecha de Pago</Text>
                                        <Text style={[styles.tableCell, { width: "18%", color: "#ffffff" }]}>N° Recibo</Text>
                                        <Text style={[styles.tableCell, { width: "18%", color: "#ffffff" }]}>N° Pagos Realizados</Text>
                                        <Text style={[styles.tableCell, { width: "20%", color: "#ffffff" }]}>Comisión Pagada</Text>
                                        <Text style={[styles.tableCell, { width: "24%", color: "#ffffff" }]}>Observaciones</Text>
                                    </View>
                                    {policy.commissions.map((commission, idx) => (
                                        <View
                                            key={commission.id}
                                            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                                        >
                                            <Text style={[styles.tableCell, { width: "20%" }]}>
                                                {dayjs(commission.createdAt).format("DD/MM/YYYY")}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: "18%" }]}>
                                                {commission.receiptNumber || "N/A"}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: "18%", textAlign: "center" }]}>
                                                <Text style={[styles.badge, { backgroundColor: "#17a2b8", color: "#ffffff", padding: 3 }]}>
                                                    1/83
                                                </Text>
                                            </Text>
                                            <Text style={[styles.tableCell, { width: "20%", fontWeight: "bold", color: "#28a745" }]}>
                                                ${Number(commission.advanceAmount || 0).toFixed(2)}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: "24%" }]}>
                                                {commission.observations || "-"}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Historial de descuentos de esta póliza */}
                            {policy.commissionRefunds && policy.commissionRefunds.length > 0 && (
                                <View style={styles.subTable}>
                                    <View style={styles.subTableHeader}>
                                        <Text style={[styles.tableCell, { width: "25%", color: "#ffffff" }]}>Fecha</Text>
                                        <Text style={[styles.tableCell, { width: "25%", color: "#ffffff" }]}>Monto Descuento</Text>
                                        <Text style={[styles.tableCell, { width: "50%", color: "#ffffff" }]}>Motivo</Text>
                                    </View>
                                    {policy.commissionRefunds.map((refund, idx) => (
                                        <View
                                            key={refund.id}
                                            style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                                        >
                                            <Text style={[styles.tableCell, { width: "25%" }]}>
                                                {dayjs(refund.cancellationDate).format("DD/MM/YYYY")}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: "25%", fontWeight: "bold", color: "#dc3545" }]}>
                                                ${Number(refund.amountRefunds || 0).toFixed(2)}
                                            </Text>
                                            <Text style={[styles.tableCell, { width: "50%" }]}>
                                                {refund.reason || "Sin motivo especificado"}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* HISTORIAL DE ANTICIPOS GENERALES */}
                {advisor.commissions && advisor.commissions.filter(c => !c.policy_id).length > 0 && (
                    <>
                        <Text style={styles.sectionTitle} break>ANTICIPOS GENERALES (SIN PÓLIZA ASIGNADA)</Text>
                        <View style={styles.table}>
                            <View style={styles.tableHeader} fixed>
                                <Text style={[styles.tableCell, { width: "25%", color: "#ffffff" }]} >Fecha de Pago</Text>
                                <Text style={[styles.tableCell, { width: "20%", color: "#ffffff" }]} >N° Recibo</Text>
                                <Text style={[styles.tableCell, { width: "18%", color: "#ffffff" }]} >Monto Abonado</Text>
                                <Text style={[styles.tableCell, { width: "37%", color: "#ffffff" }]} >Observaciones</Text>
                            </View>
                            {advisor.commissions
                                .filter(c => !c.policy_id)
                                .map((anticipo, idx) => (
                                    <View
                                        key={anticipo.id}
                                        style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                                        wrap={false}
                                    >
                                        <Text style={[styles.tableCell, { width: "25%" }]}>
                                            {dayjs(anticipo.createdAt).format("DD/MM/YYYY")}
                                        </Text>
                                        <Text style={[styles.tableCell, { width: "20%" }]}>
                                            {anticipo.receiptNumber || "N/A"}
                                        </Text>
                                        <Text style={[styles.tableCell, { width: "18%", fontWeight: "bold", color: "#17a2b8" }]}>
                                            ${Number(anticipo.advanceAmount || 0).toFixed(2)}
                                        </Text>
                                        <Text style={[styles.tableCell, { width: "37%" }]}>
                                            {anticipo.observations || "-"}
                                        </Text>
                                    </View>
                                ))}
                        </View>
                    </>
                )}

                <Text
                    style={styles.footer}
                    render={({ pageNumber, totalPages }) =>
                        `Historial de Comisiones - ${getAdvisorFullName(advisor)} - Página ${pageNumber} de ${totalPages}`
                    }
                    fixed
                />
            </Page>
        </Document>
    );
};

export default CommissionsPDFDocument;

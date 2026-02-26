import XLSX from "xlsx-js-style";

/**
 * Exporta las pólizas distribuidas a un archivo Excel con estilos.
 * @param {Array} distributedPolicies - Pólizas con campos calculados
 * @param {Object} globalTotals - Totales globales
 * @param {number} advisorTotalAdvances - Total de anticipos del asesor
 * @param {Object} advisor - Datos del asesor (firstName, surname)
 */
export const exportCommissionsToExcel = (
    distributedPolicies,
    globalTotals,
    advisorTotalAdvances,
    advisor
) => {
    if (!distributedPolicies || distributedPolicies.length === 0) return;

    // ─── Estilos ───
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        fill: { fgColor: { rgb: "1B2A4A" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
        },
    };

    const cellBorder = {
        top: { style: "thin", color: { rgb: "CCCCCC" } },
        bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } },
        right: { style: "thin", color: { rgb: "CCCCCC" } },
    };

    const numFmt = "$#,##0.00";

    // Colores de texto por columna (datos)
    const dataFontColors = {
        7: "0D6EFD",  // Com. totales → azul
        8: "D4A017",  // Com. liberadas → amarillo oscuro
        9: "198754",  // Com. pagadas → verde
        10: "17A2B8", // Anticipo → teal
        11: "DC3545", // Desc. → rojo
        13: "A259FF", // A favor → morado
    };

    // Colores de fondo por columna (totales)
    const footerStyles = {
        7: { bg: "0D6EFD", fg: "FFFFFF" },
        8: { bg: "FFC107", fg: "000000" },
        9: { bg: "198754", fg: "FFFFFF" },
        10: { bg: "17A2B8", fg: "FFFFFF" },
        11: { bg: "DC3545", fg: "FFFFFF" },
        12: { bg: "6C757D", fg: "FFFFFF" },
        13: { bg: "A259FF", fg: "FFFFFF" },
    };

    // ─── Datos ───
    const headers = [
        "N° de póliza", "Compañía", "Cliente", "Frecuencia",
        "Pagos por periodo/año", "Comisión por renovación", "N° Com. A pagar",
        "Comisiones totales", "Comisiones liberadas", "Comisiones pagadas",
        "Anticipo aplicado", "Desc. (Si aplica)", "Saldo (después del registro)",
        "Comisiones a favor",
    ];

    const rows = distributedPolicies.map((policy) => {
        const afterBalance = (policy.commissionInFavor || 0) - (policy.advanceApplied || 0);
        const releasedPayments = policy.payments?.filter(
            (p) => p.paymentStatus && p.paymentStatus.id == 2
        ).length || 0;
        const totalPayments = policy.payments?.length || 0;

        return [
            policy.numberPolicy || "",
            policy.company?.companyName || "",
            policy.customer
                ? `${policy.customer.firstName || ""} ${policy.customer.secondName || ""} ${policy.customer.surname || ""} ${policy.customer.secondSurname || ""}`.trim()
                : "N/A",
            policy.isCommissionAnnualized === false ? "Normal" : "Anualizada",
            policy.isCommissionAnnualized === false ? policy.numberOfPaymentsAdvisor : 1,
            policy.renewalCommission ? "SI" : "NO",
            `${releasedPayments}/${totalPayments}`,
            Number(policy.commissionTotal?.toFixed(2) || 0),
            Number(policy.released?.toFixed(2) || 0),
            Number(policy.paid?.toFixed(2) || 0),
            Number(policy.appliedHistoricalAdvance?.toFixed(2) || 0),
            Number(policy.refundsAmount?.toFixed(2) || 0),
            Number(afterBalance.toFixed(2)),
            Number(policy.commissionInFavor?.toFixed(2) || 0),
        ];
    });

    const totalsRow = [
        "TOTALES", "", "", "", "",
        "Total anticipos:",
        Number(advisorTotalAdvances.toFixed(2)),
        Number(globalTotals.commissionTotal?.toFixed(2) || 0),
        Number(globalTotals.released?.toFixed(2) || 0),
        Number(globalTotals.paid?.toFixed(2) || 0),
        Number(globalTotals.appliedHistoricalAdvance?.toFixed(2) || 0),
        Number(globalTotals.refundsAmount?.toFixed(2) || 0),
        Number(globalTotals.afterBalance?.toFixed(2) || 0),
        Number(globalTotals.commissionInFavor?.toFixed(2) || 0),
    ];

    // ─── Crear hoja ───
    const wsData = [headers, ...rows, totalsRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Ancho de columnas
    ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 2, 18) }));

    // Estilo HEADERS
    headers.forEach((_, c) => {
        const ref = XLSX.utils.encode_cell({ r: 0, c });
        if (ws[ref]) ws[ref].s = headerStyle;
    });

    // Estilo DATOS
    rows.forEach((row, ri) => {
        row.forEach((_, c) => {
            const ref = XLSX.utils.encode_cell({ r: ri + 1, c });
            if (!ws[ref]) return;
            const s = { border: cellBorder, alignment: { horizontal: c >= 7 ? "right" : "left" } };
            if (dataFontColors[c]) s.font = { bold: true, color: { rgb: dataFontColors[c] } };
            if (c >= 7) s.numFmt = numFmt;
            ws[ref].s = s;
        });
    });

    // Estilo TOTALES
    const tRow = rows.length + 1;
    totalsRow.forEach((_, c) => {
        const ref = XLSX.utils.encode_cell({ r: tRow, c });
        if (!ws[ref]) return;
        const s = {
            font: { bold: true },
            border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } },
            },
            alignment: { horizontal: c >= 6 ? "right" : "left" },
        };
        if (c >= 7) s.numFmt = numFmt;
        if (footerStyles[c]) {
            s.fill = { fgColor: { rgb: footerStyles[c].bg } };
            s.font = { bold: true, color: { rgb: footerStyles[c].fg } };
        }
        if (c === 0) s.font = { bold: true, sz: 12 };
        ws[ref].s = s;
    });

    // ─── Generar archivo ───
    const wb = XLSX.utils.book_new();
    const advisorName = `${advisor.firstName || ""} ${advisor.surname || ""}`.trim();
    XLSX.utils.book_append_sheet(wb, ws, "Comisiones");
    XLSX.writeFile(wb, `comisiones-${advisorName.replace(/\s+/g, "-")}.xlsx`);
};

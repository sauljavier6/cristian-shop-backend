import Sale from "../models/Sale";
import Retiro from "../models/Retiro";
import PaymentSale from "../models/PaymentSale";
import PDFDocument from "pdfkit";
import Batch from "../models/Batch";
import User from "../models/User";

interface Totales {
  efectivo: number;
  tarjetas: number;
  cheques: number;
  ventas: number;
  salidas: number;
}

export const getDatos = async (req: any, res: any) => {
  const { lote } = req.query;

  try {
    // Traemos las ventas con sus métodos de pago
    const sales = await Sale.findAll({
      where: {
        Batch: lote,
        ID_State: 2
      },
      include: [
        {
          model: PaymentSale,
          // IMPORTANTE: si usaste alias en tu asociación, colócalo aquí
          // as: "payment"
        }
      ]
    });

    // Traemos retiros
    const retiros = await Retiro.findAll({
      where: { Batch: lote },
      raw: true
    });

    const combined = [...sales, ...retiros];

    combined.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    let totales: Totales = {
      efectivo: 0,
      tarjetas: 0,
      cheques: 0,
      ventas: 0,
      salidas: 0
    };

    // Procesar ventas
    sales.forEach((sale: any) => {
      const total = Number(sale.Total) || 0;

      // Manejar PaymentSale cuando viene como arreglo o como objeto
      const payment = Array.isArray(sale.PaymentSale) ? sale.PaymentSale[0] : sale.PaymentSale;
      const desc = payment?.ID_Payment;

      totales.ventas += total;

      if (desc === 2 || desc === 3) {
        totales.tarjetas += total;
      } else if (desc === 4) {
        totales.cheques += total;
      } else {
        totales.efectivo += total;
      }
    });

    // Procesar retiros
    retiros.forEach((retiro) => {
      totales.salidas += Number(retiro.Amount) || 0;
    });

    return res.status(200).json({
      data: combined,
      totales,
      message: "Success",
      sales
    });

  } catch (error) {
    console.error("Error obteniendo datos:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

const paymentNames: Record<number, string> = {
  1: "Efectivo",
  2: "Tarjeta Débito",
  3: "Tarjeta Crédito",
  4: "Cheque",
};

export const generarPDFCorte = async (req: any, res: any) => {
  const { lote } = req.query;

  try {
    // -------------------- CONSULTAR LOTE Y USUARIO --------------------
    const batch = await Batch.findOne({
      where: { Lote: lote },
    });

    if (!batch) return res.status(404).json({ message: "Lote no encontrado" });

    const user = await User.findOne({
      where: { ID_User: batch.ID_User },
      attributes: ["Name"],
    });

    const operador = user?.Name || "Desconocido";
    const fechaLote = batch.Date.toLocaleString();

    // -------------------- CONSULTAR VENTAS Y RETIROS --------------------
    const sales = await Sale.findAll({
      where: { Batch: lote, ID_State: 2 },
      include: [{ model: PaymentSale }],
      order: [["createdAt", "ASC"]],
    });

    const retiros = await Retiro.findAll({ where: { Batch: lote }, raw: true });

    // -------------------- CALCULAR TOTALES --------------------
    let totales: Totales = { efectivo: 0, tarjetas: 0, cheques: 0, ventas: 0, salidas: 0 };

    sales.forEach((sale: any) => {
      const total = Number(sale.Total) || 0;
      const payment = Array.isArray(sale.PaymentSale) ? sale.PaymentSale[0] : sale.PaymentSale;
      const desc = payment?.ID_Payment;

      totales.ventas += total;
      if (desc === 2 || desc === 3) totales.tarjetas += total;
      else if (desc === 4) totales.cheques += total;
      else totales.efectivo += total;
    });

    retiros.forEach((r: any) => (totales.salidas += Number(r.Amount) || 0));

    // -------------------- GENERAR PDF --------------------
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=corte_${lote}.pdf`);
    doc.pipe(res);

    // -------------------- ENCABEZADO --------------------
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("CORTE DE CAJA", { align: "center" });

    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Lote: ${batch.Lote}`, { align: "center" })
      .text(`Operador: ${operador}`, { align: "center" })
      .text(`Fecha del Lote: ${fechaLote}`, { align: "center" });

    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#aaaaaa"); // línea separadora
    doc.moveDown(0.5);

    // -------------------- RESUMEN DE TOTALES --------------------
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("RESUMEN DE TOTALES", { underline: true });

    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica");

    const totalesData = [
      { label: "Ventas Totales", value: totales.ventas },
      { label: "Efectivo", value: totales.efectivo },
      { label: "Tarjetas", value: totales.tarjetas },
      { label: "Cheques", value: totales.cheques },
      { label: "Retiros Totales", value: totales.salidas },
    ];

    totalesData.forEach((t) => {
      const rowY = doc.y;
        doc.text(t.label, 40, rowY);
        doc.text(
          `$${t.value.toFixed(2)}`,
          0,
          rowY,
          { align: "right" }
        );

        doc.moveDown(1);
    });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#aaaaaa"); // línea separadora
    doc.moveDown(0.5);

    // -------------------- LISTA DE MOVIMIENTOS --------------------
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("MOVIMIENTOS", 40, doc.y, { underline: true });

    doc.moveDown(0.3);


    // Encabezado de tabla
    const headerY = doc.y;
    const RIGHT = 555;

    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("No", 40, headerY, { width: 30 });
    doc.text("Fecha y Hora", 70, headerY, { width: 120 });
    doc.text("Tipo", 190, headerY, { width: 60 });
    doc.text("Monto", RIGHT - 160, headerY, { width: 80, align: "right" });
    doc.text("Método", RIGHT - 80, headerY, { width: 80, align: "right" });

    doc.moveDown(0.8);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke("#cccccc");
    doc.moveDown(0.5);
    doc.font("Helvetica");

    const combined = [...sales, ...retiros].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    combined.forEach((item: any, index: number) => {
      const fecha = new Date(item.createdAt).toLocaleString();
      let tipo = "";
      let monto = 0;
      let metodo = "";

      if (item.Total) {
        tipo = "Venta";
        monto = Number(item.Total);
        const payment = Array.isArray(item.PaymentSale)
          ? item.PaymentSale[0]
          : item.PaymentSale;
        metodo = paymentNames[payment?.ID_Payment] || "Efectivo";
      } else {
        tipo = "Retiro";
        monto = Number(item.Amount);
        metodo = item.Concept || "";
      }

      // 🔒 Fijamos la Y de la fila
      const rowY = doc.y;

      doc.text(`${index + 1}`, 40, rowY, { width: 30 });
      doc.text(fecha, 70, rowY, { width: 120 });
      doc.text(tipo, 190, rowY, { width: 60 });

      // Método / concepto (antes del monto)
      doc.text(
        `$${monto.toFixed(2)}`,
        RIGHT - 260,
        rowY,
        { width: 180, align: "right", ellipsis: true }
      );

      // Monto (pegado al borde derecho)
      doc.text(
        metodo,
        RIGHT - 80,
        rowY,
        { width: 80, align: "right" }
      );

      // ⬇️ Bajamos UNA sola vez
      doc.moveDown(1);
    });


    //FOOTER - EFECTIVO FINAL
    doc.moveDown(1);
    const efectivoFinal = totales.efectivo + totales.tarjetas + totales.cheques - totales.salidas;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(
        `EFECTIVO FINAL: $${efectivoFinal.toFixed(2)}`,
        0,
        doc.y,
        { align: "right", underline: true }
      );

    doc.end();
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({ message: "Error generando PDF" });
  }
};

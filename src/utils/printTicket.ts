// utils/printTicket.ts
import PDFDocument from "pdfkit";
import { Response } from "express";

export const generateTicket = (res: Response, saleData: any) => {
  const doc = new PDFDocument({ size: "A6", margin: 10 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline; filename=ticket.pdf");

  doc.pipe(res);

  // 🧾 Encabezado del ticket
  doc.fontSize(14).text("TICKET DE VENTA", { align: "center" });
  doc.moveDown();
  doc.fontSize(10).text(`ID Venta: ${saleData?.ID_Sale ?? "N/A"}`);
  doc.text(`Fecha: ${saleData?.Date ?? "N/A"}`);
  doc.text(`Estado: ${saleData?.State?.Name ?? "N/A"}`);
  doc.moveDown();

  // 📦 Productos
  doc.fontSize(12).text("Productos:");
  if (Array.isArray(saleData?.SaleProducts)) {
    saleData.SaleProducts.forEach((product: any) => {
      doc.fontSize(10).text(`- ${product.Name}: ${product.Quantity} x $${product.Price}`);
    });
  } else {
    doc.fontSize(10).text("No hay productos.");
  }
  doc.moveDown();

  // 💰 Pagos
  doc.fontSize(12).text("Pagos:");
  if (Array.isArray(saleData?.PaymentSales)) {
    saleData.PaymentSales.forEach((payment: any) => {
      doc.fontSize(10).text(`- ${payment.PaymentType}: $${payment.Amount}`);
    });
  } else {
    doc.fontSize(10).text("No hay pagos.");
  }
  doc.moveDown();

  // ✅ Total
  doc.fontSize(12).text(`Total: $${saleData?.Total ?? 0}`, { align: "right" });

  doc.end();
};

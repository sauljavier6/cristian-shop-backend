import PDFDocument from "pdfkit";
import { parseStringPromise } from "xml2js";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";

/* =========================================================
   NUMERO A LETRAS (MXN)
   ========================================================= */

function numeroALetrasMXN(total: number): string {
  const enteros = Math.floor(total);
  const centavos = Math.round((total - enteros) * 100);
  return `${convertirNumeroALetras(enteros)} PESOS ${centavos
    .toString()
    .padStart(2, "0")}/100 M.N.`;
}

function convertirNumeroALetras(num: number): string {
  const unidades = ["", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE"];
  const especiales = ["DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE"];
  const decenas = ["", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA", "SESENTA", "SETENTA", "OCHENTA", "NOVENTA"];
  const centenas = ["", "CIENTO", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS", "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS"];

  if (num === 0) return "CERO";
  if (num === 100) return "CIEN";

  let texto = "";

  if (num >= 1_000_000) {
    texto += convertirNumeroALetras(Math.floor(num / 1_000_000)) + " MILLONES ";
    num %= 1_000_000;
  }

  if (num >= 1000) {
    texto += convertirNumeroALetras(Math.floor(num / 1000)) + " MIL ";
    num %= 1000;
  }

  if (num >= 100) {
    texto += centenas[Math.floor(num / 100)] + " ";
    num %= 100;
  }

  if (num >= 10 && num <= 15) {
    texto += especiales[num - 10];
    return texto.trim();
  }

  if (num >= 20) {
    texto += decenas[Math.floor(num / 10)];
    num %= 10;
    if (num > 0) texto += " Y ";
  }

  texto += unidades[num];
  return texto.trim();
}

/* =========================================================
   GENERAR PDF CFDI 4.0
   ========================================================= */

export const generarYGuardarPDF = async (
  xmlTimbrado: string,
  uuid: string
): Promise<string> => {

  const data = await parseStringPromise(xmlTimbrado, { explicitArray: false });

  const cfdi = data["cfdi:Comprobante"];
  const emisor = cfdi["cfdi:Emisor"].$;
  const receptor = cfdi["cfdi:Receptor"].$;
  const timbre = cfdi["cfdi:Complemento"]["tfd:TimbreFiscalDigital"].$;

  const conceptosRaw = cfdi["cfdi:Conceptos"]["cfdi:Concepto"];
  const conceptos = Array.isArray(conceptosRaw) ? conceptosRaw : [conceptosRaw];

  const impuestos = cfdi["cfdi:Impuestos"] || {};
  const trasladosRaw = impuestos["cfdi:Traslados"]?.["cfdi:Traslado"];
  const traslados = trasladosRaw
    ? Array.isArray(trasladosRaw)
      ? trasladosRaw
      : [trasladosRaw]
    : [];

  const dir = path.join(process.cwd(), "storage", "pdfs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const pdfPath = path.join(dir, `${uuid}.pdf`);
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(fs.createWriteStream(pdfPath));

  const money = (v: any) => `$${Number(v || 0).toFixed(2)}`;

  /* ================= ENCABEZADO ================= */

  doc.font("Helvetica-Bold").fontSize(16).text(emisor.Nombre, 50, 50);
  doc.font("Helvetica").fontSize(9)
    .text(`RFC: ${emisor.Rfc}`, 50, 75)
    .text(`Régimen Fiscal: ${emisor.RegimenFiscal}`, 50, 90)
    .text(`Lugar de Expedición: ${cfdi.$.LugarExpedicion}`, 50, 105);

  doc.font("Helvetica-Bold").fontSize(14)
    .text("FACTURA CFDI 4.0", 400, 50, { align: "right" });

  doc.font("Helvetica").fontSize(9)
    .text(`UUID: ${timbre.UUID}`, 300, 75, { align: "right" })
    .text(`Serie: ${cfdi.$.Serie || "-"}`, 400, 90, { align: "right" })
    .text(`Folio: ${cfdi.$.Folio || "-"}`, 400, 105, { align: "right" });

  doc.moveTo(50, 125).lineTo(545, 125).strokeColor("#D1D5DB").stroke();

  /* ================= RECEPTOR ================= */

  doc.roundedRect(50, 140, 495, 80, 8).stroke("#D1D5DB");
  doc.font("Helvetica-Bold").fontSize(10).text("DATOS DEL RECEPTOR", 60, 150);

  doc.font("Helvetica").fontSize(9)
    .text(`Nombre: ${receptor.Nombre}`, 60, 170)
    .text(`RFC: ${receptor.Rfc}`, 60, 185)
    .text(`Uso CFDI: ${receptor.UsoCFDI}`, 350, 170)
    .text(`Régimen: ${receptor.RegimenFiscalReceptor}`, 350, 185);

  /* ================= CONCEPTOS ================= */

  let y = 240;
  doc.rect(50, y, 495, 22).fill("#E5E7EB");
  doc.fillColor("black").font("Helvetica-Bold").fontSize(9);
  doc.text("Cant.", 60, y + 6);
  doc.text("Descripción", 120, y + 6);
  doc.text("V. Unit.", 380, y + 6);
  doc.text("Importe", 460, y + 6);

  y += 25;
  doc.font("Helvetica").fontSize(9);

  conceptos.forEach((c: any) => {
    doc.text(c.$.Cantidad, 60, y);
    doc.text(c.$.Descripcion, 120, y, { width: 240 });
    doc.text(money(c.$.ValorUnitario), 380, y);
    doc.text(money(c.$.Importe), 460, y);
    y += 18;
  });

  /* ================= TOTALES ================= */

  const totalsX = 345;
  const totalsW = 200;

  const labelX = totalsX + 15;
  const valueX = totalsX + 15;
  const valueW = totalsW - 30;

  let totalBoxY = y + 20;

  doc.roundedRect(totalsX, totalBoxY, totalsW, 120, 8)
    .stroke("#D1D5DB");

  doc.font("Helvetica").fontSize(10);

  // Subtotal
  doc.text("Subtotal:", labelX, totalBoxY + 15);

  doc.text(
    money(cfdi.$.SubTotal),
    valueX,
    totalBoxY + 15,
    {
      width: valueW,
      align: "right"
    }
  );

  let lineY = totalBoxY + 32;

  // Impuestos (IVA)
  traslados.forEach((t: any) => {
    doc.text(
      `IVA ${Number(t.$.TasaOCuota) * 100}%:`,
      labelX,
      lineY
    );

    doc.text(
      money(t.$.Importe),
      valueX,
      lineY,
      {
        width: valueW,
        align: "right"
      }
    );

    lineY += 16;
  });

  // Total
  doc.font("Helvetica-Bold");

  doc.text("TOTAL:", labelX, lineY + 8);

  doc.text(
    money(cfdi.$.Total),
    valueX,
    lineY + 8,
    {
      width: valueW,
      align: "right"
    }
  );

  /* ================= TOTAL EN LETRA ================= */

  doc.font("Helvetica").fontSize(9);
  doc.text("TOTAL EN LETRA:", 50, totalBoxY + 20);
  doc.text(numeroALetrasMXN(Number(cfdi.$.Total)), 50, totalBoxY + 35, { width: 260 });

/* ================= QR + BLOQUE FISCAL SAT ================= */

const qrSAT = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${timbre.UUID}&re=${emisor.Rfc}&rr=${receptor.Rfc}&tt=${cfdi.$.Total}&fe=${timbre.SelloCFD.slice(-8)}`;

const qr = await QRCode.toDataURL(qrSAT);

/* POSICIÓN */
const fiscalY = totalBoxY + 140;
const boxHeight = 210;

/* CONTENEDOR */
doc.roundedRect(50, fiscalY, 495, boxHeight, 8).stroke("#D1D5DB");

/* QR */
doc.image(qr, 60, fiscalY + 25, { width: 120 });

/* TEXTO */
doc.font("Helvetica").fontSize(7);

let textX = 200;
let textY = fiscalY + 20;
const textWidth = 330;

doc.text(
  "NÚMERO DE SERIE DEL CERTIFICADO DEL SAT:",
  textX,
  textY,
  { width: textWidth }
);
textY += 12;

doc.font("Helvetica-Bold").text(
  timbre.NoCertificadoSAT,
  textX,
  textY,
  { width: textWidth }
);
textY += 18;

doc.font("Helvetica").text(
  "NÚMERO DE SERIE DEL CERTIFICADO DEL CSD DEL EMISOR:",
  textX,
  textY,
  { width: textWidth }
);
textY += 12;

doc.font("Helvetica-Bold").text(
  cfdi.$.NoCertificado,
  textX,
  textY,
  { width: textWidth }
);
textY += 18;

doc.font("Helvetica").text(
  "SELLO DIGITAL DEL SAT:",
  textX,
  textY,
  { width: textWidth }
);
textY += 12;

doc.text(
  timbre.SelloSAT,
  textX,
  textY,
  {
    width: textWidth,
    lineBreak: true,
    align: "justify"
  }
);

textY += 48;

doc.text(
  "SELLO DIGITAL DEL CFDI:",
  textX,
  textY,
  { width: textWidth }
);
textY += 12;

doc.text(
  timbre.SelloCFD,
  textX,
  textY,
  {
    width: textWidth,
    lineBreak: true,
    align: "justify"
  }
);

/* CADENA ORIGINAL */
doc.fontSize(6);
doc.text(
  `CADENA ORIGINAL DEL COMPLEMENTO DE CERTIFICACIÓN DIGITAL DEL SAT:\n||${timbre.Version}|${timbre.UUID}|${timbre.FechaTimbrado}|${timbre.RfcProvCertif}|${timbre.SelloCFD}|${timbre.NoCertificadoSAT}||`,
  60,
  fiscalY + boxHeight - 55,
  {
    width: 475,
    lineBreak: true
  }
);

  /* ================= LEYENDA ================= */

  doc.fontSize(8).text(
    "ESTE DOCUMENTO ES UNA REPRESENTACIÓN IMPRESA DE UN CFDI 4.0",
    50,
    doc.page.height - 60,
    { align: "center" }
  );

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(pdfPath));
    doc.on("error", reject);
  });
};

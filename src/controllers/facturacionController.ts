import FacturacionTicket from "../models/FacturacionTicket";
import Sale from "../models/Sale";
import { Op } from "sequelize";
import { timbrarXML } from "../services/finkok.service";
import Facturacion from "../models/Facturacion";
import User from "../models/User";
import Email from "../models/Email";
import Phone from "../models/Phone";
import PaymentSale from "../models/PaymentSale";
import Payment from "../models/Payment";
import SaleProduct from "../models/SaleProduct";
import Product from "../models/Product";
import Stock from "../models/Stock";
import State from "../models/State";
import Iva from "../models/Iva";
import { generarYGuardarPDF } from "../services/cfdiPdf.service";
import fs from "fs";
import path from "path";

interface Ivadata {
  Description: string;
  Iva: number;
}

interface Productdata {
  Description: string;
  Code: string;
  Codesat: string;
  Iva: Ivadata;
}

interface Stockdata {
  Description: string;
  Code: string;
  Purchaseprice: number;
  Saleprice: number;
}

interface Item {
  ID_Product?: number;
  Quantity: number;
  Product: Productdata;
  Stock: Stockdata;
  Saleprice: number;
}

const obtenerXMLTimbrado = (xml: any): string => {
  // Buffer
  if (Buffer.isBuffer(xml)) {
    xml = xml.toString("utf8");
  }

  // Si NO empieza con < → es base64
  if (!xml.trim().startsWith("<")) {
    xml = Buffer.from(xml, "base64").toString("utf8");
  }

  // Quitar BOM si existe
  return xml.replace(/^\uFEFF/, "").trim();
};


function getFechaCFDI(): string {
  // Fecha actual
  const now = new Date();

  // Restar 5 minutos (OBLIGATORIO)
  now.setMinutes(now.getMinutes() - 5);

  // Formatear en hora local México
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return formatter.format(now).replace(" ", "T");
}

const fechaCFDI = getFechaCFDI();
// ========================================================
//  TIMBRAR CFDI 4.0
// ========================================================
export const facturarVenta = async (req: any, res: any) => {
  try {
    const { ID_Sale, Items } = req.body;

    let subtotal = 0;
    let totalIVA = 0;

    // 👉 Agrupador de impuestos por tasa
    const impuestosPorTasa: Record<string, { base: number; importe: number }> =
      {};

    // ===============================
    // CONCEPTOS
    // ===============================
    const conceptosXML = Items.map((item: any) => {
      const cantidad = item.Quantity;
      const valorUnitario = item.Saleprice; // PRECIO REAL DE LA VENTA
      const importe = +(cantidad * valorUnitario).toFixed(2);

      const tasaIVA = Number(item.Iva); // 0 | 0.08 | 0.16
      const ivaImporte = +(importe * tasaIVA);

      subtotal += importe;

      // Agrupar impuestos
      if (tasaIVA > 0) {
        if (!impuestosPorTasa[tasaIVA]) {
          impuestosPorTasa[tasaIVA] = { base: 0, importe: 0 };
        }

        impuestosPorTasa[tasaIVA].base += importe;
        impuestosPorTasa[tasaIVA].importe += ivaImporte;
      }

      return `
      <cfdi:Concepto
        ClaveProdServ="${item.Product.Codesat}"
        Cantidad="${cantidad}"
        ClaveUnidad="H87"
        Descripcion="${item.Product.Description} ${item.Stock.Description}"
        ValorUnitario="${valorUnitario}"
        Importe="${importe.toFixed(2)}"
        ObjetoImp="${tasaIVA > 0 ? "02" : "01"}">

        ${
          tasaIVA > 0
            ? `
        <cfdi:Impuestos>
          <cfdi:Traslados>
            <cfdi:Traslado
              Base="${importe.toFixed(2)}"
              Impuesto="002"
              TipoFactor="Tasa"
              TasaOCuota="${tasaIVA.toFixed(6)}"
              Importe="${ivaImporte.toFixed(2)}"/>
          </cfdi:Traslados>
        </cfdi:Impuestos>`
            : ""
        }

      </cfdi:Concepto>`;
      }).join("");

    const trasladosXML = Object.entries(impuestosPorTasa)
      .map(([tasa, data]) => {
        const base = +data.base.toFixed(2);
        const importeIVA = +(base * Number(tasa)).toFixed(2);

        totalIVA += importeIVA;

        return `
        <cfdi:Traslado
          Base="${base.toFixed(2)}"
          Impuesto="002"
          TipoFactor="Tasa"
          TasaOCuota="${Number(tasa).toFixed(6)}"
          Importe="${importeIVA.toFixed(2)}"/>`;
              })
        .join("");

    const total = +(subtotal + totalIVA).toFixed(2);

    // ===============================
    // XML CFDI 4.0
    // ===============================
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <cfdi:Comprobante
      xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
      xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
      xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd"
      Version="4.0"
      Serie="F"
      Folio="${ID_Sale}"
      Fecha="${fechaCFDI}"
      SubTotal="${subtotal.toFixed(2)}"
      Total="${total.toFixed(2)}"
      Moneda="MXN"
      TipoDeComprobante="I"
      FormaPago="01"
      MetodoPago="PUE"
      Exportacion="01"
      LugarExpedicion="20928">

      <cfdi:Emisor
        Rfc="EKU9003173C9"
        Nombre="ESCUELA KEMPER URGATE"
        RegimenFiscal="601"/>

      <cfdi:Receptor
        Rfc="XAXX010101000"
        Nombre="PUBLICO GENERAL"
        UsoCFDI="S01"
        RegimenFiscalReceptor="616"
        DomicilioFiscalReceptor="20928"/>

      <cfdi:Conceptos>
        ${conceptosXML}
      </cfdi:Conceptos>

      ${
        totalIVA > 0
          ? `
      <cfdi:Impuestos TotalImpuestosTrasladados="${totalIVA.toFixed(2)}">
        <cfdi:Traslados>
          ${trasladosXML}
        </cfdi:Traslados>
      </cfdi:Impuestos>`
          : ""
      }

    </cfdi:Comprobante>`;

    // ===============================
    // TIMBRADO
    // ===============================
    const resultado = await timbrarXML(xml);

    // GENERAR PDF
    await generarYGuardarPDF(resultado.xml, resultado.uuid);

    // ===============================
    // GUARDAR FACTURACION TICKET
    // ===============================
    await FacturacionTicket.create({
      ID_Sale,
      UUID: resultado.uuid,
      Folio_SAT: ID_Sale ?? null,
      Fecha_Timbrado: fechaCFDI,
      Estado: true,
    });

    res.json({
      ok: true,
      uuid: resultado.uuid,
      xml: resultado.xml,
    });
  } catch (error: any) {
    console.error("❌ ERROR CFDI:", error.message);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
};


export const obtenerPDF = async (req: any, res: any) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({
        ok: false,
        message: "UUID requerido",
      });
    }

    // 📁 Ruta del PDF generado
    const pdfPath = path.join(
      process.cwd(),
      "storage",
      "pdfs",
      `${uuid}.pdf`
    );

    // ❌ No existe
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({
        ok: false,
        message: "PDF no encontrado",
      });
    }

    // 📄 Headers correctos
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="factura-${uuid}.pdf"`
    );

    // 📤 Stream directo (mejor que readFile)
    const stream = fs.createReadStream(pdfPath);
    stream.pipe(res);
  } catch (error: any) {
    console.error("❌ Error obteniendo PDF:", error);
    res.status(500).json({
      ok: false,
      error: error.message,
    });
  }
};


export const getFacturacionTickets = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.searchTerm || "";

    const whereClause: any = {};

    if (searchTerm) {
      whereClause[Op.or] = [{ ID_Sale: Number(searchTerm) || undefined }];
    }

    const result = await FacturacionTicket.findAndCountAll({
      where: searchTerm ? whereClause : undefined,
      include: [{ model: Sale }],
      order: [["ID_FacturacionTicket", "DESC"]],
      offset: searchTerm ? undefined : offset,
      limit: searchTerm ? undefined : limit,
      distinct: true,
    });

    res.status(200).json({
      data: result.rows,
      currentPage: searchTerm ? 1 : page,
      totalPages: searchTerm ? 1 : Math.ceil(result.count / limit),
      totalItems: result.count,
      hasMore: !searchTerm && page < Math.ceil(result.count / limit),
      message: "Lista de facturas obtenida correctamente",
    });
  } catch (error) {
    console.error("Error al obtener facturación:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getSaleById = async (req: any, res: any) => {
  try {
    const { ID_Sale } = req.params;

    if (!ID_Sale) {
      return res
        .status(400)
        .json({ success: false, message: "ID_Sale es requerido" });
    }

    const sale = await Sale.findOne({
      where: { ID_Sale },
      include: [
        {
          model: PaymentSale,
          include: [{ model: Payment }],
        },
        {
          model: SaleProduct,
          include: [
            {
              model: Product,
              include: [
                {
                  model: Iva,
                },
              ],
            },
            { model: Stock },
          ],
        },
        {
          model: State,
        },
        {
          model: FacturacionTicket,
        },
      ],
    });

    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Venta no encontrada" });
    }

    // Si la venta tiene un cliente (ID_User), buscar cliente y facturación
    let cliente = null;
    let facturacion = null;
    if (sale.ID_User) {
      cliente = await User.findOne({
        where: { ID_User: sale.ID_User },
        attributes: ["ID_User", "Name"],
        include: [
          {
            model: Email,
            attributes: ["ID_Email", "Description"],
          },
          {
            model: Phone,
            attributes: ["ID_Phone", "Description"],
          },
        ],
      });

      facturacion = await Facturacion.findOne({
        where: { ID_User: sale.ID_User },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...sale.toJSON(),
        Cliente: cliente,
        Facturacion: facturacion,
      },
    });
  } catch (error) {
    console.error("Error al obtener la venta:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener la venta",
      error: error instanceof Error ? error.message : error,
    });
  }
};

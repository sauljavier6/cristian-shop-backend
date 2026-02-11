// src/controllers/ticketController.ts
import Sale from "../models/Sale";
import PaymentSale from "../models/PaymentSale";
import State from "../models/State";
import sequelize from "../config/database";
import { QueryTypes } from "sequelize";
import nodemailer from "nodemailer";
import Email from "../models/Email";
import User from "../models/User";
import Address from "../models/Adress";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_KEY!);

export const printTicket = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id, {
      include: [{ model: PaymentSale }, { model: State }],
    });

    if (!sale) {
      return res.status(404).send("Venta no encontrada");
    }

    type ProductRow = {
      Quantity: number;
      Description: string | null;
      Saleprice: number | null;
    };

    const products = await sequelize.query<ProductRow>(
      `
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { saleId: id },
      },
    );

    const html = `
    <html>
    <head>
      <title>Ticket #${sale.ID_Sale}</title>
      <style>
        body {
          font-family: monospace;
          font-size: 11px;
          width: 260px;
          margin: 0 auto;
          padding: 6px;
          line-height: 1.3;
        }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .small { font-size: 10px; }
        .line {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .product {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin: 2px 0;
        }
        .total-line {
          border-top: 2px solid #000;
          margin: 6px 0;
        }
      </style>
    </head>

    <body>

      <div class="center bold" style="font-size:14px">VALENTTO MX</div>
      <div class="center small">valenttomx@gmail.com</div>
      <div class="center small">Tel: (663) 403-2690</div>
      <div class="center small">Tijuana, BC</div>

      <div class="line"></div>

      <div class="center bold">TICKET DE VENTA</div>

      <div class="line"></div>

      <div>Venta #: ${sale.ID_Sale}</div>
      <div>Fecha: ${new Date(sale.createdAt).toLocaleString()}</div>

      <div class="line"></div>

      ${products
        .map(
          (p) => `
        <div class="product">
          <span>${(p.Description ?? "Producto").slice(0, 20)}</span>
          <span>${p.Quantity} x $${p.Saleprice}</span>
        </div>
      `,
        )
        .join("")}

      <div class="total-line"></div>

      <div class="product bold">
        <span>Subtotal</span>
        <span>$${sale.Subtotal}</span>
      </div>
      <div class="product">
        <span>IVA</span>
        <span>$${sale.Iva}</span>
      </div>
      <div class="product bold">
        <span>TOTAL</span>
        <span>$${sale.Total}</span>
      </div>

      <div class="total-line"></div>

      <div class="center bold">¡GRACIAS POR SU COMPRA!</div>
      <div class="center small">Conserve su ticket</div>

    </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Error al imprimir ticket:", error);
    res.status(500).send("Error al imprimir el ticket");
  }
};

// Reutilizamos la misma función de ticket
export const sendTicketByEmail = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id, {
      include: [{ model: PaymentSale }, { model: State }],
    });

    if (!sale) {
      return res.status(404).send("Venta no encontrada");
    }

    let address = null;
    address = await Address.findOne({
      where: { ID_Address: sale.ID_Address },
      attributes: ["ID_Address", "Description"],
    });

    const UserTo = await User.findOne({ where: { ID_User: sale.ID_User } });
    const DataTo = await Email.findByPk(UserTo?.ID_Email);
    const to = DataTo?.Description;

    type ProductRow = {
      Quantity: number;
      Description: string | null;
      Saleprice: number | null;
    };
    const products = await sequelize.query<ProductRow>(
      `
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { saleId: id },
      },
    );

    const html = `
    <html>
      <head>
        <title>Ticket #${sale.ID_Sale}</title>
        <style>
          body {
            font-family: monospace;
            font-size: 11px;
            width: 260px;
            margin: 0 auto;
            padding: 6px;
            line-height: 1.2;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          .product {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          .box {
            border: 1px dashed #000;
            padding: 4px;
            margin: 6px 0;
          }
        </style>
      </head>

      <body>
        <div class="center bold">VALENTTO MX</div>
        <div class="center">--------------------</div>
        <div class="center bold">TICKET DE VENTA</div>
        <div class="center">¡GRACIAS POR SU COMPRA!</div>
        <div class="center">--------------------</div>

        <div class="center small">ValenttoMX@gmail.com</div>
        <div class="center small">Tijuana, BC</div>
        <div class="center small">Tel: (663) 403-2690</div>

        <div class="line"></div>

        <div><strong>Venta #:</strong> ${sale.ID_Sale}</div>
        <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>

        <div class="line"></div>

        <div class="bold">Dirección del cliente:</div>
        <div class="product">
          ${address?.Description ?? "No registrada"}
        </div>

        <div class="line"></div>

        ${products
          .map(
            (p) => `
          <div class="product">
            <span>${p.Description ?? "Producto"}</span>
            <span>${p.Quantity} x $${p.Saleprice}</span>
          </div>
        `,
          )
          .join("")}

        <div class="line"></div>

        <div class="product bold">
          <span>Subtotal</span>
          <span>$ ${sale.Subtotal}</span>
        </div>
        <div class="product">
          <span>IVA</span>
          <span>$ ${sale.Iva}</span>
        </div>


        <div class="product bold">
          <span>TOTAL</span>
          <span>$ ${sale.Total}</span>
        </div>

        <div class="line"></div>

        <div class="center small">Conserve este ticket como comprobante</div>
        <div class="center bold">¡Gracias por su preferencia!</div>

      </body>
    </html>
    `;

    // Configura el transporte
    await resend.emails.send({
      from: "ValenttoMX <ValenttoMX@valenttomx.com>",
      to: to!,
      subject: `Ticket de venta #${sale.ID_Sale}`,
      html,
    });

    res.json({ message: "Ticket enviado exitosamente" });
  } catch (error) {
    console.error("Error al enviar ticket:", error);
    res.status(500).send("Error al enviar el ticket por correo.");
  }
};

// Reutilizamos la misma función de ticket
export const sendCotizacionByEmail = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id, {
      include: [{ model: PaymentSale }, { model: State }],
    });

    if (!sale) {
      return res.status(404).send("Venta no encontrada");
    }

    let address = null;
    address = await Address.findOne({
      where: { ID_Address: sale.ID_Address },
      attributes: ["ID_Address", "Description"],
    });

    const UserTo = await User.findOne({ where: { ID_User: sale.ID_User } });
    const DataTo = await Email.findByPk(UserTo?.ID_Email);
    const to = DataTo?.Description;

    type ProductRow = {
      Quantity: number;
      Description: string | null;
      Saleprice: number | null;
    };
    const products = await sequelize.query<ProductRow>(
      `
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { saleId: id },
      },
    );

    const html = `
    <html>
      <head>
        <style>
          body {
            font-family: monospace;
            font-size: 11px;
            width: 260px;
            margin: 0 auto;
            padding: 6px;
            line-height: 1.3;
          }

          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }

          .product {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }

          .total {
            font-size: 14px;
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <div class="center bold">VALENTTO MX</div>
        <div class="center small">ValenttoMX@gmail.com</div>
        <div class="center small">Tijuana, BC</div>
        <div class="center small">Tel: (663) 403-2690</div>

        <div class="line"></div>

        <div class="center bold">COTIZACIÓN</div>

        <div><strong>No:</strong> ${sale.ID_Sale}</div>
        <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>

        <div class="line"></div>

        <div class="bold">Dirección del cliente:</div>
        <div class="small">
          ${address?.Description ?? "No especificada"}
        </div>

        <div class="line"></div>

        ${products
          .map(
            (p) => `
          <div class="product">
            <span>${(p.Description ?? "Producto").slice(0, 22)}</span>
            <span>${p.Quantity} x $${p.Saleprice}</span>
          </div>
        `,
          )
          .join("")}

        <div class="line"></div>

        <div class="product">
          <span>Subtotal</span>
          <span>$ ${sale.Subtotal}</span>
        </div>
        <div class="product">
          <span>IVA</span>
          <span>$ ${sale.Iva}</span>
        </div>

        <div class="product total">
          <span>TOTAL</span>
          <span>$ ${sale.Total}</span>
        </div>

        <div class="line"></div>

        <div class="center bold">¡Gracias por su preferencia!</div>
        <div class="center small">Cotización válida por 7 días</div>
      </body>
    </html>
    `;

    // Configura el transporte
    await resend.emails.send({
      from: "ValenttoMX <ValenttoMX@valenttomx.com>",
      to: to!,
      subject: `Ticket de venta #${sale.ID_Sale}`,
      html,
    });

    res.json({ message: "Cotizacion enviada exitosamente" });
  } catch (error) {
    console.error("Error al enviar ticket:", error);
    res.status(500).send("Error al enviar el ticket por correo.");
  }
};

export const printTicketCotizacion = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id, {
      include: [{ model: PaymentSale }, { model: State }],
    });

    if (!sale) {
      return res.status(404).send("Venta no encontrada");
    }

    type ProductRow = {
      Quantity: number;
      Description: string | null;
      Saleprice: number | null;
    };
    const products = await sequelize.query<ProductRow>(
      `
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `,
      {
        type: QueryTypes.SELECT,
        replacements: { saleId: id },
      },
    );

    const html = `
    <html>
      <head>
        <title>Cotización #${sale.ID_Sale}</title>
        <style>
          body {
            font-family: monospace;
            font-size: 11px;
            width: 260px;
            margin: 0 auto;
            padding: 6px;
            line-height: 1.2;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          .product {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
          .total-box {
            border: 1px dashed #000;
            padding: 4px;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>

        <div class="center bold">VALENTTO MX</div>
        <div class="center small">Autodetallado & Servicios</div>
        <div class="center">--------------------</div>
        <div class="center bold">COTIZACIÓN</div>
        <div class="center">Válida por 7 días</div>
        <div class="center">--------------------</div>

        <div class="center small">ValenttoMX@gmail.com</div>
        <div class="center small">Tijuana, BC</div>
        <div class="center small">Tel: (663) 403-2690</div>

        <div class="line"></div>

        <div><strong>Cotización #:</strong> ${sale.ID_Sale}</div>
        <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>

        <div class="line"></div>

        ${products
          .map(
            (p) => `
          <div class="product">
            <span>${p.Description ?? "Producto"}</span>
            <span>${p.Quantity} x $${p.Saleprice}</span>
          </div>
        `,
          )
          .join("")}

        <div class="line"></div>

        <div class="product bold">
          <span>Subtotal</span>
          <span>$ ${sale.Subtotal}</span>
        </div>
        <div class="product">
          <span>IVA</span>
          <span>$ ${sale.Iva}</span>
        </div>

        <div class="total-box">
          <div class="product bold">
            <span>TOTAL</span>
            <span>$ ${sale.Total}</span>
          </div>
        </div>

        <div class="line"></div>

        <div class="center small">Precios sujetos a cambio</div>
        <div class="center small">No constituye comprobante fiscal</div>
        <div class="center bold">¡Gracias por su preferencia!</div>

      </body>
    </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Error al imprimir ticket:", error);
    res.status(500).send("Error al imprimir el ticket");
  }
};

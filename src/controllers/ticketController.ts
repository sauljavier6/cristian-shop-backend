// src/controllers/ticketController.ts
import Sale from "../models/Sale";
import PaymentSale from "../models/PaymentSale";
import State from "../models/State";
import sequelize from '../config/database';
import { QueryTypes } from 'sequelize';
import nodemailer from 'nodemailer';
import Email from "../models/Email";
import User from "../models/User";

export const printTicket = async (req: any, res: any) => {
  const { id } = req.params;

  try {
    const sale = await Sale.findByPk(id, {
      include: [
        { model: PaymentSale },
        { model: State }
      ],
    });

    if (!sale) {
      return res.status(404).send("Venta no encontrada");
    }

    type ProductRow = { Quantity: number; Description: string | null; Saleprice: number | null };
    const products = await sequelize.query<ProductRow>(`
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `, {
      type: QueryTypes.SELECT,
      replacements: { saleId: id }
    });

    const html = `
      <html>
        <head>
          <title>Ticket #${sale.ID_Sale}</title>
          <style>
            body {
              font-family: monospace;
              font-size: 11px;
              width: 260px; /* Aproximadamente 58mm */
              margin: 0 auto;
              padding: 5px;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; } 
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            .product {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="center bold">valentto mx</div>
          <div class="center">--------------------</div>
          <div class="center">¡GRACIAS POR SU COMPRA!</div>
          <div class="center">Vuelva pronto</div>
          <div class="center">--------------------</div>
          <div class="center">ValenttoMX@gmail.com</div>
          <div class="center">Tijuana, BC</div>
          <div class="center">Tel: (663) 403-2690</div>
          <div class="center">--------------------</div>
          <div class="line"></div>
          <div><strong>Venta #:</strong> ${sale.ID_Sale}</div>
          <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>
          <div class="line"></div>

          ${products.map(p => `
            <div class="product">
              <span>${p.Description ?? 'Producto'}</span>
              <span>${p.Quantity} x $${p.Saleprice}</span>
            </div>
          `).join("")}


          <div class="line"></div>
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
            <span>Total</span>
            <span>$ ${sale.Total}</span>
          </div>
          <div class="line"></div>

          <div class="center">¡Gracias por su compra!</div>
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

    const UserTo = await User.findOne({where: { ID_User: sale.ID_User }});
    const DataTo = await Email.findByPk( UserTo?.ID_Email );
    const to = DataTo?.Description;

    type ProductRow = { Quantity: number; Description: string | null; Saleprice: number | null };
    const products = await sequelize.query<ProductRow>(`
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `, {
      type: QueryTypes.SELECT,
      replacements: { saleId: id }
    });

    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              font-size: 11px;
              width: 260px;
              margin: 0 auto;
              padding: 5px;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            .product {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="center bold">valentto mx</div>
          <div class="center">--------------------</div>
          <div class="center">¡GRACIAS POR SU COMPRA!</div>
          <div class="center">Vuelva pronto</div>
          <div class="center">--------------------</div>
          <div class="center">ValenttoMX@gmail.com</div>
          <div class="center">Tijuana, BC</div>
          <div class="center">Tel: (663) 403-2690</div>
          <div class="center">--------------------</div>
          <div class="line"></div>
          <div><strong>Numero Venta:</strong> ${sale.ID_Sale}</div>
          <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>
          <div class="line"></div>
          ${products.map(p => `
            <div class="product">
              <span>${p.Description ?? 'Producto'}</span>
              <span>${p.Quantity} x $${p.Saleprice}</span>
            </div>
          `).join("")}
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
            <span>Total</span>
            <span>$ ${sale.Total}</span>
          </div>
          <div class="line"></div>
          <div class="center">¡Gracias por su compra!</div>
        </body>
      </html>
    `;

    // Configura el transporte
    const transporter = nodemailer.createTransport({
      service: 'gmail', // o tu proveedor SMTP
      auth: {
        user: 'psauljavier6@gmail.com',
        pass: 'svql lgaj xtqi xrtd',
      },
    });

    const mailOptions = {
      from: 'tuemail@gmail.com',
      to: to,
      subject: `Ticket de venta #${sale.ID_Sale}`,
      html,
    };

    await transporter.sendMail(mailOptions);
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

    const UserTo = await User.findOne({where: { ID_User: sale.ID_User }});
    const DataTo = await Email.findByPk( UserTo?.ID_Email );
    const to = DataTo?.Description;

    type ProductRow = { Quantity: number; Description: string | null; Saleprice: number | null };
    const products = await sequelize.query<ProductRow>(`
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `, {
      type: QueryTypes.SELECT,
      replacements: { saleId: id }
    });

    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: monospace;
              font-size: 11px;
              width: 260px;
              margin: 0 auto;
              padding: 5px;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            .product {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="center bold">valentto mx</div>
          <div class="center">--------------------</div>
          <div class="center">¡GRACIAS POR SU INTERÉS!</div>
          <div class="center">Esperamos poder atenderle pronto</div>
          <div class="center">--------------------</div>
          <div class="center">ValenttoMX@gmail.com</div>
          <div class="center">Tijuana, BC</div>
          <div class="center">Tel: (663) 403-2690</div>
          <div class="center">--------------------</div>
          <div class="line"></div>
          <div><strong>Numero Cotizacion:</strong> ${sale.ID_Sale}</div>
          <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>
          <div class="line"></div>
          ${products.map(p => `
            <div class="product">
              <span>${p.Description ?? 'Producto'}</span>
              <span>${p.Quantity} x $${p.Saleprice}</span>
            </div>
          `).join("")}
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
            <span>Total</span>
            <span>$ ${sale.Total}</span>
          </div>
          <div class="line"></div>
          <div class="center">¡Gracias por su preferencia!</div>
        </body>
      </html>
    `;

    // Configura el transporte
    const transporter = nodemailer.createTransport({
      service: 'gmail', // o tu proveedor SMTP
      auth: {
        user: 'psauljavier6@gmail.com',
        pass: 'svql lgaj xtqi xrtd',
      },
    });

    const mailOptions = {
      from: 'tuemail@gmail.com',
      to: to,
      subject: `Cotizacion #${sale.ID_Sale}`,
      html,
    };

    await transporter.sendMail(mailOptions);
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
      include: [
        { model: PaymentSale },
        { model: State }
      ],
    });

    if (!sale) {
      return res.status(404).send("Venta no encontrada");
    }

    type ProductRow = { Quantity: number; Description: string | null; Saleprice: number | null };
    const products = await sequelize.query<ProductRow>(`
      SELECT sp."Quantity", p."Description", sp."Saleprice"
      FROM "SaleProduct" sp
      LEFT JOIN "Product" p ON sp."ID_Product" = p."ID_Product"
      LEFT JOIN "Stock" s ON sp."ID_Stock" = s."ID_Stock"
      WHERE sp."ID_Sale" = :saleId
    `, {
      type: QueryTypes.SELECT,
      replacements: { saleId: id }
    });


    const html = `
      <html>
        <head>
          <title>Ticket #${sale.ID_Sale}</title>
          <style>
            body {
              font-family: monospace;
              font-size: 11px;
              width: 260px; /* Aproximadamente 58mm */
              margin: 0 auto;
              padding: 5px;
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            .product {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="center bold">valentto mx</div>
          <div class="center">--------------------</div>
          <div class="center">¡GRACIAS POR SU INTERÉS!</div>
          <div class="center">Esperamos poder atenderle pronto</div>
          <div class="center">--------------------</div>
          <div class="center">ValenttoMX@gmail.com</div>
          <div class="center">Tijuana, BC</div>
          <div class="center">Tel: (663) 403-2690</div>
          <div class="center">--------------------</div>
          <div class="line"></div>
          <div><strong>Cotizacion #:</strong> ${sale.ID_Sale}</div>
          <div><strong>Fecha:</strong> ${new Date(sale.createdAt).toLocaleString()}</div>
          <div class="line"></div>

          ${products.map(p => `
            <div class="product">
              <span>${p.Description ?? 'Producto'}</span>
              <span>${p.Quantity} x $${p.Saleprice}</span>
            </div>
          `).join("")}


          <div class="line"></div>
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
            <span>Total</span>
            <span>$ ${sale.Total}</span>
          </div>
          <div class="line"></div>

          <div class="center">¡Gracias por su preferencia!</div>
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error("Error al imprimir ticket:", error);
    res.status(500).send("Error al imprimir el ticket");
  }
};
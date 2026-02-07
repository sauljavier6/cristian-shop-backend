// @/controllers/SaleController.ts
import Sale from "../../models/Sale";
import ProductSale from "../../models/SaleProduct";
import Email from "../../models/Email";
import User from "../../models/User";
import Phone from "../../models/Phone";
import sequelize from '../../config/database';
import { QueryTypes } from 'sequelize';
import nodemailer from 'nodemailer';
import PaymentSale from "../../models/PaymentSale";
import State from "../../models/State";


export const createQuotes = async (req: any, res: any) => {
  const t = await Sale.sequelize?.transaction();
  try {
    const {
      User: datosUser,
      Total,
      Subtotal,
      Iva,
      items
    } = req.body;


    let userData;
    const emailData = await Email.findOne({where: { Description: datosUser.email }});
    if (emailData) {
        userData = await User.findOne({where: { ID_Email : emailData?.ID_Email }});
    }

    let phoneData;
    if (!emailData) {
        phoneData = await Phone.findOne({where: { Description: datosUser.phone }});
        if (phoneData) {
            userData = await User.findOne({where: { ID_Email : phoneData?.ID_Phone }});
        }
    }

    if (!phoneData) {
      const emailData = await Email.create({
        Description: datosUser.email,    
        State: true,
      });

      const phoneData = await Phone.create({
        Description: datosUser.phone,    
        State: true,
      });

      userData = await User.create({
        Name: datosUser.name,          
        ID_Rol: 1,
        ID_Email: emailData.ID_Email || 1,
        ID_Phone: phoneData.ID_Phone || 1,
        Imagen: '',
        Password : '',
        State: true,
      });
    }


    const newSale = await Sale.create({
      ID_User: userData?.ID_User || 1,
      Total,
      Subtotal,
      Iva,
      Balance_Total: Total,
      ID_State: 1,
      ID_Operador: 1,
      Batch: '',
      State: true,
    }, { transaction: t }); 


    if (Array.isArray(items) && items.length > 0) {
      const productSales = items.map((item) => ({
        ID_Sale: newSale.ID_Sale,
        ID_Product: item.productId,
        ID_Stock: item.stockId,
        Quantity: item.quantity,
        Saleprice: item.price,
        State: true,
      }));

      await ProductSale.bulkCreate(productSales, { transaction: t });
    }

    sendCotizacionByEmail(newSale.ID_Sale);

    await t?.commit();

    res.status(201).json({
      message: 'success',
    });

  } catch (error) {
    await t?.rollback();
    console.error('Error al crear la cotizacion:', error);
    res.status(500).json({
      message: 'Error al crear la cotizacion',
      error
    });
  }
};

export const sendCotizacionByEmail = async (saleId: number) => {

  try {
    const sale = await Sale.findByPk(saleId, {
      include: [{ model: PaymentSale }, { model: State }],
    });

    if (!sale) return;

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
      replacements: { saleId: saleId }
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
          <div class="center">Cotizacion</div>
          <div class="center">ValenttoMX@gmail.com</div>
          <div class="center">Tijuana, BC</div>
          <div class="center">Tel: (663) 403-2690</div>
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
    
  } catch (error) {
    console.error("Error al enviar ticket:", error);
  }
}
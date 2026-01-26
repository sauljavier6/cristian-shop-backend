// @/controllers/SaleController.ts
import Category from "../models/Category";
import Product from "../models/Product";
import Sale from "../models/Sale";
import Stock from "../models/Stock";
import { Op } from "sequelize";
import User from "../models/User";
import PaymentSale from "../models/PaymentSale";
import ProductSale from "../models/SaleProduct";
import Email from "../models/Email";
import Phone from "../models/Phone";
import Facturacion from "../models/Facturacion";
import SaleProduct from "../models/SaleProduct";
import State from "../models/State";
import Payment from "../models/Payment";
import Iva from "../models/Iva";

export const getListSale = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.searchTerm || "";

    let sales, count;

    if (searchTerm) {
      // Buscar por ID_Sale sin paginación
      const result = await Sale.findAndCountAll({
        where: {
          ID_State: 2,
          ID_Sale: searchTerm,
        },
        order: [["ID_Sale", "DESC"]],
        distinct: true,
      });

      sales = result.rows;
      count = result.count;
    } else {
      // Paginación normal
      const result = await Sale.findAndCountAll({
        where: { ID_State: 2 },
        order: [["ID_Sale", "DESC"]],
        limit,
        offset,
        distinct: true,
      });

      sales = result.rows;
      count = result.count;
    }

    // Incluir info de user y operator
    const salesWithUserAndOperator = await Promise.all(
      sales.map(async (sale) => {
        const user = sale.ID_User
          ? await User.findOne({
              where: { ID_User: sale.ID_User },
              attributes: ["ID_User", "Name"],
            })
          : null;

        const operator = sale.ID_Operador
          ? await User.findOne({
              where: { ID_User: sale.ID_Operador },
              attributes: ["ID_User", "Name"],
            })
          : null;

        return {
          ...sale.toJSON(),
          user,
          operator,
        };
      })
    );

    const totalPages = searchTerm ? 1 : Math.ceil(count / limit);

    res.status(200).json({
      data: salesWithUserAndOperator,
      message: "Lista de ventas obtenida correctamente",
      totalItems: count,
      totalPages,
      currentPage: searchTerm ? 1 : page, 
      hasMore: !searchTerm && page < totalPages,
    });
  } catch (error) {
    console.error("Error al obtener las ventas:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};


export const createSale = async (req: any, res: any) => {
  const t = await Sale.sequelize?.transaction();
  try {
    const {
      ID_User,
      Total,
      Balance_Total,
      Subtotal,
      Iva,
      ID_State,
      Payment,
      ID_Operador,
      Lote,
      State, 
      items
    } = req.body;

    const totalPayments = Payment.reduce((sum: number, p: any) => sum + p.Monto, 0);

    const newSale = await Sale.create({
      ID_User,
      Total,
      Balance_Total: Balance_Total - totalPayments,
      Subtotal,
      Iva,
      ID_State,
      ID_Operador,
      Batch: Lote,
      State: State ?? true,
    }, { transaction: t }); 

    if (Array.isArray(Payment) && Payment.length > 0) {
      const paymentSales = Payment.map((p) => ({
        ID_Sale: newSale.ID_Sale,
        ID_Payment: p.ID_Payment,
        Description: p.Description,
        Monto: p.Monto,
        ReferenceNumber: p.ReferenceNumber,
        State: true
      }));

      await PaymentSale.bulkCreate(paymentSales, { transaction: t });
    }

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

      for (const item of items) {
        const stock = await Stock.findByPk(item.stockId, { transaction: t });
        if (!stock) {
          throw new Error(`No se encontró stock con ID ${item.stockId}`);
        }

        if (stock.Amount < item.quantity) {
          throw new Error(`Stock insuficiente para el producto ${item.productId}`);
        }

        stock.Amount -= item.quantity;
        await stock.save({ transaction: t });
      }
    }

    await t?.commit();

    res.status(201).json({
      message: 'Venta completada con pagos, productos y stock actualizado',
      data: newSale
    });

  } catch (error) {
    await t?.rollback();
    console.error('Error al crear la venta:', error);
    res.status(500).json({
      message: 'Error al crear la venta',
      error
    });
  }
};


export const searchProducts = async (req: any, res: any) => {
  const { q } = req.query;

  try {
    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { Description: { [Op.iLike]: `${q}%` } },
          { Code: q },
        ],
      },
      include: [
        {
          model: Stock,
          where: {
            Amount: {
              [Op.gt]: 0,
            },
          },
          required: true,
        },
        {
          model: Iva,
        },
      ],
    });

    res.json(products);
  } catch (error) {
    console.error('Error al buscar productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const createCustomerSale = async (req: any, res: any) => {
  try {
    const {
      Name,
      Phone: phoneValue,
      Email: emailValue,
      RazonSocial,
      CodigoPostal,
      Rfc,
      RegimenFiscal
    } = req.body;

    const emailCreated = await Email.create({
      Description: emailValue,
      State: true,
    });

    const phoneCreated = await Phone.create({
      Description: phoneValue,
      State: true,
    });

    const newUser = await User.create({
      Name,
      ID_Rol: 2,
      ID_Email: emailCreated.ID_Email,
      ID_Phone: phoneCreated.ID_Phone,
      Imagen: '',
      Password: '',
      State: true,
    });

    const newFacturacion = await Facturacion.create({
      ID_User: newUser.ID_User,  
      RazonSocial,
      CodigoPostal,
      Rfc,
      RegimenFiscal,
      State: true,
    });

    res.status(201).json({
      message: 'Registro completado',
      data: newUser, newFacturacion,
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({
      message: 'Error al crear cliente',
      error,
    });
  }
};

export const UpdateCustomerSale = async (req: any, res: any) => {
  try {
    const {
      ID_User,
      Name,
      Phone: phoneValue,
      Email: emailValue,
      RazonSocial,
      CodigoPostal,
      Rfc,
      RegimenFiscal,
      ID_Sale
    } = req.body;

    const user = await User.findByPk(ID_User);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await Email.update(
      { Description: emailValue },
      { where: { ID_Email: user.ID_Email } }
    );

    await Phone.update(
      { Description: phoneValue },
      { where: { ID_Phone: user.ID_Phone } }
    );

    await User.update(
      { Name },
      { where: { ID_User } }
    );

    const facturacion = await Facturacion.findOne({ where: { ID_User } });
    if (facturacion) {
      await Facturacion.update(
        {
          RazonSocial,
          CodigoPostal,
          Rfc,
          RegimenFiscal,
        },
        { where: { ID_User } }
      );
    }

    const sale = await Sale.findByPk(ID_Sale);
    if (sale) {
      sale.ID_User = ID_User;
      await sale.save();
    }

    res.status(200).json({ message: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ message: 'Error al actualizar cliente', error });
  }
};

export const postCustomerSale = async (req: any, res: any) => {
  try {
    const {
      Name,
      Phone: phoneValue,
      Email: emailValue,
      RazonSocial,
      CodigoPostal,
      Rfc,
      RegimenFiscal,
      ID_Sale,
    } = req.body;

    const phone = await Phone.create({ Description: phoneValue });

    const email = await Email.create({ Description: emailValue });

    const user = await User.create({
      Name,
      ID_Rol: 2,
      ID_Phone: phone.ID_Phone,
      ID_Email: email.ID_Email,
      Imagen: '',
      Password: '',
      State: true,
    });

    await Facturacion.create({
      ID_User: user.ID_User,
      RazonSocial,
      CodigoPostal,
      Rfc,
      RegimenFiscal,
    });

    const sale = await Sale.findByPk(ID_Sale);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    sale.ID_User = user.ID_User;
    await sale.save();

    res.status(201).json({
      message: 'Cliente creado y asignado a la venta correctamente',
      ID_User: user.ID_User,
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ message: 'Error al crear cliente', error });
  }
};

export const getSaleById = async (req:any, res:any) => {
  try {
    const { ID_Sale } = req.params;

    if (!ID_Sale) {
      return res.status(400).json({ success: false, message: "ID_Sale es requerido" });
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
          include: [{ model: Product }, { model: Stock }],
        },
        {
          model: State,
        },
      ],
    });

    if (!sale) {
      return res.status(404).json({ success: false, message: "Venta no encontrada" });
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

export const createPaymentSale = async (req: any, res: any) => {
  const t = await Sale.sequelize?.transaction();
  try {
    const {
      Payment,
      ID_Sale,
    } = req.body;

    if (Array.isArray(Payment) && Payment.length > 0) {
      const paymentSales = Payment.map((p) => ({
        ID_Sale: ID_Sale,
        ID_Payment: p.ID_Payment,
        Description: p.Description,
        Monto: p.Monto,
        ReferenceNumber: p.ReferenceNumber,
        State: true,
      }));

      await PaymentSale.bulkCreate(paymentSales, { transaction: t });

      const totalPayments = Payment.reduce((sum, p) => sum + Number(p.Monto), 0);

      const sale = await Sale.findByPk(ID_Sale, { transaction: t });
      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      sale.Balance_Total = Number(sale.Balance_Total) - totalPayments;

      if (sale.Balance_Total < 0) sale.Balance_Total = 0;
      await sale.save({ transaction: t });
    }

    await t?.commit();

    res.status(201).json({ message: 'Pago registrado y balance actualizado' });
  } catch (error) {
    await t?.rollback();
    console.error('Error al crear el pago:', error);
    res.status(500).json({
      message: 'Error al crear el pago',
      error,
    });
  }
};

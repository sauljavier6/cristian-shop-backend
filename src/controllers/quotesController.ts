// @/controllers/SaleController.ts
import Category from "../models/Category";
import Product from "../models/Product";
import Sale from "../models/Sale";
import Stock from "../models/Stock";
import User from "../models/User";
import PaymentSale from "../models/PaymentSale";
import ProductSale from "../models/SaleProduct";
import SaleProduct from "../models/SaleProduct";
import State from "../models/State";
import Iva from "../models/Iva";

function createBatch(userId = 0) {
  const now = new Date();
  const datePart = now.toISOString().split("T")[0].replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `${datePart}-${userId}-${randomPart}`;
}

export const getListQuotes = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const searchTerm = req.query.searchTerm || "";

    let sales, count;

    if (searchTerm) {
      // Buscar cotización por ID_Sale sin paginación
      const result = await Sale.findAndCountAll({
        where: {
          ID_State: 1, // Cotizaciones
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
        where: { ID_State: 1 },
        order: [["ID_Sale", "DESC"]],
        limit,
        offset,
        distinct: true,
      });

      sales = result.rows;
      count = result.count;
    }

    // Agregar info de usuario y operador
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
      message: "Lista de cotizaciones obtenida correctamente",
      totalItems: count,
      totalPages,
      currentPage: searchTerm ? 1 : page,
      hasMore: !searchTerm && page < totalPages,
    });

  } catch (error) {
    console.error("Error al obtener las cotizaciones:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

export const createQuotes = async (req: any, res: any) => {
  const t = await Sale.sequelize?.transaction();
  try {
    const {
      ID_User,
      Total,
      Balance_Total,
      Subtotal,
      Iva,
      Payment,
      ID_Operador,
      Lote,
      State, 
      items
    } = req.body;

    const totalPayments = Payment.reduce((sum: number, p: any) => sum + p.Monto, 0);

    // Crear batch con usuario 0
    const batch = createBatch(0);

    const newSale = await Sale.create({
      ID_User,
      Total,
      Balance_Total: Balance_Total - totalPayments,
      Subtotal,
      Iva,
      ID_State: 1,
      ID_Operador,
      Batch: batch,
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


export const getQuotesById = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const sale = await Sale.findOne({
      where: { ID_Sale: id },
      include: [
        {
          model: State,
        },
        {
          model: PaymentSale,
        },
        {
          model: SaleProduct,
            include: [
            {
              model: Product,
              attributes: ["ID_Product", "Description"],
              include: [
                {
                  model: Iva,
                }
              ]
            },
            {
              model: Stock,
              attributes: ["ID_Stock", "Description", "Saleprice", "Amount"]
            }
            ]
        }
      ]
    });

    if (!sale) {
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    const user = await User.findOne({
      where: { ID_User: sale.ID_User },
      attributes: ["ID_User", "Name"],
    });

    const operator = await User.findOne({
      where: { ID_User: sale.ID_Operador },
      attributes: ["ID_User", "Name"],
    });

    res.status(200).json({
      data: {
        ...sale.toJSON(),
        user,
        operator,
      },
      message: "Venta obtenida correctamente",
    });
  } catch (error) {
    console.error("Error al obtener la venta:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};


export const updateQuotes = async (req: any, res: any) => {
  const t = await Sale.sequelize?.transaction();
  try {
    const {
      ID_Sale,
      ID_User,
      Total,
      Balance_Total,
      ID_State,
      Payment,
      ID_Operador,
      Lote,
      State,
      items
    } = req.body;

    const sale = await Sale.findByPk(ID_Sale, { transaction: t });
    if (!sale) {
      await t?.rollback();
      return res.status(404).json({ message: "Venta no encontrada" });
    }

    // 1️⃣ Revertir stock de los productos anteriores
    const oldProducts = await ProductSale.findAll({ where: { ID_Sale }, transaction: t });
    for (const old of oldProducts) {
      const stock = await Stock.findByPk(old.ID_Stock, { transaction: t });
      if (stock) {
        stock.Amount += old.Quantity; // devolvemos al stock
        await stock.save({ transaction: t });
      }
    }

    // 2️⃣ Eliminar pagos y productos previos
    await PaymentSale.destroy({ where: { ID_Sale }, transaction: t });
    await ProductSale.destroy({ where: { ID_Sale }, transaction: t });

    // 3️⃣ Calcular nuevo balance
    const totalPayments = Payment.reduce((sum: number, p: any) => sum + p.Monto, 0);

    // 4️⃣ Actualizar datos de la venta
    await sale.update({
      ID_User,
      Total,
      Balance_Total: Balance_Total - totalPayments,
      ID_State,
      ID_Operador,
      Batch: Lote,
      State: State ?? true
    }, { transaction: t });

    // 5️⃣ Insertar nuevos pagos
    if (Array.isArray(Payment) && Payment.length > 0) {
      const paymentSales = Payment.map((p) => ({
        ID_Sale,
        ID_Payment: p.ID_Payment,
        Description: p.Description,
        Monto: p.Monto,
        ReferenceNumber: p.ReferenceNumber,
        State: true
      }));

      await PaymentSale.bulkCreate(paymentSales, { transaction: t });
    }

    // 6️⃣ Insertar nuevos productos y ajustar stock
    if (Array.isArray(items) && items.length > 0) {
      const productSales = items.map((item) => ({
        ID_Sale,
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

    res.json({
      message: "Venta actualizada con éxito",
      data: sale
    });
  } catch (error) {
    await t?.rollback();
    console.error("Error al actualizar la venta:", error);
    res.status(500).json({
      message: "Error al actualizar la venta",
      error
    });
  }
};

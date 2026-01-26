// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import ComprasProduct from "./ComprasProducts";
import PaymentCompra from "./paymentCompra";

@Table({ tableName: "Compras" })
export default class Compras extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Compras: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare ID_Proveedor: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Total: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Balance_Total: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Subtotal: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Iva: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_Operador: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;

  // 🔑 Relación con ComprasProduct
  @HasMany(() => ComprasProduct)
  ComprasProductos?: ComprasProduct[];

  // 🔑 Relación con PaymentCompra
  @HasMany(() => PaymentCompra)
  Payments?: PaymentCompra[];
  
}
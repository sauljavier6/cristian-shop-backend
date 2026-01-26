// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from "sequelize-typescript";
import Sale from "./Sale";
import Payment from "./Payment";
import Compras from "./Compras";

@Table({ tableName: "PaymentCompra" })
export default class PaymentCompra extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_PaymentCompra: number;

  //relacion tabla compra
  @ForeignKey(() => Compras)
  @Column({
    type: DataType.INTEGER, 
    allowNull: false,
  })
  declare ID_Compra: number;

  @BelongsTo(() => Compras)
  Compras?: Compras;

  //relacion tabla tipo de pago
  @ForeignKey(() => Payment)
  @Column({
    type: DataType.INTEGER, 
    allowNull: false,
  })
  declare ID_Payment: number;
  
  @BelongsTo(() => Payment)
  Payment?: Payment;

  @Column({
    type: DataType.STRING, 
    allowNull: false,
  })
  declare Description: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Monto: number;

  @Column({
    type: DataType.STRING, 
    allowNull: false,
  })
  declare ReferenceNumber: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;
  
}
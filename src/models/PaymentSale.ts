// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from "sequelize-typescript";
import Sale from "./Sale";
import Payment from "./Payment";

@Table({ tableName: "PaymentSale" })
export default class PaymentSale extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_PaymentSale: number;

  //relacion tabla venta
  @ForeignKey(() => Sale)
  @Column({
    type: DataType.INTEGER, 
    allowNull: false,
  })
  declare ID_Sale: number;

  @BelongsTo(() => Sale)
  Sale?: Sale;

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
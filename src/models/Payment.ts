// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, HasMany } from "sequelize-typescript";
import PaymentSale from "./PaymentSale";
import Retiro from "./Retiro";

@Table({ tableName: "Payment" })
export default class Payment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Payment: number;

  @Column({
    type: DataType.STRING, 
    allowNull: false,
  })
  declare Description: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;
  
  @HasMany(() => PaymentSale)
  PaymentSale?: PaymentSale[];

  @HasMany(() => Retiro)
  Retiro?: Retiro[];
}
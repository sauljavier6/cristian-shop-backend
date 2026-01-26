// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from "sequelize-typescript";
import Payment from "./Payment";

@Table({ tableName: "Retiro" })
export default class Retiro extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Retiro: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Description: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Amount: number;

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
  declare Batch: string;

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
}
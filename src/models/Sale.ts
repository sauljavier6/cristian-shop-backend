// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import State from "./State";
import PaymentSale from "./PaymentSale";
import SaleProduct from "./SaleProduct";
import FacturacionTicket from "./FacturacionTicket";
import Address from "./Adress";

@Table({ tableName: "Sale" })
export default class Sale extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Sale: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare ID_User: number;

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

  //relacion tabla estado venta
  @ForeignKey(() => State)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_State: number;

  @BelongsTo(() => State)
  State?: State;

  //relacion tabla direccion de la venta
  @ForeignKey(() => Address)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_Address: number;

  @BelongsTo(() => Address)
  Address?: Address;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_Operador: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Batch: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare StateWeb: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare StateSale: boolean;

  @HasMany(() => PaymentSale)
  PaymentSale?: PaymentSale[]; 

  @HasMany(() => SaleProduct)
  SaleProduct?: SaleProduct[];

  @HasMany(() => FacturacionTicket)
  FacturacionTicket?: FacturacionTicket[];

}
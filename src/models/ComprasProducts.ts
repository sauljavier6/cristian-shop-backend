// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from "sequelize-typescript";
import Product from "./Product";
import Stock from "./Stock";
import Compras from "./Compras";

@Table({ tableName: "ComprasProduct" })
export default class ComprasProduct extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_ComprasProduct: number;

  //relacion tabla compra
  @ForeignKey(() => Compras)
  @Column({
    type: DataType.INTEGER, 
    allowNull: false,
  })
  declare ID_Compra: number;
  
  @BelongsTo(() => Compras)
  Compras?: Compras;

  //relacion tabla producto
  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER, 
    allowNull: false,
  })
  declare ID_Product: number;
  
  @BelongsTo(() => Product)
  Product?: Product;

  //relacion tabla stock
  @ForeignKey(() => Stock)
  @Column({
    type: DataType.INTEGER, 
    allowNull: false,
  })
  declare ID_Stock: number;
  
  @BelongsTo(() => Stock)
  Stock?: Stock;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare Quantity: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;
  
}
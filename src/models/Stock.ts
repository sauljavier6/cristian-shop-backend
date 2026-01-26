// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import Product from "./Product";
import ProductSale from "./SaleProduct";

@Table({ tableName: "Stock" })
export default class Stock extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Stock: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Description: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare Amount: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Saleprice: number;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
  })
  declare Purchaseprice: number;

  //relacion con tabla product
  @ForeignKey(() => Product)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_Product: number;

  @BelongsTo(() => Product)
  Product?: Product;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;

  @HasMany(() => ProductSale)
  ProductSales?: ProductSale[];
}
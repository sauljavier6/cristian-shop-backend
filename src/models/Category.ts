// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, HasMany } from "sequelize-typescript";
import Product from "./Product";

@Table({ tableName: "Category" })
export default class Category extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Category: number;

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

  @HasMany(() => Product)
  Product?: Product[];
}
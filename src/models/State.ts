// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, HasMany } from "sequelize-typescript";
import Sale from "./Sale";

@Table({ tableName: "State" })
export default class State extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_State: number;

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

  @HasMany(() => Sale)
  Sale?: Sale[];
}
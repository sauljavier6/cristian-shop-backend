// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, HasMany, ForeignKey, BelongsTo } from "sequelize-typescript";
import Sale from "./Sale";
import User from "./User";

@Table({ tableName: "Batch" })
export default class Batch extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Batch: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Lote: string;

  //relacion tabla usuario
  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_User: number;

  @BelongsTo(() => User)
  User?: User;

  @Column({
  type: DataType.DATE,
    allowNull: false,
  })
  declare Date: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;
}
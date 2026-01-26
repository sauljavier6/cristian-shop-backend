// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo, HasMany } from "sequelize-typescript";
import Rol from './Rol';
import Email from './Email';
import Batch from "./Batch";
import Phone from "./Phone";

@Table({ tableName: "User" })
export default class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER
  })
  declare ID_User: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Name: string;

  @ForeignKey(() => Rol)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_Rol: number;

  @BelongsTo(() => Rol, {
    foreignKey: 'ID_Rol',
    as: 'rol',
  })
  rol?: Rol;

  @ForeignKey(() => Email)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_Email: number;

  @BelongsTo(() => Email)
  Email?: Email;

  @ForeignKey(() => Phone)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare ID_Phone: number;

  @BelongsTo(() => Phone)
  Phone?: Phone;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Imagen: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Password: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;

  // Relación uno a muchos con Batch
  @HasMany(() => Batch)
  Batch?: Batch[];
}
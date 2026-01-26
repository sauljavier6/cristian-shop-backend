// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, HasMany } from "sequelize-typescript";

@Table({ tableName: "Facturacion" })
export default class Facturacion extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Facturacion: number;

  @Column({
    type: DataType.INTEGER,
  })
  declare ID_User: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare RazonSocial: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare CodigoPostal: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare Rfc: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare RegimenFiscal: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  })
  declare State: boolean;
}
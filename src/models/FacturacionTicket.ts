// @/models.ts
import { Table, Model, Column, DataType, PrimaryKey, AutoIncrement, ForeignKey, BelongsTo } from "sequelize-typescript";
import Sale from "./Sale";
import Facturacion from "./Facturacion";

@Table({ tableName: "FacturacionTicket" })
export default class FacturacionTicket extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_FacturacionTicket: number;

  //relacion tabla Sale
  @ForeignKey(() => Sale)
  @Column({
    type: DataType.INTEGER,
  })
  declare ID_Sale: number;

  @BelongsTo(() => Sale)
  Sale?: Sale;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare UUID: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare Folio_SAT: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare Fecha_Timbrado: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  declare Estado: boolean;
}

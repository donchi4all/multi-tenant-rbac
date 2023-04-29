import {
  Table,
  AutoIncrement,
  PrimaryKey,
  Column,
  Model,
  DataType,
  HasMany,
  AllowNull,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { RolePermissionInterface } from './IRolePermission';
import { Permission, Role } from '../index';

@Table({
  tableName: 'rolePermissions',
  createdAt: false,
  updatedAt: false,
})
export class RolePermission extends Model<RolePermissionInterface> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: RolePermissionInterface['id'];

  @HasMany(() => Permission, {
    sourceKey: 'permissionId',
     foreignKey: 'id',
  })
  permissions!: Permission[];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Role)
  roleId!: RolePermissionInterface['roleId'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Permission)
  permissionId!: RolePermissionInterface['permissionId'];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt!: Date;
}

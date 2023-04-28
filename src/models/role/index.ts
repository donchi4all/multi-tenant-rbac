import {
  Table,
  AutoIncrement,
  PrimaryKey,
  Column,
  Model,
  AllowNull,
  CreatedAt,
  UpdatedAt,
  DataType,
  BelongsTo,
  HasMany,
  BelongsToMany,
  Unique,
} from 'sequelize-typescript';
import { StringsFormating as Str } from '../../utils';
import { RoleInterface, RoleCreationType } from './IRole';
import { Permission, RolePermission, Tenant } from '../index';

@Table({
  tableName: 'roles',
})
export class Role extends Model<RoleInterface, RoleCreationType> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @BelongsTo(() => Tenant, {
    foreignKey: 'tenantId',
    foreignKeyConstraint: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  tenant: Tenant;

  @HasMany(() => RolePermission)
  rolePermissions: RolePermission[];


  @BelongsToMany(() => Permission, {
    through: {
      model: () => RolePermission,
    },
    foreignKey: 'roleId',
    foreignKeyConstraint: false,
  })
  permission: Permission[];

  @Unique(true)
  @Column(DataType.STRING)
  title: RoleInterface['title'];

  @Column({
    type: DataType.STRING,
    set(value: string): void {
      this.setDataValue('slug', Str.toSlugCase(value));
    },
  })
  slug: RoleInterface['slug'];

  @AllowNull
  @Column(DataType.STRING)
  description?: RoleInterface['description'];

  @Column(DataType.BOOLEAN)
  isActive: RoleInterface['isActive'];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: RoleInterface['createdAt'];

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt: RoleInterface['updatedAt'];
}

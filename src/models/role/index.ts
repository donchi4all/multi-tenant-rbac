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
  ForeignKey,
} from 'sequelize-typescript';
import { StringsFormating as Str } from '../../utils';
import { RoleInterface, RoleCreationType } from './IRole';
import { Permission, RolePermission, Tenant, UserRole } from '../index';

@Table({
  tableName: 'roles',
})
export class Role extends Model<RoleInterface, RoleCreationType> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: RoleInterface['id'];

  @BelongsTo(() => Tenant, {
    foreignKey: 'tenantId',
    foreignKeyConstraint: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  tenant!: Tenant;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => Tenant)
  tenantId!: RoleInterface['tenantId'];

  @HasMany(() => RolePermission)
  rolePermissions?: RolePermission[];


  // @BelongsToMany(() => Permission, {
  //   through: {
  //     model: () => RolePermission,
  //   },
  //   foreignKey: 'roleId',
  //   foreignKeyConstraint: false,
  // })
  // permissions!: Permission[];

  @Unique(true)
  @Column(DataType.STRING)
  title!: RoleInterface['title'];

  @Column({
    type: DataType.STRING,
    set(value: string): void {
      this.setDataValue('slug', Str.toSlugCase(value));
    },
  })
  slug!: RoleInterface['slug'];

  @AllowNull
  @Column(DataType.STRING)
  description?: RoleInterface['description'];

  @Column(DataType.BOOLEAN)
  isActive!: RoleInterface['isActive'];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt!: RoleInterface['createdAt'];

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt!: RoleInterface['updatedAt'];

  @BelongsToMany(() => Permission, () => RolePermission)
  permissions?: Permission[];

}

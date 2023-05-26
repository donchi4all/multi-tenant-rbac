import {
  Table,
  AutoIncrement,
  PrimaryKey,
  Column,
  Model,
  DataType,
  UpdatedAt,
  CreatedAt,
  BelongsTo,
  HasMany,
  ForeignKey,
  AllowNull,
  BelongsToMany,
} from 'sequelize-typescript';
import {
  UserRoleInterface,
  UserRoleStatus,
} from './IUserRole';
import { Permission, RolePermission, Role, Tenant } from '../index';
import { User } from '../user';

@Table({
  tableName: 'userRoles',
})
export class UserRole extends Model<UserRoleInterface> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  id: UserRoleInterface['id'];

  @Column(DataType.STRING)
  userId!: UserRoleInterface['userId'];

  @BelongsTo(() => Tenant, {
    foreignKey: 'tenantId',
    foreignKeyConstraint: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  tenant!: Tenant;

  @BelongsTo(() => User, {
    foreignKey: 'userId',
    foreignKeyConstraint: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user!: Tenant;

  @BelongsTo(() => Role, {
    foreignKey: 'roleId',
    foreignKeyConstraint: false,
  })
  role!: Role;

  @BelongsToMany(() => Permission, {
    through: {
      model: () => RolePermission,
    },
    sourceKey: 'roleId',
    foreignKey: 'roleId',
    foreignKeyConstraint: false,
  })
  permissions!: Permission[];

  @AllowNull(false)
  @Column(DataType.UUID)
  @ForeignKey(() => Tenant)
  tenantId!: UserRoleInterface['tenantId'];

  @AllowNull(false)
  @Column(DataType.UUID)
  @ForeignKey(() => Role)
  roleId!: UserRoleInterface['roleId'];

  @Column(DataType.ENUM(...Object.values(UserRoleStatus)))
  status!: UserRoleInterface['status'];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: UserRoleInterface['createdAt'];

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt: UserRoleInterface['updatedAt'];

  roles!: Role[];

}

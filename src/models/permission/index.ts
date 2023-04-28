import { Table, AutoIncrement, PrimaryKey, Column, Model, AllowNull, CreatedAt, UpdatedAt, DataType, BelongsToMany } from 'sequelize-typescript';

import { Role, RolePermission } from '..';
import { StringsFormating as Str} from '../../utils';
import { PermissionInterface, PermissionCreationType } from './IPermission';

@Table({
  tableName: 'permissions',
})
export class Permission extends Model<PermissionInterface, PermissionCreationType> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: PermissionInterface['id'];

  @BelongsToMany(() => Role, () => RolePermission)
  roles: Role[]

  @Column(DataType.STRING)
  title: PermissionInterface['title'];

  @Column({
    type: DataType.STRING,
        set (value: string): void {
      this.setDataValue('slug', Str.toSlugCase(value));
    }
  })
  slug: PermissionInterface['slug'];

  @AllowNull
  @Column(DataType.STRING)
  description: PermissionInterface['description'];

  @Column(DataType.BOOLEAN)
  isActive: PermissionInterface['isActive'];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt!: PermissionInterface['createdAt'];

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt!: PermissionInterface['updatedAt'];
}
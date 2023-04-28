import {
  Table,
  AutoIncrement,
  PrimaryKey,
  Column,
  Model,
  DataType,
  UpdatedAt,
  CreatedAt,
  AllowNull,
  Default,
  Unique,
  BelongsTo, HasMany,
} from 'sequelize-typescript';
import { TenantInterface } from './ITenant';
import { StringsFormating as Str } from '../../utils';
import { UserRole } from '../index';

@Table({
  tableName: 'tenants',
})
export class Tenant extends Model<TenantInterface> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: TenantInterface['id'];

  @Column(DataType.STRING)
  name: TenantInterface['name'];

  @Unique
  @Column({
    type: DataType.STRING,
    set(value: string): void {
      this.setDataValue('slug', Str.toSlugCase(value));
    },
  })
  slug: TenantInterface['slug'];

  @HasMany(() => UserRole)
  businessUsers: UserRole[];


  @AllowNull
  @Column(DataType.STRING)
  description: TenantInterface['description'];

  @Default(false)
  @Column(DataType.BOOLEAN)
  isActive?: TenantInterface['isActive'];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  createdAt: TenantInterface['createdAt'];

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
  })
  updatedAt: TenantInterface['updatedAt'];
}


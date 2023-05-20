import { Permission } from '../permission';

export interface UserRoleInterface {
  id?: string;
  userId: string | undefined;
  tenantId: string | undefined;
  roleId: string | undefined;
  status: `${UserRoleStatus}`;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: Permission[]
}

export enum UserRoleStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

export type UserRoleCreationType = Pick<UserRoleInterface, 'userId' | 'tenantId'> & { roleSlug: string }

export type UserRoleRequestType = { roleId: string, tenantId: string, userId: string }
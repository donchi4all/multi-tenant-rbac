import { PermissionInterface } from "../permission/IPermission";

export interface RoleInterface {
  id?: string;
  tenantId: string | undefined;
  title: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: PermissionInterface[];
}

export type RoleType = Pick<RoleInterface, 'id' | 'title' | 'slug' | 'description' | 'isActive' | 'createdAt' | 'updatedAt' | 'permissions'>

export type RoleCreationType = Pick<RoleInterface, 'tenantId' | 'title' | 'slug' | 'description' | 'isActive'>;

export type RoleCreationRequestType = Pick<RoleInterface, 'title' | 'description' | 'isActive'>;

export type RoleEditRequestType = RoleCreationRequestType;

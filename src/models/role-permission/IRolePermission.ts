export interface RolePermissionInterface {
  id?: string | undefined;
  roleId: string;
  permissionId: string;
}

export interface AddPermissionToRoleType {
  role: string;
  permissions: string | Array<string>;
}

export type RolePermissionCreationType = Pick<
  RolePermissionInterface,
  'roleId' | 'permissionId'
>;

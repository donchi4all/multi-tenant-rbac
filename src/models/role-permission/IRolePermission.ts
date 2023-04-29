export interface RolePermissionInterface {
  id?: number | undefined;
  roleId: number;
  permissionId: number;
}

export interface AddPermissionToRoleType {
  role: string | number;
  permissions: string | Array<string>;
}

export type RolePermissionCreationType = Pick<
  RolePermissionInterface,
  'roleId' | 'permissionId'
>;

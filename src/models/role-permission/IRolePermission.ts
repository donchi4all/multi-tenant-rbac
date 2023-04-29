export interface RolePermissionInterface {
  id?: number | undefined;
  roleId: number;
  permissionId: number;
}

export interface AddPermissionToRoleType {
  role: string;
  permissions: string | Array<string>;
}

export type RolePermissionCreationType = Pick<
  RolePermissionInterface,
  'roleId' | 'permissionId'
>;

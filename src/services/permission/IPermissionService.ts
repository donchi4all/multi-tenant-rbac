import {
  PermissionInterface,
  PermissionEditRequestType,
  PermissionCreationRequestType,
} from '../../models/permission/IPermission';

export interface IPermissionService {
  /** Create permission(s). */
  createPermission(
    payload: PermissionCreationRequestType | PermissionCreationRequestType[],
    slugCase?: boolean
  ): Promise<Array<PermissionInterface>>;

  /** Update a permission by id. */
  updatePermission(
    permissionId: string,
    payload: PermissionEditRequestType,
    slugCase?: boolean
  ): Promise<PermissionInterface>;

  /** List active permissions. */
  listPermissions(): Promise<Array<PermissionInterface>>;

  /** Find active permission by slug/title. */
  findPermission(identifier: string): Promise<PermissionInterface>;

  /** Delete permission by slug/title. */
  deletePermission(identifier: string): Promise<void>;

  /** Find active permission by id. */
  findPermissionById(
    permissionId: PermissionInterface['id'],
    rejectIfNotFound?: boolean
  ): Promise<PermissionInterface>;

  /** Upsert permission by title/slug. */
  upsertPermission(
    payload: PermissionCreationRequestType,
    slugCase?: boolean
  ): Promise<PermissionInterface>;

  /** Ensure a batch of permissions exists idempotently. */
  ensurePermissions(
    payload: PermissionCreationRequestType[],
    slugCase?: boolean
  ): Promise<Array<PermissionInterface>>;
}

import { Op } from 'sequelize';
import { Permission } from '../../models';
import {
  PermissionCreationRequestType,
  PermissionEditRequestType,
  PermissionInterface,
} from '../../models/permission/IPermission';
import { IPermissionService } from './IPermissionService';
import {
  CommonErrorHandler,
  PermissionErrorHandler,
} from '../../modules/exceptions';
export { PermissionCreationRequestType, PermissionEditRequestType, Permission };
import { StringsFormating as Str } from '../../utils';

export class PermissionService implements IPermissionService {
  /**
   * Create a new permission for a platform
   *
   * @param payload
   * @returns
   */
  public async createPermission(
    payload: PermissionCreationRequestType | PermissionCreationRequestType[],
    formatSlug: boolean = true
  ): Promise<Array<Permission>> {
    try {
      if (!Array.isArray(payload)) {
        payload = [payload];
      }

      const permissions = Promise.all(
        payload.map(async (payload) => {
          let [title, slug] = Array(2).fill(payload.title);

          if (formatSlug) slug = Str.toSlugCase(slug);
          return await Permission.create({ ...payload, title, slug });
        })
      );

      return permissions;
    } catch (err) {
      throw new PermissionErrorHandler(PermissionErrorHandler.FailedToCreate);
    }
  }

  /**
   * Update an existing permission
   *
   * @param permissionId
   * @param payload
   * @returns
   */
  public async updatePermission(
    permissionId: string,
    payload: PermissionEditRequestType,
    formatSlug: boolean = true
  ): Promise<Permission> {
    try {
      const permission = await Permission.findOne({
        where: { id: permissionId },
      });

      if (!permission) {
        return Promise.reject(
          new PermissionErrorHandler(PermissionErrorHandler.NotExist)
        );
      }

      let [title, slug] = Array(2).fill(payload.title);

      if (formatSlug) slug = Str.toSlugCase(slug);
      await permission.update({ ...permission, title, slug });

      return permission;
    } catch (err) {
      throw err;
    }
  }

  /**
   * List all permissions tied to a tenant
   *
   * @returns
   */
  public async listPermissions(): Promise<Array<Permission>> {
    try {
      return await Permission.findAll({
        where: { isActive: true }
      });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Find an existing permission
   * identifier can be slug or title
   * @param identifier
   * @returns
   */
  public async findPermission(identifier: string): Promise<Permission> {
    try {
      const permission = await Permission.findOne({
        where: {
          [Op.or]: [{ slug: identifier }, { title: identifier }],
          [Op.and]: [{ isActive: true }]
        },
      });

      if (!permission) {
        return Promise.reject(
          new PermissionErrorHandler(PermissionErrorHandler.NotExist)
        );
      }

      return permission;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Delete an existing permission
   * identifier can be slug or title
   * @param identifier
   * @returns
   */
  public async deletePermission(identifier: string): Promise<void> {
    try {
      const permission = await this.findPermission(identifier);
      await permission.destroy();

      return;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Find Permission By ID
   *
   * @param permissionId
   * @param rejectIfNotFound
   */
  public async findPermissionById(
    permissionId: PermissionInterface['id'],
    rejectIfNotFound: boolean = true
  ): Promise<Permission> {
    try {
      const permission = await Permission.findOne({
        where: {
          id: permissionId,
          isActive: true,
        },
      });
      if (!permission && rejectIfNotFound) {
        return Promise.reject(
          new PermissionErrorHandler(
            PermissionErrorHandler.PermissionDoNotExist
          )
        );
      }
      return permission!;
    } catch (e) {
      throw e;
    }
  }
}

const permissionService = new PermissionService();
export default permissionService;

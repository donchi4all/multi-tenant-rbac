import {
  PermissionCreationRequestType,
  PermissionEditRequestType,
  PermissionInterface,
} from '../../models/permission/IPermission';
import { IPermissionService } from './IPermissionService';
import { PermissionErrorHandler } from '../../modules/exceptions';
import { StringsFormating as Str } from '../../utils';
import Database from '../../modules/database';
import AuditTrail from '../../modules/audit';
import { assertNonEmptyString } from '../../modules/validation';

export { PermissionCreationRequestType, PermissionEditRequestType };

export class PermissionService implements IPermissionService {
  private getPermissionContext() {
    return Database.getConfig();
  }

  /**
   * Creates one or many permissions using configured model name.
   */
  public async createPermission(
    payload: PermissionCreationRequestType | PermissionCreationRequestType[],
    slugCase: boolean = true
  ): Promise<Array<PermissionInterface>> {
    const { adapter, models } = this.getPermissionContext();
    const items = Array.isArray(payload) ? payload : [payload];

    const records = await Promise.all(
      items.map(async (item) => {
        assertNonEmptyString(item.title, 'permission.title');
        const slug = slugCase
          ? Str.toSlugCase(item.title)
          : Str.toSlugCaseWithUnderscores(item.title);

        return adapter.create(models.permissions, {
          ...item,
          slug,
        });
      })
    );

    await Promise.all(
      records.map((record) =>
        AuditTrail.emit({
          action: 'permission.create',
          model: models.permissions,
          recordId: String(record.id),
          after: record as Record<string, any>,
        })
      )
    );

    return records as PermissionInterface[];
  }

  public async updatePermission(
    permissionId: string,
    payload: PermissionEditRequestType,
    slugCase: boolean = true
  ): Promise<PermissionInterface> {
    const { adapter, models } = this.getPermissionContext();
    assertNonEmptyString(permissionId, 'permissionId');

    const existing = await adapter.findOne(models.permissions, {
      where: { id: permissionId },
    });

    if (!existing) {
      throw new PermissionErrorHandler(PermissionErrorHandler.NotExist);
    }

    const slug = slugCase
      ? Str.toSlugCase(payload.title)
      : Str.toSlugCaseWithUnderscores(payload.title);

    const updated = await adapter.update(
      models.permissions,
      { id: permissionId },
      { ...payload, slug }
    );

    const result = (updated || existing) as PermissionInterface;
    await AuditTrail.emit({
      action: 'permission.update',
      model: models.permissions,
      recordId: String(result.id),
      before: existing as Record<string, any>,
      after: result as Record<string, any>,
    });
    return result;
  }

  public async listPermissions(): Promise<Array<PermissionInterface>> {
    const { adapter, models } = this.getPermissionContext();
    const permissions = await adapter.findMany(models.permissions, {
      where: { isActive: true },
    });
    return permissions as PermissionInterface[];
  }

  public async findPermission(identifier: string): Promise<PermissionInterface> {
    const { adapter, models } = this.getPermissionContext();

    const bySlug = await adapter.findOne(models.permissions, {
      where: { slug: identifier, isActive: true },
    });

    if (bySlug) return bySlug as PermissionInterface;

    const byTitle = await adapter.findOne(models.permissions, {
      where: { title: identifier, isActive: true },
    });

    if (!byTitle) {
      throw new PermissionErrorHandler(PermissionErrorHandler.NotExist);
    }

    return byTitle as PermissionInterface;
  }

  public async deletePermission(identifier: string): Promise<void> {
    const { adapter, models } = this.getPermissionContext();
    assertNonEmptyString(identifier, 'identifier');
    const permission = await this.findPermission(identifier);
    await adapter.delete(models.permissions, { id: permission.id });
    await AuditTrail.emit({
      action: 'permission.delete',
      model: models.permissions,
      recordId: String(permission.id),
      before: permission as Record<string, any>,
    });
  }

  public async findPermissionById(
    permissionId: PermissionInterface['id'],
    rejectIfNotFound: boolean = true
  ): Promise<PermissionInterface> {
    const { adapter, models } = this.getPermissionContext();

    const permission = await adapter.findOne(models.permissions, {
      where: {
        id: permissionId,
        isActive: true,
      },
    });

    if (!permission && rejectIfNotFound) {
      throw new PermissionErrorHandler(PermissionErrorHandler.PermissionDoNotExist);
    }

    return permission as PermissionInterface;
  }

  public async upsertPermission(
    payload: PermissionCreationRequestType,
    slugCase: boolean = true
  ): Promise<PermissionInterface> {
    const { adapter, models } = this.getPermissionContext();
    assertNonEmptyString(payload.title, 'permission.title');

    const slug = slugCase
      ? Str.toSlugCase(payload.title)
      : Str.toSlugCaseWithUnderscores(payload.title);

    const existing =
      (await adapter.findOne(models.permissions, { where: { slug } })) ||
      (await adapter.findOne(models.permissions, { where: { title: payload.title } }));

    if (existing) {
      return existing as PermissionInterface;
    }

    const [created] = await this.createPermission(
      [
        {
          ...payload,
        },
      ],
      slugCase
    );

    return created;
  }

  public async ensurePermissions(
    payload: PermissionCreationRequestType[],
    slugCase: boolean = true
  ): Promise<Array<PermissionInterface>> {
    const items = Array.isArray(payload) ? payload : [payload];
    const result = await Promise.all(
      items.map((item) => this.upsertPermission(item, slugCase))
    );
    return result;
  }
}

const permissionService = new PermissionService();
export default permissionService;

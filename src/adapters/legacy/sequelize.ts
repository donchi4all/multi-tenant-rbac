import { AdapterQuery, AdapterRecord, AdapterWhere, IRbacAdapter, RbacResolvedConfig } from '../../core/types';

function safeRequire(moduleName: string): any {
  // Dynamic loading keeps ORM packages optional for core runtime.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(moduleName);
}

function normalizeRow(row: any): AdapterRecord {
  if (!row) return row;
  if (typeof row.get === 'function') {
    return row.get({ plain: true });
  }
  if (typeof row.toJSON === 'function') {
    return row.toJSON();
  }
  return row;
}

export class LegacySequelizeAdapter implements IRbacAdapter {
  private opIn: symbol | string = '$in';
  private readonly modelMap = new Map<string, any>();

  async init(config: RbacResolvedConfig): Promise<void> {
    if (!config.mysqlConfig) {
      throw new Error('mysqlConfig is required when using legacy mysql config mode.');
    }

    let SequelizeTS: any;
    let Models: any;

    try {
      SequelizeTS = safeRequire('sequelize-typescript');
      Models = safeRequire('../../models');
      const Sequelize = safeRequire('sequelize');
      this.opIn = Sequelize.Op.in;
    } catch (error) {
      throw new Error(
        'Legacy mysql mode requires sequelize + sequelize-typescript. Install them or provide config.adapter.'
      );
    }

    const sequelize = new SequelizeTS.Sequelize({
      ...config.mysqlConfig,
      pool: { max: 1 },
      models: Object.values(Models),
      logging: false,
      dialect: 'mysql',
    });

    await sequelize.authenticate();

    this.bindModel(Models.Tenant, ['tenants', config.models.tenants]);
    this.bindModel(Models.Role, ['roles', config.models.roles]);
    this.bindModel(Models.Permission, ['permissions', config.models.permissions]);
    this.bindModel(Models.UserRole, [
      'user_roles',
      'userRoles',
      config.models.userRoles,
    ]);
    this.bindModel(Models.RolePermission, [
      'role_permissions',
      'rolePermissions',
      config.models.rolePermissions,
    ]);
  }

  private bindModel(model: any, aliases: string[]): void {
    aliases.forEach((alias) => this.modelMap.set(alias, model));
  }

  private getModel(model: string): any {
    const found = this.modelMap.get(model);
    if (!found) {
      throw new Error(`LegacySequelizeAdapter model not mapped: ${model}`);
    }
    return found;
  }

  private normalizeWhere(where?: AdapterWhere): Record<string, unknown> {
    if (!where) return {};

    return Object.entries(where).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = { [this.opIn]: value };
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, unknown>);
  }

  async findOne(model: string, query: AdapterQuery): Promise<AdapterRecord | null> {
    const Model = this.getModel(model);
    const row = await Model.findOne({ where: this.normalizeWhere(query.where) });
    return row ? normalizeRow(row) : null;
  }

  async findMany(model: string, query?: AdapterQuery): Promise<AdapterRecord[]> {
    const Model = this.getModel(model);
    const rows = await Model.findAll({ where: this.normalizeWhere(query?.where) });
    return rows.map(normalizeRow);
  }

  async create(model: string, data: AdapterRecord): Promise<AdapterRecord> {
    const Model = this.getModel(model);
    const row = await Model.create(data);
    return normalizeRow(row);
  }

  async createMany(model: string, data: AdapterRecord[]): Promise<AdapterRecord[]> {
    const Model = this.getModel(model);
    const rows = await Model.bulkCreate(data);
    return rows.map(normalizeRow);
  }

  async update(model: string, where: AdapterWhere, data: AdapterRecord): Promise<AdapterRecord | null> {
    const Model = this.getModel(model);
    const row = await Model.findOne({ where: this.normalizeWhere(where) });

    if (!row) return null;

    await row.update(data);
    return normalizeRow(row);
  }

  async delete(model: string, where: AdapterWhere): Promise<number> {
    const Model = this.getModel(model);
    return Model.destroy({ where: this.normalizeWhere(where) });
  }
}

export default LegacySequelizeAdapter;

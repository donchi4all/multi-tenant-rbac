import {
  AdapterQuery,
  AdapterRecord,
  AdapterWhere,
  IRbacAdapter,
  RbacResolvedConfig,
  SequelizeConfig,
} from '../core/types';

function safeRequire(moduleName: string): any {
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

export class SequelizeAdapter implements IRbacAdapter {
  private sequelize: any;
  private dataTypes: any;
  private opIn: symbol | string = '$in';
  private modelMap = new Map<string, any>();

  constructor(private readonly runtimeConfig?: SequelizeConfig) {}

  async init(config: RbacResolvedConfig): Promise<void> {
    const sequelizePkg = safeRequire('sequelize');
    const SequelizeCtor = sequelizePkg.Sequelize;
    this.dataTypes = sequelizePkg.DataTypes;
    this.opIn = sequelizePkg.Op.in;

    const sequelizeConfig = this.runtimeConfig || config.sequelizeConfig;
    if (!sequelizeConfig) {
      throw new Error('sequelizeConfig is required for SequelizeAdapter.');
    }

    this.sequelize = sequelizeConfig.sequelize
      ? sequelizeConfig.sequelize
      : new SequelizeCtor({
          dialect: sequelizeConfig.dialect,
          host: sequelizeConfig.host,
          port: sequelizeConfig.port,
          database: sequelizeConfig.database,
          username: sequelizeConfig.username,
          password: sequelizeConfig.password,
          logging: sequelizeConfig.logging ?? false,
        });

    await this.sequelize.authenticate();

    const suppliedModels = sequelizeConfig.models || {};
    Object.entries(suppliedModels).forEach(([key, model]) => {
      this.modelMap.set(key, model);
    });

    if (sequelizeConfig.autoDefineModels !== false) {
      this.ensureDefaultModels(config);
    }

    this.bindKnownAliases(config);

    if (sequelizeConfig.sync) {
      await this.sequelize.sync({
        alter: sequelizeConfig.syncOptions?.alter ?? true,
        force: sequelizeConfig.syncOptions?.force ?? false,
        ...(sequelizeConfig.syncOptions?.match
          ? { match: sequelizeConfig.syncOptions.match }
          : {}),
      });
    }
  }

  private ensureDefaultModels(config: RbacResolvedConfig): void {
    const required = [
      config.models.tenants,
      config.models.roles,
      config.models.permissions,
      config.models.userRoles,
      config.models.rolePermissions,
    ];

    required.forEach((table) => {
      if (this.resolveModel(table)) return;
      const schema = this.buildSchemaForTable(config, table);
      const model = this.sequelize.define(table, schema, { tableName: table });
      this.modelMap.set(table, model);
    });
  }

  private buildSchemaForTable(config: RbacResolvedConfig, tableName: string): Record<string, any> {
    const dt = this.dataTypes;
    const { models, keys } = config;

    if (tableName === models.tenants) {
      return {
        id: { type: dt.UUID, defaultValue: dt.UUIDV4, primaryKey: true },
        name: { type: dt.STRING, allowNull: false },
        slug: { type: dt.STRING, allowNull: false, unique: true },
        description: { type: dt.STRING },
        isActive: { type: dt.BOOLEAN, defaultValue: true },
      };
    }

    if (tableName === models.roles) {
      return {
        id: { type: dt.UUID, defaultValue: dt.UUIDV4, primaryKey: true },
        [keys.tenantId]: { type: dt.UUID, allowNull: false },
        title: { type: dt.STRING, allowNull: false },
        slug: { type: dt.STRING, allowNull: false },
        description: { type: dt.STRING },
        isActive: { type: dt.BOOLEAN, defaultValue: true },
      };
    }

    if (tableName === models.permissions) {
      return {
        id: { type: dt.UUID, defaultValue: dt.UUIDV4, primaryKey: true },
        title: { type: dt.STRING, allowNull: false },
        slug: { type: dt.STRING, allowNull: false },
        description: { type: dt.STRING },
        isActive: { type: dt.BOOLEAN, defaultValue: true },
      };
    }

    if (tableName === models.userRoles) {
      return {
        id: { type: dt.UUID, defaultValue: dt.UUIDV4, primaryKey: true },
        [keys.userId]: { type: dt.STRING, allowNull: false },
        [keys.tenantId]: { type: dt.UUID, allowNull: false },
        [keys.roleId]: { type: dt.UUID, allowNull: false },
        status: { type: dt.STRING, defaultValue: 'active' },
      };
    }

    if (tableName === models.rolePermissions) {
      return {
        id: { type: dt.UUID, defaultValue: dt.UUIDV4, primaryKey: true },
        [keys.roleId]: { type: dt.UUID, allowNull: false },
        [keys.permissionId]: { type: dt.UUID, allowNull: false },
      };
    }

    return {
      id: { type: dt.UUID, defaultValue: dt.UUIDV4, primaryKey: true },
    };
  }

  private bindKnownAliases(config: RbacResolvedConfig): void {
    this.bindAliasList(config.models.tenants, ['tenants']);
    this.bindAliasList(config.models.roles, ['roles']);
    this.bindAliasList(config.models.permissions, ['permissions']);
    this.bindAliasList(
      config.models.userRoles,
      config.models.userRoles === 'user_roles' ? ['user_roles', 'userRoles'] : ['userRoles']
    );
    this.bindAliasList(
      config.models.rolePermissions,
      config.models.rolePermissions === 'role_permissions'
        ? ['role_permissions', 'rolePermissions']
        : ['rolePermissions']
    );
  }

  private bindAliasList(primaryAlias: string, aliases: string[]): void {
    const source = [primaryAlias, ...aliases]
      .map((alias) => this.resolveModel(alias))
      .find((model) => !!model);

    if (!source) return;

    [primaryAlias, ...aliases].forEach((alias) => {
      this.modelMap.set(alias, source);
    });
  }

  private resolveModel(name: string): any {
    if (this.modelMap.has(name)) return this.modelMap.get(name);

    if (this.sequelize?.models?.[name]) {
      return this.sequelize.models[name];
    }

    const candidate = Object.values(this.sequelize?.models || {}).find((model: any) => {
      const tableName = typeof model.getTableName === 'function' ? model.getTableName() : undefined;
      if (!tableName) return false;
      if (typeof tableName === 'string') return tableName === name;
      return tableName?.tableName === name;
    });

    return candidate || null;
  }

  private getModel(model: string): any {
    const found = this.resolveModel(model);
    if (!found) {
      throw new Error(`SequelizeAdapter model not mapped: ${model}`);
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

  async withTransaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T> {
    return this.sequelize.transaction(async (tx: unknown) => callback(tx));
  }
}

export default SequelizeAdapter;

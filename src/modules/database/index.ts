import { LoggerDecorator, LoggerInterface } from '../logger';
import {
  AdapterTransactionCallback,
  IRbacAdapter,
  MongodbConfig,
  RbacResolvedConfig,
  rbacConfig,
  resolveRbacConfig,
} from '../../core/types';
import LegacyMongooseAdapter from '../../adapters/legacy/mongoose';
import SequelizeAdapter from '../../adapters/sequelize';

export { MongodbConfig, rbacConfig };

export class Database {
  @LoggerDecorator('Database')
  private log!: LoggerInterface;
  private config?: RbacResolvedConfig;

  public async init(config: rbacConfig): Promise<void> {
    const withDefaultAdapter = this.withLegacyAdapterFallback(config);
    const resolved = resolveRbacConfig(withDefaultAdapter);

    this.config = resolved;
    await resolved.adapter.init?.(resolved);
    this.log.info('RBAC adapter has been initialized successfully.');
  }

  private withLegacyAdapterFallback(config: rbacConfig): rbacConfig {
    if (config.adapter) return config;

    if (config.sequelizeConfig) {
      return { ...config, adapter: new SequelizeAdapter(config.sequelizeConfig) };
    }

    if (config.dialect === 'mysql') {
      if (!config.mysqlConfig) {
        throw new Error('mysqlConfig is required when dialect is mysql.');
      }
      return {
        ...config,
        adapter: new SequelizeAdapter({
          dialect: 'mysql',
          ...config.mysqlConfig,
        }),
      };
    }

    if (config.dialect === 'postgres') {
      if (!config.postgresConfig) {
        throw new Error('postgresConfig is required when dialect is postgres.');
      }
      return {
        ...config,
        adapter: new SequelizeAdapter({
          dialect: 'postgres',
          ...config.postgresConfig,
        }),
      };
    }

    if (config.dialect === 'mongodb') {
      // Backward compatibility: existing mongodb users can keep old config shape.
      return { ...config, adapter: new LegacyMongooseAdapter() };
    }

    throw new Error(
      'RBAC adapter is required. Provide config.adapter, or use legacy dialect + connection config.'
    );
  }

  public getAdapter(): IRbacAdapter {
    if (!this.config) {
      throw new Error('RBAC is not initialized. Call init(config) first.');
    }

    return this.config.adapter;
  }

  public getConfig(): RbacResolvedConfig {
    if (!this.config) {
      throw new Error('RBAC is not initialized. Call init(config) first.');
    }

    return this.config;
  }

  /**
   * Runs an operation in adapter transaction when supported.
   * Falls back to direct execution when adapter has no transaction API.
   */
  public async withTransaction<T>(callback: AdapterTransactionCallback<T>): Promise<T> {
    const adapter = this.getAdapter();

    if (adapter.withTransaction) {
      return adapter.withTransaction(callback);
    }

    if (adapter.beginTransaction && adapter.commitTransaction && adapter.rollbackTransaction) {
      const tx = await adapter.beginTransaction();
      try {
        const result = await callback(tx);
        await adapter.commitTransaction(tx);
        return result;
      } catch (error) {
        await adapter.rollbackTransaction(tx);
        throw error;
      }
    }

    return callback(undefined);
  }

  static connection() {
    return null;
  }
}

const database = new Database();

export default database;

import { createRbac } from './helpers/createRbac';
import { Database as DatabaseClass } from '../src/modules/database';
import { IRbacAdapter, rbacConfig } from '../src/core/types';

class WithTransactionAdapter implements IRbacAdapter {
  async findOne(): Promise<Record<string, any> | null> {
    return null;
  }

  async findMany(): Promise<Record<string, any>[]> {
    return [];
  }

  async create(_model: string, data: Record<string, any>): Promise<Record<string, any>> {
    return { id: '1', ...data };
  }

  async update(): Promise<Record<string, any> | null> {
    return null;
  }

  async delete(): Promise<number> {
    return 0;
  }

  async withTransaction<T>(callback: (tx: unknown) => Promise<T>): Promise<T> {
    return callback({ tx: true });
  }
}

describe('Coverage floor helpers', () => {
  it('covers database fallback configuration branches', () => {
    const db = new DatabaseClass() as any;

    const withAdapter = { adapter: { findOne: jest.fn() } } as unknown as rbacConfig;
    expect(db.withLegacyAdapterFallback(withAdapter)).toBe(withAdapter);

    const withSequelize = {
      sequelizeConfig: { dialect: 'mysql' as const, host: 'localhost', database: 'x', username: 'x', password: 'x' },
    } as rbacConfig;
    expect(db.withLegacyAdapterFallback(withSequelize).adapter).toBeTruthy();

    expect(() => db.withLegacyAdapterFallback({ dialect: 'mysql' } as rbacConfig)).toThrow(
      'mysqlConfig is required when dialect is mysql.'
    );

    expect(() => db.withLegacyAdapterFallback({ dialect: 'postgres' } as rbacConfig)).toThrow(
      'postgresConfig is required when dialect is postgres.'
    );

    expect(
      db.withLegacyAdapterFallback({
        dialect: 'mysql',
        mysqlConfig: { host: 'localhost', database: 'x', username: 'x', password: 'x' },
      } as rbacConfig).adapter
    ).toBeTruthy();

    expect(
      db.withLegacyAdapterFallback({
        dialect: 'postgres',
        postgresConfig: { host: 'localhost', database: 'x', username: 'x', password: 'x' },
      } as rbacConfig).adapter
    ).toBeTruthy();

    expect(db.withLegacyAdapterFallback({ dialect: 'mongodb' } as rbacConfig).adapter).toBeTruthy();

    expect(() => db.withLegacyAdapterFallback({ dialect: 'sqlite' as any } as rbacConfig)).toThrow(
      'RBAC adapter is required'
    );
  });

  it('covers database uninitialized access and static connection', () => {
    const db = new DatabaseClass();
    expect(() => db.getAdapter()).toThrow('RBAC is not initialized');
    expect(() => db.getConfig()).toThrow('RBAC is not initialized');
    expect(DatabaseClass.connection()).toBeNull();
  });

  it('covers withTransaction adapter callback branch', async () => {
    const db = new DatabaseClass();
    await db.init({ adapter: new WithTransactionAdapter() });

    const result = await db.withTransaction(async (tx) => {
      expect(tx).toEqual({ tx: true });
      return 'ok';
    });

    expect(result).toBe('ok');
  });

  it('covers permission service branches (title fallback and underscore slug)', async () => {
    const rbac = await createRbac();

    const [created] = await rbac.createPermission(
      [{ title: 'View Reports', description: 'View reports', isActive: true }],
      false
    );
    expect(created.slug).toBe('view_reports');

    const foundByTitle = await rbac.findPermission('View Reports');
    expect(foundByTitle.id).toBe(created.id);

    const updated = await rbac.updatePermission(
      created.id as string,
      { title: 'Export Reports', description: 'Export', isActive: true },
      false
    );
    expect(updated.slug).toBe('export_reports');

    const list = await rbac.ensurePermissions([
      { title: 'Manage Reports', description: 'Manage', isActive: true },
    ]);
    expect(list).toHaveLength(1);
  });
});

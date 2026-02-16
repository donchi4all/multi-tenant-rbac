import { Database, AuditTrail, hooks, ValidationError } from '../src';
import TtlCache from '../src/modules/cache';
import { assertArrayHasItems, assertNonEmptyString, normalizeToArray } from '../src/modules/validation';
import { IRbacAdapter, rbacConfig } from '../src/core/types';

class TxAdapter implements IRbacAdapter {
  public began = false;
  public committed = false;
  public rolledBack = false;

  async findOne(): Promise<Record<string, any> | null> { return null; }
  async findMany(): Promise<Record<string, any>[]> { return []; }
  async create(_m: string, data: Record<string, any>): Promise<Record<string, any>> { return data; }
  async update(): Promise<Record<string, any> | null> { return null; }
  async delete(): Promise<number> { return 0; }

  async beginTransaction(): Promise<unknown> {
    this.began = true;
    return { tx: true };
  }

  async commitTransaction(): Promise<void> {
    this.committed = true;
  }

  async rollbackTransaction(): Promise<void> {
    this.rolledBack = true;
  }
}

describe('Core modules', () => {
  beforeEach(() => {
    AuditTrail.clearHandlers();
    hooks.removeAllListeners();
  });

  it('emits audit events and hooks', async () => {
    const events: string[] = [];
    AuditTrail.register(async (event) => {
      events.push(event.action);
    });

    const hookPayloads: Record<string, any>[] = [];
    hooks.onHook('afterRoleAssign', (payload) => {
      hookPayloads.push(payload);
    });

    await AuditTrail.emit({ action: 'tenant.create' });
    hooks.emitHook('afterRoleAssign', { id: '1' });

    expect(events).toContain('tenant.create');
    expect(hookPayloads).toHaveLength(1);
  });

  it('validates input utilities', () => {
    expect(() => assertNonEmptyString('', 'field')).toThrow(ValidationError);
    expect(() => assertArrayHasItems([], 'items')).toThrow(ValidationError);

    assertNonEmptyString('ok', 'field');
    assertArrayHasItems([1], 'items');

    expect(normalizeToArray(1)).toEqual([1]);
    expect(normalizeToArray([1, 2])).toEqual([1, 2]);
  });

  it('handles ttl cache lifecycle', async () => {
    const cache = new TtlCache<string>(5);
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(cache.get('k')).toBeNull();

    cache.set('a', 'b');
    cache.delete('a');
    expect(cache.get('a')).toBeNull();

    cache.set('c', 'd');
    cache.clear();
    expect(cache.get('c')).toBeNull();
  });

  it('runs transaction helper and rollback path', async () => {
    const adapter = new TxAdapter();
    const config: rbacConfig = { adapter };
    await Database.init(config);

    const okResult = await Database.withTransaction(async () => 'ok');
    expect(okResult).toBe('ok');
    expect(adapter.began).toBe(true);
    expect(adapter.committed).toBe(true);

    await expect(
      Database.withTransaction(async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    expect(adapter.rolledBack).toBe(true);
  });

  it('throws when config has no adapter and no fallback dialect config', async () => {
    await expect(Database.init({} as rbacConfig)).rejects.toThrow('RBAC adapter is required');
  });
});

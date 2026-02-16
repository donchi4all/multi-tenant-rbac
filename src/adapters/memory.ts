import { AdapterQuery, AdapterRecord, AdapterWhere, IRbacAdapter } from '../core/types';

function matchesWhere(record: AdapterRecord, where?: AdapterWhere): boolean {
  if (!where) return true;

  return Object.entries(where).every(([key, expected]) => {
    if (expected === undefined) return true;
    if (Array.isArray(expected)) {
      return expected.includes(record[key]);
    }
    return record[key] === expected;
  });
}

export class InMemoryAdapter implements IRbacAdapter {
  private readonly store = new Map<string, AdapterRecord[]>();

  async findOne(model: string, query: AdapterQuery): Promise<AdapterRecord | null> {
    const rows = this.store.get(model) || [];
    return rows.find((row) => matchesWhere(row, query.where)) || null;
  }

  async findMany(model: string, query?: AdapterQuery): Promise<AdapterRecord[]> {
    const rows = this.store.get(model) || [];
    return rows.filter((row) => matchesWhere(row, query?.where));
  }

  async create(model: string, data: AdapterRecord): Promise<AdapterRecord> {
    const rows = this.store.get(model) || [];
    const id = data.id || `${rows.length + 1}`;
    const created = { ...data, id };
    rows.push(created);
    this.store.set(model, rows);
    return created;
  }

  async createMany(model: string, data: AdapterRecord[]): Promise<AdapterRecord[]> {
    return Promise.all(data.map((item) => this.create(model, item)));
  }

  async update(
    model: string,
    where: AdapterWhere,
    data: AdapterRecord
  ): Promise<AdapterRecord | null> {
    const rows = this.store.get(model) || [];
    const index = rows.findIndex((row) => matchesWhere(row, where));
    if (index === -1) return null;

    rows[index] = { ...rows[index], ...data };
    this.store.set(model, rows);
    return rows[index];
  }

  async delete(model: string, where: AdapterWhere): Promise<number> {
    const rows = this.store.get(model) || [];
    const kept = rows.filter((row) => !matchesWhere(row, where));
    this.store.set(model, kept);
    return rows.length - kept.length;
  }
}

export default InMemoryAdapter;

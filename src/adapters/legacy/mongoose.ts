import { AdapterQuery, AdapterRecord, AdapterWhere, IRbacAdapter, RbacResolvedConfig } from '../../core/types';

function safeRequire(moduleName: string): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(moduleName);
}

function toMongoWhere(where?: AdapterWhere): Record<string, unknown> {
  if (!where) return {};

  return Object.entries(where).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = { $in: value };
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);
}

function normalizeDoc(doc: any): AdapterRecord {
  if (!doc) return doc;
  const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;

  if (plain._id && !plain.id) {
    plain.id = String(plain._id);
  }

  return plain;
}

export class LegacyMongooseAdapter implements IRbacAdapter {
  private mongoose: any;
  private connection: any;

  async init(config: RbacResolvedConfig): Promise<void> {
    if (!config.mongodbConfig?.url) {
      throw new Error('mongodbConfig.url is required when using legacy mongodb config mode.');
    }

    try {
      this.mongoose = safeRequire('mongoose');
    } catch (error) {
      throw new Error('Legacy mongodb mode requires mongoose. Install it or provide config.adapter.');
    }

    await this.mongoose.connect(config.mongodbConfig.url);
    this.connection = this.mongoose.connection;
  }

  private getCollection(name: string): any {
    if (!this.connection) {
      throw new Error('LegacyMongooseAdapter is not initialized.');
    }

    return this.connection.collection(name);
  }

  async findOne(model: string, query: AdapterQuery): Promise<AdapterRecord | null> {
    const collection = this.getCollection(model);
    const doc = await collection.findOne(toMongoWhere(query.where));
    return doc ? normalizeDoc(doc) : null;
  }

  async findMany(model: string, query?: AdapterQuery): Promise<AdapterRecord[]> {
    const collection = this.getCollection(model);
    const docs = await collection.find(toMongoWhere(query?.where)).toArray();
    return docs.map(normalizeDoc);
  }

  async create(model: string, data: AdapterRecord): Promise<AdapterRecord> {
    const collection = this.getCollection(model);
    const result = await collection.insertOne(data);
    return { ...data, id: String(result.insertedId), _id: result.insertedId };
  }

  async createMany(model: string, data: AdapterRecord[]): Promise<AdapterRecord[]> {
    const collection = this.getCollection(model);
    const result = await collection.insertMany(data);
    return data.map((row, index) => ({
      ...row,
      id: String(result.insertedIds[index]),
      _id: result.insertedIds[index],
    }));
  }

  async update(model: string, where: AdapterWhere, data: AdapterRecord): Promise<AdapterRecord | null> {
    const collection = this.getCollection(model);
    const result = await collection.findOneAndUpdate(
      toMongoWhere(where),
      { $set: data },
      { returnDocument: 'after' }
    );

    return result?.value ? normalizeDoc(result.value) : null;
  }

  async delete(model: string, where: AdapterWhere): Promise<number> {
    const collection = this.getCollection(model);
    const result = await collection.deleteMany(toMongoWhere(where));
    return result.deletedCount || 0;
  }
}

export default LegacyMongooseAdapter;

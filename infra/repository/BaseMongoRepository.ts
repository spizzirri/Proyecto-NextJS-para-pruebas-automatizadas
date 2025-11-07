import MongoDBException from "domain/exceptions/MongoDBException";
import EntityModel from "domain/models/EntityModel";
import {
  IRepository,
  PaginationResult,
  SearchRepository,
} from "domain/repository/IRepository";
import mongoose, { FilterQuery, Model, SortOrder } from "mongoose";

type EntityConstructor<T> = new (...args: any[]) => T;

class BaseMongoRepository<T extends EntityModel> implements IRepository<T> {
  protected model: Model<any>;

  constructor(
    private readonly entityConstructor: EntityConstructor<T>,
    schema: mongoose.Schema,
    tableName: string,
    private readonly isCustomId: boolean = true
  ) {
    if (!tableName) {
      throw new MongoDBException(
        `${this.constructor.toString()} is having TABLE_NAME null or empty: ${tableName}`
      );
    }
    this.model =
      mongoose.models[tableName] || mongoose.model(tableName, schema);
  }

  async create(entity: T): Promise<T> {
    try {
      const model = new this.model(this.mapToPersistence(entity));
      const record = await model.save();

      entity.markAsCreated();
      await entity.commit();

      return this.mapToEntity(record);
    } catch (err) {
      console.error(err);
      throw new MongoDBException(
        `[create] Error: ${JSON.stringify(err)}`
      );
    }
  }

  async findOne(options?: SearchRepository<T>): Promise<T | null> {
    const where = this.transformWhere(
      options?.where ?? {}
    ) as FilterQuery<any>;
    const query = this.model.findOne(where);

    if (options?.order) {
      query.sort(this.transformOrder(options.order));
    }

    const record = await query.exec();

    return record ? this.mapToEntity(record) : null;
  }

  async find(options?: SearchRepository<T>): Promise<PaginationResult<T>> {
    const where = this.transformWhere(options?.where ?? {});
    const order = options?.order ? this.transformOrder(options.order) : undefined;

    const pageSize = options?.limit ?? 10;
    const skip = options?.skip ?? 0;

    const total = await this.model.countDocuments(where);

    const query = this.model.find(where);

    if (order) {
      query.sort(order);
    }

    query.limit(pageSize).skip(skip);

    const records = await query.exec();

    return {
      page: Math.floor(skip / pageSize) + 1,
      pageSize,
      total,
      results: records.map((item: any) => this.mapToEntity(item)) as T[],
    };
  }

  async findByKey(key: string | number): Promise<T | null> {
    // Validate ObjectId format before querying
    if (typeof key === "string" && !mongoose.Types.ObjectId.isValid(key)) {
      return null;
    }

    try {
      const record = await this.model.findById(key);

      if (!record) return null;

      return this.mapToEntity(record);
    } catch (error) {
      // If there's an error (e.g., invalid ObjectId format), return null
      return null;
    }
  }

  async update(entity: T): Promise<T> {
    if (!entity.isDirty()) return entity;

    const updated = await this.model.updateOne(
      this.isCustomId ? { _id: entity.id } : { id: entity.id },
      {
        $inc: { __v: 1 },
        ...this.mapToPersistence(entity),
      }
    );
    if (!updated.modifiedCount)
      throw new MongoDBException(
        `[update] Entity no found for key ${entity.id}`
      );
    await entity.commit();

    return entity;
  }

  async delete(where: Partial<T>, force?: boolean): Promise<number> {
    const filter = this.transformWhere(where);
    const fields = Object.keys(filter);

    if (fields.length < 1 && fields.length < 1 && !force) {
      throw new MongoDBException(
        `Deleting invoke without any filter. Please, check your request or call with force param`
      );
    }

    const trx: Promise<void>[] = [];
    const records = await this.model.find(filter);
    const entities = records.map((item: any) => this.mapToEntity(item));
    if (entities.length > 0) {
      entities.forEach((item) => {
        item.markAsDeleted();
        trx.push(item.commit());
      });
    }

    const task = await this.model.deleteMany(filter);

    await Promise.allSettled(trx);

    return task.deletedCount;
  }

  protected mapToPersistence(entity: T): any {
    if (this.isCustomId) {
      const { id, ...rest } = entity as any;
      // Only include _id if it's a valid non-empty value
      // If id is empty or invalid, let MongoDB generate it automatically
      if (id && (typeof id === "string" ? mongoose.Types.ObjectId.isValid(id) : true)) {
        return { ...rest, _id: id };
      }
      // Return without _id to let MongoDB auto-generate it
      return rest;
    }
    return entity;
  }

  protected mapToEntity(data: any): T {
    if (this.isCustomId) {
      const { _id, ...object } = Object.assign({}, data.toObject());
      // Convert _id (which may be an ObjectId) to string
      const idString = _id ? String(_id) : "";
      const entity = new this.entityConstructor({ ...object, id: idString });
      return entity;
    }
    return new this.entityConstructor(Object.assign({}, data.toObject()));
  }

  private transformWhere(where: Partial<T>): FilterQuery<T> {
    const filter: FilterQuery<T> = where ?? {};

    if (this.isCustomId && (filter as any).id) {
      (filter as any)._id = (filter as any).id;
      delete (filter as any).id;
    }
    return filter;
  }

  private transformOrder(
    order: { [P in keyof T]?: "ASC" | "DESC" }
  ): Record<string, SortOrder> {
    const transformed: Record<string, SortOrder> = {};
    for (const key in order) {
      const direction = order[key];
      if (direction) {
        transformed[key] = direction.toLowerCase() as SortOrder;
      }
    }

    return transformed;
  }
}

export default BaseMongoRepository;


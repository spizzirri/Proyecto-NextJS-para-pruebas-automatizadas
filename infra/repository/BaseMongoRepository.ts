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
      const persistenceData = this.mapToPersistence(entity);
      
      // Verificar que images esté presente antes de guardar
      if (!('images' in persistenceData)) {
        persistenceData.images = (entity as any).images || [];
      }
      
      // Verificar que image_url esté presente y tenga al menos un elemento
      if (!('image_url' in persistenceData) || !Array.isArray(persistenceData.image_url) || persistenceData.image_url.length === 0) {
        const imagesArray = (entity as any).images || [];
        persistenceData.image_url = imagesArray.length > 0 ? imagesArray : [];
      }
      
      const model = new this.model(persistenceData);
      const record = await model.save();

      entity.markAsCreated();
      await entity.commit();

      const mappedEntity = this.mapToEntity(record);
      return mappedEntity;
    } catch (err) {
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

    const persistenceData = this.mapToPersistence(entity);
    
    const updated = await this.model.updateOne(
      this.isCustomId ? { _id: entity.id } : { id: entity.id },
      {
        $inc: { __v: 1 },
        $set: persistenceData,
      }
    );
    if (!updated.modifiedCount)
      throw new MongoDBException(
        `[update] Entity no found for key ${entity.id}`
      );
    await entity.commit();

    // Recuperar la entidad actualizada de la base de datos
    const updatedEntity = await this.findByKey(entity.id);
    if (!updatedEntity) {
      throw new MongoDBException(`[update] Could not retrieve updated entity ${entity.id}`);
    }
    return updatedEntity;
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
      // Usar toJSON() para obtener todas las propiedades serializadas
      const entityData = entity.toJSON();
      const { id, ...rest } = entityData;
      // Only include _id if it's a valid non-empty value
      // If id is empty or invalid, let MongoDB generate it automatically
      const result = id && (typeof id === "string" ? mongoose.Types.ObjectId.isValid(id) : true)
        ? { ...rest, _id: id }
        : rest;
      
      // Asegurar que images siempre esté presente explícitamente
      // Acceder directamente a la propiedad de la entidad para asegurar que se incluya
      // Esto es crítico porque puede que no esté en toJSON() si getSubclassKeys() no lo detecta
      const imagesValue = (entity as any).images;
      if (Array.isArray(imagesValue)) {
        result.images = imagesValue;
      } else {
        result.images = [];
      }
      
      // Asegurar que image_url siempre sea un array
      const imageUrlValue = (entity as any).image_url;
      if (Array.isArray(imageUrlValue)) {
        result.image_url = imageUrlValue;
      } else if (imageUrlValue) {
        result.image_url = [imageUrlValue];
      } else {
        result.image_url = [];
      }
      
      return result;
    }
    const json = entity.toJSON();
    const imagesValue = (entity as any).images;
    if (Array.isArray(imagesValue)) {
      json.images = imagesValue;
    } else {
      json.images = [];
    }
    return json;
  }

  protected mapToEntity(data: any): T {
    if (this.isCustomId) {
      const { _id, ...object } = Object.assign({}, data.toObject());
      // Convert _id (which may be an ObjectId) to string
      const idString = _id ? String(_id) : "";
      const entity = new this.entityConstructor({ ...object, id: idString });
      return entity;
    }
    const obj = Object.assign({}, data.toObject());
    return new this.entityConstructor(obj);
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


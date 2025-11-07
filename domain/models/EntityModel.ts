abstract class EntityModel {
  public id: string;
  public createdAt?: Date;
  public updatedAt?: Date;
  public useTimestamps: boolean = true;
  abstract entityName: string;

  protected _dirty: boolean = false;
  protected _originalData: Record<string, any>;
  protected _lastAction: "CREATE" | "UPDATE" | "DELETE" | "BUILDED" = "BUILDED";

  constructor(data?: Record<string, any>) {
    // Ensure id is always a string, converting ObjectId if necessary
    const rawId = data?.id || data?._id;
    this.id = rawId ? String(rawId) : "";
    delete data?.__v;
    this._originalData = data ?? {};

    if (this.useTimestamps) {
      this.createdAt = data?.createdAt ? new Date(data.createdAt) : new Date();
      this.updatedAt = data?.updatedAt ? new Date(data.updatedAt) : new Date();
    }
  }

  public markAsCreated(): void {
    this._lastAction = "CREATE";
    this._dirty = true;
  }

  public markAsDeleted(): void {
    this._lastAction = "DELETE";
    this._dirty = true;
  }

  public update(data: Partial<this>): void {
    for (const key of Object.keys(data) as Array<keyof this>) {
      const newValue = data[key];
      const oldValue = this[key];

      const hasChanged =
        newValue instanceof Date && oldValue instanceof Date
          ? newValue.getTime() !== oldValue.getTime()
          : newValue !== oldValue;

      if (hasChanged) {
        (this[key] as any) = newValue;
        this._dirty = true;
      }
    }

    if (this._dirty && this.useTimestamps) {
      this.updatedAt = new Date();
    }

    this._lastAction = "UPDATE";
  }

  public async commit(): Promise<void> {
    if (!this._dirty) return;
    this._dirty = false;
    this._originalData = this.getPublicState();
  }

  private getPublicState(): Record<string, any> {
    const keys = this.getSubclassKeys();
    keys.push("id");

    if (this.useTimestamps) {
      keys.push(...["createdAt", "updatedAt"]);
    }

    const state: Record<string, any> = {};
    for (const key of keys) {
      const value = this[key as keyof this];
      // Convert Date objects to ISO strings for JSON serialization
      if (value instanceof Date) {
        state[key] = value.toISOString();
      } else {
        state[key] = value;
      }
    }
    return state;
  }

  private getSubclassKeys(): string[] {
    class Temp extends EntityModel {
      entityName: string = "";
    }

    const baseKeys = Object.keys(new Temp({}));
    const instanceKeys = Object.keys(this);

    return instanceKeys.filter(
      (key) =>
        !baseKeys.includes(key) &&
        !key.startsWith("_") &&
        typeof (this as any)[key] !== "function"
    );
  }

  public isDirty(): boolean {
    return this._dirty;
  }

  public toJSON() {
    const json = this.getPublicState();
    return json;
  }
}

export default EntityModel;


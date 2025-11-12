import EntityModel from "./EntityModel";

export class PetEntity extends EntityModel {
  public entityName: string = "Pet";
  public name: string;
  public owner_name: string;
  public species: string;
  public age?: number;
  public poddy_trained?: boolean;
  public diet?: string[];
  public image_url: string[]; // Cambiar a array
  public images: string[]; // Cambiar a no opcional para asegurar que siempre exista
  public likes?: string[];
  public dislikes?: string[];

  constructor(data?: Record<string, any>) {
    super(data);
    this.name = data?.name || "";
    this.owner_name = data?.owner_name || "";
    this.species = data?.species || "";
    this.age = data?.age;
    this.poddy_trained = data?.poddy_trained;
    this.diet = data?.diet || [];
    // Asegurar que image_url sea un array, incluso si viene undefined o como string
    if (Array.isArray(data?.image_url)) {
      this.image_url = data.image_url;
    } else if (data?.image_url) {
      this.image_url = [data.image_url];
    } else {
      this.image_url = [];
    }
    // Asegurar que images sea un array, incluso si viene undefined
    this.images = Array.isArray(data?.images) ? data.images : (data?.images ? [data.images] : []);
    this.likes = data?.likes || [];
    this.dislikes = data?.dislikes || [];
    console.log("PetEntity constructor - data.images:", data?.images);
    console.log("PetEntity constructor - this.images:", this.images);
  }

  // Sobrescribir toJSON para asegurar que images e image_url siempre se incluyan como arrays
  public toJSON() {
    const json = super.toJSON();
    // Asegurar que images siempre esté presente explícitamente
    json.images = this.images || [];
    // Asegurar que image_url siempre sea un array
    if (Array.isArray(this.image_url)) {
      json.image_url = this.image_url;
    } else if (this.image_url) {
      json.image_url = [this.image_url];
    } else {
      json.image_url = [];
    }
    console.log("PetEntity.toJSON - this.images:", this.images);
    console.log("PetEntity.toJSON - this.image_url:", this.image_url);
    console.log("PetEntity.toJSON - json.images:", json.images);
    console.log("PetEntity.toJSON - json.image_url:", json.image_url);
    return json;
  }
}


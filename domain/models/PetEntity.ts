import EntityModel from "./EntityModel";

export class PetEntity extends EntityModel {
  public entityName: string = "Pet";
  public name: string;
  public owner_name: string;
  public species: string;
  public age?: number;
  public poddy_trained?: boolean;
  public diet?: string[];
  public image_url: string;
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
    this.image_url = data?.image_url || "";
    this.likes = data?.likes || [];
    this.dislikes = data?.dislikes || [];
  }
}


import { Schema } from "mongoose";
import BaseMongoRepository from "./BaseMongoRepository";
import { PetEntity } from "domain/models/PetEntity";
import { IPetRepository } from "domain/repository/IPetRepository";

const PetSchema = new Schema<PetEntity>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for this pet."],
      maxlength: [60, "Name cannot be more than 60 characters"],
    },
    owner_name: {
      type: String,
      required: [true, "Please provide the pet owner's name"],
      maxlength: [60, "Owner's Name cannot be more than 60 characters"],
    },
    species: {
      type: String,
      required: [true, "Please specify the species of your pet."],
      maxlength: [40, "Species specified cannot be more than 40 characters"],
    },
    age: {
      type: Number,
    },
    poddy_trained: {
      type: Boolean,
    },
    diet: {
      type: [String],
    },
    image_url: {
      type: String,
      required: [true, "Please provide an image url for this pet."],
    },
    likes: {
      type: [String],
    },
    dislikes: {
      type: [String],
    },
  },
  {
    collection: "pets",
    timestamps: true,
  }
);

export class MongoPetRepository
  extends BaseMongoRepository<PetEntity>
  implements IPetRepository
{
  constructor() {
    super(PetEntity, PetSchema, "pets");
  }
}


import { Schema } from "mongoose";
import BaseMongoRepository from "./BaseMongoRepository";
import { PetEntity } from "domain/models/PetEntity";
import { IPetRepository } from "domain/repository/IPetRepository";

const PetSchema = new Schema<PetEntity>(
  {
    name: {
      type: String,
      required: [true, "Por favor, proporciona un nombre para esta mascota."],
      maxlength: [60, "El nombre no puede tener más de 60 caracteres"],
    },
    owner_name: {
      type: String,
      required: [true, "Por favor, proporciona el nombre del dueño de la mascota"],
      maxlength: [60, "El nombre del dueño no puede tener más de 60 caracteres"],
    },
    species: {
      type: String,
      required: [true, "Por favor, especifica la especie de tu mascota."],
      maxlength: [40, "La especie especificada no puede tener más de 40 caracteres"],
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
      required: [true, "Por favor, proporciona una URL de imagen para esta mascota."],
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


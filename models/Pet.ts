import mongoose from "mongoose";

export interface Pets extends mongoose.Document {
  name: string;
  owner_name: string;
  species: string;
  age: number;
  poddy_trained: boolean;
  diet: string[];
  image_url: string;
  likes: string[];
  dislikes: string[];
}

/* PetSchema will correspond to a collection in your MongoDB database. */
const PetSchema = new mongoose.Schema<Pets>({
  name: {
    /* The name of this pet */

    type: String,
    required: [true, "Por favor, proporciona un nombre para esta mascota."],
    maxlength: [60, "El nombre no puede tener más de 60 caracteres"],
  },
  owner_name: {
    /* The owner of this pet */

    type: String,
    required: [true, "Por favor, proporciona el nombre del dueño de la mascota"],
    maxlength: [60, "El nombre del dueño no puede tener más de 60 caracteres"],
  },
  species: {
    /* The species of your pet */

    type: String,
    required: [true, "Por favor, especifica la especie de tu mascota."],
    maxlength: [40, "La especie especificada no puede tener más de 40 caracteres"],
  },
  age: {
    /* Pet's age, if applicable */

    type: Number,
  },
  poddy_trained: {
    /* Boolean poddy_trained value, if applicable */

    type: Boolean,
  },
  diet: {
    /* List of dietary needs, if applicable */

    type: [String],
  },
  image_url: {
    /* Url to pet image */

    required: [true, "Por favor, proporciona una URL de imagen para esta mascota."],
    type: String,
  },
  likes: {
    /* List of things your pet likes to do */

    type: [String],
  },
  dislikes: {
    /* List of things your pet does not like to do */

    type: [String],
  },
});

export default mongoose.models.Pet || mongoose.model<Pets>("Pet", PetSchema);

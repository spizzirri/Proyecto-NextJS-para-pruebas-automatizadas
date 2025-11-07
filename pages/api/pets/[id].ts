import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Pet, { Pets } from "@/models/Pet";
import mongoose, { Model } from "mongoose";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  // Ensure id is a string
  const petId = Array.isArray(id) ? id[0] : id;
  
  if (!petId || typeof petId !== "string") {
    return res.status(400).json({ success: false, error: "Invalid ID" });
  }

  const PetModel = Pet as Model<Pets>;

  switch (method) {
    case "GET" /* Get a model by its ID */:
      try {
        const pet = await PetModel.findById(petId).exec();
        if (!pet) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: pet });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case "PUT" /* Edit a model by its ID */:
      try {
        const pet = await PetModel.findByIdAndUpdate(
          petId,
          req.body as Partial<Pets>,
          {
            new: true,
            runValidators: true,
          }
        ).exec();
        if (!pet) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: pet });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case "DELETE" /* Delete a model by its ID */:
      try {
        const objectId = new mongoose.Types.ObjectId(petId);
        const deletedPet = await PetModel.deleteOne({ _id: objectId }).exec();
        if (!deletedPet) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}

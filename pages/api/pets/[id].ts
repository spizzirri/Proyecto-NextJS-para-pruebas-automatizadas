import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import { MongoPetRepository } from "infra/repository/MongoPetRepository";
import { PetEntity } from "domain/models/PetEntity";

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

  const petRepository = new MongoPetRepository();

  switch (method) {
    case "GET" /* Get a model by its ID */:
      try {
        const pet = await petRepository.findByKey(petId);
        if (!pet) {
          return res.status(400).json({ success: false });
        }
        const petData = pet.toJSON();
        res.status(200).json({ success: true, data: petData });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case "PUT" /* Edit a model by its ID */:
      try {
        const existingPet = await petRepository.findByKey(petId);
        if (!existingPet) {
          return res.status(400).json({ success: false });
        }
        existingPet.update(req.body);
        const pet = await petRepository.update(existingPet);
        const petData = pet.toJSON();
        res.status(200).json({ success: true, data: petData });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    case "DELETE" /* Delete a model by its ID */:
      try {
        const deletedCount = await petRepository.delete({ id: petId } as Partial<PetEntity>);
        if (deletedCount === 0) {
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

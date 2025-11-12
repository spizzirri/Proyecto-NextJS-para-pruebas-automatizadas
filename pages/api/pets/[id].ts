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
        console.log("API GET - pet.images:", pet.images);
        const petData = pet.toJSON();
        console.log("API GET - petData.images:", petData.images);
        res.status(200).json({ success: true, data: petData });
      } catch (error) {
        console.error("API GET - Error:", error);
        res.status(400).json({ success: false });
      }
      break;

    case "PUT" /* Edit a model by its ID */:
      try {
        console.log("API PUT - req.body.images:", req.body.images);
        const existingPet = await petRepository.findByKey(petId);
        if (!existingPet) {
          return res.status(400).json({ success: false });
        }
        console.log("API PUT - existingPet.images antes:", existingPet.images);
        existingPet.update(req.body);
        console.log("API PUT - existingPet.images después:", existingPet.images);
        const pet = await petRepository.update(existingPet);
        console.log("API PUT - pet guardado.images:", pet.images);
        const petData = pet.toJSON();
        console.log("API PUT - petData.images:", petData.images);
        res.status(200).json({ success: true, data: petData });
      } catch (error) {
        console.error("API PUT - Error:", error);
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

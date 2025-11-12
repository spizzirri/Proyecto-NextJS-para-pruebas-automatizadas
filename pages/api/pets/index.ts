import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import { MongoPetRepository } from "infra/repository/MongoPetRepository";
import { PetEntity } from "domain/models/PetEntity";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req;

  await dbConnect();

  const petRepository = new MongoPetRepository();

  switch (method) {
    case "GET":
      try {
        const result = await petRepository.find({});
        res.status(200).json({ success: true, data: result.results });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      try {
        
        // Asegurar que image_url sea un array con al menos un elemento
        if (!Array.isArray(req.body.image_url) || req.body.image_url.length === 0) {
          return res.status(400).json({ 
            success: false, 
            error: "image_url debe ser un array con al menos una imagen" 
          });
        }
        
        const petEntity = new PetEntity(req.body);
        const pet = await petRepository.create(petEntity);
        const petData = pet.toJSON();
        res.status(201).json({ success: true, data: petData });
      } catch (error: any) {
        res.status(400).json({ 
          success: false, 
          error: error?.message || "Error al crear la mascota",
          details: error?.toString()
        });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
}

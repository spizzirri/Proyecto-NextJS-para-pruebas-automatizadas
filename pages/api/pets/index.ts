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
        console.log("API GET ALL - Primer pet.images:", result.results[0]?.images);
        res.status(200).json({ success: true, data: result.results });
      } catch (error) {
        console.error("API GET ALL - Error:", error);
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      try {
        console.log("API POST - req.body completo:", JSON.stringify(req.body, null, 2));
        console.log("API POST - req.body.image_url:", req.body.image_url);
        console.log("API POST - req.body.images:", req.body.images);
        
        // Asegurar que image_url sea un array con al menos un elemento
        if (!Array.isArray(req.body.image_url) || req.body.image_url.length === 0) {
          console.error("API POST - Error: image_url debe ser un array con al menos un elemento");
          return res.status(400).json({ 
            success: false, 
            error: "image_url debe ser un array con al menos una imagen" 
          });
        }
        
        const petEntity = new PetEntity(req.body);
        console.log("API POST - petEntity.image_url:", petEntity.image_url);
        console.log("API POST - petEntity.images:", petEntity.images);
        const pet = await petRepository.create(petEntity);
        console.log("API POST - pet guardado.image_url:", pet.image_url);
        console.log("API POST - pet guardado.images:", pet.images);
        const petData = pet.toJSON();
        console.log("API POST - petData.image_url:", petData.image_url);
        console.log("API POST - petData.images:", petData.images);
        res.status(201).json({ success: true, data: petData });
      } catch (error: any) {
        console.error("API POST - Error completo:", error);
        console.error("API POST - Error message:", error?.message);
        console.error("API POST - Error stack:", error?.stack);
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

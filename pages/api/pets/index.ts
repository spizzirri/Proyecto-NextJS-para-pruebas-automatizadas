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
        const petEntity = new PetEntity(req.body);
        const pet = await petRepository.create(petEntity);
        res.status(201).json({ success: true, data: pet });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    default:
      res.status(400).json({ success: false });
      break;
  }
}

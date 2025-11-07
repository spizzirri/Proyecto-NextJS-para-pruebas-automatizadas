import { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/dbConnect";
import Pet, { Pets } from "@/models/Pet";
import { Model } from "mongoose";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req;

  await dbConnect();

  const PetModel = Pet as Model<Pets>;

  switch (method) {
    case "GET":
      try {
        const pets = await PetModel.find({}).exec(); /* find all the data in our database */
        res.status(200).json({ success: true, data: pets });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case "POST":
      try {
        const pet = await PetModel.create(
          req.body as Partial<Pets>,
        ); /* create a new model in the database */
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

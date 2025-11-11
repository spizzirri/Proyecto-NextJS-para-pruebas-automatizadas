import dbConnect from "../lib/dbConnect";
import { GetServerSideProps } from "next";
import { MongoPetRepository } from "infra/repository/MongoPetRepository";
import { Content } from "pages/home";

type PetData = {
  id: string;
  name: string;
  owner_name: string;
  species: string;
  age?: number;
  poddy_trained?: boolean;
  diet?: string[];
  image_url: string;
  likes?: string[];
  dislikes?: string[];
};

type Props = {
  pets: PetData[];
};

/* Retrieves pet(s) data from mongodb database */
export const getServerSideProps: GetServerSideProps<Props> = async () => {
  await dbConnect();

  /* find all the data in our database */
  const petRepository = new MongoPetRepository();
  const result = await petRepository.find({});

  /* Ensures all objectIds and nested objectIds are serialized as JSON data */
  const pets = result.results.map((pet) => pet.toJSON() as PetData);

  return { props: { pets: pets } };
};

export default function Index({ pets }: Props) {
  return <Content pets={pets} />;
}

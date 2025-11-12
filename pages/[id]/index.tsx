import dbConnect from "@/lib/dbConnect";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { MongoPetRepository } from "infra/repository/MongoPetRepository";
import { Content } from "pages/pet";

interface Params extends ParsedUrlQuery {
  id: string;
}

type PetData = {
  id: string;
  name: string;
  owner_name: string;
  species: string;
  age?: number;
  poddy_trained?: boolean;
  diet?: string[];
  image_url: string;
  images?: string[];
  likes?: string[];
  dislikes?: string[];
};

type Props = {
  pet: PetData;
};

export const getServerSideProps: GetServerSideProps<Props, Params> = async ({
  params,
}: GetServerSidePropsContext) => {
  await dbConnect();

  if (!params?.id) {
    return {
      notFound: true,
    };
  }

  const petId = Array.isArray(params.id) ? params.id[0] : params.id;
  if (!petId) {
    return {
      notFound: true,
    };
  }

  const petRepository = new MongoPetRepository();
  const pet = await petRepository.findByKey(petId);

  if (!pet) {
    return {
      notFound: true,
    };
  }

  /* Ensures all objectIds and nested objectIds are serialized as JSON data */
  const serializedPet = pet.toJSON() as PetData;

  return {
    props: {
      pet: serializedPet,
    },
  };
};

export default function PetPage({ pet }: Props) {
  return <Content pet={pet} />;
}

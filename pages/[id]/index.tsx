import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dbConnect from "@/lib/dbConnect";
import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { ParsedUrlQuery } from "querystring";
import { MongoPetRepository } from "infra/repository/MongoPetRepository";

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
  likes?: string[];
  dislikes?: string[];
};

type Props = {
  pet: PetData;
};

/* Allows you to view pet card info and delete pet card*/
const PetPage = ({ pet }: Props) => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const handleDelete = async () => {
    const petID = router.query.id;

    try {
      await fetch(`/api/pets/${petID}`, {
        method: "Delete",
      });
      router.push("/");
    } catch (error) {
      setMessage("Failed to delete the pet.");
    }
  };

  const petId = String(pet.id);

  return (
    <div key={petId}>
      <div className="card">
        <img src={pet.image_url} />
        <h5 className="pet-name">{pet.name}</h5>
        <div className="main-content">
          <p className="pet-name">{pet.name}</p>
          <p className="owner">Owner: {pet.owner_name}</p>

          {/* Extra Pet Info: Likes and Dislikes */}
          <div className="likes info">
            <p className="label">Likes</p>
            <ul>
              {(pet.likes || []).map((data, index) => (
                <li key={index}>{data} </li>
              ))}
            </ul>
          </div>
          <div className="dislikes info">
            <p className="label">Dislikes</p>
            <ul>
              {(pet.dislikes || []).map((data, index) => (
                <li key={index}>{data} </li>
              ))}
            </ul>
          </div>

          <div className="btn-container">
            <Link href={`/${petId}/edit`}>
              <button className="btn edit">Edit</button>
            </Link>
            <button className="btn delete" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </div>
      {message && <p>{message}</p>}
    </div>
  );
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

export default PetPage;

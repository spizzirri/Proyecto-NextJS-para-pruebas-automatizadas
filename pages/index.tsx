import Link from "next/link";
import dbConnect from "../lib/dbConnect";
import { GetServerSideProps } from "next";
import { MongoPetRepository } from "infra/repository/MongoPetRepository";

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

const Index = ({ pets }: Props) => {
  return (
    <>
      {pets.map((pet) => {
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
                  <Link href={{ pathname: "/[id]/edit", query: { id: petId } }}>
                    <button className="btn edit">Edit</button>
                  </Link>
                  <Link href={{ pathname: "/[id]", query: { id: petId } }}>
                    <button className="btn view">View</button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
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

export default Index;

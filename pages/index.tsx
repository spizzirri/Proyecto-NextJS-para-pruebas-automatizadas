import Link from "next/link";
import dbConnect from "../lib/dbConnect";
import Pet, { Pets } from "../models/Pet";
import { GetServerSideProps } from "next";
import { Document, Model } from "mongoose";

type Props = {
  pets: Pets[];
};

type PetDocument = Document<unknown, {}, Pets> & Pets & Required<{ _id: unknown }> & { __v: number };

const Index = ({ pets }: Props) => {
  return (
    <>
      {pets.map((pet) => {
        const petId = String(pet._id);
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
                    {pet.likes.map((data, index) => (
                      <li key={index}>{data} </li>
                    ))}
                  </ul>
                </div>
                <div className="dislikes info">
                  <p className="label">Dislikes</p>
                  <ul>
                    {pet.dislikes.map((data, index) => (
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
  const PetModel = Pet as Model<Pets>;
  const result = await PetModel.find({}).exec();

  /* Ensures all objectIds and nested objectIds are serialized as JSON data */
  const pets = result.map((doc: PetDocument) => {
    const pet = JSON.parse(JSON.stringify(doc)) as Pets;
    return pet;
  });

  return { props: { pets: pets } };
};

export default Index;

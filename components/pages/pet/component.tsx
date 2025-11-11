import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { PetCard } from "./PetCard";

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

export default function PetDetailComponent({ pet }: Props) {
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
    <>
      <PetCard pet={pet} showActions={false} />
      <div className="btn-container">
        <Link href={`/${petId}/edit`}>
          <button className="btn edit">Edit</button>
        </Link>
        <button className="btn delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
      {message && <p>{message}</p>}
    </>
  );
}


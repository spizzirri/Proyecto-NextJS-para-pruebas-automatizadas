import { PetCard } from "../pet/PetCard";

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
  pets: PetData[];
};

export default function HomeComponent({ pets }: Props) {
  return (
    <>
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} showActions={true} showAllImages={false} />
      ))}
    </>
  );
}


import { useRouter } from "next/router";
import useSWR from "swr";
import Form from "@/components/Form";

const fetcher = (url: string) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data);

export default function EditPetComponent() {
  const router = useRouter();
  const { id } = router.query;
  const {
    data: pet,
    error,
    isLoading,
  } = useSWR(id ? `/api/pets/${id}` : null, fetcher);

  if (error) return <p>Error al cargar</p>;
  if (isLoading) return <p>Cargando...</p>;
  if (!pet) return null;

  const petForm = {
    name: pet.name,
    owner_name: pet.owner_name,
    species: pet.species,
    age: pet.age,
    poddy_trained: pet.poddy_trained,
    diet: pet.diet,
    image_url: pet.image_url,
    images: pet.images,
    likes: pet.likes,
    dislikes: pet.dislikes,
  };

  return <Form formId="edit-pet-form" petForm={petForm} forNewPet={false} />;
}


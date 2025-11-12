import { useRouter } from "next/router";
import useSWR from "swr";
import Form, { PetForm } from "@/components/Form";

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

  const petForm = new PetForm(pet);

  return <Form formId="edit-pet-form" petForm={petForm} forNewPet={false} />;
}


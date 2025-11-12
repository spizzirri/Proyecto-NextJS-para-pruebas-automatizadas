import Link from "next/link";

type PetData = {
  id: string;
  name: string;
  owner_name: string;
  species: string;
  age?: number;
  poddy_trained?: boolean;
  diet?: string[];
  image_url: string | string[]; // Puede ser string (compatibilidad) o array
  images?: string[];
  likes?: string[];
  dislikes?: string[];
};

type Props = {
  pet: PetData;
  showActions?: boolean;
  showAllImages?: boolean; // Si es false, solo muestra la primera imagen
};

export function PetCard({ pet, showActions = false, showAllImages = false }: Props) {
  const petId = String(pet.id);

  // Obtener todas las imágenes
  const allImages = pet.images && pet.images.length > 0 
    ? pet.images 
    : Array.isArray(pet.image_url) && pet.image_url.length > 0
    ? pet.image_url
    : typeof pet.image_url === 'string' && pet.image_url
    ? [pet.image_url]
    : [];

  // Si no hay imágenes, no mostrar nada
  if (allImages.length === 0) {
    return null;
  }

  // Si showAllImages es false, solo usar la primera imagen
  const imagesToShow = showAllImages ? allImages : [allImages[0]];

  // Retornar una tarjeta por cada imagen a mostrar
  return (
    <>
      {imagesToShow.map((img, index) => (
        <div key={`${petId}-${index}`}>
          <div className="card">
            <img src={img} alt={`${pet.name} - Imagen ${index + 1}`} />
            <h5 className="pet-name">{pet.name}</h5>
            <div className="main-content">
              <p className="pet-name">{pet.name}</p>
              <p className="owner">Dueño: {pet.owner_name}</p>

              {/* Extra Pet Info: Likes and Dislikes */}
              <div className="likes info">
                <p className="label">Gustos</p>
                <ul>
                  {(pet.likes || []).map((data, idx) => (
                    <li key={idx}>{data} </li>
                  ))}
                </ul>
              </div>
              <div className="dislikes info">
                <p className="label">Disgustos</p>
                <ul>
                  {(pet.dislikes || []).map((data, idx) => (
                    <li key={idx}>{data} </li>
                  ))}
                </ul>
              </div>

              {showActions && (
                <div className="btn-container">
                  <Link href={{ pathname: "/[id]/edit", query: { id: petId } }}>
                    <button className="btn edit">Editar</button>
                  </Link>
                  <Link href={{ pathname: "/[id]", query: { id: petId } }}>
                    <button className="btn view">Ver</button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}


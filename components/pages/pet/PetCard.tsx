import Link from "next/link";

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
  showActions?: boolean;
};

export function PetCard({ pet, showActions = false }: Props) {
  const petId = String(pet.id);

  return (
    <div key={petId}>
      <div className="card">
        <img src={pet.image_url} />
        <h5 className="pet-name">{pet.name}</h5>
        <div className="main-content">
          <p className="pet-name">{pet.name}</p>
          <p className="owner">Dueño: {pet.owner_name}</p>

          {/* Extra Pet Info: Likes and Dislikes */}
          <div className="likes info">
            <p className="label">Gustos</p>
            <ul>
              {(pet.likes || []).map((data, index) => (
                <li key={index}>{data} </li>
              ))}
            </ul>
          </div>
          <div className="dislikes info">
            <p className="label">Disgustos</p>
            <ul>
              {(pet.dislikes || []).map((data, index) => (
                <li key={index}>{data} </li>
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
  );
}


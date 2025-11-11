import { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";

interface FormData {
  name: string;
  owner_name: string;
  species: string;
  age: number;
  poddy_trained: boolean;
  diet: string[];
  image_url: string;
  likes: string[];
  dislikes: string[];
}

interface Error {
  name?: string;
  owner_name?: string;
  species?: string;
  image_url?: string;
}

type Props = {
  formId: string;
  petForm: FormData;
  forNewPet?: boolean;
};

const Form = ({ formId, petForm, forNewPet = true }: Props) => {
  const router = useRouter();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(
    petForm.image_url || null
  );
  // Si hay una URL existente y no es base64, usar URL por defecto
  const [useFileUpload, setUseFileUpload] = useState(
    !petForm.image_url || petForm.image_url.startsWith("data:")
      ? true
      : false
  );

  const [form, setForm] = useState({
    name: petForm.name,
    owner_name: petForm.owner_name,
    species: petForm.species,
    age: petForm.age,
    poddy_trained: petForm.poddy_trained,
    diet: petForm.diet,
    image_url: petForm.image_url,
    likes: petForm.likes,
    dislikes: petForm.dislikes,
  });

  /* The PUT method edits an existing entry in the mongodb database. */
  const putData = async (form: FormData) => {
    const { id } = router.query;

    try {
      const res = await fetch(`/api/pets/${id}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(form),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status.toString());
      }

      const { data } = await res.json();

      mutate(`/api/pets/${id}`, data, false); // Update the local data without a revalidation
      router.push("/");
    } catch (error) {
      setMessage("Failed to update pet");
    }
  };

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form: FormData) => {
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(form),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status.toString());
      }

      router.push("/");
    } catch (error) {
      setMessage("Failed to add pet");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target;
    const value =
      target.name === "poddy_trained"
        ? (target as HTMLInputElement).checked
        : target.value;
    const name = target.name;

    setForm({
      ...form,
      [name]: value,
    });

    // Actualizar preview si es image_url
    if (name === "image_url" && !useFileUpload && typeof value === "string") {
      setImagePreview(value);
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      setMessage("Por favor, selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("La imagen es demasiado grande. Máximo 5MB");
      return;
    }

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setForm({
        ...form,
        image_url: base64String,
      });
      setImagePreview(base64String);
      setMessage("");
    };
    reader.onerror = () => {
      setMessage("Error al leer el archivo");
    };
    reader.readAsDataURL(file);
  };

  /* Makes sure pet info is filled for pet name, owner name, species, and image url*/
  const formValidate = () => {
    let err: Error = {};
    if (!form.name) err.name = "Name is required";
    if (!form.owner_name) err.owner_name = "Owner is required";
    if (!form.species) err.species = "Species is required";
    if (!form.image_url) err.image_url = "Image is required";
    return err;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = formValidate();

    if (Object.keys(errs).length === 0) {
      forNewPet ? postData(form) : putData(form);
    } else {
      setErrors({ errs });
    }
  };

  return (
    <>
      <form id={formId} onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          type="text"
          maxLength={20}
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="owner_name">Owner</label>
        <input
          type="text"
          maxLength={20}
          name="owner_name"
          value={form.owner_name}
          onChange={handleChange}
          required
        />

        <label htmlFor="species">Species</label>
        <input
          type="text"
          maxLength={30}
          name="species"
          value={form.species}
          onChange={handleChange}
          required
        />

        <label htmlFor="age">Age</label>
        <input
          type="number"
          name="age"
          value={form.age}
          onChange={handleChange}
        />

        <label htmlFor="poddy_trained">Potty Trained</label>
        <input
          type="checkbox"
          name="poddy_trained"
          checked={form.poddy_trained}
          onChange={handleChange}
        />

        <label htmlFor="diet">Diet</label>
        <textarea
          name="diet"
          maxLength={60}
          value={form.diet}
          onChange={handleChange}
        />

        <label htmlFor="image">Imagen</label>
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label style={{ marginRight: "1rem" }}>
              <input
                type="radio"
                name="imageSource"
                checked={useFileUpload}
                onChange={() => {
                  setUseFileUpload(true);
                  setForm({ ...form, image_url: "" });
                  setImagePreview(null);
                }}
              />
              Cargar desde ordenador
            </label>
            <label>
              <input
                type="radio"
                name="imageSource"
                checked={!useFileUpload}
                onChange={() => {
                  setUseFileUpload(false);
                  // Si ya hay una URL en el formulario, mantenerla; si no, usar la original
                  const currentUrl = form.image_url && !form.image_url.startsWith("data:")
                    ? form.image_url
                    : petForm.image_url || "";
                  setForm({ ...form, image_url: currentUrl });
                  setImagePreview(currentUrl || null);
                }}
              />
              Usar URL
            </label>
          </div>

          {useFileUpload ? (
            <div>
              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleFileChange}
                required={!form.image_url}
              />
              {imagePreview && (
                <div style={{ marginTop: "1rem" }}>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <input
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
                required
              />
              {imagePreview && (
                <div style={{ marginTop: "1rem" }}>
                  <img
                    src={imagePreview}
                    alt="Vista previa"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <label htmlFor="likes">Likes</label>
        <textarea
          name="likes"
          maxLength={60}
          value={form.likes}
          onChange={handleChange}
        />

        <label htmlFor="dislikes">Dislikes</label>
        <textarea
          name="dislikes"
          maxLength={60}
          value={form.dislikes}
          onChange={handleChange}
        />

        <button type="submit" className="btn">
          Submit
        </button>
      </form>
      <p>{message}</p>
      <div>
        {Object.keys(errors).map((err, index) => (
          <li key={index}>{err}</li>
        ))}
      </div>
    </>
  );
};

export default Form;

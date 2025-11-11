import { useState, useRef } from "react";
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
  // Array de imágenes con nombre y datos base64
  interface ImageData {
    name: string;
    data: string; // base64
  }
  const [images, setImages] = useState<ImageData[]>(() => {
    // Si hay una imagen existente (base64 o URL), incluirla
    if (petForm.image_url) {
      return [{ name: "Imagen existente", data: petForm.image_url }];
    }
    return [];
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setMessage("Error al actualizar la mascota");
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
      setMessage("Error al agregar la mascota");
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
  };

  const handleAddImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Verificar límite de 4 imágenes
    if (images.length >= 4) {
      setMessage("Máximo 4 imágenes permitidas");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Procesar cada archivo seleccionado
    const newImages: ImageData[] = [];
    let hasError = false;
    const maxImages = 4;
    const remainingSlots = maxImages - images.length;

    for (let i = 0; i < Math.min(files.length, remainingSlots); i++) {
      const file = files[i];
      if (!file) continue;

      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        setMessage("Por favor, selecciona solo archivos de imagen válidos");
        hasError = true;
        continue;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("Una o más imágenes son demasiado grandes. Máximo 5MB por imagen");
        hasError = true;
        continue;
      }

      // Convertir a base64
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          newImages.push({
            name: file.name,
            data: base64String,
          });
          resolve();
        };
        reader.onerror = () => {
          setMessage("Error al leer uno o más archivos");
          reject();
        };
        reader.readAsDataURL(file);
      });
    }

    if (files.length > remainingSlots) {
      setMessage(`Solo se pueden agregar ${remainingSlots} imagen(es) más. Máximo 4 imágenes.`);
    }

    if (!hasError && newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      // Actualizar image_url con la primera imagen (para compatibilidad)
      setForm({
        ...form,
        image_url: updatedImages[0]?.data || "",
      });
      if (files.length <= remainingSlots) {
        setMessage("");
      }
    }

    // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    // Actualizar image_url con la primera imagen restante o cadena vacía
    const firstImage = newImages.length > 0 && newImages[0] ? newImages[0].data : "";
    setForm({
      ...form,
      image_url: firstImage,
    });
  };

  /* Makes sure pet info is filled for pet name, owner name, species, and image url*/
  const formValidate = () => {
    let err: Error = {};
    if (!form.name) err.name = "El nombre es requerido";
    if (!form.owner_name) err.owner_name = "El dueño es requerido";
    if (!form.species) err.species = "La especie es requerida";
    if (images.length === 0) err.image_url = "Al menos una imagen es requerida";
    return err;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = formValidate();

    if (Object.keys(errs).length === 0) {
      // Asegurar que image_url tenga la primera imagen (siempre habrá al menos una por la validación)
      const firstImage = images.length > 0 && images[0] ? images[0].data : "";
      const formToSubmit: FormData = {
        ...form,
        image_url: firstImage,
      };
      forNewPet ? postData(formToSubmit) : putData(formToSubmit);
    } else {
      setErrors({ errs });
    }
  };

  return (
    <>
      <form id={formId} onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* Columna 1: Nombre a Dieta */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="name">Nombre</label>
          <input
            type="text"
            maxLength={20}
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />

          <label htmlFor="owner_name">Dueño</label>
          <input
            type="text"
            maxLength={20}
            name="owner_name"
            value={form.owner_name}
            onChange={handleChange}
            required
          />

          <label htmlFor="species">Especie</label>
          <input
            type="text"
            maxLength={30}
            name="species"
            value={form.species}
            onChange={handleChange}
            required
          />

          <label htmlFor="age">Edad</label>
          <input
            type="number"
            name="age"
            value={form.age}
            onChange={handleChange}
          />

          <label htmlFor="poddy_trained">Entrenado para ir al baño</label>
          <input
            type="checkbox"
            name="poddy_trained"
            checked={form.poddy_trained}
            onChange={handleChange}
          />

          <label htmlFor="diet">Dieta</label>
          <textarea
            name="diet"
            maxLength={60}
            value={form.diet}
            onChange={handleChange}
          />
        </div>

        {/* Columna 2: Imágenes, Gustos, Disgustos, Botón */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <label htmlFor="image">Imágenes</label>
          <div style={{ marginBottom: "1rem" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              multiple
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={handleAddImageClick}
              className="btn"
              disabled={images.length >= 4}
              style={{
                marginBottom: "1rem",
                backgroundColor: images.length >= 4 ? "#cccccc" : "#4CAF50",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "4px",
                cursor: images.length >= 4 ? "not-allowed" : "pointer",
                opacity: images.length >= 4 ? 0.6 : 1,
              }}
            >
              Agregar imagen {images.length >= 4 ? "(Máximo 4)" : ""}
            </button>

            {images.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "1rem 0 0 0",
                }}
              >
                {images.map((image, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginRight: "0.5rem",
                      }}
                      title={image.name}
                    >
                      {image.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        backgroundColor: "rgba(255, 0, 0, 0.8)",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        width: "30px",
                        height: "30px",
                        cursor: "pointer",
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                      title="Eliminar imagen"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label htmlFor="likes">Gustos</label>
          <textarea
            name="likes"
            maxLength={60}
            value={form.likes}
            onChange={handleChange}
          />

          <label htmlFor="dislikes">Disgustos</label>
          <textarea
            name="dislikes"
            maxLength={60}
            value={form.dislikes}
            onChange={handleChange}
          />

          <button type="submit" className="btn" style={{ marginTop: "auto" }}>
            Guardar
          </button>
        </div>
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

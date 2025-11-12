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
  image_url: string[]; // Cambiar a array
  images?: string[];
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
  const [previewImage, setPreviewImage] = useState<string | null>(null); // Estado para la imagen en preview
  // Array de imágenes con nombre y datos base64
  interface ImageData {
    name: string;
    data: string; // base64
  }
  const [images, setImages] = useState<ImageData[]>(() => {
    // Si hay imágenes guardadas, usarlas
    if (petForm.images && petForm.images.length > 0) {
      return petForm.images.map((img, index) => ({
        name: `Imagen ${index + 1}`,
        data: img,
      }));
    }
    // Si image_url es un array con imágenes, usarlas
    if (Array.isArray(petForm.image_url) && petForm.image_url.length > 0) {
      return petForm.image_url.map((img, index) => ({
        name: `Imagen ${index + 1}`,
        data: img,
      }));
    }
    // Si image_url es un string (compatibilidad hacia atrás), convertirlo a array
    if (petForm.image_url && typeof petForm.image_url === 'string') {
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
    // Asegurar que image_url siempre sea un array
    image_url: Array.isArray(petForm.image_url) 
      ? petForm.image_url 
      : (petForm.image_url && typeof petForm.image_url === 'string' 
          ? [petForm.image_url] 
          : []),
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
      console.log("Form.postData - Enviando form:", form);
      console.log("Form.postData - form.image_url:", form.image_url);
      console.log("Form.postData - form.images:", form.images);
      
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
        const errorData = await res.json().catch(() => ({}));
        console.error("Form.postData - Error response:", errorData);
        throw new Error(errorData.error || errorData.message || `Error ${res.status}`);
      }

      const { data } = await res.json();
      mutate("/api/pets", data, false); // Update the local data without a revalidation
      router.push("/");
    } catch (error: any) {
      console.error("Form.postData - Error completo:", error);
      setMessage(error?.message || "Error al agregar la mascota");
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
      // Actualizar image_url con todas las imágenes como array
      setForm({
        ...form,
        image_url: updatedImages.map(img => img.data),
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
    // Actualizar image_url con todas las imágenes restantes como array
    const remainingImages = newImages.map(img => img.data);
    setForm({
      ...form,
      image_url: remainingImages,
    });
  };

  /* Makes sure pet info is filled for pet name, owner name, species, and image url*/
  const formValidate = () => {
    let err: Error = {};
    if (!form.name) err.name = "El nombre es requerido";
    if (!form.owner_name) err.owner_name = "El dueño es requerido";
    if (!form.species) err.species = "La especie es requerida";
    // Validar que haya al menos una imagen (puede estar en images o en image_url)
    const hasImages = images.length > 0 || (Array.isArray(form.image_url) && form.image_url.length > 0);
    if (!hasImages) err.image_url = "Al menos una imagen es requerida";
    return err;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = formValidate();

    if (Object.keys(errs).length === 0) {
      // Guardar todas las imágenes en el array images
      const allImages = images.map((img) => img.data);
      // image_url también debe ser un array con todas las imágenes
      const formToSubmit: FormData = {
        ...form,
        image_url: allImages, // image_url es ahora un array
        images: allImages,
      };
      console.log("Form - Enviando imágenes:", allImages.length, allImages);
      console.log("Form - image_url (array):", allImages);
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
                      onClick={() => {
                        // Si la imagen ya está en preview, ocultarla; si no, mostrarla
                        if (previewImage === image.data) {
                          setPreviewImage(null);
                        } else {
                          setPreviewImage(image.data);
                        }
                      }}
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginRight: "0.5rem",
                        cursor: "pointer",
                        color: previewImage === image.data ? "#4CAF50" : "inherit",
                        fontWeight: previewImage === image.data ? "bold" : "normal",
                      }}
                      title={`Click para ${previewImage === image.data ? "ocultar" : "ver"} la imagen`}
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

          <div style={{ display: "flex", gap: "1rem", marginTop: "auto" }}>
            <button
              type="submit"
              className="btn btn-save"
              style={{
                flex: 1,
                color: "#28a745",
                border: "2px solid #28a745",
                backgroundColor: "transparent",
              }}
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn btn-cancel"
              style={{
                flex: 1,
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
      <p>{message}</p>
      <div>
        {Object.keys(errors).map((err, index) => (
          <li key={index}>{err}</li>
        ))}
      </div>
      
      {/* Modal para preview de imagen */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          <img
            src={previewImage}
            alt="Preview"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImage(null);
            }}
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
            }}
          />
        </div>
      )}
    </>
  );
};

export default Form;

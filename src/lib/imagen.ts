/**
 * Achica y comprime una foto en el navegador y la devuelve como data URL.
 * Así se guarda dentro del producto en Firestore, sin necesitar Firebase
 * Storage (que hoy exige el plan pago). Una foto queda en ~40–90 KB.
 */
export async function comprimirImagen(
  archivo: File,
  ladoMaximo = 900,
): Promise<string> {
  const bitmap = await createImageBitmap(archivo);
  let lado = ladoMaximo;
  let calidad = 0.78;

  for (let intento = 0; intento < 5; intento++) {
    const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("El navegador no permite procesar la imagen");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let url = canvas.toDataURL("image/webp", calidad);
    // Safari no codifica WebP: cae a PNG, que pesa mucho. Usamos JPEG.
    if (!url.startsWith("data:image/webp")) {
      url = canvas.toDataURL("image/jpeg", calidad);
    }
    if (url.length < 180_000) {
      bitmap.close();
      return url;
    }
    lado = Math.round(lado * 0.8);
    calidad -= 0.08;
  }
  bitmap.close();
  throw new Error("La foto es demasiado pesada, probá con otra");
}

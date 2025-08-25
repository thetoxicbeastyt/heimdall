export async function searchMedia(term: string, quality: string, provider: string) {
  const response = await fetch(
    `/api/media/search?term=${term}&quality=${quality}&provider=${provider}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.json();
}
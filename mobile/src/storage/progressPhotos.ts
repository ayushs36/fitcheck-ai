export type ProgressPhoto = {
  id: string;
  uri: string;
  createdAt: string;
};

type PhotoStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export const localProgressPhotoKey = "fitcheck-mobile:progress-photos:v1";

export function accountProgressPhotoKey(accountKey: string) {
  return `${accountKey}:progress-photos:v1`;
}

export async function loadProgressPhotos(storage: PhotoStorage, key: string): Promise<ProgressPhoto[]> {
  const raw = await storage.getItem(key);
  if (!raw) return [];
  try {
    const photos = JSON.parse(raw);
    return Array.isArray(photos) ? photos.filter((photo): photo is ProgressPhoto => Boolean(
      photo && typeof photo.id === "string" && typeof photo.uri === "string" && typeof photo.createdAt === "string",
    )) : [];
  } catch {
    return [];
  }
}

export async function saveProgressPhotos(storage: PhotoStorage, key: string, photos: ProgressPhoto[]) {
  await storage.setItem(key, JSON.stringify(photos.slice(0, 12)));
}

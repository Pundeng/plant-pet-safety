export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export interface ImageFileMetadata {
  type: string;
  size: number;
}

export function validateImage(file: ImageFileMetadata): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Please upload a JPEG or PNG image.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "This image is too large. Please upload an image under 5 MB.";
  }

  return null;
}

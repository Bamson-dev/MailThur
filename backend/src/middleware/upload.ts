import multer from "multer";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

/**
 * Reusable upload middleware with strict limits.
 * Import this wherever an upload route is built — never configure multer
 * ad-hoc on individual routes.
 *
 * Usage:
 *   router.post("/avatar", imageUpload.single("file"), avatarHandler);
 */
const storage = multer.memoryStorage();

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."));
    }
  },
});

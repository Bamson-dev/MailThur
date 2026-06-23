import multer from "multer";

const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_CSV_MIME_TYPES = new Set([
  "text/csv",
  "application/csv",
  "text/plain",
  "application/vnd.ms-excel",
]);

const storage = multer.memoryStorage();

export const csvUpload = multer({
  storage,
  limits: {
    fileSize: MAX_CSV_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (
      ALLOWED_CSV_MIME_TYPES.has(file.mimetype) ||
      file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV files are allowed."));
    }
  },
});

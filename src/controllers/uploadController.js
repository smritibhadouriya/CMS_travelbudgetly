// uploadController.js
export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  res.json({
    success: true,
    url: req.file.path, // Isme ab "/uploads/images/name.webp" jayega
    filename: req.file.filename
  });
};
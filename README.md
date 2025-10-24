# STUDIOGALLERY
STUDIOGALLERY is a responsive login page for an online art gallery. Built with HTML, CSS, and JavaScript, it features secure account access, form validation, and interactive elements like a password toggle, offering a clean and professional interface for artists, staff, and visitors.
# Personal Image Gallery (Front-end only)

This is a simple front-end-only personal image gallery that simulates user accounts and image uploads using localStorage. It's intended for local/personal use only (not production).

Features
- Register and log in (passwords are hashed client-side using SHA-256).
- Demo account: username `demo`, password `demo123`.
- Upload multiple images (JPG/PNG/GIF), stored as data URLs in localStorage, per-user.
- Gallery grid with thumbnails.
- Full-size modal viewer with Next/Prev and Delete.
- Export images as JSON (download).
- Logout and session handling with sessionStorage.

How to use
1. Place all files (index.html, styles.css, app.js, README.md) in the same folder.
2. Open `index.html` in a browser (Chrome, Firefox, Edge).
3. Log in with the demo account or register a new one.
4. Upload images using the "Upload images" button.
5. View images by clicking any thumbnail. Use the Delete button in the modal to remove an image.

Notes & limitations
- All storage is local to your browser using localStorage. Clearing site data or switching browsers/devices will lose stored accounts/images.
- This is not intended for production or multi-user remote use. It does not include server-side security or real authentication.
- Large images are stored as base64 data URLs — this can quickly use a lot of localStorage space. The app validates a maximum of 5 MB per image.
- For better performance on many/large images, consider adding client-side resizing or migrating to a backend.

Security
- Passwords are hashed client-side with SHA-256 before being saved to localStorage. This helps protect plain text passwords in localStorage, but client-side-only hashing is not a substitute for secure server-side authentication.
- Do not use this for sensitive data or real user accounts.

If you want improvements, I can:
- Add drag & drop uploading.
- Resize/compress images before storing to save space.
- Add import (restore) and more advanced export options.
- Combine everything into a single HTML file if you prefer one file.

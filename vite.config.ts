import { defineConfig } from "vite";
import { resolve } from "path";

// Multi-page configuration so that the various static HTML files under
// src/pages are copied and their associated scripts/styles are built. This
// makes the production build behave more like the dev server (which serves
// those files directly).
//
// The `input` object lists each page we want to treat as an entrypoint. We
// include the root index.html plus every page under src/pages that has an
// index.html file. Vite will then output corresponding HTML/asset files in
// dist (e.g. dist/pages/login/index.html). Links in the app must use the
// same paths.

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        login: resolve(__dirname, "src/pages/login/index.html"),
        register: resolve(__dirname, "src/pages/register/index.html"),
        "forgot-password": resolve(
          __dirname,
          "src/pages/forgot-password/index.html",
        ),
        "contact-us": resolve(__dirname, "src/pages/contact-us/index.html"),
        about: resolve(__dirname, "src/pages/about/index.html"),
        chat: resolve(__dirname, "src/pages/chat/index.html"),
      },
    },
  },
});

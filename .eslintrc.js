module.exports = {
  // ... other configurations
  overrides: [
    {
      files: ["*.worker.js"],
      env: {
        worker: true,
      },
      globals: {
        importScripts: "readonly",
      },
    },
  ],
};

import "dotenv/config";

import { createApp } from "./app";

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
const app = createApp();

const server = app.listen(port, () => {
  console.log(`OIO mock API listening on http://localhost:${port}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the existing mock-api process or restart with API_PORT=${port + 1}.`
    );
    process.exit(1);
  }

  throw error;
});

import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import dotenv from "dotenv";
import routes from "./routes.js";
import multipart from "@fastify/multipart";

dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_URL,
});
await app.register(sensible);
await app.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

app.register(routes);

const port = Number(process.env.PORT);
await app.listen({ port, host: "0.0.0.0" });
console.log(`Backend running on http://localhost:${port}`);

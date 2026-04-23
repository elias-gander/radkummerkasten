import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import issueRoutes from "./routes/issues.js";
import commentRoutes from "./routes/comments.js";
import verifyRoutes from "./routes/verify.js";
import uploadRoutes from "./routes/upload.js";

dotenv.config();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
});

app.register(issueRoutes);
app.register(commentRoutes);
app.register(verifyRoutes);
app.register(uploadRoutes);

const port = Number(process.env.PORT || 4000);
await app.listen({ port, host: "0.0.0.0" });
console.log(`Backend running on http://localhost:${port}`);

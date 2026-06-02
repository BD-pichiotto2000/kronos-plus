import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routes";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, app: "KRONOS+", ts: new Date() }));

app.use("/api", router);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

app.listen(PORT, () => {
  console.log(`KRONOS+ Backend corriendo en http://localhost:${PORT}`);
});

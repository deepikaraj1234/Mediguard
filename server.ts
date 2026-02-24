import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("healthcare.db");
const JWT_SECRET = process.env.JWT_SECRET || "mediguard-super-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'patient',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER,
    doctor_name TEXT,
    specialty TEXT,
    date TEXT,
    time TEXT,
    status TEXT DEFAULT 'scheduled',
    FOREIGN KEY(patient_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    dosage TEXT,
    frequency TEXT,
    time TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT,
    value TEXT,
    unit TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
      const info = stmt.run(name, email, hashedPassword, role || 'patient');
      res.status(201).json({ id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // --- Appointment Routes ---
  app.get("/api/appointments", authenticateToken, (req: any, res) => {
    const appointments = db.prepare("SELECT * FROM appointments WHERE patient_id = ?").all(req.user.id);
    res.json(appointments);
  });

  app.post("/api/appointments", authenticateToken, (req: any, res) => {
    const { doctor_name, specialty, date, time } = req.body;
    const stmt = db.prepare("INSERT INTO appointments (patient_id, doctor_name, specialty, date, time) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(req.user.id, doctor_name, specialty, date, time);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  // --- Medication Routes ---
  app.get("/api/medications", authenticateToken, (req: any, res) => {
    const meds = db.prepare("SELECT * FROM medications WHERE user_id = ?").all(req.user.id);
    res.json(meds);
  });

  app.post("/api/medications", authenticateToken, (req: any, res) => {
    const { name, dosage, frequency, time } = req.body;
    const stmt = db.prepare("INSERT INTO medications (user_id, name, dosage, frequency, time) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(req.user.id, name, dosage, frequency, time);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  // --- Admin Routes ---
  app.get("/api/admin/stats", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
    const appointmentCount = db.prepare("SELECT COUNT(*) as count FROM appointments").get();
    res.json({ users: userCount, appointments: appointmentCount });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

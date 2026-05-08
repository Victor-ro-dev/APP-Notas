const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "notes.json");

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Helpers ──────────────────────────────────────────────────────────────────
function readNotes() {
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

function writeNotes(notes) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), "utf-8");
}

// ─── Rotas ────────────────────────────────────────────────────────────────────

// GET /api/notes — lista todas as notas
app.get("/api/notes", (req, res) => {
  const notes = readNotes();
  res.json(notes);
});

// GET /api/notes/:id — retorna uma nota pelo id
app.get("/api/notes/:id", (req, res) => {
  const notes = readNotes();
  const note = notes.find((n) => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: "Nota não encontrada." });
  res.json(note);
});

// POST /api/notes — cria uma nova nota
app.post("/api/notes", (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res
      .status(400)
      .json({ error: "Os campos title e content são obrigatórios." });
  }

  const notes = readNotes();
  const newNote = {
    id: crypto.randomUUID(),
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  notes.push(newNote);
  writeNotes(notes);
  res.status(201).json(newNote);
});

// PUT /api/notes/:id — edita uma nota existente
app.put("/api/notes/:id", (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res
      .status(400)
      .json({ error: "Os campos title e content são obrigatórios." });
  }

  const notes = readNotes();
  const index = notes.findIndex((n) => n.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Nota não encontrada." });

  notes[index] = {
    ...notes[index],
    title: title.trim(),
    content: content.trim(),
    updatedAt: new Date().toISOString(),
  };

  writeNotes(notes);
  res.json(notes[index]);
});

// DELETE /api/notes/:id — deleta uma nota
app.delete("/api/notes/:id", (req, res) => {
  const notes = readNotes();
  const index = notes.findIndex((n) => n.id === req.params.id);
  if (index === -1)
    return res.status(404).json({ error: "Nota não encontrada." });

  const deleted = notes.splice(index, 1)[0];
  writeNotes(notes);
  res.json(deleted);
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

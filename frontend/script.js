// ─── Configuração ─────────────────────────────────────────────────────────────
// Após o deploy no Render, substitua a URL abaixo pela URL real do seu serviço.
// Ex.: const API_URL = 'https://notes-api-xxxx.onrender.com/api/notes';
const API_URL = "https://app-notas-3vl7.onrender.com/api/notes";

// ─── Referências DOM ──────────────────────────────────────────────────────────
const noteForm = document.getElementById("note-form");
const noteIdInput = document.getElementById("note-id");
const titleInput = document.getElementById("note-title");
const contentInput = document.getElementById("note-content");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const formTitle = document.getElementById("form-title");
const formError = document.getElementById("form-error");
const notesList = document.getElementById("notes-list");
const notesCount = document.getElementById("notes-count");
const emptyMsg = document.getElementById("empty-msg");

// ─── Utilitários ──────────────────────────────────────────────────────────────
function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
}

function clearError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function resetForm() {
  noteForm.reset();
  noteIdInput.value = "";
  formTitle.textContent = "Nova Nota";
  submitBtn.textContent = "Salvar";
  cancelBtn.classList.add("hidden");
  clearError();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Renderização ─────────────────────────────────────────────────────────────
function renderNotes(notes) {
  notesList.innerHTML = "";
  notesCount.textContent = notes.length;

  if (notes.length === 0) {
    emptyMsg.classList.remove("hidden");
    return;
  }

  emptyMsg.classList.add("hidden");

  notes.forEach((note) => {
    const li = document.createElement("li");
    li.className = "note-item";
    li.dataset.id = note.id;

    li.innerHTML = `
      <span class="note-title">${escapeHtml(note.title)}</span>
      <p class="note-content">${escapeHtml(note.content)}</p>
      <span class="note-meta">
        Criada em ${formatDate(note.createdAt)}
        ${note.updatedAt !== note.createdAt ? " · Editada em " + formatDate(note.updatedAt) : ""}
      </span>
      <div class="note-actions">
        <button class="btn-edit" data-id="${note.id}">✏️ Editar</button>
        <button class="btn-delete" data-id="${note.id}">🗑️ Excluir</button>
      </div>
    `;

    notesList.appendChild(li);
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── API calls ────────────────────────────────────────────────────────────────
async function loadNotes() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Erro ao carregar notas.");
    const notes = await res.json();
    renderNotes(notes);
  } catch (err) {
    showError(err.message);
  }
}

async function createNote(title, content) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Erro ao criar nota.");
  }

  return res.json();
}

async function updateNote(id, title, content) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Erro ao atualizar nota.");
  }

  return res.json();
}

async function deleteNote(id) {
  const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Erro ao excluir nota.");
  }

  return res.json();
}

// ─── Carregar nota no formulário de edição ────────────────────────────────────
async function startEdit(id) {
  try {
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Nota não encontrada.");
    const note = await res.json();

    noteIdInput.value = note.id;
    titleInput.value = note.title;
    contentInput.value = note.content;
    formTitle.textContent = "Editar Nota";
    submitBtn.textContent = "Atualizar";
    cancelBtn.classList.remove("hidden");
    clearError();
    titleInput.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    showError(err.message);
  }
}

// ─── Eventos ──────────────────────────────────────────────────────────────────
noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const id = noteIdInput.value.trim();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  try {
    if (id) {
      await updateNote(id, title, content);
    } else {
      await createNote(title, content);
    }
    resetForm();
    await loadNotes();
  } catch (err) {
    showError(err.message);
  }
});

cancelBtn.addEventListener("click", () => {
  resetForm();
});

notesList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains("btn-edit")) {
    await startEdit(id);
  }

  if (btn.classList.contains("btn-delete")) {
    if (!confirm("Tem certeza que deseja excluir esta nota?")) return;
    try {
      await deleteNote(id);
      await loadNotes();
    } catch (err) {
      showError(err.message);
    }
  }
});

// ─── Inicialização ────────────────────────────────────────────────────────────
loadNotes();

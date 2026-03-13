import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "job-tracker-v2";

const STATUSES = [
  { id: "active", label: "En cours", color: "#2563eb", bg: "#eff6ff" },
  { id: "interview", label: "Entretien prévu", color: "#7c3aed", bg: "#f5f3ff" },
  { id: "waiting", label: "En attente", color: "#d97706", bg: "#fffbeb" },
  { id: "offer", label: "Offre reçue", color: "#059669", bg: "#ecfdf5" },
  { id: "declined", label: "Décliné", color: "#94a3b8", bg: "#f8fafc" },
  { id: "rejected", label: "Refusé", color: "#ef4444", bg: "#fef2f2" },
];

const PRIORITIES = [
  { id: "high", label: "Haute", color: "#ef4444" },
  { id: "medium", label: "Moyenne", color: "#f59e0b" },
  { id: "low", label: "Basse", color: "#94a3b8" },
];

const TYPES = ["ESN / Consulting", "Réseau / Recommandation", "Candidature directe", "Internalisation", "Autre"];

const DEFAULT_DATA = [
  {
    id: "1",
    company: "Athoria",
    type: "ESN / Consulting",
    status: "interview",
    priority: "high",
    contact: "Camille (recruiter), Thomas (CTO)",
    salary: "Haut de 2e bande",
    nextStep: "Entretien technique avec Thomas (CTO)",
    nextDate: "2026-03-23",
    notes: "Paris, IT & AI consulting. Phone screen Axelle OK. Entretien Camille OK. Technique CTO Thomas le 23/03 à 17h via Teams. Références pro demandées après technique.",
    createdAt: Date.now(),
  },
  {
    id: "2",
    company: "WeFiiT",
    type: "ESN / Consulting",
    status: "interview",
    priority: "high",
    contact: "Antoine (sales QA), Pablo",
    salary: "Associate 35-43k (zone de souplesse)",
    nextStep: 'Entretien "Se mettre en conditions réelles" avec Antoine',
    nextDate: "2026-03-18",
    notes: "Product Management / QA consulting. Approfondir avec Pablo OK. Entretien Antoine le 18/03 en présentiel. Dossier compétences rédigé (texte), à formater.",
    createdAt: Date.now(),
  },
  {
    id: "3",
    company: "Piste Nabil / CEO",
    type: "Réseau / Recommandation",
    status: "active",
    priority: "high",
    contact: "Nabil (ancien CTO Carrefour), Isabelle",
    salary: "À déterminer",
    nextStep: "Discussion détaillée Nabil ↔ CEO",
    nextDate: "2026-03-18",
    notes: "Placement via réseau Nabil. CEO intéressé par le profil. Discussion détaillée prévue mardi 18/03. RDV présentiel Paris (bureau Nabil) entre Isabelle, Nabil et ZhengKun un vendredi. Perspective long terme : structure QA d'Isabelle.",
    createdAt: Date.now(),
  },
  {
    id: "4",
    company: "Synchrone",
    type: "ESN / Consulting",
    status: "active",
    priority: "low",
    contact: "",
    salary: "À déterminer",
    nextStep: "Garder actif, priorité secondaire",
    nextDate: "",
    notes: "ESN secondaire, maintenir contact sans investir trop d'énergie.",
    createdAt: Date.now(),
  },
];

const emptyForm = {
  company: "", type: TYPES[0], status: "active", priority: "medium",
  contact: "", salary: "", nextStep: "", nextDate: "", notes: "",
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function App() {
  const [entries, setEntries] = useState(() => loadData() || DEFAULT_DATA);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [expandedId, setExpandedId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { saveData(entries); }, [entries]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const openAdd = () => { setForm({ ...emptyForm }); setEditing(null); setShowForm(true); };
  const openEdit = (entry) => { setForm({ ...entry }); setEditing(entry.id); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm({ ...emptyForm }); };

  const handleSave = () => {
    if (!form.company.trim()) return;
    if (editing) {
      setEntries(prev => prev.map(e => e.id === editing ? { ...form, id: editing, createdAt: e.createdAt } : e));
      showToast("Piste mise à jour");
    } else {
      const newEntry = { ...form, id: Date.now().toString(), createdAt: Date.now() };
      setEntries(prev => [newEntry, ...prev]);
      showToast("Piste ajoutée");
    }
    closeForm();
  };

  const handleDelete = (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    showToast("Piste supprimée");
    if (expandedId === id) setExpandedId(null);
  };

  const handleReset = () => {
    setEntries(DEFAULT_DATA);
    showToast("Données réinitialisées");
    setExpandedId(null);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "candidatures-backup.json"; a.click();
    URL.revokeObjectURL(url);
    showToast("Export téléchargé");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (Array.isArray(data)) { setEntries(data); showToast("Import réussi"); }
        } catch { showToast("Fichier invalide"); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const getStatus = (id) => STATUSES.find(s => s.id === id) || STATUSES[0];
  const getPriority = (id) => PRIORITIES.find(p => p.id === id) || PRIORITIES[1];

  const filtered = entries.filter(e => filter === "all" || e.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "priority") {
      const order = { high: 0, medium: 1, low: 2 };
      return (order[a.priority] ?? 1) - (order[b.priority] ?? 1);
    }
    if (sortBy === "date") {
      if (!a.nextDate && !b.nextDate) return 0;
      if (!a.nextDate) return 1;
      if (!b.nextDate) return -1;
      return new Date(a.nextDate) - new Date(b.nextDate);
    }
    return a.company.localeCompare(b.company);
  });

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  };

  const isUpcoming = (d) => {
    if (!d) return false;
    const diff = (new Date(d + "T00:00:00") - new Date()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  const interviewCount = entries.filter(e => e.status === "interview").length;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Suivi Candidatures</h1>
          <p style={styles.subtitle}>
            {entries.length} piste{entries.length > 1 ? "s" : ""} · {interviewCount} entretien{interviewCount > 1 ? "s" : ""} prévu{interviewCount > 1 ? "s" : ""}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button style={styles.iconBtn} onClick={handleImport} title="Importer">📥</button>
          <button style={styles.iconBtn} onClick={handleExport} title="Exporter">📤</button>
          <button style={styles.resetBtn} onClick={handleReset}>↺ Reset</button>
          <button style={styles.addBtn} onClick={openAdd}>+ Nouvelle piste</button>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filtersRow}>
        <div style={styles.filterGroup}>
          {[{ id: "all", label: "Toutes" }, ...STATUSES].map(s => (
            <button key={s.id} onClick={() => setFilter(s.id)}
              style={{
                ...styles.filterChip,
                background: filter === s.id ? (s.color || "#0f172a") : "transparent",
                color: filter === s.id ? "#fff" : "#64748b",
                borderColor: filter === s.id ? "transparent" : "#e2e8f0",
              }}>
              {s.label}
            </button>
          ))}
        </div>
        <select style={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="priority">Tri : Priorité</option>
          <option value="date">Tri : Prochaine date</option>
          <option value="name">Tri : Nom</option>
        </select>
      </div>

      {/* Cards */}
      <div style={styles.cardList}>
        {sorted.length === 0 && (
          <div style={styles.emptyState}>
            <p style={{ fontSize: 18, color: "#94a3b8" }}>Aucune piste pour ce filtre</p>
          </div>
        )}
        {sorted.map((entry) => {
          const status = getStatus(entry.status);
          const priority = getPriority(entry.priority);
          const expanded = expandedId === entry.id;
          const upcoming = isUpcoming(entry.nextDate);
          return (
            <div key={entry.id}
              style={{ ...styles.card, borderLeft: `4px solid ${status.color}` }}
              onClick={() => setExpandedId(expanded ? null : entry.id)}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleRow}>
                  <h3 style={styles.cardCompany}>{entry.company}</h3>
                  <div style={styles.badges}>
                    <span style={{ ...styles.badge, background: status.bg, color: status.color }}>{status.label}</span>
                    <span style={{ ...styles.priorityDot, background: priority.color }} title={priority.label} />
                  </div>
                </div>
                <div style={styles.cardMeta}>
                  <span style={styles.metaTag}>{entry.type}</span>
                  {entry.salary && <span style={styles.metaTag}>💰 {entry.salary}</span>}
                </div>
              </div>

              {entry.nextStep && (
                <div style={{ ...styles.nextStep, background: upcoming ? "#fef3c7" : "#f8fafc" }}>
                  <span style={styles.nextStepLabel}>{upcoming ? "⏰" : "→"} {entry.nextStep}</span>
                  {entry.nextDate && (
                    <span style={{
                      ...styles.nextDate,
                      color: upcoming ? "#b45309" : "#64748b",
                      fontWeight: upcoming ? 700 : 500
                    }}>
                      {formatDate(entry.nextDate)}
                    </span>
                  )}
                </div>
              )}

              {expanded && (
                <div style={styles.expandedSection} onClick={e => e.stopPropagation()}>
                  {entry.contact && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Contacts</span>
                      <span style={styles.detailValue}>{entry.contact}</span>
                    </div>
                  )}
                  {entry.notes && (
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Notes</span>
                      <span style={styles.detailValue}>{entry.notes}</span>
                    </div>
                  )}
                  <div style={styles.cardActions}>
                    <button style={styles.editBtn} onClick={(e) => { e.stopPropagation(); openEdit(entry); }}>✏️ Modifier</button>
                    <button style={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}>🗑 Supprimer</button>
                  </div>
                </div>
              )}

              {!expanded && <p style={styles.expandHint}>Cliquer pour détails</p>}
            </div>
          );
        })}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div style={styles.overlay} onClick={closeForm}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editing ? "Modifier la piste" : "Nouvelle piste"}</h2>
              <button style={styles.closeBtn} onClick={closeForm}>✕</button>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Entreprise *</label>
                <input style={styles.input} value={form.company}
                  onChange={e => setForm({ ...form, company: e.target.value })}
                  placeholder="Nom de l'entreprise" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Type</label>
                <select style={styles.input} value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Statut</label>
                <select style={styles.input} value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Priorité</label>
                <select style={styles.input} value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Salaire</label>
                <input style={styles.input} value={form.salary}
                  onChange={e => setForm({ ...form, salary: e.target.value })}
                  placeholder="Ex: 38-42k" />
              </div>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Contacts</label>
                <input style={styles.input} value={form.contact}
                  onChange={e => setForm({ ...form, contact: e.target.value })}
                  placeholder="Noms et rôles" />
              </div>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Prochaine étape</label>
                <input style={styles.input} value={form.nextStep}
                  onChange={e => setForm({ ...form, nextStep: e.target.value })}
                  placeholder="Ex: Entretien technique" />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Date prochaine étape</label>
                <input style={styles.input} type="date" value={form.nextDate}
                  onChange={e => setForm({ ...form, nextDate: e.target.value })} />
              </div>
              <div style={{ ...styles.fieldFull, marginBottom: 0 }}>
                <label style={styles.label}>Notes</label>
                <textarea style={{ ...styles.input, minHeight: 80, resize: "vertical" }}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Détails, historique, remarques…" />
              </div>
            </div>
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={closeForm}>Annuler</button>
              <button style={styles.saveBtn} onClick={handleSave}>
                {editing ? "Enregistrer" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
}

const fontFamily = "'Outfit', sans-serif";

const styles = {
  container: {
    fontFamily, maxWidth: 720, margin: "0 auto", padding: "32px 16px", minHeight: "100vh",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    marginBottom: 24, flexWrap: "wrap", gap: 12,
  },
  title: { fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" },
  subtitle: { fontSize: 14, color: "#64748b", marginTop: 4, fontWeight: 500 },
  headerActions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  addBtn: {
    background: "#0f172a", color: "#fff", border: "none", borderRadius: 10,
    padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily,
    whiteSpace: "nowrap",
  },
  resetBtn: {
    background: "transparent", color: "#94a3b8", border: "1px solid #e2e8f0", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily,
  },
  iconBtn: {
    background: "transparent", border: "1px solid #e2e8f0", borderRadius: 10,
    padding: "8px 12px", fontSize: 16, cursor: "pointer", lineHeight: 1,
  },
  filtersRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20, flexWrap: "wrap", gap: 10,
  },
  filterGroup: { display: "flex", gap: 6, flexWrap: "wrap" },
  filterChip: {
    border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "5px 14px",
    fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily, transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  sortSelect: {
    border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "6px 12px",
    fontSize: 12, fontWeight: 600, fontFamily, color: "#475569", background: "#fff", cursor: "pointer",
  },
  cardList: { display: "flex", flexDirection: "column", gap: 12 },
  card: {
    background: "#fff", borderRadius: 14, padding: "18px 20px",
    border: "1px solid #e8ecf1", cursor: "pointer", transition: "all 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  },
  cardHeader: { marginBottom: 10 },
  cardTitleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardCompany: { fontSize: 18, fontWeight: 750, color: "#0f172a", margin: 0 },
  badges: { display: "flex", alignItems: "center", gap: 8 },
  badge: { fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: "0.2px" },
  priorityDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  cardMeta: { display: "flex", gap: 10, flexWrap: "wrap" },
  metaTag: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  nextStep: {
    borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between",
    alignItems: "center", gap: 10, flexWrap: "wrap",
  },
  nextStepLabel: { fontSize: 13, fontWeight: 600, color: "#334155" },
  nextDate: { fontSize: 12, whiteSpace: "nowrap" },
  expandHint: { fontSize: 11, color: "#cbd5e1", marginTop: 6, marginBottom: 0, textAlign: "center", fontStyle: "italic" },
  expandedSection: { marginTop: 14, paddingTop: 14, borderTop: "1px solid #f1f5f9" },
  detailRow: { marginBottom: 10 },
  detailLabel: {
    fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase",
    letterSpacing: "0.5px", display: "block", marginBottom: 2,
  },
  detailValue: { fontSize: 13, color: "#334155", lineHeight: 1.5 },
  cardActions: { display: "flex", gap: 8, marginTop: 14 },
  editBtn: {
    background: "#f1f5f9", border: "none", borderRadius: 8, padding: "7px 16px",
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily, color: "#334155",
  },
  deleteBtn: {
    background: "#fef2f2", border: "none", borderRadius: 8, padding: "7px 16px",
    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily, color: "#ef4444",
  },
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 18, padding: "28px 28px 20px",
    width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto",
    boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: "#0f172a", margin: 0 },
  closeBtn: { background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", padding: 4 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px" },
  field: { display: "flex", flexDirection: "column" },
  fieldFull: { display: "flex", flexDirection: "column", gridColumn: "1 / -1" },
  label: {
    fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase",
    letterSpacing: "0.5px", marginBottom: 5,
  },
  input: {
    border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "10px 14px",
    fontSize: 14, fontFamily, color: "#0f172a", outline: "none",
    transition: "border-color 0.2s", width: "100%", boxSizing: "border-box",
  },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 },
  cancelBtn: {
    background: "#f1f5f9", border: "none", borderRadius: 10, padding: "10px 24px",
    fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily, color: "#64748b",
  },
  saveBtn: {
    background: "#0f172a", color: "#fff", border: "none", borderRadius: 10,
    padding: "10px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily,
  },
  emptyState: { textAlign: "center", padding: 40 },
  toast: {
    position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
    background: "#0f172a", color: "#fff", padding: "10px 24px", borderRadius: 12,
    fontSize: 14, fontWeight: 600, fontFamily, zIndex: 2000,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)", animation: "fadeIn 0.3s ease",
  },
};

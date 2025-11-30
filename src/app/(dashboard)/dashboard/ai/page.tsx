// src/app/(dashboard)/dashboard/ai/page.tsx
"use client";

import React from "react";
import Link from "next/link";

type ToolType = "PROPOSAL" | "SCOPE" | "FOLLOW_UP";

type DocumentItem = {
  id: string;
  type: string;
  title: string;
  content: string;
  createdAt: string;
};

/// Template item type for Stage 3
type TemplateItem = {
  id: string;
  type: string;
  name: string;
  body: string;
  createdAt: string;
};

type SidebarTab = "TEMPLATES" | "HISTORY";

export default function AICopilotPage() {
  const [activeTool, setActiveTool] = React.useState<ToolType>("PROPOSAL");

  // Form fields
  const [clientName, setClientName] = React.useState("");
  const [industry, setIndustry] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [timeline, setTimeline] = React.useState("");
  const [projectSummary, setProjectSummary] = React.useState("");
  const [lastEmail, setLastEmail] = React.useState("");
  const [tone, setTone] = React.useState("friendly");

  // Generation + saving
  const [loading, setLoading] = React.useState(false);
  const [responseBox, setResponseBox] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);

  // Editing existing doc
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // History
  const [docsLoading, setDocsLoading] = React.useState(false);
  const [documents, setDocuments] = React.useState<DocumentItem[]>([]);

  /// Templates state for Stage 3
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const [templates, setTemplates] = React.useState<TemplateItem[]>([]);
  const [templateName, setTemplateName] = React.useState("");
  const [templateBody, setTemplateBody] = React.useState("");
  const [templateType, setTemplateType] =
    React.useState<ToolType>("PROPOSAL");
  const [templateSaving, setTemplateSaving] = React.useState(false);
  const [editingTemplateId, setEditingTemplateId] =
    React.useState<string | null>(null);

  /// Currently selected template applied to generation
  const [selectedTemplateName, setSelectedTemplateName] =
    React.useState<string | null>(null);
  const [selectedTemplateBody, setSelectedTemplateBody] =
    React.useState<string | null>(null);

  /// Sidebar tab: Templates vs History
  const [sidebarTab, setSidebarTab] =
    React.useState<SidebarTab>("TEMPLATES");

  React.useEffect(() => {
    fetchDocuments();
    fetchTemplates();
  }, []);

  async function fetchDocuments() {
    try {
      setDocsLoading(true);
      const res = await fetch("/api/documents", {
        method: "GET",
      });

      if (!res.ok) return;

      const data = await res.json();
      setDocuments(data.documents ?? []);
    } catch {
      // swallow for now
    } finally {
      setDocsLoading(false);
    }
  }

  /// Fetch templates for current org
  async function fetchTemplates() {
    try {
      setTemplatesLoading(true);
      const res = await fetch("/api/templates", {
        method: "GET",
      });

      if (!res.ok) return;

      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      // swallow for now
    } finally {
      setTemplatesLoading(false);
    }
  }

  function buildPrompt(): string {
    /// If a template is selected, prepend it to the prompt
    const templateIntro =
      selectedTemplateBody && selectedTemplateName
        ? `You are given a reusable template called "${selectedTemplateName}". Use its style and structure as a base.\n\nTemplate:\n${selectedTemplateBody}\n\n`
        : selectedTemplateBody
        ? `Use this template as the base style and structure:\n${selectedTemplateBody}\n\n`
        : "";

    if (activeTool === "PROPOSAL") {
      return (
        templateIntro +
        [
          "You are an AI assistant that writes client proposals for a SaaS / web project.",
          `Client name: ${clientName || "Unknown client"}.`,
          `Industry: ${industry || "Not specified"}.`,
          `Budget: ${budget || "Not specified"}.`,
          `Timeline: ${timeline || "Not specified"}.`,
          `Project summary: ${projectSummary || "Not specified"}.`,
          "",
          "Write a concise, persuasive proposal with sections: Overview, Deliverables, Timeline, Investment, Next Steps.",
        ].join(" ")
      );
    }

    if (activeTool === "SCOPE") {
      return (
        templateIntro +
        [
          "You are an AI assistant that writes project scopes for web / SaaS builds.",
          `Client name: ${clientName || "Unknown client"}.`,
          `Industry: ${industry || "Not specified"}.`,
          `Project summary: ${projectSummary || "Not specified"}.`,
          "",
          "Write a clear scope of work with sections: Objectives, Features, Tech Stack, Milestones, Assumptions.",
        ].join(" ")
      );
    }

    // FOLLOW_UP
    return (
      templateIntro +
      [
        "You are an AI assistant that writes follow-up emails for clients.",
        `Client name: ${clientName || "Unknown client"}.`,
        `Last email from client: ${lastEmail || "Not provided"}.`,
        `Tone: ${tone || "friendly"}.`,
        "",
        "Write a short follow-up email with a clear call to action.",
      ].join(" ")
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setResponseBox("");
    const prompt = buildPrompt();

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt, toolType: activeTool }),
      });

      if (res.status === 402) {
        setResponseBox(
          "Free quota reached. Upgrade to PRO for unlimited generations.\nGo to Pricing → 'Upgrade to PRO'."
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setResponseBox("Error generating. Try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResponseBox(data.output || "(no output)");

      // Default title suggestion
      if (!title) {
        const defaultTitle =
          activeTool === "PROPOSAL"
            ? `Proposal for ${clientName || "client"}`
            : activeTool === "SCOPE"
            ? `Scope for ${clientName || "client"}`
            : `Follow-up to ${clientName || "client"}`;
        setTitle(defaultTitle);
      }
    } catch {
      setResponseBox("Network error / fetch failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOrUpdate() {
    if (!responseBox.trim()) return;

    setSaving(true);
    try {
      // If editingId exists → update existing document
      if (editingId) {
        const res = await fetch(`/api/documents/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: title || "(Untitled)",
            content: responseBox,
            type: activeTool,
          }),
        });

        if (!res.ok) {
          alert("Failed to update document.");
          return;
        }

        const data = await res.json();
        if (data.document) {
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === editingId ? { ...doc, ...data.document } : doc
            )
          );
        }

        // Clear editing mode after successful update
        setEditingId(null);
      } else {
        // Otherwise create a new document
        const res = await fetch("/api/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: activeTool,
            title: title || "(Untitled)",
            content: responseBox,
          }),
        });

        if (!res.ok) {
          alert("Failed to save document.");
          return;
        }

        const data = await res.json();
        if (data.document) {
          setDocuments((prev) => [data.document, ...prev]);
        }
      }
    } catch {
      alert("Network error while saving.");
    } finally {
      setSaving(false);
    }
  }

  function handleLoadDocument(doc: DocumentItem) {
    setEditingId(doc.id);
    setTitle(doc.title);
    setResponseBox(doc.content);
    setActiveTool(doc.type as ToolType);
  }

  async function handleDeleteDocument(id: string) {
    const ok = window.confirm("Delete this document? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete document.");
        return;
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));

      if (editingId === id) {
        setEditingId(null);
      }
    } catch {
      alert("Network error while deleting.");
    }
  }

  /// Save or update a template
  async function handleSaveTemplate() {
    if (!templateName.trim() || !templateBody.trim()) {
      alert("Template name and body are required.");
      return;
    }

    setTemplateSaving(true);
    try {
      if (editingTemplateId) {
        const res = await fetch(`/api/templates/${editingTemplateId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: templateName,
            type: templateType,
            body: templateBody,
          }),
        });

        if (!res.ok) {
          alert("Failed to update template.");
          return;
        }

        const data = await res.json();
        if (data.template) {
          setTemplates((prev) =>
            prev.map((tpl) =>
              tpl.id === editingTemplateId ? { ...tpl, ...data.template } : tpl
            )
          );
        }

        setEditingTemplateId(null);
      } else {
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: templateName,
            type: templateType,
            body: templateBody,
          }),
        });

        if (!res.ok) {
          alert("Failed to create template.");
          return;
        }

        const data = await res.json();
        if (data.template) {
          setTemplates((prev) => [data.template, ...prev]);
        }
      }

      /// Clear form after save
      setTemplateName("");
      setTemplateBody("");
      setTemplateType("PROPOSAL");
    } catch {
      alert("Network error while saving template.");
    } finally {
      setTemplateSaving(false);
    }
  }

  /// Load a template into the form for editing
  function handleEditTemplate(tpl: TemplateItem) {
    setEditingTemplateId(tpl.id);
    setTemplateName(tpl.name);
    setTemplateBody(tpl.body);
    setTemplateType(tpl.type as ToolType);
    setSidebarTab("TEMPLATES");
  }

  /// Delete a template
  async function handleDeleteTemplate(id: string) {
    const ok = window.confirm("Delete this template? This cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete template.");
        return;
      }

      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));

      if (editingTemplateId === id) {
        setEditingTemplateId(null);
        setTemplateName("");
        setTemplateBody("");
        setTemplateType("PROPOSAL");
      }
    } catch {
      alert("Network error while deleting template.");
    }
  }

  /// Apply a template to the current generation context
  function handleUseTemplate(tpl: TemplateItem) {
    setActiveTool(tpl.type as ToolType);
    setTemplateType(tpl.type as ToolType);
    setSelectedTemplateName(tpl.name);
    setSelectedTemplateBody(tpl.body);
  }

  function handleClearSelectedTemplate() {
    setSelectedTemplateName(null);
    setSelectedTemplateBody(null);
  }

  function toolLabel(tool: ToolType) {
    if (tool === "PROPOSAL") return "Client Proposal";
    if (tool === "SCOPE") return "Project Scope";
    return "Follow-up Email";
  }

  // ✅ Render the form fields depending on activeTool
  function renderToolForm(): React.ReactNode {
    if (activeTool === "PROPOSAL") {
      return (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-300">Client name</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. ACME Corp"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-300">Industry</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. E-commerce, SaaS, Finance"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-300">Budget</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. $5k–$15k"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-300">Timeline</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="e.g. 6–8 weeks"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Project summary</label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
              rows={4}
              value={projectSummary}
              onChange={(e) => setProjectSummary(e.target.value)}
              placeholder="What is this project about? Goals, key features, and constraints."
            />
          </div>
        </div>
      );
    }

    if (activeTool === "SCOPE") {
      return (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-300">Client name</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="e.g. ACME Corp"
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-slate-300">Industry</label>
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. E-commerce, SaaS, Finance"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-300">Project summary</label>
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
              rows={4}
              value={projectSummary}
              onChange={(e) => setProjectSummary(e.target.value)}
              placeholder="Describe what needs to be built so the scope can be detailed."
            />
          </div>
        </div>
      );
    }

    // FOLLOW_UP
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs text-slate-300">Client name</label>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g. ACME Corp"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">
            Last email from client
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
            rows={4}
            value={lastEmail}
            onChange={(e) => setLastEmail(e.target.value)}
            placeholder="Paste or summarise the last message they sent."
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-300">Tone</label>
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
          >
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="casual">Casual</option>
            <option value="direct">Direct</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-black text-white px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        {/* Header with navigation back to Home & Dashboard */}
        <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="space-y-1">
            <h1 className="text-xl font-bold md:text-2xl">
              Proposal &amp; Document Copilot
            </h1>
            <p className="text-xs text-slate-400 md:text-sm">
              Generate proposals, scopes, and follow-up emails. Each generation
              counts towards your org usage.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
            >
              ← Home
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
            >
              Dashboard
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold hover:bg-white hover:text-black"
            >
              Upgrade plan
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Left: form + output */}
          <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm md:p-6">
            {/* Tool tabs */}
            <div className="flex flex-wrap gap-2">
              {(["PROPOSAL", "SCOPE", "FOLLOW_UP"] as ToolType[]).map(
                (tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => setActiveTool(tool)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold md:text-sm ${
                      activeTool === tool
                        ? "border-white bg-white text-black"
                        : "border-slate-600 bg-slate-900/60 text-slate-200 hover:bg-white hover:text-black"
                    }`}
                  >
                    {toolLabel(tool)}
                  </button>
                )
              )}
            </div>

            {/* Selected template badge */}
            {selectedTemplateName && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-emerald-300">
                <span>
                  Using template: <strong>{selectedTemplateName}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleClearSelectedTemplate}
                  className="rounded-full border border-emerald-500 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold hover:bg-emerald-500 hover:text-black"
                >
                  Clear template
                </button>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4 text-sm text-slate-200">
              {renderToolForm()}

              <div className="space-y-1">
                <label className="text-xs text-slate-300">
                  Document title (for saving)
                </label>
                <input
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-slate-400"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Website redesign proposal for ACME"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="rounded-lg border border-slate-600 bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
                <button
                  onClick={handleSaveOrUpdate}
                  disabled={saving || !responseBox.trim()}
                  className="rounded-lg border border-emerald-500 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? editingId
                      ? "Updating..."
                      : "Saving..."
                    : editingId
                    ? "Update document"
                    : "Save document"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-xs font-semibold hover:bg-white hover:text-black"
                  >
                    Cancel edit
                  </button>
                )}
              </div>

              {responseBox && (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/80 p-4 text-xs text-slate-200 shadow-inner md:text-sm whitespace-pre-wrap">
                  {responseBox}
                </div>
              )}
            </div>
          </section>

          {/* Right: templates + history */}
          <aside className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl backdrop-blur-sm md:p-5">
            {/* Sidebar tabs */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSidebarTab("TEMPLATES")}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold md:text-sm ${
                    sidebarTab === "TEMPLATES"
                      ? "border-white bg-white text-black"
                      : "border-slate-600 bg-slate-900/60 text-slate-200 hover:bg-white hover:text-black"
                  }`}
                >
                  Templates
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarTab("HISTORY")}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold md:text-sm ${
                    sidebarTab === "HISTORY"
                      ? "border-white bg-white text-black"
                      : "border-slate-600 bg-slate-900/60 text-slate-200 hover:bg-white hover:text-black"
                  }`}
                >
                  History
                </button>
              </div>

              {sidebarTab === "TEMPLATES" ? (
                <button
                  type="button"
                  onClick={fetchTemplates}
                  className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-semibold hover:bg-white hover:text-black"
                >
                  Refresh
                </button>
              ) : (
                <button
                  type="button"
                  onClick={fetchDocuments}
                  className="rounded-full border border-slate-600 bg-slate-900/60 px-3 py-1 text-xs font-semibold hover:bg-white hover:text-black"
                >
                  Refresh
                </button>
              )}
            </div>

            {/* Templates tab */}
            {sidebarTab === "TEMPLATES" && (
              <div className="space-y-3 text-xs md:text-sm">
                {templatesLoading && (
                  <p className="text-xs text-slate-400">
                    Loading templates…
                  </p>
                )}

                {/* Template form */}
                <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/70 p-3">
                  <p className="text-[11px] font-semibold text-slate-200">
                    {editingTemplateId
                      ? "Edit template"
                      : "Create template"}
                  </p>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">
                      Template name
                    </label>
                    <input
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="e.g. Default SaaS proposal"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">
                      Template type
                    </label>
                    <select
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400"
                      value={templateType}
                      onChange={(e) =>
                        setTemplateType(e.target.value as ToolType)
                      }
                    >
                      <option value="PROPOSAL">Client Proposal</option>
                      <option value="SCOPE">Project Scope</option>
                      <option value="FOLLOW_UP">Follow-up Email</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">
                      Template body (base structure / style)
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-slate-400"
                      rows={4}
                      value={templateBody}
                      onChange={(e) =>
                        setTemplateBody(e.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveTemplate}
                      disabled={templateSaving}
                      className="rounded-lg border border-emerald-500 bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {templateSaving
                        ? editingTemplateId
                          ? "Updating template..."
                          : "Saving template..."
                        : editingTemplateId
                        ? "Update template"
                        : "Save template"}
                    </button>
                    {editingTemplateId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTemplateId(null);
                          setTemplateName("");
                          setTemplateBody("");
                          setTemplateType("PROPOSAL");
                        }}
                        className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-[11px] font-semibold hover:bg-white hover:text-black"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                {/* Template list */}
                <ul className="max-h-64 space-y-2 overflow-y-auto">
                  {!templatesLoading && templates.length === 0 && (
                    <p className="text-[11px] text-slate-500">
                      No templates yet. Create one above to reuse across
                      your org.
                    </p>
                  )}

                  {templates.map((tpl) => (
                    <li
                      key={tpl.id}
                      className="rounded-lg border border-slate-700 bg-slate-900/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wide text-slate-400">
                            {toolLabel(tpl.type as ToolType)}
                          </span>
                          <span className="text-xs font-medium text-slate-100">
                            {tpl.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(tpl.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-300">
                        {tpl.body}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleUseTemplate(tpl)}
                          className="rounded-full border border-emerald-500 bg-emerald-500/90 px-2 py-1 text-[11px] font-semibold text-black hover:bg-emerald-400"
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditTemplate(tpl)}
                          className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-1 text-[11px] font-semibold hover:bg-white hover:text-black"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="rounded-full border border-red-500 bg-red-500/90 px-2 py-1 text-[11px] font-semibold text-black hover:bg-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* History tab */}
            {sidebarTab === "HISTORY" && (
              <div className="space-y-3 text-xs md:text-sm">
                {docsLoading && (
                  <p className="text-xs text-slate-400">
                    Loading documents…
                  </p>
                )}

                {!docsLoading && documents.length === 0 && (
                  <p className="text-xs text-slate-500">
                    No documents saved yet. Generate and save to see
                    history here.
                  </p>
                )}

                <ul className="max-h-80 space-y-2 overflow-y-auto">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="rounded-lg border border-slate-700 bg-slate-900/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wide text-slate-400">
                            {toolLabel(doc.type as ToolType)}
                          </span>
                          {editingId === doc.id && (
                            <span className="text-[10px] text-emerald-400">
                              Editing…
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(doc.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-100">
                        {doc.title}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleLoadDocument(doc)}
                          className="rounded-full border border-slate-600 bg-slate-900/60 px-2 py-1 text-[11px] font-semibold hover:bg-white hover:text-black"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="rounded-full border border-red-500 bg-red-500/90 px-2 py-1 text-[11px] font-semibold text-black hover:bg-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}


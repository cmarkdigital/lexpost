import { useState, useEffect, useRef } from "react";

// ── MOCK USER DATABASE ──────────────────────────────────────────
const USERS = {
  "carlos@lexpost.com.br": { password: "carlos123", name: "Carlos Nunes", plan: "admin" },
  "ferreira@escritorio.adv.br": { password: "senha123", name: "Dr. Ferreira", plan: "pro", escritorio: "Ferreira & Associados" },
  "demo@lexpost.com.br": { password: "demo123", name: "Demo User", plan: "starter" },
};

// ── CLAUDE API CALL ─────────────────────────────────────────────
async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || "";
}

// ── SLIDE GENERATOR PROMPT ──────────────────────────────────────
function buildSystemPrompt(form) {
  const isCarrossel = form.tipo === "carrossel";
  const numSlides = isCarrossel ? "6 slides" : "1 slide";
  const cor1 = form.cor1 || "#02253c";
  const cor2 = form.cor2 || "#d9aa66";

  return `Você é um designer especializado em marketing jurídico para Instagram.
Gere APENAS código HTML puro (sem markdown, sem explicações, sem \`\`\`html).
O HTML deve conter ${numSlides} no formato 1080x1350px.
Cada slide deve ser um div com class="slide" e style="width:1080px;height:1350px;position:relative;overflow:hidden;margin-bottom:32px;box-shadow:0 20px 60px rgba(0,0,0,0.25)".

REGRAS DE DESIGN:
- Fonte: importar do Google Fonts: Playfair Display (títulos) + Lato (corpo)
- Cor primária (azul/escuro): ${cor1}
- Cor de destaque (dourado): ${cor2}
- Texto mínimo: 22px para corpo, 60px+ para títulos
- Slides com foto de fundo: usar overlay gradiente rgba(escuro, 0.8-0.97) na base
- Cada slide deve ter rodapé com nome do escritório + @instagram
- NUNCA deixar slide com espaço vazio — preencher com elementos visuais
- Usar SVG inline para ícones, gráficos de barras, fluxogramas ou ilustrações quando pertinente
${form.fotoBase64 ? `- Slide 1 (capa): usar esta imagem como fundo OBRIGATORIAMENTE: <img src="data:image/jpeg;base64,${form.fotoBase64}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">` : "- Slide 1 (capa): usar foto do Unsplash temática jurídica como fundo"}

ESTRUTURA para ${isCarrossel ? "carrossel" : "post estático"}:
${isCarrossel ? `
Slide 1: Capa com título impactante + foto de fundo
Slide 2: Contexto / problema ou dado relevante  
Slide 3-4: Conteúdo principal (dicas, etapas, informações)
Slide 5: Destaque visual (número grande, citação, gráfico)
Slide 6: CTA — "Me siga: ${form.instagram || "@escritorio"}"
` : `
Slide único: Post completo com foto, título, até 3 pontos principais e CTA
`}

Retorne SOMENTE o HTML completo começando com <!DOCTYPE html>.`;
}

// ── ICONS ───────────────────────────────────────────────────────
const Icons = {
  Logo: () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#d9aa66"/>
      <path d="M8 10h16M8 16h10M8 22h13" stroke="#02253c" strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="24" cy="22" r="4" fill="#02253c"/>
      <path d="M22.5 22l1 1 2-2" stroke="#d9aa66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
    </svg>
  ),
  Plus: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg>
  ),
  Carousel: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="14" height="16" rx="2"/><rect x="18" y="7" width="4" height="10" rx="1"/>
    </svg>
  ),
  Post: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
    </svg>
  ),
  Sparkle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
    </svg>
  ),
  History: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  Eye: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  Upload: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
    </svg>
  ),
};

// ── STYLES ──────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: #0a0f1a;
    color: #e8e4dd;
    min-height: 100vh;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0a0f1a; }
  ::-webkit-scrollbar-thumb { background: #2a3548; border-radius: 3px; }

  .app { display: flex; min-height: 100vh; }

  /* ── LOGIN ── */
  .login-wrap {
    min-height: 100vh; width: 100%;
    display: flex; align-items: center; justify-content: center;
    background: #0a0f1a;
    position: relative; overflow: hidden;
  }
  .login-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 20% 50%, rgba(217,170,102,0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(2,37,60,0.6) 0%, transparent 50%);
  }
  .login-grid {
    position: absolute; inset: 0; opacity: 0.04;
    background-image: linear-gradient(rgba(217,170,102,0.5) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(217,170,102,0.5) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .login-card {
    position: relative; z-index: 1;
    width: 420px; padding: 56px 48px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(217,170,102,0.15);
    backdrop-filter: blur(20px);
  }
  .login-logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
  .login-logo-text { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; color: #e8e4dd; }
  .login-logo-text span { color: #d9aa66; }
  .login-title { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #e8e4dd; margin-bottom: 8px; }
  .login-sub { font-size: 15px; font-weight: 300; color: rgba(232,228,221,0.5); margin-bottom: 40px; }
  .field-label { font-size: 11px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: #d9aa66; margin-bottom: 8px; display: block; }
  .field-input {
    width: 100%; padding: 14px 16px;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(232,228,221,0.1);
    color: #e8e4dd; font-family: 'DM Sans', sans-serif; font-size: 15px;
    outline: none; transition: border-color 0.2s;
    margin-bottom: 24px;
  }
  .field-input:focus { border-color: rgba(217,170,102,0.5); }
  .field-input::placeholder { color: rgba(232,228,221,0.25); }
  .btn-primary {
    width: 100%; padding: 16px;
    background: #d9aa66; color: #02253c;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 2px; text-transform: uppercase; cursor: pointer; border: none;
    transition: opacity 0.2s, transform 0.1s;
  }
  .btn-primary:hover { opacity: 0.9; }
  .btn-primary:active { transform: scale(0.99); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .login-error { color: #e07070; font-size: 13px; margin-top: 16px; text-align: center; }
  .login-hint { margin-top: 24px; padding: 16px; background: rgba(217,170,102,0.06); border-left: 2px solid #d9aa66; }
  .login-hint p { font-size: 12px; color: rgba(232,228,221,0.5); line-height: 1.6; }
  .login-hint strong { color: #d9aa66; }

  /* ── SIDEBAR ── */
  .sidebar {
    width: 260px; flex-shrink: 0;
    background: #080d16; border-right: 1px solid rgba(232,228,221,0.06);
    display: flex; flex-direction: column;
    padding: 32px 0; position: sticky; top: 0; height: 100vh;
  }
  .sidebar-logo { display: flex; align-items: center; gap: 10px; padding: 0 28px 36px; }
  .sidebar-logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; }
  .sidebar-logo-text span { color: #d9aa66; }
  .sidebar-user {
    margin: 0 16px 32px; padding: 16px;
    background: rgba(217,170,102,0.07); border: 1px solid rgba(217,170,102,0.15);
  }
  .sidebar-user-name { font-size: 14px; font-weight: 600; color: #e8e4dd; }
  .sidebar-user-plan { font-size: 11px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #d9aa66; margin-top: 4px; }
  .sidebar-nav { flex: 1; padding: 0 16px; }
  .sidebar-nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; cursor: pointer; color: rgba(232,228,221,0.5);
    font-size: 14px; font-weight: 500; transition: all 0.15s;
    margin-bottom: 4px;
  }
  .sidebar-nav-item:hover { color: #e8e4dd; background: rgba(255,255,255,0.04); }
  .sidebar-nav-item.active { color: #d9aa66; background: rgba(217,170,102,0.08); }
  .sidebar-logout {
    margin: 0 16px; padding: 12px 16px;
    display: flex; align-items: center; gap: 10px;
    color: rgba(232,228,221,0.35); font-size: 13px; cursor: pointer;
    border-top: 1px solid rgba(232,228,221,0.06); padding-top: 24px; margin-top: 8px;
    transition: color 0.15s;
  }
  .sidebar-logout:hover { color: rgba(232,228,221,0.7); }

  /* ── MAIN ── */
  .main { flex: 1; padding: 48px 56px; overflow-y: auto; }
  .page-header { margin-bottom: 48px; }
  .page-title { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 700; color: #e8e4dd; margin-bottom: 8px; }
  .page-title span { color: #d9aa66; font-style: italic; }
  .page-sub { font-size: 16px; font-weight: 300; color: rgba(232,228,221,0.45); }

  /* ── FORM ── */
  .form-card {
    background: rgba(255,255,255,0.025); border: 1px solid rgba(232,228,221,0.08);
    padding: 48px; margin-bottom: 32px;
  }
  .form-section-title {
    font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    color: #d9aa66; margin-bottom: 28px; padding-bottom: 16px;
    border-bottom: 1px solid rgba(232,228,221,0.06);
  }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
  .form-grid.full { grid-template-columns: 1fr; }
  .form-field { display: flex; flex-direction: column; }
  .form-field .field-input { margin-bottom: 0; }
  .form-textarea {
    width: 100%; padding: 14px 16px; min-height: 100px; resize: vertical;
    background: rgba(255,255,255,0.05); border: 1px solid rgba(232,228,221,0.1);
    color: #e8e4dd; font-family: 'DM Sans', sans-serif; font-size: 15px; outline: none;
    transition: border-color 0.2s;
  }
  .form-textarea:focus { border-color: rgba(217,170,102,0.5); }
  .form-textarea::placeholder { color: rgba(232,228,221,0.25); }

  /* Tipo selector */
  .tipo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
  .tipo-btn {
    padding: 24px 20px; cursor: pointer;
    border: 1px solid rgba(232,228,221,0.1);
    background: rgba(255,255,255,0.03); transition: all 0.2s;
    display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;
  }
  .tipo-btn:hover { border-color: rgba(217,170,102,0.3); }
  .tipo-btn.selected { border-color: #d9aa66; background: rgba(217,170,102,0.08); }
  .tipo-btn-icon { color: #d9aa66; }
  .tipo-btn-label { font-size: 14px; font-weight: 600; color: #e8e4dd; }
  .tipo-btn-desc { font-size: 12px; color: rgba(232,228,221,0.4); line-height: 1.4; }

  /* Color picker */
  .color-row { display: flex; gap: 24px; }
  .color-field { display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .color-input-wrap { display: flex; align-items: center; gap: 12px; }
  .color-swatch { width: 36px; height: 36px; border: 1px solid rgba(232,228,221,0.15); cursor: pointer; flex-shrink: 0; }
  input[type="color"] { opacity: 0; position: absolute; width: 36px; height: 36px; cursor: pointer; }
  .color-hex { flex: 1; }

  /* Upload */
  .upload-area {
    border: 1px dashed rgba(217,170,102,0.3); padding: 32px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    cursor: pointer; transition: all 0.2s; text-align: center;
    background: rgba(255,255,255,0.02);
  }
  .upload-area:hover { border-color: #d9aa66; background: rgba(217,170,102,0.05); }
  .upload-area.has-file { border-color: #d9aa66; background: rgba(217,170,102,0.08); }
  .upload-area-icon { color: rgba(217,170,102,0.6); }
  .upload-area-text { font-size: 14px; color: rgba(232,228,221,0.5); }
  .upload-area-text strong { color: #d9aa66; }
  .upload-preview { width: 80px; height: 80px; object-fit: cover; border: 2px solid #d9aa66; }

  /* Content type tags */
  .content-tags { display: flex; flex-wrap: wrap; gap: 10px; }
  .content-tag {
    padding: 8px 16px; font-size: 13px; font-weight: 500; cursor: pointer;
    border: 1px solid rgba(232,228,221,0.15); color: rgba(232,228,221,0.5);
    background: transparent; transition: all 0.15s;
  }
  .content-tag:hover { border-color: rgba(217,170,102,0.4); color: rgba(232,228,221,0.8); }
  .content-tag.selected { border-color: #d9aa66; color: #d9aa66; background: rgba(217,170,102,0.1); }

  /* Generate button */
  .btn-generate {
    width: 100%; padding: 20px;
    background: linear-gradient(135deg, #d9aa66, #c49450);
    color: #02253c; font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;
    cursor: pointer; border: none; transition: all 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    margin-top: 40px;
  }
  .btn-generate:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(217,170,102,0.3); }
  .btn-generate:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

  /* ── LOADING ── */
  .loading-overlay {
    position: fixed; inset: 0; z-index: 100;
    background: rgba(8,13,22,0.95); backdrop-filter: blur(8px);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 32px;
  }
  .loading-ring {
    width: 64px; height: 64px; border-radius: 50%;
    border: 2px solid rgba(217,170,102,0.15);
    border-top-color: #d9aa66;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-family: 'Playfair Display', serif; font-size: 24px; color: #e8e4dd; }
  .loading-sub { font-size: 14px; color: rgba(232,228,221,0.4); font-weight: 300; }
  .loading-steps { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .loading-step { font-size: 13px; color: rgba(232,228,221,0.35); display: flex; align-items: center; gap: 8px; }
  .loading-step.done { color: #d9aa66; }
  .loading-step-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

  /* ── PREVIEW MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(4,8,16,0.97); backdrop-filter: blur(4px);
    display: flex; flex-direction: column;
  }
  .modal-header {
    padding: 20px 32px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid rgba(232,228,221,0.08); flex-shrink: 0;
  }
  .modal-title { font-family: 'Playfair Display', serif; font-size: 20px; color: #e8e4dd; }
  .modal-actions { display: flex; gap: 12px; align-items: center; }
  .btn-icon {
    padding: 10px 20px; display: flex; align-items: center; gap: 8px;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: 1px; cursor: pointer; transition: all 0.15s;
  }
  .btn-icon.outline {
    background: transparent; border: 1px solid rgba(232,228,221,0.2); color: rgba(232,228,221,0.7);
  }
  .btn-icon.outline:hover { border-color: rgba(232,228,221,0.4); color: #e8e4dd; }
  .btn-icon.gold { background: #d9aa66; border: none; color: #02253c; font-weight: 700; }
  .btn-icon.gold:hover { opacity: 0.9; }
  .btn-icon:disabled { opacity: 0.4; cursor: not-allowed; }
  .modal-body { flex: 1; overflow-y: auto; padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
  .slide-container { position: relative; }
  .slide-label {
    position: absolute; top: -28px; left: 0;
    font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(232,228,221,0.3);
  }
  .slide-wrapper {
    width: 360px; height: 450px; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    transform-origin: top left; transform: scale(0.333);
    position: relative;
  }

  /* ── HISTORY ── */
  .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
  .history-card {
    background: rgba(255,255,255,0.025); border: 1px solid rgba(232,228,221,0.08);
    padding: 24px; transition: border-color 0.2s;
  }
  .history-card:hover { border-color: rgba(217,170,102,0.25); }
  .history-card-type { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
  .history-badge {
    font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    padding: 4px 10px; background: rgba(217,170,102,0.15); color: #d9aa66;
  }
  .history-card-title { font-family: 'Playfair Display', serif; font-size: 18px; color: #e8e4dd; margin-bottom: 8px; line-height: 1.3; }
  .history-card-meta { font-size: 12px; color: rgba(232,228,221,0.35); margin-bottom: 20px; }
  .history-card-actions { display: flex; gap: 10px; }
  .btn-sm {
    padding: 8px 16px; font-size: 12px; font-weight: 600; letter-spacing: 1px;
    cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;
  }
  .btn-sm.outline { background: transparent; border: 1px solid rgba(232,228,221,0.15); color: rgba(232,228,221,0.6); }
  .btn-sm.outline:hover { border-color: rgba(217,170,102,0.4); color: #d9aa66; }
  .btn-sm.gold { background: rgba(217,170,102,0.15); border: 1px solid rgba(217,170,102,0.3); color: #d9aa66; }
  .btn-sm.gold:hover { background: rgba(217,170,102,0.25); }

  .empty-state { text-align: center; padding: 80px 40px; color: rgba(232,228,221,0.3); }
  .empty-state-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }
  .empty-state h3 { font-family: 'Playfair Display', serif; font-size: 24px; color: rgba(232,228,221,0.4); margin-bottom: 8px; }
  .empty-state p { font-size: 14px; }

  .divider { height: 1px; background: rgba(232,228,221,0.06); margin: 40px 0; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  .fade-in { animation: fadeIn 0.4s ease forwards; }
`;

// ── CONTENT TYPES ────────────────────────────────────────────────
const CONTENT_TYPES = [
  { id: "dica", label: "💡 Dica Jurídica" },
  { id: "mudanca", label: "📋 Mudança na Lei" },
  { id: "case", label: "🏆 Case de Sucesso" },
  { id: "apresentacao", label: "👤 Apresentação" },
  { id: "direitos", label: "⚖️ Direitos" },
  { id: "processo", label: "🔄 Passo a Passo" },
];

// ── MAIN APP ─────────────────────────────────────────────────────
export default function LexPost() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("criar");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [preview, setPreview] = useState(null); // { html, titulo }
  const [generatedHtmls, setGeneratedHtmls] = useState([]);
  const [downloading, setDownloading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    tipo: "carrossel",
    contentType: "dica",
    escritorio: "",
    instagram: "",
    tema: "",
    cor1: "#02253c",
    cor2: "#d9aa66",
    fotoBase64: null,
    fotoPreview: null,
  });

  // Login state
  const [loginEmail, setLoginEmail] = useState("demo@lexpost.com.br");
  const [loginPass, setLoginPass] = useState("demo123");
  const [loginError, setLoginError] = useState("");

  const fileRef = useRef();

  useEffect(() => {
    const stored = sessionStorage.getItem("lexpost_user");
    if (stored) setUser(JSON.parse(stored));
    const hist = sessionStorage.getItem("lexpost_history");
    if (hist) setHistory(JSON.parse(hist));
  }, []);

  function login() {
    const u = USERS[loginEmail.trim().toLowerCase()];
    if (u && u.password === loginPass) {
      const userData = { email: loginEmail, name: u.name, plan: u.plan, escritorio: u.escritorio || "" };
      setUser(userData);
      sessionStorage.setItem("lexpost_user", JSON.stringify(userData));
      if (u.escritorio) setForm(f => ({ ...f, escritorio: u.escritorio }));
      setLoginError("");
    } else {
      setLoginError("E-mail ou senha incorretos.");
    }
  }

  function logout() {
    setUser(null);
    sessionStorage.removeItem("lexpost_user");
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const full = ev.target.result;
      const b64 = full.split(",")[1];
      setForm(f => ({ ...f, fotoBase64: b64, fotoPreview: full }));
    };
    reader.readAsDataURL(file);
  }

  const LOADING_STEPS = [
    "Analisando briefing...",
    "Definindo estrutura dos slides...",
    "Gerando conteúdo jurídico...",
    "Aplicando design e paleta de cores...",
    "Inserindo elementos visuais...",
    "Finalizando carrossel...",
  ];

  async function generate() {
    if (!form.tema || !form.escritorio) return alert("Preencha o tema e o nome do escritório.");
    setLoading(true);
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(s => Math.min(s + 1, LOADING_STEPS.length - 1));
    }, 2200);

    try {
      const systemPrompt = buildSystemPrompt(form);
      const userPrompt = `
Escritório/Advogado: ${form.escritorio}
Instagram: ${form.instagram || "@" + form.escritorio.toLowerCase().replace(/\s/g, "")}
Tipo de conteúdo: ${CONTENT_TYPES.find(c => c.id === form.contentType)?.label || form.contentType}
Tema/assunto: ${form.tema}
Formato: ${form.tipo === "carrossel" ? "Carrossel com 6 slides" : "Post estático único"}
${form.fotoBase64 ? "Foto fornecida: SIM — usar na capa como fundo obrigatoriamente" : "Foto fornecida: NÃO — usar Unsplash temático"}

Gere agora o HTML completo.`;

      const html = await callClaude(systemPrompt, userPrompt);

      clearInterval(stepInterval);
      setLoadingStep(LOADING_STEPS.length - 1);

      // Save to history
      const entry = {
        id: Date.now(),
        tipo: form.tipo,
        contentType: form.contentType,
        titulo: form.tema,
        escritorio: form.escritorio,
        data: new Date().toLocaleDateString("pt-BR"),
        html,
      };
      const newHistory = [entry, ...history];
      setHistory(newHistory);
      sessionStorage.setItem("lexpost_history", JSON.stringify(newHistory));

      setPreview({ html, titulo: form.tema, id: entry.id });
    } catch (err) {
      clearInterval(stepInterval);
      alert("Erro ao gerar: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Download: abre o HTML numa nova aba onde o usuário pode salvar os slides
  async function downloadSlides(html, titulo) {
    setDownloading(true);

    // Injeta um botão de instrução no HTML gerado
    const htmlComInstrucao = html.replace("</body>", `
      <div style="position:fixed;bottom:0;left:0;right:0;background:#02253c;color:#d9aa66;
        font-family:sans-serif;font-size:15px;font-weight:600;padding:16px 32px;
        display:flex;align-items:center;justify-content:space-between;z-index:9999;
        border-top:3px solid #d9aa66;">
        <span>📥 Para salvar cada slide como PNG: clique com botão direito na imagem → "Salvar como..."</span>
        <button onclick="window.print()" style="background:#d9aa66;color:#02253c;border:none;
          padding:10px 24px;font-weight:700;font-size:14px;cursor:pointer;letter-spacing:1px;">
          🖨️ IMPRIMIR / SALVAR PDF
        </button>
      </div>
      <style>
        @media print {
          body > div[style*="position:fixed"] { display: none !important; }
          .slide { page-break-after: always; margin: 0 !important; box-shadow: none !important; }
        }
      </style>
    </body>`);

    // Abre numa nova aba
    const blob = new Blob([htmlComInstrucao], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");

    setDownloading(false);
  }

  // ── RENDER: LOGIN ──
  if (!user) return (
    <>
      <style>{css}</style>
      <div className="login-wrap">
        <div className="login-bg"/>
        <div className="login-grid"/>
        <div className="login-card fade-in">
          <div className="login-logo">
            <Icons.Logo/>
            <div className="login-logo-text">Lex<span>Post</span></div>
          </div>
          <div className="login-title">Bem-vindo</div>
          <div className="login-sub">Faça login para criar seus posts jurídicos com IA</div>

          <label className="field-label">E-mail</label>
          <input className="field-input" type="email" value={loginEmail}
            onChange={e => setLoginEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="seu@escritorio.adv.br"/>

          <label className="field-label">Senha</label>
          <input className="field-input" type="password" value={loginPass}
            onChange={e => setLoginPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && login()}
            placeholder="••••••••"/>

          <button className="btn-primary" onClick={login}>Entrar →</button>
          {loginError && <div className="login-error">{loginError}</div>}

          <div className="login-hint" style={{marginTop: 24}}>
            <p><strong>Contas de demonstração:</strong><br/>
            demo@lexpost.com.br / demo123<br/>
            ferreira@escritorio.adv.br / senha123</p>
          </div>
        </div>
      </div>
    </>
  );

  // ── RENDER: APP ──
  return (
    <>
      <style>{css}</style>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-ring"/>
          <div className="loading-text">Gerando com Claude...</div>
          <div className="loading-sub">Isso leva cerca de 30 segundos</div>
          <div className="loading-steps">
            {LOADING_STEPS.map((step, i) => (
              <div key={i} className={`loading-step ${i <= loadingStep ? "done" : ""}`}>
                <div className="loading-step-dot"/>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {preview && (
        <div className="modal-overlay">
          <div className="modal-header">
            <div className="modal-title">Preview — {preview.titulo}</div>
            <div className="modal-actions">
              <button className="btn-icon outline" onClick={() => setPreview(null)}>
                <Icons.Close/> Fechar
              </button>
              <button className="btn-icon gold" disabled={downloading}
                onClick={() => downloadSlides(preview.html, preview.titulo)}>
                <Icons.Download/>
                {downloading ? "Baixando..." : "Baixar PNGs"}
              </button>
            </div>
          </div>
          <div className="modal-body">
            <div style={{fontSize: 12, color: "rgba(232,228,221,0.35)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8}}>
              Prévia em escala reduzida — os PNGs finais são 1080×1350px
            </div>
            {/* Render slides in iframe */}
            <iframe
              srcDoc={preview.html}
              style={{width: "100%", height: "calc(100vh - 140px)", border: "none", background: "#888"}}
              title="preview"
            />
          </div>
        </div>
      )}

      <div className="app">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <Icons.Logo/>
            <div className="sidebar-logo-text">Lex<span>Post</span></div>
          </div>

          <div className="sidebar-user">
            <div className="sidebar-user-name">{user.name}</div>
            <div className="sidebar-user-plan">{user.plan}</div>
          </div>

          <div className="sidebar-nav">
            <div className={`sidebar-nav-item ${page === "criar" ? "active" : ""}`} onClick={() => setPage("criar")}>
              <Icons.Plus/> Criar Post
            </div>
            <div className={`sidebar-nav-item ${page === "historico" ? "active" : ""}`} onClick={() => setPage("historico")}>
              <Icons.History/> Histórico
              {history.length > 0 && (
                <span style={{marginLeft: "auto", fontSize: 11, background: "rgba(217,170,102,0.2)", color: "#d9aa66", padding: "2px 8px", borderRadius: 20}}>
                  {history.length}
                </span>
              )}
            </div>
          </div>

          <div className="sidebar-logout" onClick={logout}>
            <Icons.Logout/> Sair
          </div>
        </div>

        {/* Main content */}
        <div className="main">

          {/* ── CRIAR ── */}
          {page === "criar" && (
            <div className="fade-in">
              <div className="page-header">
                <div className="page-title">Criar <span>novo post</span></div>
                <div className="page-sub">Preencha o briefing e o Claude gera o carrossel completo</div>
              </div>

              {/* Tipo */}
              <div className="form-card">
                <div className="form-section-title">01 — Formato</div>
                <div className="tipo-grid">
                  <div className={`tipo-btn ${form.tipo === "carrossel" ? "selected" : ""}`}
                    onClick={() => setForm(f => ({...f, tipo: "carrossel"}))}>
                    <div className="tipo-btn-icon"><Icons.Carousel/></div>
                    <div className="tipo-btn-label">Carrossel</div>
                    <div className="tipo-btn-desc">6 slides sequenciais para arrastar no Instagram</div>
                  </div>
                  <div className={`tipo-btn ${form.tipo === "post" ? "selected" : ""}`}
                    onClick={() => setForm(f => ({...f, tipo: "post"}))}>
                    <div className="tipo-btn-icon"><Icons.Post/></div>
                    <div className="tipo-btn-label">Post Estático</div>
                    <div className="tipo-btn-desc">Imagem única 1080×1350px com todo o conteúdo</div>
                  </div>
                </div>
              </div>

              {/* Tipo de conteúdo */}
              <div className="form-card">
                <div className="form-section-title">02 — Tipo de conteúdo</div>
                <div className="content-tags">
                  {CONTENT_TYPES.map(ct => (
                    <div key={ct.id} className={`content-tag ${form.contentType === ct.id ? "selected" : ""}`}
                      onClick={() => setForm(f => ({...f, contentType: ct.id}))}>
                      {ct.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Briefing */}
              <div className="form-card">
                <div className="form-section-title">03 — Briefing</div>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="field-label">Nome do escritório / advogado</label>
                    <input className="field-input" value={form.escritorio}
                      onChange={e => setForm(f => ({...f, escritorio: e.target.value}))}
                      placeholder="Ex: Ferreira & Associados"/>
                  </div>
                  <div className="form-field">
                    <label className="field-label">Instagram</label>
                    <input className="field-input" value={form.instagram}
                      onChange={e => setForm(f => ({...f, instagram: e.target.value}))}
                      placeholder="@escritorio"/>
                  </div>
                </div>
                <div className="form-grid full">
                  <div className="form-field">
                    <label className="field-label">Tema do post</label>
                    <textarea className="form-textarea" value={form.tema}
                      onChange={e => setForm(f => ({...f, tema: e.target.value}))}
                      placeholder="Ex: Direitos do consumidor em compras online — como cancelar, pedir reembolso e acionar a Justiça"/>
                  </div>
                </div>
              </div>

              {/* Visual */}
              <div className="form-card">
                <div className="form-section-title">04 — Identidade visual</div>

                <div className="color-row" style={{marginBottom: 28}}>
                  {[["cor1", "Cor principal"], ["cor2", "Cor de destaque"]].map(([key, label]) => (
                    <div className="color-field" key={key}>
                      <label className="field-label">{label}</label>
                      <div className="color-input-wrap">
                        <div style={{position: "relative"}}>
                          <div className="color-swatch" style={{background: form[key]}}/>
                          <input type="color" value={form[key]}
                            onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                            style={{position: "absolute", top: 0, left: 0, opacity: 0, width: 36, height: 36, cursor: "pointer"}}/>
                        </div>
                        <input className="field-input color-hex" value={form[key]}
                          onChange={e => setForm(f => ({...f, [key]: e.target.value}))}
                          style={{marginBottom: 0, fontFamily: "monospace"}}/>
                      </div>
                    </div>
                  ))}
                </div>

                <label className="field-label">Foto do advogado (opcional)</label>
                <div className={`upload-area ${form.fotoPreview ? "has-file" : ""}`}
                  onClick={() => fileRef.current.click()}>
                  <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
                  {form.fotoPreview
                    ? <><img src={form.fotoPreview} className="upload-preview" alt="preview"/>
                        <div className="upload-area-text"><strong>Foto carregada</strong> — clique para trocar</div></>
                    : <><div className="upload-area-icon"><Icons.Upload/></div>
                        <div className="upload-area-text">Clique para <strong>fazer upload</strong> da sua foto<br/>
                        <span style={{fontSize:12, opacity:0.6}}>JPG ou PNG — será usada na capa</span></div></>
                  }
                </div>

                <button className="btn-generate" onClick={generate} disabled={loading}>
                  <Icons.Sparkle/>
                  {loading ? "Gerando..." : `Gerar ${form.tipo === "carrossel" ? "Carrossel" : "Post"} com Claude`}
                </button>
              </div>
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          {page === "historico" && (
            <div className="fade-in">
              <div className="page-header">
                <div className="page-title">Histórico de <span>posts</span></div>
                <div className="page-sub">{history.length} post{history.length !== 1 ? "s" : ""} gerado{history.length !== 1 ? "s" : ""}</div>
              </div>

              {history.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>Nenhum post ainda</h3>
                  <p>Crie seu primeiro carrossel na aba "Criar Post"</p>
                </div>
              ) : (
                <div className="history-grid">
                  {history.map(item => (
                    <div key={item.id} className="history-card">
                      <div className="history-card-type">
                        <div className="history-badge">{item.tipo === "carrossel" ? "Carrossel" : "Post"}</div>
                        <div className="history-badge" style={{background:"rgba(232,228,221,0.06)", color:"rgba(232,228,221,0.4)"}}>
                          {CONTENT_TYPES.find(c => c.id === item.contentType)?.label || item.contentType}
                        </div>
                      </div>
                      <div className="history-card-title">{item.titulo}</div>
                      <div className="history-card-meta">{item.escritorio} · {item.data}</div>
                      <div className="history-card-actions">
                        <button className="btn-sm outline" onClick={() => setPreview({html: item.html, titulo: item.titulo})}>
                          <Icons.Eye/> Ver
                        </button>
                        <button className="btn-sm gold" onClick={() => downloadSlides(item.html, item.titulo)}>
                          <Icons.Download/> Baixar PNGs
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

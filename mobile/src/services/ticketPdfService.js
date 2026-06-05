// Service de génération de ticket PDF — layout 4 sections (55mm×160mm)
// Sections : A-souche dégradé QR+vertical, B-infos événement, C-corps QR+filigrane, D-talon gris
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FS from 'expo-file-system'
import * as FileSystem from 'expo-file-system/legacy'
import { Asset } from 'expo-asset'
import { Alert } from 'react-native'
import { formatDateTicket, formatDatetimeLong } from '../utils/dateUtils'

let _logoBase64Promise = null
function getLogoBase64() {
  if (!_logoBase64Promise) {
    _logoBase64Promise = (async () => {
      try {
        const asset = Asset.fromModule(require('../../assets/logo_mobile.jpeg'))
        await asset.downloadAsync()
        const b64 = await FS.readAsStringAsync(asset.localUri, {
          encoding: FS.EncodingType.Base64,
        })
        return b64
      } catch {
        return null
      }
    })()
  }
  return _logoBase64Promise
}

function formatPrix(prix) {
  if (prix == null) return '—'
  return `${Number(prix).toLocaleString('fr-FR')} FCFA`
}

// Dimensions : 55mm × 160mm ≈ 156pt × 454pt
const W = 156
const H = 454

function construireHtmlTicket(ticket, qrDataUrl, logoBase64) {
  const isScanned = ticket.statut === 'utilise'
  const dateStr = formatDateTicket(ticket.eventDate)
  const heureStr = ticket.eventHeure || ''
  const scannedStr = ticket.dateScan ? formatDatetimeLong(ticket.dateScan) : null
  const statutLabel = isScanned ? 'Utilisé' : 'Valide'
  const statutColor = isScanned ? '#94A3B8' : '#00E5A0'
  const catColor = ticket.couleurHex || '#6366F1'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}">
<title>Billet ${ticket.eventNom} — SENGUICHET</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${W}pt;
    height: ${H}pt;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
  }
  .page {
    width: ${W}pt;
    height: ${H}pt;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* Scanné stamp */
  .scanned-stamp {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-25deg);
    font-size: 22pt;
    font-weight: 900;
    color: ${isScanned ? '#ef4444' : 'transparent'};
    border: ${isScanned ? '1.5pt solid #ef4444' : 'none'};
    padding: 2pt 8pt;
    border-radius: 2pt;
    z-index: 10;
    pointer-events: none;
    opacity: ${isScanned ? 0.7 : 0};
    letter-spacing: 1.5pt;
  }

  /* SECTION A : Souche dégradé */
  .section-a {
    height: 108pt;
    background: linear-gradient(135deg, #6366F1, ${catColor}, #EC4899);
    padding: 8pt 11pt;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .section-a::after {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent, transparent 8pt,
      rgba(255,255,255,0.03) 8pt, rgba(255,255,255,0.03) 16pt
    );
    pointer-events: none;
  }
  .section-a-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5pt;
    z-index: 1;
  }
  .qr-stub {
    width: 62pt; height: 62pt;
    background: #fff;
    border-radius: 4pt;
    padding: 4pt;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .qr-stub img {
    width: 100%; height: 100%;
    image-rendering: pixelated;
  }
  .ref-stub {
    color: rgba(255,255,255,0.85);
    font-size: 7pt;
    font-weight: 700;
    letter-spacing: 1.5pt;
    text-align: center;
  }
  .section-a-right {
    writing-mode: vertical-rl;
    text-orientation: mixed;
    color: rgba(255,255,255,0.15);
    font-size: 14pt;
    font-weight: 900;
    letter-spacing: 5pt;
    text-transform: uppercase;
    z-index: 1;
    margin-left: auto;
    user-select: none;
    line-height: 1;
  }

  /* Perforation */
  .perf {
    height: 8pt;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: space-around;
    flex-shrink: 0;
  }
  .perf-dot {
    width: 3pt; height: 3pt;
    border-radius: 50%;
    background: #f0f2f5;
    flex-shrink: 0;
  }
  .perf-line {
    flex: 1;
    height: 0;
    border-top: 1pt dashed #cbd5e1;
    margin: 0 1.5pt;
  }

  /* SECTION B : Infos événement */
  .section-b {
    height: 85pt;
    padding: 7pt 11pt;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2pt;
    flex-shrink: 0;
  }
  .event-title {
    font-size: 11pt;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 0.5pt;
    max-width: 100%;
  }
  .event-date {
    font-size: 7pt;
    color: #475569;
    font-weight: 600;
  }
  .event-lieu {
    font-size: 7pt;
    color: #94a3b8;
    font-weight: 700;
    letter-spacing: 1pt;
    text-transform: uppercase;
  }
  .event-meta {
    display: flex;
    gap: 10pt;
    font-size: 7pt;
    font-weight: 700;
    color: ${catColor};
    margin-top: 3pt;
  }
  .event-meta span {
    background: rgba(99,102,241,0.08);
    padding: 1.5pt 6pt;
    border-radius: 3pt;
  }

  /* SECTION C : Corps QR + filigrane */
  .section-c {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5pt 11pt;
    position: relative;
    overflow: hidden;
    min-height: 0;
  }
  .watermark {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    user-select: none;
    z-index: 0;
  }
  .watermark span {
    font-size: 40pt;
    font-weight: 900;
    color: rgba(99,102,241,0.04);
    letter-spacing: 8pt;
    text-transform: uppercase;
    transform: rotate(-20deg);
    white-space: nowrap;
  }
  .qr-main-wrap {
    width: 48%;
    aspect-ratio: 1;
    background: #fff;
    border-radius: 5pt;
    padding: 4pt;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    box-shadow: 0 2pt 10pt rgba(0,0,0,0.06);
  }
  .qr-main-wrap img {
    width: 100%; height: 100%;
    image-rendering: pixelated;
  }
  .statut-badge {
    z-index: 1;
    margin-top: 5pt;
    padding: 1.5pt 8pt;
    border-radius: 5pt;
    font-size: 7pt;
    font-weight: 700;
    color: #fff;
    background: ${statutColor};
  }
  .acheteur-info {
    z-index: 1;
    font-size: 5.5pt;
    color: #94a3b8;
    margin-top: 3pt;
  }

  /* SECTION D : Talon gris */
  .section-d {
    height: 85pt;
    background: #f8fafc;
    padding: 7pt 11pt;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3pt;
    flex-shrink: 0;
    border-top: 1pt solid #e2e8f0;
  }
  .d-logo {
    font-size: 8pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 3pt;
  }
  .d-line {
    font-size: 5.5pt;
    color: #94a3b8;
    line-height: 1.5;
    text-align: center;
  }
  .d-barcode {
    width: 80%;
    height: 8pt;
    background: repeating-linear-gradient(
      90deg,
      #0f172a, #0f172a 1pt,
      transparent 1pt, transparent 2pt
    );
    margin-top: 3pt;
    opacity: 0.3;
  }
</style>
</head>
<body>
<div class="page">

  <div class="scanned-stamp">UTILISÉ</div>

  <!-- SECTION A -->
  <div class="section-a">
    <div class="section-a-left">
      <div class="qr-stub">
        ${qrDataUrl
          ? `<img src="${qrDataUrl}" alt="QR" />`
          : `<div style="width:100%;height:100%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:5pt;color:#94a3b8">—</div>`
        }
      </div>
      <div class="ref-stub">#${ticket.numero || '—'}</div>
    </div>
    <div class="section-a-right">SENGUICHET</div>
  </div>

  <!-- Perf -->
  <div class="perf">
    <div class="perf-dot"></div><div class="perf-line"></div>
    <div class="perf-dot"></div><div class="perf-line"></div>
    <div class="perf-dot"></div><div class="perf-line"></div>
    <div class="perf-dot"></div>
  </div>

  <!-- SECTION B -->
  <div class="section-b">
    <div class="event-title">${(ticket.eventNom || 'ÉVÉNEMENT').toUpperCase()}</div>
    <div class="event-date">${dateStr}${heureStr ? ` à ${heureStr}` : ''}</div>
    ${ticket.eventLieu ? `<div class="event-lieu">${ticket.eventLieu.toUpperCase()}</div>` : ''}
    <div class="event-meta">
      <span>${(ticket.categorie || 'STANDARD').toUpperCase()}</span>
      <span>${formatPrix(ticket.prix)}</span>
    </div>
  </div>

  <!-- Perf -->
  <div class="perf">
    <div class="perf-dot"></div><div class="perf-line"></div>
    <div class="perf-dot"></div><div class="perf-line"></div>
    <div class="perf-dot"></div><div class="perf-line"></div>
    <div class="perf-dot"></div>
  </div>

  <!-- SECTION C -->
  <div class="section-c">
    <div class="watermark"><span>SENGUICHET</span></div>
    <div class="qr-main-wrap">
      ${qrDataUrl
        ? `<img src="${qrDataUrl}" alt="QR" />`
        : `<div style="width:100%;height:100%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:5pt;color:#94a3b8">QR non disponible</div>`
      }
    </div>
    <div class="statut-badge">${statutLabel}</div>
    <div class="acheteur-info">${ticket.telephone || ''}</div>
  </div>

  <!-- SECTION D -->
  <div class="section-d">
    <div class="d-logo">SENGUICHET</div>
    <div class="d-line">Billeterie événementielle</div>
    <div class="d-line">Entrée unique et non transférable</div>
    ${scannedStr ? `<div class="d-line">Scanné le ${scannedStr}</div>` : ''}
    <div class="d-barcode"></div>
  </div>

</div>
</body>
</html>`
}

// Génère un fichier PDF du ticket et ouvre le menu de partage/impression
export async function genererTicketPDF(ticket, qrDataUrl) {
  const logoB64 = await getLogoBase64()
  const html = construireHtmlTicket(ticket, qrDataUrl, logoB64)

  const nomEvent = (ticket.eventNom || 'billet')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '').trim()

  let dateStr = ''
  if (ticket.eventDate) {
    try {
      const d = new Date(ticket.eventDate)
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('fr-FR').replace(/\//g, '-')
      } else if (ticket.eventDate.includes('/')) {
        dateStr = ticket.eventDate.split('/').reverse().join('-')
      } else {
        dateStr = ticket.eventDate
      }
    } catch {
      dateStr = ticket.eventDate
    }
  }
  const nomFichier = `Billet - ${nomEvent}${dateStr ? ` - ${dateStr}` : ''}.pdf`

  const { uri } = await Print.printToFileAsync({
    html,
    width: W,
    height: H,
  })

  const pdfPath = `${FileSystem.cacheDirectory}${nomFichier}`
  await FileSystem.moveAsync({ from: uri, to: pdfPath })

  const disponible = await Sharing.isAvailableAsync()
  if (disponible) {
    await Sharing.shareAsync(pdfPath, {
      mimeType: 'application/pdf',
      dialogTitle: `Billet ${ticket.eventNom}`,
      UTI: 'com.adobe.pdf',
    })
  } else {
    Alert.alert(
      'Partage non disponible',
      "Le partage n'est pas disponible sur cet appareil. Le fichier PDF a été sauvegardé."
    )
  }

  return uri
}

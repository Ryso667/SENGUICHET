// Service de génération de ticket PDF — layout ticket classique
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FS from 'expo-file-system'
import * as FileSystem from 'expo-file-system/legacy'
import { Asset } from 'expo-asset'
import { Alert } from 'react-native'
import { formatDateTicket, formatDatetimeLong } from '../utils/dateUtils'

// Logo en base64 mis en cache côté module (initialisation paresseuse)
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

// Template du ticket vertical thermique — dimensions adaptées pour PDF 300pt × 420pt
const TICKET_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=300">
<title>Billet {{NUMERO}} — SENGUICHET</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 300pt;
    height: 420pt;
    font-family: 'Courier New', 'Courier', monospace;
    background: #fafafa;
  }
  .ticket {
    width: 300pt;
    height: 420pt;
    background: #fafafa;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
  }
  .perf {
    width: 100%;
    border: none;
    border-top: 1.5px dashed #cbd5e1;
    margin: 12pt 0;
    position: relative;
  }
  .perf::after {
    content: '\\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB \\25CB';
    display: block;
    text-align: center;
    font-size: 5pt;
    color: #94a3b8;
    letter-spacing: 2px;
    position: absolute;
    top: -8px;
    width: 100%;
  }
  .section-a {
    height: 80pt;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(90deg);
    transform-origin: center center;
    margin: 30pt 0;
  }
  .section-a .qr-small {
    width: 60pt;
    height: 60pt;
    margin: 0 12pt;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .section-a .qr-small img {
    width: 60pt;
    height: 60pt;
    display: block;
  }
  .section-a .ticket-num {
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
  }
  .section-a .barcode {
    font-size: 8pt;
    letter-spacing: 2px;
    color: #64748b;
    white-space: nowrap;
  }
  .section-b {
    height: 80pt;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(270deg);
    transform-origin: center center;
    margin: 30pt 0;
  }
  .section-b .ticket-num {
    font-size: 14pt;
    font-weight: 700;
    letter-spacing: 1px;
    white-space: nowrap;
    margin: 0 12pt;
  }
  .section-b .price {
    font-size: 22pt;
    font-weight: 900;
    color: #0f172a;
    white-space: nowrap;
    margin: 0 12pt;
  }
  .section-b .barcode {
    font-size: 8pt;
    letter-spacing: 2px;
    color: #64748b;
    white-space: nowrap;
  }
  .section-c {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    min-height: 140pt;
  }
  .section-c .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 48pt;
    font-weight: 900;
    color: rgba(99, 102, 241, 0.06);
    letter-spacing: 4px;
    text-align: center;
    line-height: 1.2;
    pointer-events: none;
    white-space: pre;
  }
  .section-c .qr-large {
    width: 90pt;
    height: 90pt;
    z-index: 1;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .section-c .qr-large img {
    width: 90pt;
    height: 90pt;
    display: block;
  }
  .section-c .price-side {
    writing-mode: vertical-rl;
    font-size: 16pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 2px;
    position: absolute;
    right: 8pt;
    top: 50%;
    transform: translateY(-50%);
    padding-left: 6pt;
    border-left: 1px solid #cbd5e1;
  }
  .section-d {
    background: #2563eb;
    color: white;
    padding: 14pt 10pt;
    text-align: center;
    flex-shrink: 0;
  }
  .section-d .platform {
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 3px;
    opacity: 0.7;
    margin-bottom: 6pt;
  }
  .section-d .event-title {
    font-size: 16pt;
    font-weight: 800;
    letter-spacing: 1px;
    margin-bottom: 5pt;
  }
  .section-d .event-venue {
    font-size: 10pt;
    opacity: 0.85;
    letter-spacing: 0.5px;
    margin-bottom: 4pt;
    line-height: 1.4;
  }
  .section-d .event-datetime {
    font-size: 12pt;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 6pt;
  }
  .section-d .legal {
    font-size: 7pt;
    opacity: 0.5;
    letter-spacing: 0.3px;
    border-top: 0.5px solid rgba(255,255,255,0.3);
    padding-top: 5pt;
  }
  .status-badge {
    position: absolute;
    top: 10pt;
    right: 10pt;
    font-size: 8pt;
    font-weight: 700;
    padding: 3pt 6pt;
    border-radius: 4pt;
    z-index: 5;
  }
  .status-badge.valide { background: #dcfce7; color: #166534; }
  .status-badge.utilise { background: #fee2e2; color: #991b1b; }
  .status-badge.exire { background: #fef3c7; color: #92400e; }
</style>
</head>
<body>
<div class="ticket">
  <div class="status-badge {{STATUT_CLASS}}">{{STATUT_LABEL}}</div>

  <div class="section-a">
    <span class="ticket-num">{{NUMERO}}</span>
    <div class="qr-small">{{QR_CODE_A}}</div>
    <span class="barcode">{{CODE_BARRES}}</span>
  </div>

  <div class="perf"></div>

  <div class="section-b">
    <span class="ticket-num">{{NUMERO}}</span>
    <span class="price">{{PRIX}}</span>
    <span class="barcode">{{CODE_BARRES}}</span>
  </div>

  <div class="perf"></div>

  <div class="section-c">
    <div class="watermark">{{WATERMARK}}</div>
    <div class="qr-large">{{QR_CODE_C}}</div>
    <div class="price-side">{{PRIX}}</div>
  </div>

  <div class="perf"></div>

  <div class="section-d">
    <div class="platform">S E N G U I C H E T</div>
    <div class="event-title">{{TITRE_EVENEMENT}}</div>
    <div class="event-venue">{{LIEU}}</div>
    <div class="event-datetime">{{DATE_HEURE}}</div>
    <div class="legal">Entrée unique et non transférable</div>
  </div>
</div>
</body>
</html>`;

function construireHtmlTicket(ticket, qrDataUrl, logoBase64) {
  const isScanned = ticket.statut === 'utilise';
  const numero = `#${ticket.numero || '—'}`;
  const prix = ticket.prix ? `${Number(ticket.prix).toLocaleString('fr-FR')} FCFA` : '—';
  const codeBarres = (ticket.numero || '0000000000000000').padStart(16, '0').replace(/(.{4})/g, '$1-').slice(0, 19);
  const watermark = 'SENGUICHET\\nSENGUICHET';
  const evenement = (ticket.categorie ? `${(ticket.eventNom || 'ÉVÉNEMENT').toUpperCase()} — ${ticket.categorie.toUpperCase()}` : (ticket.eventNom || 'ÉVÉNEMENT').toUpperCase());
  const lieu = (ticket.eventLieu || '').toUpperCase();
  const dateStr = formatDateTicket(ticket.eventDate);
  const heureStr = ticket.eventHeure || '';
  const dateHeure = heureStr ? `${dateStr} À ${heureStr}`.toUpperCase() : dateStr.toUpperCase();

  let statutClass = 'valide';
  let statutLabel = '✓ VALIDE';
  if (isScanned) {
    statutClass = 'utilise';
    statutLabel = '✕ UTILISÉ';
  }

  const qrA = qrDataUrl
    ? `<img src="${qrDataUrl}" alt="QR A" />`
    : '<div style="width:60pt;height:60pt;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#94a3b8">QR A</div>';

  const qrC = qrDataUrl
    ? `<img src="${qrDataUrl}" alt="QR C" />`
    : '<div style="width:90pt;height:90pt;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#94a3b8">QR C</div>';

  let html = TICKET_HTML_TEMPLATE
    .replace(/\{\{NUMERO\}\}/g, numero)
    .replace(/\{\{PRIX\}\}/g, prix)
    .replace(/\{\{CODE_BARRES\}\}/g, codeBarres)
    .replace(/\{\{WATERMARK\}\}/g, watermark)
    .replace(/\{\{TITRE_EVENEMENT\}\}/g, evenement)
    .replace(/\{\{LIEU\}\}/g, lieu)
    .replace(/\{\{DATE_HEURE\}\}/g, dateHeure)
    .replace(/\{\{STATUT_CLASS\}\}/g, statutClass)
    .replace(/\{\{STATUT_LABEL\}\}/g, statutLabel)
    .replace(/\{\{QR_CODE_A\}\}/g, qrA)
    .replace(/\{\{QR_CODE_C\}\}/g, qrC);

  // Overlay scanned mark sur le QR central
  if (isScanned) {
    html = html.replace(
      '</div>',
      '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60pt;height:60pt;border-radius:50%;background:rgba(220,38,38,0.85);display:flex;align-items:center;justify-content:center;z-index:10"><span style="font-size:32pt;color:white;font-weight:900;line-height:1">✕</span></div></div>'
    );
  }

  return html;
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
    width: 300,
    height: 420,
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

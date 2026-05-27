// Service de génération de ticket PDF — layout ticket classique
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import { Alert } from 'react-native'

function formatDateTicket(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('/')) {
    const [j, m, a] = dateStr.split('/')
    return `${j.padStart(2, '0')}-${m.padStart(2, '0')}-${a}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
    }
  }
  return dateStr
}

function formatDatetimeLong(dateStr) {
  if (!dateStr) return ''
  if (dateStr.includes('T')) {
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) {
      const jj = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      const sec = String(d.getSeconds()).padStart(2, '0')
      return `${jj}-${mm}-${d.getFullYear()} ${hh}:${min}:${sec}`
    }
  }
  return dateStr
}

function formatPrix(prix) {
  if (prix == null) return '—'
  return `${Number(prix).toLocaleString('fr-FR')} FCFA`
}

  const DASHES = '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -'

function construireHtmlTicket(ticket, qrDataUrl) {
  const isScanned = ticket.statut === 'utilise'
  const organisateur = 'SENGUICHET'
  const dateStr = formatDateTicket(ticket.eventDate)
  const scannedStr = ticket.dateScan ? formatDatetimeLong(ticket.dateScan) : null

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=300">
<title>Billet ${ticket.eventNom} — SENGUICHET</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 300pt;
    height: 420pt;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #0f172a;
    background: #ffffff;
  }
  .page {
    width: 300pt;
    height: 420pt;
    padding: 6pt 10pt;
    display: flex;
    flex-direction: column;
    text-align: center;
    overflow: hidden;
  }
  .top-block { flex-shrink: 0; }
  .bottom-block { flex-shrink: 0; }

  /* En-tête */
  .header { margin-bottom: 3pt; }
  .logo-circle {
    width: 28pt; height: 28pt;
    border-radius: 50%;
    background: #EEF2FF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14pt;
    margin-bottom: 3pt;
  }
  .org-name {
    font-size: 9pt;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 2px;
  }

  /* Ligne de tirets */
  .dash {
    font-size: 6pt;
    color: #cbd5e1;
    letter-spacing: -1px;
    margin: 3pt 0;
    width: 100%;
  }

  /* Nom événement */
  .event-name {
    font-size: 15pt;
    font-weight: 800;
    line-height: 1.3;
    letter-spacing: 0.5px;
    width: 100%;
  }

  /* Infos */
  .info-line {
    font-size: 11pt;
    font-weight: 700;
    color: #0f172a;
    width: 100%;
  }
  .venue {
    font-size: 10pt;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 1px;
    width: 100%;
  }
  .ref {
    font-size: 10pt;
    font-weight: 800;
    color: #64748b;
    letter-spacing: 0.5px;
    width: 100%;
    margin-bottom: 2pt;
  }

  /* QR */
  .qr-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
  .qr-wrap {
    position: relative;
    display: inline-block;
    padding: 1pt;
    background: #ffffff;
  }
  .qr-wrap img {
    width: 160pt;
    height: 160pt;
    image-rendering: pixelated;
    display: block;
  }
  .scanned-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .red-circle {
    width: 52pt; height: 52pt;
    border-radius: 50%;
    background: rgba(220, 38, 38, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .red-circle span {
    font-size: 28pt;
    color: #ffffff;
    font-weight: 800;
    line-height: 1;
  }
  .scanned-text {
    font-size: 9pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.5px;
    margin-top: 3pt;
  }

  /* Catégorie et prix */
  .categorie {
    font-size: 13pt;
    font-weight: 800;
    letter-spacing: 1.5px;
    width: 100%;
  }
  .prix {
    font-size: 12pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: 0.5px;
    width: 100%;
    margin-bottom: 3pt;
  }

  /* Footer */
  .footer {
    font-size: 8pt;
    color: #64748b;
    font-style: italic;
    width: 100%;
    line-height: 1.4;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Bloc haut : en-tête, infos, référence -->
  <div class="top-block">
    <div class="header">
      <div class="logo-circle">🎫</div>
      <div class="org-name">${organisateur}</div>
    </div>
    <div class="dash">${DASHES}</div>
    <div class="event-name">${(ticket.eventNom || 'ÉVÉNEMENT').toUpperCase()}</div>
    <div class="dash">${DASHES}</div>
    <div class="info-line">${dateStr}${ticket.eventHeure ? ` à ${ticket.eventHeure}` : ''}</div>
    ${ticket.eventLieu ? `<div class="venue">${ticket.eventLieu.toUpperCase()}</div>` : ''}
    <div class="dash">${DASHES}</div>
    <div class="ref">REF : ${ticket.numero || '—'}</div>
  </div>

  <!-- Bloc milieu : QR Code (flex:1 s'étire pour remplir) -->
  <div class="qr-section">
    <div class="qr-wrap">
      ${qrDataUrl
        ? `<img src="${qrDataUrl}" alt="QR Code billet" />`
        : `<div style="width:160pt;height:160pt;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-size:7pt;color:#94a3b8">QR non disponible</div>`
      }
      ${isScanned ? `
      <div class="scanned-overlay">
        <div class="red-circle"><span>✕</span></div>
      </div>` : ''}
    </div>
    ${isScanned && scannedStr ? `<div class="scanned-text">Contrôlé le ${scannedStr}</div>` : ''}
  </div>

  <!-- Bloc bas : catégorie, prix, footer -->
  <div class="bottom-block">
    <div class="dash">${DASHES}</div>
    <div class="categorie">${(ticket.categorie || 'STANDARD').toUpperCase()}</div>
    <div class="prix">PRIX: ${formatPrix(ticket.prix)}</div>
    <div class="dash">${DASHES}</div>
    <div class="footer">Entrée unique et non transférable</div>
  </div>

</div>
</body>
</html>`
}

// Génère un fichier PDF du ticket et ouvre le menu de partage/impression
export async function genererTicketPDF(ticket, qrDataUrl) {
  const html = construireHtmlTicket(ticket, qrDataUrl)

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

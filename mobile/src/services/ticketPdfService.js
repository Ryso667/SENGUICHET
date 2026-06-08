// Service de génération de ticket PDF — style billet physique (identique à l'app)
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import { Alert } from 'react-native'

function formatPrix(prix) {
  if (prix == null) return '—'
  return `${Number(prix).toLocaleString('fr-FR')} FCFA`
}

function construireHtmlTicket(ticket, qrDataUrl) {
  const eventNom = (ticket.eventNom || 'ÉVÉNEMENT').toUpperCase()
  const dateFormatted = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const heureStr = ticket.eventHeure || ''
  const lieuStr = (ticket.eventLieu || '').toUpperCase()
  const categorie = (ticket.categorie || 'STANDARD').toUpperCase()
  const prixStr = formatPrix(ticket.prix)
  const refStr = ticket.numero || '—'
  const dateAchat = ticket.dateAchat
    ? new Date(ticket.dateAchat).toLocaleDateString('fr-FR')
    : ''

  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" style="width:180px;height:180px;display:block" />`
    : '<div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999">QR</div>'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Billet ${eventNom}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0D1B2A;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .ticket {
    width: 340px;
    background: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    position: relative;
  }
  /* HEADER */
  .header {
    height: 140px;
    background: #FFFFFF;
    position: relative;
    overflow: hidden;
  }
  .shape1 { position:absolute; top:-20px; right:-30px; width:160px; height:160px; border-radius:80px; background:#00C8FF; opacity:0.15; }
  .shape2 { position:absolute; top:10px; right:20px; width:100px; height:100px; border-radius:50px; background:#0077FF; opacity:0.2; }
  .shape3 { position:absolute; top:40px; right:-10px; width:70px; height:70px; border-radius:35px; background:#00E5A0; opacity:0.15; }
  .shape4 { position:absolute; top:-10px; right:60px; width:50px; height:50px; border-radius:25px; background:#0077FF; opacity:0.1; }
  .header-content {
    position: absolute;
    left: 20px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .logo {
    width: 48px; height: 48px;
    background: #E8F4FD;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #0D1B2A;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }
  .header-title {
    font-size: 10px;
    font-weight: 700;
    color: #0D1B2A;
    letter-spacing: 3px;
    margin-top: 4px;
  }
  /* REFERENCE VERTICALE */
  .ref-vert {
    position: absolute;
    left: 0;
    top: 140px;
    bottom: 0;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 5;
  }
  .ref-vert-text {
    font-size: 9px;
    color: #5A7090;
    letter-spacing: 1px;
    transform: rotate(-90deg);
    white-space: nowrap;
    font-family: 'Courier New', monospace;
  }
  /* BODY */
  .body {
    padding: 20px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .body-sep {
    width: 100%;
    border-bottom: 1px dashed #E0E0E0;
    margin-bottom: 16px;
  }
  .event-name {
    font-size: 22px;
    font-weight: 900;
    color: #0D1B2A;
    text-align: center;
    letter-spacing: 0.5px;
    line-height: 1.3;
    margin-bottom: 8px;
  }
  .event-date {
    font-size: 13px;
    font-weight: 600;
    color: #5A7090;
    text-align: center;
    margin-bottom: 4px;
  }
  .event-lieu {
    font-size: 12px;
    font-weight: 700;
    color: #00C8FF;
    text-align: center;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .spacer { height: 8px; }
  /* QR */
  .qr-zone {
    width: 100%;
    display: flex;
    justify-content: center;
    border: 1px solid #E8E8E8;
    border-radius: 8px;
    padding: 12px;
    background: #FFFFFF;
  }
  /* PERFORATION */
  .perf {
    height: 20px;
    display: flex;
    align-items: center;
    position: relative;
    margin: 0 10px;
  }
  .perf-line {
    flex: 1;
    border-bottom: 1.5px dashed #CCCCCC;
    margin: 0 10px;
  }
  .perf-circle {
    width: 20px; height: 20px;
    border-radius: 10px;
    background: #0D1B2A;
    flex-shrink: 0;
  }
  /* FOOTER */
  .footer {
    background: #F7F8FA;
    padding: 20px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    position: relative;
  }
  .cat-pill {
    background: #0D1B2A;
    padding: 6px 20px;
    border-radius: 9999px;
  }
  .cat-text {
    font-size: 10px;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .price {
    font-size: 26px;
    font-weight: 900;
    color: #0D1B2A;
    text-align: center;
  }
  .legal {
    font-size: 10px;
    color: #A0B4C8;
    font-style: italic;
    text-align: center;
  }
  .watermark {
    position: absolute;
    bottom: 8px;
    right: 16px;
    font-size: 8px;
    font-weight: 700;
    color: #CCCCCC;
    letter-spacing: 1px;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .ticket { box-shadow: none; border-radius: 0; }
  }
</style>
</head>
<body>
<div class="ticket">

  <!-- HEADER -->
  <div class="header">
    <div class="shape1"></div>
    <div class="shape2"></div>
    <div class="shape3"></div>
    <div class="shape4"></div>
    <div class="header-content">
      <div class="logo">S</div>
      <div class="header-title">SENGUICHET</div>
    </div>
  </div>

  <!-- REF VERTICALE -->
  <div class="ref-vert">
    <div class="ref-vert-text">REF | ${refStr}</div>
  </div>

  <!-- CORPS -->
  <div class="body">
    <div class="body-sep"></div>

    <div class="event-name">${eventNom}</div>

    ${dateFormatted ? `<div class="event-date">${dateFormatted}${heureStr ? ' à ' + heureStr : ''}</div>` : ''}

    ${lieuStr ? `<div class="event-lieu">${lieuStr}</div>` : ''}

    <div class="spacer"></div>

    <div class="qr-zone">
      ${qrImg}
    </div>
  </div>

  <!-- PERFORATION -->
  <div class="perf">
    <div class="perf-circle"></div>
    <div class="perf-line"></div>
    <div class="perf-circle"></div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="cat-pill">
      <div class="cat-text">${categorie}</div>
    </div>
    <div class="price">${prixStr}</div>
    <div class="legal">Entrée unique et non transférable</div>
    <div class="watermark">SENGUICHET</div>
  </div>

</div>
</body>
</html>`
}

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
  const nomFichier = 'Billet - ' + nomEvent + (dateStr ? ' - ' + dateStr : '') + '.pdf'

  const { uri } = await Print.printToFileAsync({
    html,
    width: 340,
    height: 620,
  })

  const pdfPath = FileSystem.cacheDirectory + nomFichier
  await FileSystem.moveAsync({ from: uri, to: pdfPath })

  const disponible = await Sharing.isAvailableAsync()
  if (disponible) {
    await Sharing.shareAsync(pdfPath, {
      mimeType: 'application/pdf',
      dialogTitle: 'Billet ' + ticket.eventNom,
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

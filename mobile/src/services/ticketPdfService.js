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

  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" style="width:180px;height:180px;display:block" />`
    : '<div style="width:180px;height:180px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999">QR</div>'

  // Design vert émeraude premium (identique à l'app mobile)
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Billet ${eventNom}</title>
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0F1A0F;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 20px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
  }
  .ticket {
    width: 340px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    position: relative;
  }
  /* HEADER — vert forêt */
  .header {
    background: #1B4332;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .orbe1 { position:absolute; top:-30px; right:-30px; width:120px; height:120px; border-radius:60px; background:rgba(64,145,108,0.35); }
  .orbe2 { position:absolute; bottom:-20px; left:-20px; width:80px; height:80px; border-radius:40px; background:rgba(212,175,55,0.15); }
  .header-row { display:flex; align-items:center; gap:10px; }
  .logo-box {
    width:38px; height:38px; border-radius:10px;
    background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2);
    display:flex; align-items:center; justify-content:center;
  }
  .logo-box img { width:28px; height:28px; border-radius:6px; }
  .header-title {
    font-size:10px; font-weight:700; letter-spacing:3px; color:rgba(255,255,255,0.7);
  }
  .gold-line { height:1px; background:#D4AF37; opacity:0.6; margin:16px 0; }
  .event-name {
    font-size:22px; font-weight:700; color:#fff; text-align:center;
    letter-spacing:0.5px; line-height:28px;
  }
  .event-cat {
    font-size:10px; color:rgba(255,255,255,0.5); text-align:center;
    letter-spacing:2px; margin-top:6px;
  }
  /* PERFORATION */
  .perf {
    height:22px; position:relative;
    background: linear-gradient(to bottom, #1B4332, #F9F6EE);
    display:flex; align-items:center; justify-content:center;
  }
  .perf-line {
    position:absolute; left:22px; right:22px;
    border-top:2px dashed rgba(27,67,50,0.2);
  }
  .perf-c {
    position:absolute; width:22px; height:22px; border-radius:11px;
    background:#0F1A0F; z-index:2;
  }
  .perf-c.left { left:-11px; }
  .perf-c.right { right:-11px; }
  /* BODY — crème */
  .body {
    background: #F9F6EE;
    padding: 20px 24px 8px;
  }
  .body-row { display:flex; justify-content:space-between; }
  .body-label {
    font-size:8px; font-weight:700; letter-spacing:2px; color:#40916C;
    margin-bottom:2px;
  }
  .body-val {
    font-size:12px; font-weight:600; color:#1B4332;
  }
  .body-lieu {
    font-size:12px; font-weight:600; color:#40916C; letter-spacing:0.5px;
    margin-top:2px;
  }
  .body-sep { height:1px; background:rgba(27,67,50,0.1); margin:14px 0; }
  .body-ref {
    font-size:9px; color:#40916C; letter-spacing:2px; text-align:center;
    margin-bottom:4px;
  }
  .qr-zone {
    background:#fff; border-radius:12px; padding:12px; margin:14px 0;
    border:1px solid rgba(27,67,50,0.08);
    display:flex; justify-content:center;
  }
  /* PERFORATION BASSE */
  .perf-bot {
    height:22px; position:relative;
    background: linear-gradient(to bottom, #F9F6EE, #F0EAD6);
    display:flex; align-items:center; justify-content:center;
  }
  /* FOOTER — beige */
  .footer {
    background: #F0EAD6;
    border-radius: 0 0 20px 20px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    position: relative;
  }
  .badge {
    background: #1B4332;
    border-radius: 999px;
    padding: 5px 20px;
  }
  .badge-text {
    font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
    color: #D4AF37;
  }
  .price {
    font-size: 28px; font-weight: 700; color: #1B4332;
    letter-spacing: -0.5px; text-align: center;
  }
  .legal {
    font-size: 9px; color: #40916C; font-style: italic; text-align: center;
  }
  .watermark {
    font-size: 8px; color: rgba(27,67,50,0.3); letter-spacing: 2px;
    align-self: flex-end; margin-right: 4px;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .ticket { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="ticket">

  <!-- HEADER -->
  <div class="header">
    <div class="orbe1"></div>
    <div class="orbe2"></div>
    <div class="header-row">
      <div class="logo-box">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 28 28'%3E%3Crect width='28' height='28' fill='%23D4AF37' rx='4'/%3E%3Ctext x='14' y='20' text-anchor='middle' font-size='16' font-weight='bold' fill='%231B4332'%3ES%3C/text%3E%3C/svg%3E" alt="S" />
      </div>
      <div class="header-title">SENGUICHET</div>
    </div>
    <div class="gold-line"></div>
    <div class="event-name">${eventNom}</div>
    <div class="event-cat">${categorie}</div>
  </div>

  <!-- PERFORATION HAUTE -->
  <div class="perf">
    <div class="perf-line"></div>
    <div class="perf-c left"></div>
    <div class="perf-c right"></div>
  </div>

  <!-- CORPS -->
  <div class="body">
    <div class="body-row">
      <div>
        <div class="body-label">DATE</div>
        <div class="body-val">${dateFormatted}</div>
      </div>
      ${heureStr ? '<div style="text-align:right">' +
        '<div class="body-label">HEURE</div>' +
        '<div class="body-val">' + heureStr + '</div>' +
      '</div>' : ''}
    </div>

    ${lieuStr ? '<div style="margin-top:10px">' +
      '<div class="body-label">LIEU</div>' +
      '<div class="body-lieu">' + lieuStr + '</div>' +
    '</div>' : ''}

    <div class="body-sep"></div>

    <div class="body-ref">REF · ${refStr}</div>

    <div class="qr-zone">
      ${qrImg}
    </div>
  </div>

  <!-- PERFORATION BASSE -->
  <div class="perf-bot">
    <div class="perf-line"></div>
    <div class="perf-c left"></div>
    <div class="perf-c right"></div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="badge">
      <div class="badge-text">${categorie}</div>
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

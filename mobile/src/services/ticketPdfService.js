// Service de génération de ticket PDF — format paysage, design vert émeraude, 3 colonnes
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import { Asset } from 'expo-asset'
import { Alert } from 'react-native'

// Charge le logo et le convertit en base64 pour injection dans le HTML du PDF
async function chargerLogoBase64() {
  try {
    const asset = Asset.fromModule(require('../../assets/logo_mobile.jpeg'))
    await asset.downloadAsync()
    const b64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return `data:image/jpeg;base64,${b64}`
  } catch {
    return null
  }
}

function formatPrix(prix) {
  if (prix == null) return '—'
  return `${Number(prix).toLocaleString('fr-FR')} FCFA`
}

function construireHtmlTicket(ticket, qrDataUrl, logoBase64) {
  const eventNom = (ticket.eventNom || 'ÉVÉNEMENT').toUpperCase()
  const dateFormatted = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const heureStr = ticket.eventHeure || ''
  const lieuStr = (ticket.eventLieu || '').toUpperCase()
  const categorie = (ticket.categorie || 'STANDARD').toUpperCase()
  const prixStr = formatPrix(ticket.prix)
  const refStr = ticket.numero || '—'

  const catStr = ticket.categorie || 'STANDARD'

  const logoImg = logoBase64
    ? `<img src="${logoBase64}" style="width:48px;height:48px;border-radius:10px;border:2px solid rgba(255,255,255,0.2);display:block" />`
    : '<div style="width:48px;height:48px;border-radius:10px;background:#1B4332;border:2px solid rgba(255,255,255,0.2)"></div>'

  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" style="width:160px;height:160px;display:block" />`
    : '<div style="width:160px;height:160px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#999">QR</div>'

  const statutOverlay = ticket.statut === 'utilise'
    ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,77,109,0.9);border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:700;">✕</div>'
    : ''

  // Design paysage 3 colonnes — palette vert émeraude #1B4332 / #40916C / #D4AF37 / #F9F6EE / #F0EAD6
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>Billet ${eventNom}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    background: #0F1A0F;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    padding: 24px;
    font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif;
  }
  .ticket {
    display: flex;
    flex-direction: row;
    width: 100%;
    max-width: 780px;
    height: 480px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    position: relative;
  }

  /* ===== COLONNE GAUCHE — HEADER ===== */
  .col-left {
    width: 25%;
    background: #1B4332;
    border-radius: 20px 0 0 20px;
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;
    padding: 32px 20px;
    flex-shrink: 0;
  }
  .col-left .orbe1 {
    position: absolute; top: -40px; right: -40px;
    width: 140px; height: 140px; border-radius: 50%;
    background: rgba(64,145,108,0.35);
  }
  .col-left .orbe2 {
    position: absolute; bottom: -30px; left: -30px;
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(212,175,55,0.15);
  }
  .col-left .brand {
    font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.7);
    font-weight: 600; text-transform: uppercase;
    position: relative; z-index: 1;
  }
  .col-left .gold-line {
    width: 60px; height: 1px; background: #D4AF37; opacity: 0.7;
    position: relative; z-index: 1;
  }
  .col-left .event-name {
    font-size: 22px; font-weight: 800; color: #fff;
    text-align: center; line-height: 1.25;
    position: relative; z-index: 1;
  }
  .col-left .event-sub {
    font-size: 9px; color: rgba(255,255,255,0.5);
    letter-spacing: 2px; text-transform: uppercase;
    position: relative; z-index: 1;
  }
  .col-left .logo-wrap {
    position: relative; z-index: 1;
  }

  /* ===== SÉPARATEUR PERFORÉ VERTICAL ===== */
  .sep {
    width: 24px;
    position: relative;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sep.dark-cream {
    background: linear-gradient(to right, #1B4332, #F9F6EE);
  }
  .sep.cream-beige {
    background: linear-gradient(to right, #F9F6EE, #F0EAD6);
  }
  .sep .dash {
    position: absolute; left: 50%; top: 0; bottom: 0;
    border-left: 2px dashed rgba(27,67,50,0.2);
  }
  .sep .sc {
    position: absolute; left: 50%; transform: translateX(-50%);
    width: 24px; height: 24px; border-radius: 50%;
    background: #0F1A0F; z-index: 2;
  }
  .sep .sc.top { top: -12px; }
  .sep .sc.bot { bottom: -12px; }

  /* ===== COLONNE CENTRALE — CORPS ===== */
  .col-center {
    width: 45%;
    background: #F9F6EE;
    padding: 36px 28px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 16px;
    flex-shrink: 0;
  }
  .col-center .row2 {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .col-center .lbl {
    font-size: 8px; letter-spacing: 2px; color: #40916C;
    font-weight: 600; text-transform: uppercase; margin-bottom: 3px;
  }
  .col-center .val {
    font-size: 13px; color: #1B4332;
    font-weight: 600; font-family: 'Outfit', sans-serif;
  }
  .col-center .lieu {
    color: #40916C; letter-spacing: 0.5px;
    font-weight: 700; font-size: 13px;
  }
  .col-center .sep-line {
    height: 1px; background: rgba(27,67,50,0.1);
  }
  .col-center .ref {
    font-size: 9px; color: #40916C; letter-spacing: 2px;
    text-align: center; font-family: monospace;
  }
  .col-center .qr-wrap {
    background: #fff; border-radius: 12px; padding: 12px;
    border: 1px solid rgba(27,67,50,0.08);
    display: flex; justify-content: center; align-items: center;
    align-self: center; position: relative;
  }

  /* ===== COLONNE DROITE — SOUCHE ===== */
  .col-right {
    width: 30%;
    background: #F0EAD6;
    border-radius: 0 20px 20px 0;
    padding: 32px 24px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 16px;
    position: relative;
    flex-shrink: 0;
  }
  .col-right .badge {
    background: #1B4332;
    border-radius: 999px;
    padding: 6px 24px;
  }
  .col-right .badge-text {
    font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
    color: #D4AF37; text-transform: uppercase;
    font-family: 'Outfit', sans-serif;
  }
  .col-right .price {
    font-size: 32px; font-weight: 800; color: #1B4332;
    font-family: 'Outfit', sans-serif; letter-spacing: -0.5px;
    text-align: center;
  }
  .col-right .legal {
    font-size: 9px; color: #40916C; font-style: italic; text-align: center;
  }
  .col-right .thin-sep {
    width: 40px; height: 1px; background: rgba(27,67,50,0.15);
  }
  .col-right .info {
    text-align: center;
  }
  .col-right .info .ilbl {
    font-size: 8px; letter-spacing: 2px; color: #40916C;
    font-weight: 600; text-transform: uppercase; margin-bottom: 2px;
  }
  .col-right .info .ival {
    font-size: 11px; font-weight: 700; color: #1B4332;
  }
  .col-right .info .iref {
    font-size: 9px; color: #40916C; font-family: monospace; letter-spacing: 1px;
  }
  .col-right .wm {
    font-size: 8px; color: rgba(27,67,50,0.25);
    letter-spacing: 3px; position: absolute; bottom: 16px; right: 16px;
  }
</style>
</head>
<body>
<div class="ticket">

  <!-- COLONNE GAUCHE : Header -->
  <div class="col-left">
    <div class="orbe1"></div>
    <div class="orbe2"></div>
    <div class="logo-wrap">${logoImg}</div>
    <div class="brand">SENGUICHET</div>
    <div class="gold-line"></div>
    <div class="event-name">${eventNom}</div>
    <div class="event-sub">${categorie}</div>
  </div>

  <!-- SÉPARATEUR PERFORÉ -->
  <div class="sep dark-cream">
    <div class="dash"></div>
    <div class="sc top"></div>
    <div class="sc bot"></div>
  </div>

  <!-- COLONNE CENTRALE : Corps -->
  <div class="col-center">
    <div class="row2">
      <div>
        <div class="lbl">DATE</div>
        <div class="val">${dateFormatted}</div>
      </div>
      ${heureStr ? '<div style="text-align:right">' +
        '<div class="lbl">HEURE</div>' +
        '<div class="val">' + heureStr + '</div>' +
      '</div>' : ''}
    </div>

    ${lieuStr ? '<div>' +
      '<div class="lbl">LIEU</div>' +
      '<div class="lieu">' + lieuStr + '</div>' +
    '</div>' : ''}

    <div class="sep-line"></div>

    <div class="ref">REF · ${refStr}</div>

    <div class="qr-wrap" style="${statutOverlay ? 'position:relative' : ''}">
      ${qrImg}
      ${statutOverlay}
    </div>
  </div>

  <!-- SÉPARATEUR PERFORÉ -->
  <div class="sep cream-beige">
    <div class="dash"></div>
    <div class="sc top"></div>
    <div class="sc bot"></div>
  </div>

  <!-- COLONNE DROITE : Souche -->
  <div class="col-right">
    <div class="badge">
      <div class="badge-text">${categorie}</div>
    </div>
    <div class="price">${prixStr}</div>
    <div class="legal">Entrée unique et non transférable</div>
    <div class="thin-sep"></div>
    <div class="info">
      <div class="ilbl">Catégorie</div>
      <div class="ival">${catStr}</div>
      <div style="margin-top:6px">
        <div class="ilbl">Billet N°</div>
        <div class="iref">${refStr}</div>
      </div>
    </div>
    <div class="wm">SENGUICHET</div>
  </div>

</div>
</body>
</html>`
}

export async function genererTicketPDF(ticket, qrDataUrl) {
  const logoBase64 = await chargerLogoBase64()
  const html = construireHtmlTicket(ticket, qrDataUrl, logoBase64)

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
    width: 841,
    height: 595,
    margins: { top: 0, bottom: 0, left: 0, right: 0 },
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

// Service de génération de ticket PDF — format portrait, design vert émeraude (identique à TicketScreen.js)
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

  const logoImg = logoBase64
    ? `<img src="${logoBase64}" style="width:38px;height:38px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);display:block" />`
    : '<div style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2)"></div>'

  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" style="width:160px;height:160px;display:block" />`
    : '<div style="width:160px;height:160px;"></div>'

  const statutOverlay = (ticket.statut || '').toLowerCase() === 'utilise' || (ticket.statut || '').toLowerCase() === 'expire'
    ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,77,109,0.9);border-radius:50%;width:64px;height:64px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:700;">✕</div>'
    : ''

  const isUsed = (ticket.statut || '').toLowerCase() === 'utilise'
  const isExpired = (ticket.statut || '').toLowerCase() === 'expire'
  const watermarkLabel = isExpired ? 'EXPIRÉ' : 'UTILISÉ'
  const watermarkColor = isExpired ? '#FF4D6D' : '#66BB6A'
  const showWatermark = isUsed || isExpired

  // Design portrait — identique au TicketScreen.js
  // Header vert #10B981 → perforation → corps crème #F9F6EE → perforation → souche beige #F0EAD6
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
    min-height: 100vh;
    padding: 24px;
    font-family: 'Outfit', 'Helvetica Neue', Arial, sans-serif;
  }
  .ticket {
    width: 100%;
    max-width: 360px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
    position: relative;
  }

  /* ===== HEADER ===== */
  .header {
    background: #10B981;
    padding: 32px 28px;
    position: relative;
    overflow: hidden;
    text-align: center;
  }
  .header .orbe1 {
    position: absolute; top: -40px; right: -40px;
    width: 140px; height: 140px; border-radius: 50%;
    background: rgba(16,185,129,0.3);
  }
  .header .orbe2 {
    position: absolute; bottom: -30px; left: -30px;
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(245,158,11,0.12);
  }
  .header .orbe3 {
    position: absolute; top: 60px; left: -20px;
    width: 60px; height: 60px; border-radius: 50%;
    background: rgba(255,255,255,0.03);
  }
  .logo-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .logo-wrap {
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .brand {
    font-size: 10px; letter-spacing: 3px; color: rgba(255,255,255,0.7);
    font-weight: 700;
  }
  .gold-line {
    height: 1px; background: #F59E0B; opacity: 0.5;
    margin: 20px auto 18px; width: 80%;
  }
  .event-name {
    font-size: 22px; font-weight: 800; color: #fff;
    text-align: center; letter-spacing: 0.5px;
    line-height: 1.25;
  }
  .cat-pill {
    display: inline-block;
    background: rgba(245,158,11,0.15);
    border-radius: 999px;
    padding: 4px 14px;
    margin-top: 10px;
  }
  .cat-pill-text {
    font-size: 9px; font-weight: 700; letter-spacing: 2px;
    color: #F59E0B;
  }

  /* ===== PERFORATION ===== */
  .perf {
    height: 24px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .perf.green-cream { background: linear-gradient(to bottom, #10B981, #F9F6EE); }
  .perf.cream-beige { background: linear-gradient(to bottom, #F9F6EE, #F0EAD6); }
  .perf .dash-line {
    display: flex;
    justify-content: space-evenly;
    align-items: center;
    width: calc(100% - 60px);
    position: absolute;
    left: 30px; right: 30px;
  }
  .perf .dash {
    width: 5px; height: 2px;
    background: #3D4356;
    border-radius: 1px;
  }
  .perf .hc {
    position: absolute;
    top: 50%;
    width: 24px; height: 24px;
    border-radius: 50%;
    background: #0F1A0F;
    margin-top: -12px;
  }
  .perf .hc.left { left: -12px; }
  .perf .hc.right { right: -12px; }

  /* ===== BODY ===== */
  .body {
    background: #F9F6EE;
    padding: 28px 28px 16px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
  }
  .info-block {
    flex: 1;
  }
  .info-block-right {
    text-align: right;
  }
  .info-label {
    font-size: 8px; letter-spacing: 2px; color: #6EE7B7;
    font-weight: 700; margin-bottom: 3px;
  }
  .info-value {
    font-size: 14px; font-weight: 600; color: #111827;
  }
  .lieu-block {
    margin-top: 14px;
  }
  .lieu-label {
    font-size: 8px; letter-spacing: 2px; color: #6EE7B7;
    font-weight: 700; margin-bottom: 3px;
  }
  .lieu-value {
    font-size: 13px; font-weight: 600; color: #6EE7B7;
    letter-spacing: 0.5px;
  }
  .separator {
    height: 1px; background: rgba(17,24,39,0.08);
    margin: 18px 0;
  }
  .ref-text {
    font-size: 9px; color: #6EE7B7;
    text-align: center; letter-spacing: 2px;
    font-family: monospace;
    margin-bottom: 6px;
  }
  .qr-wrap {
    background: #fff; border-radius: 14px; padding: 16px;
    margin-top: 10px; margin-bottom: 6px;
    border: 1px solid rgba(17,24,39,0.06);
    display: flex; justify-content: center; align-items: center;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  /* ===== FOOTER ===== */
  .footer {
    background: #F0EAD6;
    padding: 24px 28px;
    text-align: center;
    position: relative;
  }
  .footer .badge {
    background: #10B981;
    border-radius: 999px;
    display: inline-block;
    padding: 6px 24px;
    margin-bottom: 10px;
  }
  .footer .badge-text {
    font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
    color: #F59E0B;
  }
  .footer .price {
    font-size: 28px; font-weight: 800; color: #111827;
    letter-spacing: -0.5px;
  }
  .footer .legal {
    font-size: 9px; color: #6EE7B7;
    font-style: italic; margin-top: 10px;
  }
  .footer .wm {
    font-size: 8px; color: rgba(17,24,39,0.25);
    letter-spacing: 3px; font-weight: 700;
    text-align: right;
    margin-top: 4px;
  }

  /* ===== WATERMARK ===== */
  .watermark {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .watermark-text {
    font-size: 60px; font-weight: 800;
    letter-spacing: 8px;
    opacity: 0.12;
    transform: rotate(-30deg);
  }
</style>
</head>
<body>
<div class="ticket">

  <!-- HEADER -->
  <div class="header">
    <div class="orbe1"></div>
    <div class="orbe2"></div>
    <div class="orbe3"></div>
    <div class="logo-row">
      <div class="logo-wrap">${logoImg}</div>
      <div class="brand">SENGUICHET</div>
    </div>
    <div class="gold-line"></div>
    <div class="event-name">${eventNom}</div>
    <div class="cat-pill">
      <div class="cat-pill-text">${categorie}</div>
    </div>
  </div>

  <!-- PERFORATION HAUTE -->
  <div class="perf green-cream">
    <div class="dash-line">${'<div class="dash"></div>'.repeat(30)}</div>
    <div class="hc left"></div>
    <div class="hc right"></div>
  </div>

  <!-- BODY -->
  <div class="body">
    <div class="info-row">
      <div class="info-block">
        <div class="info-label">DATE</div>
        <div class="info-value">${dateFormatted || '—'}</div>
      </div>
      <div class="info-block info-block-right">
        <div class="info-label">HEURE</div>
        <div class="info-value">${heureStr || '—'}</div>
      </div>
    </div>

    <div class="lieu-block">
      <div class="lieu-label">LIEU</div>
      <div class="lieu-value">${lieuStr || 'À VENIR'}</div>
    </div>

    <div class="separator"></div>

    <div class="ref-text">REF · ${refStr}</div>

    <div class="qr-wrap">
      ${qrImg}
      ${showWatermark ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,77,109,0.9);border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;font-weight:700;">✕</div>' : ''}
    </div>
  </div>

  <!-- PERFORATION BASSE -->
  <div class="perf cream-beige">
    <div class="dash-line">${'<div class="dash"></div>'.repeat(30)}</div>
    <div class="hc left"></div>
    <div class="hc right"></div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="badge">
      <div class="badge-text">${categorie}</div>
    </div>
    <div class="price">${prixStr}</div>
    <div class="legal">Entrée unique et non transférable</div>
    <div class="wm">SENGUICHET</div>
  </div>

  ${showWatermark ? '<div class="watermark"><div class="watermark-text" style="color:' + watermarkColor + '">' + watermarkLabel + '</div></div>' : ''}

</div>
</body>
</html>`
}

// Génère le HTML du ticket pour l'export web (format portrait, palette vert émeraude)
export function genererHtmlWebTicket(ticket, qrDataUrl) {
  const nomEvent = (ticket.eventNom || 'ÉVÉNEMENT').toUpperCase()
  const dateFmt = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const heure = ticket.eventHeure || ''
  const lieu = (ticket.eventLieu || '').toUpperCase()
  const categorie = (ticket.categorie || 'STANDARD').toUpperCase()
  const prix = ticket.prix ? `${Number(ticket.prix).toLocaleString('fr-FR')} FCFA` : '—'
  const ref = ticket.numero || '—'
  const isUsed = (ticket.statut || '').toLowerCase() === 'utilise'
  const isExpired = (ticket.statut || '').toLowerCase() === 'expire'
  const showWatermark = isUsed || isExpired
  const watermarkLabel = isExpired ? 'EXPIRÉ' : 'UTILISÉ'
  const watermarkColor = isExpired ? '#FF4D6D' : '#66BB6A'
  const qrImg = qrDataUrl
    ? `<img src="${qrDataUrl}" style="width:160px;height:160px;display:block" />`
    : '<div style="width:160px;height:160px;"></div>'

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/><title>Billet ${nomEvent}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page{margin:0}*{margin:0;padding:0;box-sizing:border-box}
  html,body{height:100%}
  body{background:#0F1A0F;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:24px;font-family:'Outfit','Helvetica Neue',Arial,sans-serif}
  .t{width:100%;max-width:360px;border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.35);position:relative}
  .h{background:#10B981;padding:32px 28px;position:relative;overflow:hidden;text-align:center}
  .h .o1{position:absolute;top:-40px;right:-40px;width:140px;height:140px;border-radius:50%;background:rgba(16,185,129,0.3)}
  .h .o2{position:absolute;bottom:-30px;left:-30px;width:100px;height:100px;border-radius:50%;background:rgba(245,158,11,0.12)}
  .lr{display:flex;align-items:center;justify-content:center;gap:10px}
  .br{font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.7);font-weight:700}
  .gl{height:1px;background:#F59E0B;opacity:0.5;margin:20px auto 18px;width:80%}
  .en{font-size:22px;font-weight:800;color:#fff;text-align:center;letter-spacing:0.5px;line-height:1.25}
  .cp{display:inline-block;background:rgba(245,158,11,0.15);border-radius:999px;padding:4px 14px;margin-top:10px}
  .ct{font-size:9px;font-weight:700;letter-spacing:2px;color:#F59E0B}
  .pf{height:24px;position:relative;display:flex;align-items:center;justify-content:center}
  .pf.gc{background:linear-gradient(to bottom,#10B981,#F9F6EE)}
  .pf.cb{background:linear-gradient(to bottom,#F9F6EE,#F0EAD6)}
  .pf .dl{display:flex;justify-content:space-evenly;align-items:center;width:calc(100% - 60px);position:absolute;left:30px;right:30px}
  .pf .d{width:5px;height:2px;background:#3D4356;border-radius:1px}
  .pf .hc{position:absolute;top:50%;width:24px;height:24px;border-radius:50%;background:#0F1A0F;margin-top:-12px}
  .pf .hc.l{left:-12px}.pf .hc.r{right:-12px}
  .b{background:#F9F6EE;padding:28px 28px 16px}
  .ir{display:flex;justify-content:space-between}
  .ib{flex:1}.ibr{text-align:right}
  .il{font-size:8px;letter-spacing:2px;color:#6EE7B7;font-weight:700;margin-bottom:3px}
  .iv{font-size:14px;font-weight:600;color:#111827}
  .lb{margin-top:14px}
  .ll{font-size:8px;letter-spacing:2px;color:#6EE7B7;font-weight:700;margin-bottom:3px}
  .lv{font-size:13px;font-weight:600;color:#6EE7B7;letter-spacing:0.5px}
  .sl{height:1px;background:rgba(17,24,39,0.08);margin:18px 0}
  .rt{font-size:9px;color:#6EE7B7;text-align:center;letter-spacing:2px;font-family:monospace;margin-bottom:6px}
  .qw{background:#fff;border-radius:14px;padding:16px;margin-top:10px;margin-bottom:6px;border:1px solid rgba(17,24,39,0.06);display:flex;justify-content:center;align-items:center;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
  .f{background:#F0EAD6;padding:24px 28px;text-align:center;position:relative}
  .f .bd{background:#10B981;border-radius:999px;display:inline-block;padding:6px 24px;margin-bottom:10px}
  .f .bt{font-size:9px;font-weight:700;letter-spacing:2.5px;color:#F59E0B}
  .f .pr{font-size:28px;font-weight:800;color:#111827;letter-spacing:-0.5px}
  .f .lg{font-size:9px;color:#6EE7B7;font-style:italic;margin-top:10px}
  .f .wm{font-size:8px;color:rgba(17,24,39,0.25);letter-spacing:3px;font-weight:700;text-align:right;margin-top:4px}
  .wt{position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
  .wt-text{font-size:60px;font-weight:800;letter-spacing:8px;opacity:0.12;transform:rotate(-30deg)}
</style></head>
<body>
<div class="t">
  <div class="h">
    <div class="o1"></div><div class="o2"></div>
    <div class="lr"><svg width="38" height="38" viewBox="0 0 38 38"><rect width="38" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/><text x="19" y="24" text-anchor="middle" font-size="18" font-weight="800" fill="#F59E0B" font-family="Arial">S</text></svg><div class="br">SENGUICHET</div></div>
    <div class="gl"></div>
    <div class="en">${nomEvent}</div>
    <div class="cp"><div class="ct">${categorie}</div></div>
  </div>
  <div class="pf gc"><div class="dl">${'<div class="d"></div>'.repeat(30)}</div><div class="hc l"></div><div class="hc r"></div></div>
  <div class="b">
    <div class="ir"><div class="ib"><div class="il">DATE</div><div class="iv">${dateFmt || '—'}</div></div><div class="ib ibr"><div class="il">HEURE</div><div class="iv">${heure || '—'}</div></div></div>
    <div class="lb"><div class="ll">LIEU</div><div class="lv">${lieu || 'À VENIR'}</div></div>
    <div class="sl"></div>
    <div class="rt">REF · ${ref}</div>
    <div class="qw">${qrImg}${showWatermark ? '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(255,77,109,0.9);border-radius:50%;width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;font-weight:700;">✕</div>' : ''}</div>
  </div>
  <div class="pf cb"><div class="dl">${'<div class="d"></div>'.repeat(30)}</div><div class="hc l"></div><div class="hc r"></div></div>
  <div class="f"><div class="bd"><div class="bt">${categorie}</div></div><div class="pr">${prix}</div><div class="lg">Entrée unique et non transférable</div><div class="wm">SENGUICHET</div></div>
  ${showWatermark ? '<div class="wt"><div class="wt-text" style="color:' + watermarkColor + '">' + watermarkLabel + '</div></div>' : ''}
</div>
</body></html>`
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

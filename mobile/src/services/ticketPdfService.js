// Service de génération de ticket PDF — template premium charte SENGUICHET
// Fond #0D1B2A, carte #152232, header gradient, QR zone, footer catégorie+prix
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
  const dateStr = ticket.eventDate
    ? new Date(ticket.eventDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const heureStr = ticket.eventHeure || ''
  const lieuStr = (ticket.eventLieu || '').toUpperCase()
  const categorie = (ticket.categorie || 'STANDARD').toUpperCase()
  const prixStr = formatPrix(ticket.prix)
  const refStr = ticket.numero || '—'

  const qrHtml = qrDataUrl
    ? `<img src="${qrDataUrl}" width="150" height="150" style="display:block;margin:0 auto;width:150px;height:150px" />`
    : '<div style="width:150px;height:150px;background:rgba(0,200,255,0.05);border-radius:8px;margin:0 auto;font-size:11px;color:#5A7090;text-align:center;line-height:150px">QR non disponible</div>'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Billet ${eventNom} — SENGUICHET</title>
</head>
<body style="margin:0;padding:20px;background:#0D1B2A;font-family:'Helvetica Neue',Arial,Helvetica,sans-serif;text-align:center">

  <table style="width:340px;border-collapse:collapse;margin:0 auto;background:#152232;border:1px solid #1E3448;border-radius:16px;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif">

    <!-- HEADER GRADIENT -->
    <tr>
      <td style="background:linear-gradient(135deg,#00C8FF,#0077FF);text-align:center;padding:24px 16px;">
        <div style="width:48px;height:48px;border-radius:12px;margin:0 auto 6px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;font-weight:bold">S</div>
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;color:#FFFFFF;letter-spacing:3px;text-transform:uppercase">SENGUICHET</div>
      </td>
    </tr>

    <!-- PERFORATION -->
    <tr>
      <td style="padding:0 8px;height:14px;position:relative">
        <div style="border-bottom:2px dashed #1E3448;height:1px;font-size:1px;line-height:1px">&nbsp;</div>
      </td>
    </tr>

    <!-- CORPS -->
    <tr>
      <td style="text-align:center;padding:20px 24px">

        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:18px;color:#FFFFFF;letter-spacing:1px;line-height:1.3;margin-bottom:6px">${eventNom}</div>

        ${dateStr ? `<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:600;font-size:12px;color:#A0B4C8;margin-bottom:3px">${dateStr}${heureStr ? ' à ' + heureStr : ''}</div>` : ''}

        ${lieuStr ? `<div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;color:#00C8FF;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px">${lieuStr}</div>` : ''}

        <div style="width:60%;height:0;border-top:1px solid #1E3448;margin:10px auto"></div>

        <div style="font-family:'Courier New',monospace;font-size:11px;color:#5A7090;margin-bottom:14px">REF : ${refStr}</div>

        <div style="background:rgba(0,200,255,0.05);border:1px solid rgba(0,200,255,0.15);border-radius:12px;padding:14px;text-align:center">
          ${qrHtml}
        </div>

      </td>
    </tr>

    <!-- PERFORATION -->
    <tr>
      <td style="padding:0 8px;height:14px;position:relative">
        <div style="border-bottom:2px dashed #1E3448;height:1px;font-size:1px;line-height:1px">&nbsp;</div>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:rgba(0,0,0,0.2);text-align:center;padding:16px 24px">

        <div style="display:inline-block;background:linear-gradient(135deg,#00C8FF,#0077FF);padding:5px 18px;border-radius:9999px;margin-bottom:8px">
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:11px;color:#FFFFFF;letter-spacing:2px">${categorie}</div>
        </div>

        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-weight:900;font-size:20px;color:#FFFFFF;margin-bottom:4px">${prixStr}</div>

        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:9px;color:#5A7090;font-style:italic">Entrée unique et non transférable</div>

      </td>
    </tr>

  </table>

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

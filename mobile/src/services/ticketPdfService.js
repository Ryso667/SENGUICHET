// Service de génération de ticket PDF — template table-based compatible PDF
// Dimensions 340×620px, 3 zones : QR 140px, infos+prix (table 70/30), mentions
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system/legacy'
import { Alert } from 'react-native'

function formatPrix(prix) {
  if (prix == null) return '—'
  return `${Number(prix).toLocaleString('fr-FR')} FCFA'
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

  return '<!DOCTYPE html>'
    + '<html lang="fr"><head><meta charset="utf-8">'
    + '<title>Billet ' + eventNom + ' — SENGUICHET</title>'
    + '<style>'
    + '*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}'
    + 'body{font-family:Helvetica,Arial,sans-serif;background:#f0f2f5;display:flex;align-items:center;justify-content:center;padding:16px}'
    + '.tk{width:340px;height:620px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:0 auto}'

    // Z1 : QR 140px + ref
    + '.z1{height:230px;text-align:center;padding-top:20px}'
    + '.qr{width:140px;height:140px;margin:0 auto}'
    + '.qr img{width:140px;height:140px;image-rendering:pixelated}'
    + '.ref{font-family:monospace;font-size:11px;color:#64748b;margin-top:10px}'

    // Perforation
    + '.perf{border-bottom:2px dashed #cbd5e1;margin:0 15px;height:1px}'

    // Z2 : table 70/30
    + '.z2{height:240px;padding:20px}'
    + 'table{width:100%;border-collapse:collapse}'
    + 'td.left{width:70%;vertical-align:top;padding-right:10px}'
    + 'td.right{width:30%;border-left:1px solid #e2e8f0;text-align:right;vertical-align:middle;padding-left:10px}'
    + '.ev{font-size:16px;font-weight:bold;color:#0f172a;text-transform:uppercase;line-height:1.2}'
    + '.dt{font-size:12px;color:#334155;font-weight:600;margin-top:8px}'
    + '.loc{font-size:11px;color:#94a3b8;margin-top:4px}'
    + '.cat{font-size:11px;color:#475569;font-weight:bold;margin-top:15px;text-transform:uppercase}'
    + '.pl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}'
    + '.pr{font-size:15px;font-weight:bold;color:#0f172a;margin-top:2px}'

    // Z3 : pied gris
    + '.z3{height:100px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;padding-top:15px}'
    + '.br{font-size:10px;font-weight:bold;color:#94a3b8;letter-spacing:2px}'
    + '.lg{font-size:9px;color:#94a3b8;margin-top:4px}'

    + '@media print{body{background:#fff;padding:0}.tk{box-shadow:none;border-radius:0}@page{margin:0}}'
    + '</style></head><body>'

    + '<div class="tk">'
    + '  <div class="z1">'
    + '    <div class="qr">'
    + (qrDataUrl
      ? '<img src="' + qrDataUrl + '" alt="QR" />'
      : '<div style="width:140px;height:140px;background:#f1f5f9;margin:0 auto;font-size:10px;color:#94a3b8;display:flex;align-items:center;justify-content:center">QR non disponible</div>')
    + '    </div>'
    + '    <div class="ref">#' + refStr + '</div>'
    + '  </div>'

    + '  <div class="perf"></div>'

    + '  <div class="z2">'
    + '    <table>'
    + '      <tr>'
    + '        <td class="left">'
    + '          <div class="ev">' + eventNom + '</div>'
    + '          <div class="dt">' + dateStr + (heureStr ? ' à ' + heureStr : '') + '</div>'
    + '          <div class="loc">' + lieuStr + '</div>'
    + '          <div class="cat">Type : ' + categorie + '</div>'
    + '        </td>'
    + '        <td class="right">'
    + '          <div class="pl">Tarif</div>'
    + '          <div class="pr">' + prixStr + '</div>'
    + '        </td>'
    + '      </tr>'
    + '    </table>'
    + '  </div>'

    + '  <div class="z3">'
    + '    <div class="br">SENGUICHET</div>'
    + '    <div class="lg">Billetterie événementielle • Entrée unique et non transférable</div>'
    + '  </div>'
    + '</div>'

    + '</body></html>'
}

// Génère un fichier PDF du ticket et ouvre le menu de partage/impression
// ticket: { eventNom, eventDate, eventHeure, eventLieu, categorie, prix, numero }
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

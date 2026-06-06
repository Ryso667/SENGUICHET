// Service de génération de ticket PDF — template 100% table inline, zéro classe CSS
// Dimensions 340×600px, 3 zones : QR 140px, infos+prix (table 70/30), mentions
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

  const qrCell = qrDataUrl
    ? '<img src="' + qrDataUrl + '" width="140" height="140" style="display:block;margin:0 auto;width:140px;height:140px" />'
    : '<div style="width:140px;height:140px;background:#f1f5f9;margin:0 auto;font-size:10px;color:#94a3b8;text-align:center;line-height:140px">QR non disponible</div>'

  return '<!DOCTYPE html>'
    + '<html lang="fr"><head><meta charset="utf-8">'
    + '<title>Billet ' + eventNom + ' — SENGUICHET</title>'
    + '</head><body style="margin:0;padding:16px;background:#f0f2f5;font-family:Arial,Helvetica,sans-serif;text-align:center">'

    + '<table style="width:340px;height:600px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;font-family:Arial,sans-serif;margin:40px auto;border-collapse:collapse;overflow:hidden">'

    // Z1 : QR 140px + ref
    + '<tr><td style="height:220px;text-align:center;vertical-align:middle;padding-top:20px;background:#fff">'
    +   qrCell
    +   '<div style="font-family:monospace;font-size:11px;color:#64748b;margin-top:8px;font-weight:bold">#' + refStr + '</div>'
    + '</td></tr>'

    // Perforation
    + '<tr><td style="height:2px;padding:0 15px">'
    +   '<div style="border-bottom:2px dashed #cbd5e1;height:1px;font-size:1px;line-height:1px">&nbsp;</div>'
    + '</td></tr>'

    // Z2 : table 70/30
    + '<tr><td style="height:240px;vertical-align:top;padding:20px 15px">'
    +   '<table style="width:100%;border-collapse:collapse">'
    +     '<tr>'
    +       '<td style="width:70%;vertical-align:top;padding-right:10px">'
    +         '<div style="font-size:15px;font-weight:bold;color:#0f172a;text-transform:uppercase;line-height:1.3">' + eventNom + '</div>'
    +         '<div style="font-size:12px;color:#334155;font-weight:bold;margin-top:8px">' + dateStr + (heureStr ? ' à ' + heureStr : '') + '</div>'
    +         '<div style="font-size:10px;color:#94a3b8;margin-top:4px;line-height:1.2">' + lieuStr + '</div>'
    +         '<div style="margin-top:25px;font-size:11px;color:#334155;font-weight:bold;text-transform:uppercase">ACCÈS : <span style="color:#0f172a">' + categorie + '</span></div>'
    +       '</td>'
    +       '<td style="width:30%;border-left:1px solid #e2e8f0;text-align:right;vertical-align:middle;padding-left:10px">'
    +         '<div style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px">TARIF</div>'
    +         '<div style="font-size:14px;font-weight:bold;color:#0f172a;margin-top:2px;white-space:nowrap">' + prixStr + '</div>'
    +       '</td>'
    +     '</tr>'
    +   '</table>'
    + '</td></tr>'

    // Z3 : pied gris
    + '<tr><td style="height:90px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;vertical-align:middle;padding:10px">'
    +   '<div style="font-size:10px;font-weight:bold;color:#94a3b8;letter-spacing:2px;text-transform:uppercase">SENGUICHET</div>'
    +   '<div style="font-size:9px;color:#94a3b8;margin-top:4px">Billetterie événementielle • Entrée unique et non transférable</div>'
    + '</td></tr>'

    + '</table>'
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

import React, { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Check } from "../../components/Icons";

const sections = [
  { key: "profil", label: "Mon profil", icon: "👤" },
  { key: "securite", label: "Sécurité", icon: "🔒" },
  { key: "notifications", label: "Notifications", icon: "🔔" },
];

const Parametres = () => {
  const [open, setOpen] = useState("profil");
  const [nom, setNom] = useState("Mamadou Diallo");
  const [email] = useState("mamadou@email.com");
  const [telephone, setTelephone] = useState("+221 77 123 45 67");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [notifSms, setNotifSms] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifStock, setNotifStock] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Toggle = ({ val, setVal }) => (
    <button
      onClick={() => setVal(!val)}
      className="w-12 h-6 rounded-full relative transition-all"
      style={{ background: val ? "rgba(21,128,61,0.35)" : "rgba(0,0,0,0.1)" }}
    >
      <div className={`w-5 h-5 rounded-full absolute top-0.5 transition-all ${val ? "left-[26px]" : "left-0.5"}`}
        style={{ background: val ? "var(--color-accent)" : "rgba(0,0,0,0.25)" }} />
    </button>
  );

  return (
    <DashboardLayout title="Paramètres">
      <div className="max-w-2xl mx-auto space-y-4">
        {sections.map((s) => {
          const isOpen = open === s.key;
          return (
            <div key={s.key} className="overflow-hidden rounded-2xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}>
              <button
                onClick={() => setOpen(isOpen ? null : s.key)}
                className="w-full flex items-center justify-between px-6 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{s.icon}</span>
                  <span className="font-medium" style={{ color: "var(--color-text-primary)", fontFamily: "Outfit, sans-serif" }}>{s.label}</span>
                </div>
                <span className="text-sm transition-transform" style={{ color: "var(--color-text-muted)", transform: isOpen ? "rotate(180deg)" : "none" }}>▾</span>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 space-y-4 border-t" style={{ borderColor: "var(--color-border)", paddingTop: 20 }}>
                  {s.key === "profil" && (
                    <>
                      <div>
                        <label className="block text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>Nom</label>
                        <input value={nom} onChange={(e) => setNom(e.target.value)} className="input-premium" />
                      </div>
                      <div>
                        <label className="block text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>Email</label>
                        <input value={email} readOnly className="input-premium" style={{ opacity: 0.6 }} />
                      </div>
                      <div>
                        <label className="block text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>Téléphone</label>
                        <input value={telephone} onChange={(e) => setTelephone(e.target.value)} className="input-premium" />
                      </div>
                      <button onClick={handleSave} className="btn-primary" style={{ width: "auto", paddingLeft: 28, paddingRight: 28 }}>
                        {saved ? <><Check size={16} /> Sauvegardé</> : "Sauvegarder"}
                      </button>
                    </>
                  )}

                  {s.key === "securite" && (
                    <>
                      <div>
                        <label className="block text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>Ancien mot de passe</label>
                        <input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} className="input-premium" />
                      </div>
                      <div>
                        <label className="block text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>Nouveau mot de passe</label>
                        <input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="input-premium" />
                      </div>
                      <div>
                        <label className="block text-xs mb-2" style={{ color: "var(--color-text-muted)" }}>Confirmer le mot de passe</label>
                        <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className={`input-premium ${confirmPwd && confirmPwd !== newPwd ? "error" : ""}`} />
                      </div>
                      <button onClick={handleSave} className="btn-primary" style={{ width: "auto", paddingLeft: 28, paddingRight: 28 }}>
                        Changer le mot de passe
                      </button>
                    </>
                  )}

                  {s.key === "notifications" && (
                    <>
                      {[
                        { label: "SMS à chaque vente de billet", val: notifSms, set: setNotifSms },
                        { label: "Email récapitulatif quotidien", val: notifEmail, set: setNotifEmail },
                        { label: "Alertes stock faible", val: notifStock, set: setNotifStock },
                      ].map((n) => (
                        <div key={n.label} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{n.label}</span>
                          <Toggle val={n.val} setVal={n.set} />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {saved && (
          <div className="px-4 py-3 text-sm text-center rounded-2xl" style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", color: "var(--success)", animation: "fadeInDown 0.3s ease" }}>
            <Check size={16} /> Paramètres mis à jour avec succès
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Parametres;

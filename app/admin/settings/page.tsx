"use client"

import { useEffect, useState } from "react"

const API_BASE = "http://localhost/art-e-commerce-website/art-admin-backend/api.php"

type AdminProfile = {
  id: number | string
  name: string
  email: string
}

type StoreSettings = {
  storeName: string
  storeLogo: string
  contactPhone: string
  contactEmail: string
  deliveryCharges: number
  instagramUrl: string
  whatsappUrl: string
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState<AdminProfile>({ id: "", name: "", email: "" })
  const [profileMsg, setProfileMsg] = useState<string>("")
  const [profileErr, setProfileErr] = useState<string>("")
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState<string>("")
  const [passwordErr, setPasswordErr] = useState<string>("")
  const [passwordSaving, setPasswordSaving] = useState(false)

  const [settings, setSettings] = useState<StoreSettings>({
    storeName: "",
    storeLogo: "",
    contactPhone: "",
    contactEmail: "",
    deliveryCharges: 0,
    instagramUrl: "",
    whatsappUrl: "",
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [settingsMsg, setSettingsMsg] = useState<string>("")
  const [settingsErr, setSettingsErr] = useState<string>("")
  const [settingsSaving, setSettingsSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [profileRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}?path=admin_profile_get`, { credentials: "include" }),
          fetch(`${API_BASE}?path=store_settings_get`, { credentials: "include" }),
        ])

        const profileData = await profileRes.json().catch(() => null)
        const settingsData = await settingsRes.json().catch(() => null)

        if (!cancelled) {
          if (profileRes.ok && profileData?.admin) {
            setProfile(profileData.admin)
          }
          if (settingsRes.ok && settingsData?.settings) {
            setSettings(settingsData.settings)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileMsg("")
    setProfileErr("")
    setProfileSaving(true)
    try {
      const res = await fetch(`${API_BASE}?path=admin_profile_update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setProfileErr((data && data.error) || "Unable to save profile")
        return
      }
      setProfileMsg("Saved")
    } finally {
      setProfileSaving(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordMsg("")
    setPasswordErr("")
    setPasswordSaving(true)
    try {
      const res = await fetch(`${API_BASE}?path=admin_change_password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setPasswordErr((data && data.error) || "Unable to change password")
        return
      }
      setCurrentPassword("")
      setNewPassword("")
      setPasswordMsg("Password updated")
    } finally {
      setPasswordSaving(false)
    }
  }

  async function saveStoreSettings(e: React.FormEvent) {
    e.preventDefault()
    setSettingsMsg("")
    setSettingsErr("")
    setSettingsSaving(true)

    try {
      const form = new FormData()
      form.append("storeName", settings.storeName)
      form.append("contactPhone", settings.contactPhone)
      form.append("contactEmail", settings.contactEmail)
      form.append("deliveryCharges", String(settings.deliveryCharges ?? 0))
      form.append("instagramUrl", settings.instagramUrl)
      form.append("whatsappUrl", settings.whatsappUrl)
      if (logoFile) {
        form.append("logo", logoFile)
      }

      const res = await fetch(`${API_BASE}?path=store_settings_update`, {
        method: "POST",
        credentials: "include",
        body: form,
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setSettingsErr((data && data.error) || "Unable to save settings")
        return
      }
      if (data?.settings) {
        setSettings(data.settings)
      }
      setLogoFile(null)
      setSettingsMsg("Saved")
    } finally {
      setSettingsSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-amber-700 font-sans mb-2">Settings</p>
          <h1 className="text-2xl md:text-3xl font-semibold">Admin Settings</h1>
          <p className="text-xs text-slate-500 font-sans mt-1">Manage admin profile and store configuration.</p>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl bg-white/70 border border-amber-100 p-5">
          <p className="text-sm text-slate-600 font-sans">Loading…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="rounded-3xl bg-white/90 shadow-sm border border-amber-100 p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Admin profile</h2>
              <p className="text-xs text-slate-500 font-sans mt-1">Update admin name and email.</p>
            </div>

            <form onSubmit={saveProfile} className="space-y-4">
              {profileErr && <p className="text-xs text-red-600 font-sans">{profileErr}</p>}
              {profileMsg && <p className="text-xs text-emerald-700 font-sans">{profileMsg}</p>}

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                className="w-full rounded-lg bg-amber-700 text-white text-sm font-sans py-2.5 hover:bg-amber-800 transition disabled:opacity-60"
              >
                {profileSaving ? "Saving…" : "Save profile"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white/90 shadow-sm border border-amber-100 p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Change password</h2>
              <p className="text-xs text-slate-500 font-sans mt-1">Set a new admin password.</p>
            </div>

            <form onSubmit={savePassword} className="space-y-4">
              {passwordErr && <p className="text-xs text-red-600 font-sans">{passwordErr}</p>}
              {passwordMsg && <p className="text-xs text-emerald-700 font-sans">{passwordMsg}</p>}

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full rounded-lg bg-amber-700 text-white text-sm font-sans py-2.5 hover:bg-amber-800 transition disabled:opacity-60"
              >
                {passwordSaving ? "Updating…" : "Update password"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white/90 shadow-sm border border-amber-100 p-5 md:p-6 lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Store info</h2>
              <p className="text-xs text-slate-500 font-sans mt-1">Store name, logo, contact, delivery charges and social links.</p>
            </div>

            <form onSubmit={saveStoreSettings} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                {settingsErr && <p className="text-xs text-red-600 font-sans">{settingsErr}</p>}
                {settingsMsg && <p className="text-xs text-emerald-700 font-sans">{settingsMsg}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Store name</label>
                <input
                  value={settings.storeName}
                  onChange={(e) => setSettings((s) => ({ ...s, storeName: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Delivery charges (₹)</label>
                <input
                  type="number"
                  value={settings.deliveryCharges}
                  onChange={(e) => setSettings((s) => ({ ...s, deliveryCharges: Number(e.target.value || 0) }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Contact phone</label>
                <input
                  value={settings.contactPhone}
                  onChange={(e) => setSettings((s) => ({ ...s, contactPhone: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Contact email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">Instagram link</label>
                <input
                  value={settings.instagramUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, instagramUrl: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 font-sans">WhatsApp link</label>
                <input
                  value={settings.whatsappUrl}
                  onChange={(e) => setSettings((s) => ({ ...s, whatsappUrl: e.target.value }))}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1 font-sans">Store logo</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-amber-200 bg-amber-50/40 px-3 py-2 text-sm font-sans"
                  />
                  {settings.storeLogo ? (
                    <a
                      href={settings.storeLogo}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-sans text-amber-800 hover:underline"
                    >
                      View current logo
                    </a>
                  ) : (
                    <span className="text-xs font-sans text-slate-500">No logo uploaded</span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="w-full rounded-lg bg-amber-700 text-white text-sm font-sans py-2.5 hover:bg-amber-800 transition disabled:opacity-60"
                >
                  {settingsSaving ? "Saving…" : "Save store settings"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

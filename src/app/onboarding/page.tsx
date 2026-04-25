"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import {
  User, CreditCard, Landmark, Building2, Search,
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, ShieldCheck
} from "lucide-react"

/* ── Types ── */
type Role = "buyer" | "seller"
type Gender = "male" | "female" | "other" | ""

interface FormData {
  // Step 1 – Role
  role: Role | ""
  // Step 2 – Personal info
  full_name: string
  dob: string
  gender: Gender
  // Step 3 – KYC
  pan_number: string
  aadhar_number: string
  // Step 4 – Bank details
  account_holder_name: string
  bank_name: string
  account_number: string
  ifsc_code: string
}

const INITIAL: FormData = {
  role: "",
  full_name: "",
  dob: "",
  gender: "",
  pan_number: "",
  aadhar_number: "",
  account_holder_name: "",
  bank_name: "",
  account_number: "",
  ifsc_code: "",
}

/* ── Validators ── */
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
const AADHAR_RE = /^\d{12}$/
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/

function validateStep(step: number, f: FormData): string | null {
  if (step === 1 && !f.role) return "Please select your role to continue."
  if (step === 2) {
    if (!f.full_name.trim()) return "Full name is required."
    if (!f.dob) return "Date of birth is required."
    const age = Math.floor((Date.now() - new Date(f.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    if (age < 18) return "You must be at least 18 years old to register."
    if (!f.gender) return "Please select your gender."
  }
  if (step === 3) {
    if (!PAN_RE.test(f.pan_number.toUpperCase())) return "Invalid PAN number. Format: AAAAA9999A"
    if (!AADHAR_RE.test(f.aadhar_number.replace(/\s/g, ""))) return "Aadhar must be a 12-digit number."
  }
  if (step === 4) {
    if (!f.account_holder_name.trim()) return "Account holder name is required."
    if (!f.bank_name.trim()) return "Bank name is required."
    if (!f.account_number.trim() || f.account_number.length < 9) return "Enter a valid account number."
    if (!IFSC_RE.test(f.ifsc_code.toUpperCase())) return "Invalid IFSC code. Format: ABCD0123456"
    // Cross-check: name on bank should match PAN holder name
    if (f.account_holder_name.trim().toLowerCase() !== f.full_name.trim().toLowerCase()) {
      return "Account holder name must match your full name as per PAN card."
    }
  }
  return null
}

/* ── Step indicator ── */
const STEPS = [
  { label: "Role", icon: Search },
  { label: "Personal", icon: User },
  { label: "KYC Docs", icon: CreditCard },
  { label: "Bank", icon: Landmark },
]

/* ── Component ── */
export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const set = (key: keyof FormData, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const next = () => {
    const err = validateStep(step, form)
    if (err) { setError(err); return }
    setError(null)
    setStep(s => s + 1)
  }

  const back = () => { setError(null); setStep(s => s - 1) }

  const handleSubmit = async () => {
    const err = validateStep(4, form)
    if (err) { setError(err); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError("Session expired. Please log in again."); setLoading(false); return }

    // Save role to user metadata and mark kyc_status as submitted
    await supabase.auth.updateUser({ data: { role: form.role, full_name: form.full_name, kyc_status: "submitted" } })

    // Save profile to DB
    const { error: dbErr } = await supabase.from("user_profiles").upsert({
      user_id: user.id,
      full_name: form.full_name,
      dob: form.dob,
      gender: form.gender,
      pan_number: form.pan_number.toUpperCase(),
      aadhar_number: form.aadhar_number.replace(/\s/g, ""),
      account_holder_name: form.account_holder_name,
      bank_name: form.bank_name,
      account_number: form.account_number,
      ifsc_code: form.ifsc_code.toUpperCase(),
      role: form.role,
      kyc_status: "pending",
    }, { onConflict: "user_id" })

    setLoading(false)
    if (dbErr) { setError("Failed to save profile. Please try again."); return }
    setDone(true)
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-950/60 border border-emerald-900/50 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">Registration Submitted!</h1>
            <p className="text-zinc-400 mt-2 text-sm leading-relaxed">
              Your KYC details have been submitted for verification. Our team will verify
              your documents within <span className="text-white font-semibold">1–2 business days</span>.
              You&apos;ll receive an email once your account is activated.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> What gets verified
            </p>
            {["PAN card details", "Aadhar number", "Bank account & IFSC", "Name consistency across documents"].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                {item}
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push(form.role === "seller" ? "/seller/listings/new" : "/marketplace")}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {form.role === "seller" ? "Go to List Property" : "Browse Marketplace"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <span className="text-zinc-950 font-black text-sm">B</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Bhoomi<span className="text-emerald-400">Auction</span>
          </span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between px-2">
          {STEPS.map((s, i) => {
            const num = i + 1
            const active = num === step
            const done = num < step
            return (
              <div key={s.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done ? "bg-emerald-500 text-white" :
                    active ? "bg-emerald-600 text-white ring-4 ring-emerald-600/20" :
                    "bg-zinc-800 text-zinc-500"
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : num}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? "text-emerald-400" : "text-zinc-600"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${num < step ? "bg-emerald-500" : "bg-zinc-800"}`} style={{ width: "60px" }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 space-y-6 shadow-2xl">

          {/* Error */}
          {error && (
            <div className="bg-red-950/40 border border-red-900/50 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* ── STEP 1: Role ── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Welcome! Let&apos;s get started</h2>
                <p className="text-sm text-zinc-400 mt-1">How do you plan to use BhoomiAuction?</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {([
                  { val: "buyer", icon: Search, label: "Buy Property", desc: "Browse & bid on auctions", color: "emerald" },
                  { val: "seller", icon: Building2, label: "Sell Property", desc: "List properties for auction", color: "cyan" },
                ] as const).map(({ val, icon: Icon, label, desc, color }) => (
                  <button key={val} onClick={() => set("role", val)}
                    className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
                      form.role === val
                        ? color === "emerald" ? "border-emerald-500 bg-emerald-950/30" : "border-cyan-500 bg-cyan-950/20"
                        : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
                    }`}>
                    {form.role === val && <CheckCircle2 className={`absolute top-3 right-3 w-4 h-4 ${color === "emerald" ? "text-emerald-400" : "text-cyan-400"}`} />}
                    <Icon className={`w-7 h-7 mb-3 ${form.role === val ? (color === "emerald" ? "text-emerald-400" : "text-cyan-400") : "text-zinc-500"}`} />
                    <p className="font-bold text-white text-sm">{label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Personal Info ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Personal Information</h2>
                <p className="text-sm text-zinc-400 mt-1">Basic details to set up your profile.</p>
              </div>
              <Field label="Full Name (as per PAN card)" required>
                <input type="text" value={form.full_name} onChange={e => set("full_name", e.target.value)}
                  placeholder="Animesh Sharma" className={inputCls} />
              </Field>
              <Field label="Date of Birth" required>
                <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)}
                  max={new Date(Date.now() - 18 * 365.25 * 86400000).toISOString().split("T")[0]}
                  className={inputCls} />
              </Field>
              <Field label="Gender" required>
                <div className="flex gap-3">
                  {(["male", "female", "other"] as const).map(g => (
                    <button key={g} onClick={() => set("gender", g)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all capitalize ${
                        form.gender === g
                          ? "border-emerald-500 bg-emerald-950/30 text-emerald-400"
                          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ── STEP 3: KYC ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">KYC Documents</h2>
                <p className="text-sm text-zinc-400 mt-1">Required for legal compliance and identity verification.</p>
              </div>
              <Field label="PAN Card Number" required hint="Format: AAAAA9999A">
                <input type="text" value={form.pan_number} onChange={e => set("pan_number", e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F" maxLength={10} className={inputCls} />
              </Field>
              <Field label="Aadhar Card Number" required hint="12-digit number (no spaces needed)">
                <input type="text" value={form.aadhar_number} onChange={e => set("aadhar_number", e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="1234 5678 9012" className={inputCls} />
              </Field>
              <div className="bg-amber-950/30 border border-amber-900/40 rounded-xl px-4 py-3 text-xs text-amber-300 flex gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Your document numbers are encrypted and stored securely. They are only accessed by our compliance team for KYC verification.</span>
              </div>
            </div>
          )}

          {/* ── STEP 4: Bank ── */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white">Bank Account Details</h2>
                <p className="text-sm text-zinc-400 mt-1">Required for EMD refunds and payment processing.</p>
              </div>
              <Field label="Account Holder Name" required hint="Must match your name on PAN card">
                <input type="text" value={form.account_holder_name} onChange={e => set("account_holder_name", e.target.value)}
                  placeholder="As per bank records" className={inputCls} />
              </Field>
              <Field label="Bank Name" required>
                <input type="text" value={form.bank_name} onChange={e => set("bank_name", e.target.value)}
                  placeholder="State Bank of India" className={inputCls} />
              </Field>
              <Field label="Account Number" required>
                <input type="text" value={form.account_number} onChange={e => set("account_number", e.target.value.replace(/\D/g, ""))}
                  placeholder="XXXXXXXXXXXX" className={inputCls} />
              </Field>
              <Field label="IFSC Code" required hint="Format: ABCD0123456">
                <input type="text" value={form.ifsc_code} onChange={e => set("ifsc_code", e.target.value.toUpperCase())}
                  placeholder="SBIN0001234" maxLength={11} className={inputCls} />
              </Field>
              <div className="bg-zinc-800/60 rounded-xl px-4 py-3 text-xs text-zinc-400 space-y-1">
                <p className="font-semibold text-zinc-300">Cross-verification checks:</p>
                <div className="space-y-0.5">
                  <MatchRow label="Name on PAN" a={form.full_name} b={form.account_holder_name} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <button onClick={back}
                className="flex-1 h-12 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            {step < 4 ? (
              <button onClick={next}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><ShieldCheck className="w-4 h-4" /> Submit for Verification</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600">
          Your data is encrypted and only used for identity verification.
        </p>
      </div>
    </div>
  )
}

/* ── Helper components ── */
const inputCls = "w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-600 transition-colors placeholder:text-zinc-600"

function Field({ label, children, required, hint }: {
  label: string; children: React.ReactNode; required?: boolean; hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-zinc-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
}

function MatchRow({ label, a, b }: { label: string; a: string; b: string }) {
  const match = a.trim().toLowerCase() === b.trim().toLowerCase() && a.trim() !== ""
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${match ? "bg-emerald-400" : "bg-zinc-600"}`} />
      <span>{label}</span>
      {match
        ? <span className="text-emerald-400 ml-auto">✓ Match</span>
        : <span className="text-zinc-600 ml-auto">{a && b ? "✗ Mismatch" : "Pending"}</span>
      }
    </div>
  )
}

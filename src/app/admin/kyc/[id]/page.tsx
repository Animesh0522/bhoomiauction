import { createClient } from "@/utils/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, User, CreditCard, Landmark, Clock, CheckCircle2, XCircle } from "lucide-react"
import KycReviewActions from "./KycReviewActions"

export default async function AdminKycReviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Helper to format age
  const age = Math.floor((Date.now() - new Date(profile.dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/kyc" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              Review Profile: {profile.full_name}
            </h1>
            <p className="text-zinc-400 mt-1">Submitted on {new Date(profile.created_at).toLocaleString()}</p>
          </div>
          <div>
            {profile.kyc_status === 'pending' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-400 bg-amber-400/10 px-4 py-2 rounded-full font-bold">
                <Clock className="w-4 h-4" /> Pending Review
              </span>
            )}
            {profile.kyc_status === 'verified' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full font-bold">
                <CheckCircle2 className="w-4 h-4" /> Verified
              </span>
            )}
            {profile.kyc_status === 'rejected' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-red-400 bg-red-400/10 px-4 py-2 rounded-full font-bold">
                <XCircle className="w-4 h-4" /> Rejected
              </span>
            )}
          </div>
        </div>

        {profile.kyc_status === 'rejected' && profile.kyc_notes && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-5">
            <h3 className="text-red-400 font-semibold mb-1">Rejection Reason:</h3>
            <p className="text-red-300 text-sm">{profile.kyc_notes}</p>
          </div>
        )}

        {/* Data Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Personal Info */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold border-b border-zinc-800 pb-3">
              <User className="w-5 h-5" /> Personal Information
            </div>
            <div className="space-y-3">
              <DetailRow label="Full Name" value={profile.full_name} />
              <DetailRow label="Date of Birth" value={`${new Date(profile.dob).toLocaleDateString()} (${age} years)`} />
              <DetailRow label="Gender" value={<span className="capitalize">{profile.gender}</span>} />
              <DetailRow label="Role" value={<span className="capitalize">{profile.role}</span>} />
            </div>
          </div>

          {/* KYC Docs */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold border-b border-zinc-800 pb-3">
              <CreditCard className="w-5 h-5" /> KYC Documents
            </div>
            <div className="space-y-3">
              <DetailRow label="PAN Number" value={<span className="font-mono tracking-wider text-white bg-zinc-950 px-2 py-1 rounded">{profile.pan_number}</span>} />
              <DetailRow label="Aadhar Number" value={<span className="font-mono tracking-wider text-white bg-zinc-950 px-2 py-1 rounded">{profile.aadhar_number.replace(/(\d{4})/g, '$1 ').trim()}</span>} />
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 md:col-span-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold border-b border-zinc-800 pb-3">
              <Landmark className="w-5 h-5" /> Bank Details
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              <DetailRow label="Account Holder" value={profile.account_holder_name} />
              <DetailRow label="Bank Name" value={profile.bank_name} />
              <DetailRow label="Account Number" value={<span className="font-mono">{profile.account_number}</span>} />
              <DetailRow label="IFSC Code" value={<span className="font-mono">{profile.ifsc_code}</span>} />
            </div>
            
            {/* Admin cross-check helper */}
            <div className="mt-4 bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Cross-Verification Check</p>
              <div className="flex items-center gap-2 text-sm">
                <span>Name on PAN vs Bank Account:</span>
                {profile.full_name.trim().toLowerCase() === profile.account_holder_name.trim().toLowerCase() ? (
                  <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> EXACT MATCH</span>
                ) : (
                  <span className="text-red-400 font-medium flex items-center gap-1"><XCircle className="w-4 h-4"/> MISMATCH</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Actions (Only show if pending) */}
        {profile.kyc_status === 'pending' && (
          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-lg font-semibold text-white mb-4">Admin Decision</h3>
            <KycReviewActions userId={profile.user_id} />
          </div>
        )}

      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-medium text-zinc-500 mb-0.5">{label}</span>
      <span className="block text-sm text-zinc-200">{value}</span>
    </div>
  )
}

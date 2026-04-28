import { createClient } from "@/utils/supabase/server"
import Link from "next/link"
import { CheckCircle2, Clock, XCircle, Search, ShieldCheck } from "lucide-react"

export default async function AdminKycDashboard() {
  const supabase = createClient()

  // Fetch all profiles, order by pending first, then by creation date
  const { data: profiles, error } = await supabase
    .from("user_profiles")
    .select("*")
    .order("kyc_status", { ascending: false }) // 'pending' comes before 'verified'
    .order("created_at", { ascending: false })

  if (error) {
    return <div className="p-8 text-red-400">Error loading profiles: {error.message}</div>
  }

  const pendingCount = profiles?.filter(p => p.kyc_status === "pending").length || 0

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
              KYC Verifications
            </h1>
            <p className="text-zinc-400 mt-1">Review and approve user registrations</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Pending</span>
              <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total</span>
              <span className="text-2xl font-bold text-white">{profiles?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {profiles?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No KYC profiles found.
                  </td>
                </tr>
              ) : (
                profiles?.map((profile) => (
                  <tr key={profile.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{profile.full_name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">PAN: {profile.pan_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                        profile.role === 'buyer' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyan-500/10 text-cyan-400'
                      }`}>
                        {profile.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {new Date(profile.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {profile.kyc_status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full font-medium">
                          <Clock className="w-4 h-4" /> Pending
                        </span>
                      )}
                      {profile.kyc_status === 'verified' && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded-full font-medium">
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      )}
                      {profile.kyc_status === 'rejected' && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-red-400 bg-red-400/10 px-3 py-1 rounded-full font-medium">
                          <XCircle className="w-4 h-4" /> Rejected
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/admin/kyc/${profile.id}`}
                        className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-white transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const [mobile, setMobile] = useState("")
  const [otp, setOtp] = useState("")
  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Attempting to sign in with OTP via SMS
    const { error } = await supabase.auth.signInWithOtp({
      phone: mobile,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setStep("OTP")
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.verifyOtp({
      phone: mobile,
      token: otp,
      type: 'sms',
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      // OTP verified successfully, redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Login to Auction Platform</CardTitle>
          <CardDescription className="text-zinc-400">
            {step === "PHONE" 
              ? "Enter your 10-digit mobile number to receive a secure OTP." 
              : `We've sent a code to ${mobile}.`}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-800 text-red-200 text-sm rounded-md">
              {error}
            </div>
          )}

          {step === "PHONE" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-zinc-300">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-zinc-300">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
              <Button 
                type="button" 
                variant="link" 
                className="w-full text-zinc-400 hover:text-white"
                onClick={() => setStep("PHONE")}
              >
                Use a different number
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

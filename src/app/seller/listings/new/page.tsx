"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, Loader2 } from "lucide-react"
import { CurrencyInput } from "@/components/ui/currency-input"

export default function NewListingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Controlled form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "",
    reserve_price: "",
    area_sqft: "",
    area_unit: "sq_ft",
    length: "",
    breadth: "",
    facing: "",
    address: "",
    city: "Delhi",
    state: "Delhi",
    pincode: "110001"
  })

  const [files, setFiles] = useState<File[]>([])
  const router = useRouter()
  const supabase = createClient()

  // Load from Local Storage on mount
  useEffect(() => {
    const savedData = localStorage.getItem("propertyFormDraft")
    if (savedData) {
      try {
        setFormData(JSON.parse(savedData))
      } catch (_e) {
        console.error("Failed to parse local storage data")
      }
    }
  }, [])

  // Save to Local Storage on change
  useEffect(() => {
    localStorage.setItem("propertyFormDraft", JSON.stringify(formData))
  }, [formData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!files || files.length === 0) {
        throw new Error("Please upload at least 1 photo of the property.")
      }
      if (files.length > 10) {
        throw new Error(`You can only upload a maximum of 10 photos. You selected ${files.length}.`)
      }

      // 1. Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error("You must be logged in to create a listing.")

      // 2. Upload images
      const imageUrls: string[] = []
      
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `${Math.random()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('property_assets')
            .upload(filePath, file)

          if (uploadError) {
            throw new Error(`Failed to upload image: ${uploadError.message}`)
          }

          const { data: { publicUrl } } = supabase.storage
            .from('property_assets')
            .getPublicUrl(filePath)
            
          imageUrls.push(publicUrl)
        }
      }

      // 3. Insert property record
      const { error: insertError } = await supabase.from('properties').insert({
        seller_id: user.id,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        area_sqft: Number(formData.area_sqft),
        area_unit: formData.area_unit,
        reserve_price: formData.reserve_price ? Number(formData.reserve_price) : null,
        length: formData.length ? Number(formData.length) : null,
        breadth: formData.breadth ? Number(formData.breadth) : null,
        facing: formData.facing || null,
        property_type: formData.property_type,
        status: 'draft',
        image_urls: imageUrls
      })

      if (insertError) {
        throw new Error(`Failed to create listing: ${insertError.message}`)
      }

      // 4. Success - Clear draft and redirect
      localStorage.removeItem("propertyFormDraft")
      router.push("/dashboard")
      router.refresh()

    } catch (err: unknown) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl min-h-screen">
      <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl">
        <CardHeader className="space-y-1 border-b border-zinc-800 pb-6 mb-6">
          <CardTitle className="text-3xl font-bold tracking-tight">List a Property</CardTitle>
          <CardDescription className="text-zinc-400">
            Submit your property for auction. It will be saved securely as a draft.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-800 text-red-200 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-zinc-300">Property Title</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required placeholder="E.g. Luxury Villa in Downtown" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-300">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} required placeholder="Describe the key features of the property..." className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="property_type" className="text-zinc-300">Property Type</Label>
                  <select 
                    name="property_type" 
                    value={formData.property_type}
                    onChange={handleInputChange}
                    required 
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                  >
                    <option value="" disabled>Select type</option>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="land">Land</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-zinc-300">Total Area</Label>
                  <div className="flex space-x-2">
                    <Input id="area_sqft" name="area_sqft" value={formData.area_sqft} onChange={handleInputChange} type="number" min="1" required placeholder="E.g. 5" className="flex-1 bg-zinc-800 border-zinc-700 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                    <select 
                      name="area_unit" 
                      value={formData.area_unit}
                      onChange={handleInputChange}
                      required 
                      className="flex h-10 w-36 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                    >
                      <option value="sq_ft">Sq Ft</option>
                      <option value="sq_mt">Sq Mt</option>
                      <option value="sq_yd">Sq Yd</option>
                      <option value="kachia_bigha">Kachia Bigha</option>
                      <option value="pakka_bigha">Pakka Bigha (27,225 sq ft)</option>
                      <option value="acre">Acre</option>
                      <option value="are">Are</option>
                      <option value="biswa">Biswa</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="reserve_price" className="text-zinc-300">Minimum Sale Price (₹)</Label>
                  <CurrencyInput 
                    id="reserve_price" 
                    name="reserve_price" 
                    value={formData.reserve_price} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, reserve_price: val }))} 
                    required 
                    placeholder="E.g. 10,00,000" 
                    className="bg-zinc-800 border-zinc-700 text-white" 
                  />
                  <p className="text-xs text-zinc-500">This is the starting price or reserve price for your property.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length" className="text-zinc-300">Length</Label>
                  <Input id="length" name="length" value={formData.length} onChange={handleInputChange} type="number" min="1" placeholder="Length" className="bg-zinc-800 border-zinc-700 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breadth" className="text-zinc-300">Breadth</Label>
                  <Input id="breadth" name="breadth" value={formData.breadth} onChange={handleInputChange} type="number" min="1" placeholder="Breadth" className="bg-zinc-800 border-zinc-700 text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facing" className="text-zinc-300">Facing Direction</Label>
                  <select 
                    name="facing" 
                    value={formData.facing}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                  >
                    <option value="" disabled>Select facing</option>
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="North-East">North-East</option>
                    <option value="North-West">North-West</option>
                    <option value="South-East">South-East</option>
                    <option value="South-West">South-West</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-lg font-medium text-white">Location Details</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-zinc-300">Street Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} required placeholder="123 Main St" className="bg-zinc-800 border-zinc-700 text-white" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-zinc-300">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleInputChange} required placeholder="New York" className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-zinc-300">State</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleInputChange} required placeholder="NY" className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode" className="text-zinc-300">Pincode / Zip</Label>
                  <Input id="pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} required placeholder="10001" className="bg-zinc-800 border-zinc-700 text-white" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-lg font-medium text-white">Media</h3>
              
              <div className="space-y-2">
                <Label htmlFor="images" className="text-zinc-300">Upload Images</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="images" className="flex flex-col items-center justify-center w-full h-40 border-2 border-zinc-700 border-dashed rounded-lg cursor-pointer bg-zinc-800/50 hover:bg-zinc-800 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-8 h-8 mb-3 text-zinc-400" />
                      <p className="mb-2 text-sm text-zinc-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-zinc-500">PNG, JPG or WEBP (1 to 10 photos maximum)</p>
                    </div>
                    <input 
                      id="images" 
                      type="file" 
                      multiple 
                      accept="image/*"
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files) {
                          const newFiles = Array.from(e.target.files);
                          const totalFiles = files.length + newFiles.length;
                          if (totalFiles > 10) {
                            setError("You can only select up to 10 photos in total.");
                          } else {
                            setError(null);
                            setFiles(prev => [...prev, ...newFiles]);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-zinc-300">Selected Photos ({files.length}/10):</p>
                    <ul className="text-sm text-zinc-400 space-y-1">
                      {files.map((f, i) => (
                        <li key={i} className="flex justify-between items-center bg-zinc-800/50 p-2 rounded border border-zinc-700">
                          <span className="truncate max-w-[80%]">{f.name}</span>
                          <button 
                            type="button" 
                            onClick={() => setFiles(files.filter((_, index) => index !== i))}
                            className="text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full bg-white text-zinc-950 hover:bg-zinc-200"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading and Submitting...
                  </>
                ) : (
                  "Submit Property Listing"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

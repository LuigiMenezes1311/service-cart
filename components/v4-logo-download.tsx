"use client"

import { useState } from "react"
import { V4LogoSVG } from "./v4-logo-pure-svg"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function V4LogoDownload() {
  const [variant, setVariant] = useState<"primary" | "simplified" | "icon-only">("primary")
  const [colorMode, setColorMode] = useState<"light" | "dark">("light")

  const downloadSVG = () => {
    // Create SVG string
    const svgElement = document.getElementById("download-svg")
    if (!svgElement) return

    const svgString = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" })
    const svgUrl = URL.createObjectURL(svgBlob)

    // Create download link
    const downloadLink = document.createElement("a")
    downloadLink.href = svgUrl
    downloadLink.download = `v4-company-logo-${variant}-${colorMode}.svg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h2 className="mb-4 text-xl font-semibold">Download Logo</h2>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Variant</label>
          <Select
            value={variant}
            onValueChange={(value) => setVariant(value as "primary" | "simplified" | "icon-only")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select variant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="simplified">Simplified</SelectItem>
              <SelectItem value="icon-only">Icon Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Color Mode</label>
          <Select value={colorMode} onValueChange={(value) => setColorMode(value as "light" | "dark")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select color mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 rounded-md border border-gray-200 p-4">
        <div className={`flex h-40 items-center justify-center ${colorMode === "dark" ? "bg-[#0f172a]" : "bg-white"}`}>
          <div className="w-3/4" id="download-svg">
            <V4LogoSVG variant={variant} colorMode={colorMode} />
          </div>
        </div>
      </div>

      <button onClick={downloadSVG} className="w-full rounded-md bg-[#e32438] px-4 py-2 text-white hover:bg-[#c01e2e]">
        Download SVG
      </button>
    </div>
  )
}


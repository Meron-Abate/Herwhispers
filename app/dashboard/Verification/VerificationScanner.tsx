"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { verifyTokenOrCode, confirmHandover, VerificationResult } from "@/app/actions/verification"

export function VerificationScanner() {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [quantity, setQuantity] = useState<number>(2)
  const [isPending, startTransition] = useTransition()

  // Camera scanner states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const html5QrCodeRef = useRef<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Play a short feedback beep on successful scan using Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(800, audioCtx.currentTime)
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.15)
    } catch {
      // Audio not permitted or supported, safe to ignore
    }
  }

  // Execute lookup
  const runVerification = (codeToVerify: string) => {
    setError(null)
    setSuccessMsg(null)

    if (!codeToVerify.trim()) {
      setError("Please paste a QR token UUID or type a Participant Code.")
      return
    }

    startTransition(async () => {
      try {
        const res = await verifyTokenOrCode(codeToVerify)
        if (!res.success) {
          setError(res.message || "Participant not found.")
          setResult(null)
        } else {
          setResult(res)
          setError(null)
          setQuery("")
        }
      } catch (err: any) {
        setError(err.message || "An unexpected error occurred.")
        setResult(null)
      }
    })
  }

  const handleManualSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    runVerification(query)
  }

  // Start Camera Scanning
  const startCamera = async () => {
    setCameraError(null)
    setError(null)

    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scannerId = "qr-reader-container"

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerId)
      }

      setIsCameraActive(true)

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText: string) => {
          playBeep()
          setQuery(decodedText)
          await stopCamera()
          runVerification(decodedText)
        },
        () => {
          // Frame parse error - ignore while streaming
        }
      )
    } catch (err: any) {
      console.error("Camera error:", err)
      setIsCameraActive(false)
      setCameraError(
        "Could not access camera. Please allow camera permissions or upload an image file instead."
      )
    }
  }

  // Stop Camera Scanning
  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop()
        }
      } catch (err) {
        console.error("Error stopping camera:", err)
      }
    }
    setIsCameraActive(false)
  }

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [])

  // Scan from uploaded image file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCameraError(null)
    setError(null)

    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode("qr-file-reader-dummy")
      const decodedText = await scanner.scanFile(file, true)
      playBeep()
      setQuery(decodedText)
      runVerification(decodedText)
      scanner.clear()
    } catch (err: any) {
      setError("No valid QR code was detected in the uploaded image. Please try another photo.")
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleHandover = () => {
    const currentParticipant = result?.participant
    if (!currentParticipant) return
    setError(null)
    setSuccessMsg(null)

    startTransition(async () => {
      try {
        await confirmHandover(currentParticipant.id, quantity)
        setSuccessMsg(
          `Handover confirmed! Successfully recorded distribution of ${quantity} pack(s) to ${currentParticipant.participant_code}.`
        )
        const refreshed = await verifyTokenOrCode(
          currentParticipant.participant_code
        )
        setResult(refreshed)
      } catch (err: any) {
        setError(err.message || "Failed to confirm handover.")
      }
    })
  }

  const p = result?.participant
  const isDistributed = (p?.distributions?.length ?? 0) > 0
  const isEligible = p?.assessment?.result === "ELIGIBLE"

  return (
    <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Admin Eligibility & Distribution Scanner
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Scan student QR codes via webcam, upload a screenshot, or enter the participant code manually.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isCameraActive ? (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Scan with Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition"
              >
                Stop Camera
              </button>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition"
            >
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload QR Image
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Live Camera Viewfinder */}
        <div
          className={`mt-4 overflow-hidden rounded-2xl border-2 border-dashed border-rose-300 bg-black/90 p-4 transition-all ${
            isCameraActive ? "block" : "hidden"
          }`}
        >
          <div className="flex items-center justify-between pb-3 text-white">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-300">
              Live Camera Scanner Active
            </span>
            <span className="text-xs text-gray-300">Point at student's QR code</span>
          </div>

          <div
            id="qr-reader-container"
            className="w-full max-w-md mx-auto overflow-hidden rounded-xl"
          />
        </div>

        {/* Hidden container for image decoding */}
        <div id="qr-file-reader-dummy" className="hidden" />

        {cameraError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {cameraError}
          </div>
        )}

        {/* Manual Barcode / Text Input */}
        <form onSubmit={handleManualSearch} className="mt-4 flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Or type/paste QR Token UUID or HW-2026-..."
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition"
          >
            {isPending ? "Checking..." : "Verify Code"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMsg}
          </div>
        )}
      </div>

      {/* Result Verification Card */}
      {p && (
        <div className="mt-6 border-t border-gray-100 pt-6">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Participant Code
                </span>
                <h3 className="text-2xl font-bold text-gray-900 font-mono">
                  {p.participant_code}
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Telegram Student ID: <span className="font-mono">{p.student.telegram_id}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isEligible
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isEligible ? "ELIGIBLE FOR SUPPORT" : p.assessment?.result || "PENDING"}
                </span>

                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isDistributed
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {isDistributed ? "DISTRIBUTED" : "AWAITING PICKUP"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                <span className="text-xs text-gray-500">Campaign</span>
                <p className="mt-1 font-semibold text-gray-800">{p.campaign.name}</p>
                <span className="text-xs text-emerald-600 font-medium">{p.campaign.status}</span>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                <span className="text-xs text-gray-500">Assessment Score</span>
                <p className="mt-1 text-xl font-bold text-gray-800">
                  {p.assessment?.total_score ?? "N/A"} pts
                </p>
                <span className="text-xs text-gray-500">
                  {p.assessment?.result_reason ?? "Completed"}
                </span>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-100">
                <span className="text-xs text-gray-500">QR Code Status</span>
                <p className="mt-1 font-semibold text-gray-800">
                  {p.qrCode?.revoked_at ? "Revoked" : "Active & Verified"}
                </p>
                <span className="text-xs text-gray-400 font-mono truncate block" title={p.qrCode?.qr_token}>
                  {p.qrCode?.qr_token ? `${p.qrCode.qr_token.slice(0, 18)}...` : "None"}
                </span>
              </div>
            </div>

            {/* Handover Action Section */}
            <div className="mt-6 border-t border-gray-200 pt-5">
              {isDistributed ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>Handover Already Completed</span>
                  </div>
                  <p className="mt-1 text-xs">
                    This participant received {p.distributions[0].quantity} pack(s) on{" "}
                    {new Date(p.distributions[0].distributed_at).toLocaleString()}. Duplicate pickup is blocked.
                  </p>
                </div>
              ) : isEligible ? (
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div>
                    <h4 className="font-semibold text-emerald-900">
                      Eligible & Ready for Collection
                    </h4>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      Confirming handover will record distribution in PostgreSQL and prevent duplicate pickups.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-medium text-emerald-900">Packs:</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 rounded-lg border border-emerald-300 bg-white px-2.5 py-1.5 text-sm text-center font-semibold"
                      />
                    </div>
                    <button
                      onClick={handleHandover}
                      disabled={isPending}
                      className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition"
                    >
                      {isPending ? "Confirming..." : "Confirm Handover"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 text-sm">
                  This participant is not eligible for distribution under this campaign.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

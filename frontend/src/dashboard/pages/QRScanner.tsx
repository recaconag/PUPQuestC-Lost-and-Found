import { useState, useRef, useEffect } from "react";
import { 
  FaCamera, 
  FaQrcode, 
  FaCheck, 
  FaTimes, 
  FaBoxOpen, 
  FaUpload, 
  FaKeyboard,
  FaSpinner
} from "react-icons/fa";
import { Html5Qrcode } from "html5-qrcode";
import { useVerifyClaimQRMutation } from "../../redux/api/api";

const QRScanner = () => {
  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "manual">("camera");
  const [scannedToken, setScannedToken] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isDecodingFile, setIsDecodingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const [verifyClaimQR, { isLoading: isVerifying }] = useVerifyClaimQRMutation();

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch((err) => {
          console.error("Clean up camera stop failed", err);
        });
      }
    };
  }, []);

  // Handler for stop camera
  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraActive(false);
        setError(null);
      } catch (err: any) {
        console.error("Failed to stop camera scan stream:", err);
      }
    }
  };

  // Handler for start camera
  const startCamera = async () => {
    setError(null);
    try {
      const qrReaderEl = document.getElementById("qr-reader");
      if (!qrReaderEl) {
        throw new Error("Scanner viewport container not found in DOM");
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const minSize = Math.min(width, height);
            const boxSize = Math.floor(minSize * 0.7);
            return {
              width: boxSize,
              height: boxSize
            };
          }
        },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        () => {
          // Silent parsing loops
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.error("Failed to start camera session:", err);
      setError("Failed to access video device: " + (err.message || err));
    }
  };

  // Switch tabs securely and cleanup
  const handleTabChange = async (tab: "camera" | "upload" | "manual") => {
    if (isCameraActive) {
      await stopCamera();
    }
    setActiveTab(tab);
    setError(null);
  };

  // Perform backend verification
  const handleScanResult = async (token: string) => {
    await stopCamera();
    setScannedToken(token);
    setError(null);

    try {
      // Send token directly to our fallback route which queries by token
      const result = await verifyClaimQR({
        claimId: token,
        scannedToken: token,
      }).unwrap();

      if (result?.success) {
        setScanResult(result.data?.claimDetails);
        setScannedToken("");
      }
    } catch (err: any) {
      console.error("[QRScanner] Verification failed:", err);
      setError(
        err?.data?.message ?? "Failed to verify QR code token. Please try again."
      );
    }
  };

  // Handle image file selection and client-side decoding
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsDecodingFile(true);

    try {
      // Create a temporary node for html5-qrcode target bindings
      const tempContainer = document.createElement("div");
      tempContainer.id = "temp-qr-reader";
      tempContainer.style.display = "none";
      document.body.appendChild(tempContainer);

      const html5QrCode = new Html5Qrcode("temp-qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);

      // Cleanup DOM
      html5QrCode.clear();
      document.body.removeChild(tempContainer);

      handleScanResult(decodedText);
    } catch (err: any) {
      console.error("QR Code image decoding failed:", err);
      setError("No valid claim QR Code detected in this photo. Please upload a clear image.");
    } finally {
      setIsDecodingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleManualScan = async () => {
    if (!scannedToken.trim()) {
      setError("Please enter a token or claim ID");
      return;
    }
    await handleScanResult(scannedToken.trim());
  };

  const resetScanner = () => {
    setScannedToken("");
    setScanResult(null);
    setError(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-500 bg-clip-text text-transparent">
            QR Code Scanner
          </h1>
          <p className="text-gray-400 mt-1">
            Scan claim QR codes to verify and release items
          </p>
        </div>
      </div>

      {/* Main Container */}
      <div className="glass-card rounded-xl p-6">
        {!scanResult ? (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-700/60 mb-6">
              <button
                onClick={() => handleTabChange("camera")}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === "camera"
                    ? "border-yellow-500 text-yellow-500 bg-yellow-900/10"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaCamera />
                Camera Scan
              </button>
              <button
                onClick={() => handleTabChange("upload")}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === "upload"
                    ? "border-yellow-500 text-yellow-500 bg-yellow-900/10"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaUpload />
                Upload QR Image
              </button>
              <button
                onClick={() => handleTabChange("manual")}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all duration-200 ${
                  activeTab === "manual"
                    ? "border-yellow-500 text-yellow-500 bg-yellow-900/10"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <FaKeyboard />
                Enter Manually
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 px-4 py-3 bg-red-900/30 border border-red-600/40 rounded-lg text-sm text-red-300 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2 text-red-400">✕</span>
                  {error}
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-white text-xs font-bold"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Tab Contents */}
            <div className="mb-6 min-h-[260px] flex flex-col justify-center">
              {activeTab === "camera" && (
                <div className="flex flex-col items-center justify-center space-y-4">
                  {/* Camera Viewfinder */}
                  <div className="relative w-full max-w-sm aspect-square bg-gray-900 border border-red-900/40 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                    <div id="qr-reader" className="w-full h-full" />
                    {!isCameraActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 p-4 text-center">
                        <FaQrcode className="text-5xl text-gray-600 mb-3 animate-pulse" />
                        <p className="text-gray-400 text-sm">
                          Camera stream is turned off.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Toggle button */}
                  {!isCameraActive ? (
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-gray-900 font-semibold rounded-lg transition-all duration-200 flex items-center gap-2 shadow-[0_2px_10px_rgba(234,179,8,0.3)]"
                    >
                      <FaCamera />
                      Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-2"
                    >
                      <FaTimes />
                      Stop Camera
                    </button>
                  )}
                </div>
              )}

              {activeTab === "upload" && (
                <div className="flex flex-col items-center justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isDecodingFile}
                  />

                  {/* Drag-and-drop / Upload Zone */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isDecodingFile}
                    className="w-full max-w-sm aspect-video bg-gray-800/40 hover:bg-gray-800/60 border-2 border-dashed border-gray-700 hover:border-yellow-600/60 rounded-xl flex flex-col items-center justify-center transition-all duration-200 p-6 disabled:opacity-50"
                  >
                    {isDecodingFile ? (
                      <>
                        <FaSpinner className="text-4xl text-yellow-500 animate-spin mb-3" />
                        <p className="text-yellow-400 text-sm font-semibold">
                          Decoding QR Image...
                        </p>
                      </>
                    ) : (
                      <>
                        <FaUpload className="text-4xl text-yellow-500 mb-3" />
                        <p className="text-white font-semibold mb-1">
                          Click to select QR code image
                        </p>
                        <p className="text-gray-400 text-xs text-center">
                          Supports PNG, JPG, JPEG containing claim QR codes
                        </p>
                      </>
                    )}
                  </button>
                </div>
              )}

              {activeTab === "manual" && (
                <div className="max-w-xl mx-auto w-full">
                  <label className="block mb-2 text-sm font-semibold text-white">
                    Enter Verification Token Manually
                  </label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={scannedToken}
                      onChange={(e) => setScannedToken(e.target.value)}
                      placeholder="Enter QR token (e.g. PUPQC-CLAIM-...)"
                      className="flex-1 px-4 py-3 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400"
                      disabled={isVerifying}
                    />
                    <button
                      onClick={handleManualScan}
                      disabled={isVerifying || !scannedToken.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md border border-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <div className="flex items-center">
                          <FaSpinner className="animate-spin mr-2" />
                          Verifying...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <FaQrcode className="mr-2" />
                          Verify
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* General Instructions */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2 flex items-center">
                <FaQrcode className="mr-2" />
                How to Verify a Claim
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Choose your method: Real-time Camera scan, Image upload, or Manual input.</li>
                <li>Verify using the approved student claim QR code token.</li>
                <li>A valid verification automatically marks the item as "Claimed" and logs the release.</li>
              </ul>
            </div>
          </>
        ) : (
          /* Success Result */
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-600/50 rounded-lg p-6 text-center">
              <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FaCheck className="text-green-600 text-3xl" />
              </div>
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                VALID CLAIM ✓
              </h2>
              <p className="text-gray-300 text-sm">
                The claim verification QR code has been successfully verified!
              </p>
            </div>

            {/* Claim Details */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold gold-text mb-4">
                Claim Verification Log
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-gray-700/40 pb-2">
                  <span className="text-gray-400">Claimant:</span>
                  <span className="text-white font-medium">
                    {scanResult?.user?.name || scanResult?.user?.email}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-700/40 pb-2">
                  <span className="text-gray-400">Item Name:</span>
                  <span className="text-white font-medium">
                    {scanResult?.foundItem?.foundItemName}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-700/40 pb-2">
                  <span className="text-gray-400">Item Location:</span>
                  <span className="text-white font-medium">
                    {scanResult?.foundItem?.location}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-400">Release Status:</span>
                  <span className="text-green-400 font-bold">
                    CLAIMED / RELEASED
                  </span>
                </div>
              </div>
            </div>

            {/* Item Image */}
            {scanResult?.foundItem?.img && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Released Item Image
                </h3>
                <img
                  src={scanResult.foundItem.img}
                  alt={scanResult.foundItem.foundItemName}
                  className="w-full max-w-sm h-48 object-cover rounded-lg mx-auto"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetScanner}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
              >
                Scan Another
              </button>
              <button
                onClick={resetScanner}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center border border-green-600/50"
              >
                <FaBoxOpen className="mr-2" />
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;

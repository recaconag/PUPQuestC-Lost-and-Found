import { useState } from "react";
import { FaCamera, FaQrcode, FaCheck, FaTimes, FaBoxOpen } from "react-icons/fa";
import { useVerifyClaimQRMutation } from "../../redux/api/api";

const QRScanner = () => {
  const [scannedToken, setScannedToken] = useState("");
  const [claimId, setClaimId] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [verifyClaimQR, { isLoading: isVerifying }] = useVerifyClaimQRMutation();

  const handleManualScan = async () => {
    if (!scannedToken.trim()) {
      setError("Please enter a token or claim ID");
      return;
    }

    setError(null);

    try {
      const result = await verifyClaimQR({
        claimId: claimId || scannedToken,
        scannedToken: scannedToken,
      }).unwrap();

      if (result?.success) {
        setScanResult(result.data?.claimDetails);
        setScannedToken("");
        setClaimId("");
      }
    } catch (err: any) {
      console.error("[QRScanner] Verification failed:", err);
      setError(
        err?.data?.message ?? "Failed to verify QR code. Please try again."
      );
    }
  };

  const resetScanner = () => {
    setScannedToken("");
    setClaimId("");
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

      {/* Scanner Interface */}
      <div className="glass-card rounded-xl p-6">
        {!scanResult ? (
          <>
            <div className="mb-6">
              <label className="block mb-2 text-sm font-semibold text-white">
                Scan QR Code or Enter Token
              </label>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={scannedToken}
                  onChange={(e) => setScannedToken(e.target.value)}
                  placeholder="Enter QR token or claim ID..."
                  className="flex-1 px-4 py-3 bg-gray-800/50 border border-red-900/40 hover:border-red-800/60 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500/70 focus:border-yellow-500/60 transition-all duration-200 placeholder-gray-400"
                />
                <button
                  onClick={handleManualScan}
                  disabled={isVerifying || !scannedToken.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-md border border-red-600/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

            {/* Error Message */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-600/50 rounded-lg text-sm text-red-300">
                <div className="flex items-center">
                  <FaTimes className="mr-2" />
                  {error}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
              <h3 className="font-semibold text-blue-300 mb-2 flex items-center">
                <FaCamera className="mr-2" />
                How to Use
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Ask the claimant to show their approved claim QR code</li>
                <li>Enter the token from the QR code manually above</li>
                <li>Or use a QR scanner app to read the code</li>
                <li>Click "Verify" to validate the claim</li>
                <li>If valid, the item will be automatically marked as released</li>
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
              <p className="text-gray-300">
                The QR code has been successfully verified
              </p>
            </div>

            {/* Claim Details */}
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold gold-text mb-4">
                Claim Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Item:</span>
                  <span className="text-white font-medium">
                    {scanResult?.foundItem?.foundItemName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Claimant:</span>
                  <span className="text-white font-medium">
                    {scanResult?.user?.name || scanResult?.user?.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 font-medium">
                    CLAIMED / RETURNED
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Location:</span>
                  <span className="text-white font-medium">
                    {scanResult?.foundItem?.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Item Image */}
            {scanResult?.foundItem?.img && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">
                  Item Image
                </h3>
                <img
                  src={scanResult.foundItem.img}
                  alt={scanResult.foundItem.foundItemName}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={resetScanner}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
              >
                Scan Another
              </button>
              <button
                onClick={() => {
                  // Item is already released via the verify endpoint
                  resetScanner();
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center border border-green-600/50"
              >
                <FaBoxOpen className="mr-2" />
                Item Released
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;

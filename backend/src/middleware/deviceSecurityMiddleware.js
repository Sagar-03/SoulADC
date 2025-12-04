/**
 * Device Security Middleware
 * Validates device fingerprint and IP address for user authentication
 * 
 * This middleware ensures that users can only login from their registered device and IP.
 * On first login, it stores the device fingerprint and IP.
 * On subsequent logins, it verifies they match the stored values.
 */

/**
 * Extract client IP address from request
 * Handles various proxy scenarios
 */
const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip;
};

/**
 * Middleware to check device and IP security
 * Should be used AFTER password verification but BEFORE token generation
 * 
 * @param {Object} user - User document from database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Boolean} - Returns true if check passes, sends error response if fails
 */
const checkDeviceSecurity = async (user, req, res) => {
  try {
    // Skip check for admin users
    if (user.role === "admin") {
      return true;
    }

    const currentIp = getClientIp(req);
    const currentFingerprint = req.body.deviceFingerprint;

    // Validate fingerprint is provided
    if (!currentFingerprint) {
      console.log("⚠️ Warning: No device fingerprint provided in login request");
      // Allow login but log warning - you can make this stricter by returning false
    }

    // First-time login: Store IP and fingerprint
    if (!user.registeredIp && !user.deviceFingerprint) {
      if (currentFingerprint) {
        user.registeredIp = currentIp;
        user.deviceFingerprint = currentFingerprint;
        await user.save();
        
        console.log(`✅ First login - Device registered for ${user.email}:`, {
          ip: currentIp,
          fingerprint: currentFingerprint.substring(0, 12) + '...'
        });
      }
      return true;
    }

    // Subsequent logins: Verify device and IP match
    const ipMatches = user.registeredIp === currentIp;
    const fingerprintMatches = user.deviceFingerprint === currentFingerprint;

    if (!ipMatches || !fingerprintMatches) {
      console.log(`❌ Login blocked for ${user.email} - Device/IP mismatch:`, {
        storedIp: user.registeredIp,
        currentIp,
        ipMatches,
        storedFingerprint: user.deviceFingerprint?.substring(0, 12) + '...',
        currentFingerprint: currentFingerprint?.substring(0, 12) + '...',
        fingerprintMatches
      });

      res.status(403).json({
        success: false,
        message: "Login blocked: Unauthorized device or IP.",
        details: "This account is locked to a specific device and IP address. Please contact support if you need to access from a different device.",
        errorCode: "DEVICE_LOCK_VIOLATION"
      });
      return false;
    }

    console.log(`✅ Device and IP verified for ${user.email}`);
    return true;

  } catch (error) {
    console.error("❌ Error in device security check:", error);
    // In case of error, allow login but log the issue
    // You can make this stricter by returning false
    return true;
  }
};

/**
 * Helper function to clear device lock for a user
 * Used by admin endpoint
 */
const clearDeviceLock = async (user) => {
  user.registeredIp = null;
  user.deviceFingerprint = null;
  await user.save();
  
  console.log(`✅ Device lock cleared for user: ${user.email}`);
  return true;
};

module.exports = {
  checkDeviceSecurity,
  clearDeviceLock,
  getClientIp
};

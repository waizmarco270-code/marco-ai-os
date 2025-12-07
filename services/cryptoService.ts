
// A simple yet robust client-side license validation using hashing.
// In a real production app with high stakes, you'd want server-side validation.
// For a standalone/PWA "Legendary Assistant", this is secure enough against casual tampering.

const SALT = "MARCO_GENESIS_PROTOCOL_V3_SECRET_SALT_998877"; 
export const MASTER_KEY = "MARCO-DEV-WAIZ-MASTER";

// Generate a SHA-256 hash of the input string
async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a valid license key
// Format: MARCO-PRO-<RANDOM_ID>-<CHECKSUM>
export const generateLicenseKey = async (): Promise<string> => {
    // 1. Generate Random ID (8 chars hex)
    const randomId = Math.random().toString(16).substring(2, 10).toUpperCase();
    
    // 2. Create Checksum Base
    const base = `MARCO-PRO-${randomId}-${SALT}`;
    
    // 3. Hash it
    const hash = await sha256(base);
    
    // 4. Take first 4 chars of hash as checksum
    const checksum = hash.substring(0, 4).toUpperCase();
    
    return `MARCO-PRO-${randomId}-${checksum}`;
};

// Validate a license key
export const validateLicenseKey = async (key: string): Promise<boolean> => {
    const cleanKey = key.trim().toUpperCase();
    
    // MASTER KEY BYPASS
    if (cleanKey === MASTER_KEY) return true;

    const parts = cleanKey.split('-');
    
    // Check Format: MARCO-PRO-ID-CHECKSUM
    if (parts.length !== 4) return false;
    if (parts[0] !== 'MARCO' || parts[1] !== 'PRO') return false;
    
    const randomId = parts[2];
    const providedChecksum = parts[3];
    
    // Re-calculate hash
    const base = `MARCO-PRO-${randomId}-${SALT}`;
    const hash = await sha256(base);
    const calculatedChecksum = hash.substring(0, 4).toUpperCase();
    
    return providedChecksum === calculatedChecksum;
};

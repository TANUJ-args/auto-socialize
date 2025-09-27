export function mapAuthError(error: any): string {
  const message = error?.message || error?.toString() || "Unknown error";
  
  // PKCS#8 misconfiguration
  if (message.includes("PKCS") || message.includes("pkcs")) {
    return "Authentication system configuration error. Please contact support.";
  }
  
  // Invalid credentials
  if (message.includes("Invalid") || message.includes("invalid")) {
    return "Invalid credentials. Please check and try again.";
  }
  
  // Rate limiting
  if (message.includes("rate") || message.includes("too many")) {
    return "Too many attempts. Please try again later.";
  }
  
  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return "Network error. Please check your connection.";
  }
  
  // Email errors
  if (message.includes("email") || message.includes("Email")) {
    return "Please enter a valid email address.";
  }
  
  // Code errors
  if (message.includes("code") || message.includes("Code")) {
    return "Invalid verification code. Please try again.";
  }
  
  // Generic fallback
  return "Something went wrong. Please try again.";
}
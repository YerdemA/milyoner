import { FirebaseError } from "firebase/app";

const MESSAGES: Record<string, string> = {
  // Auth
  "auth/invalid-credential": "E-posta veya şifre hatalı.",
  "auth/invalid-email": "Geçerli bir e-posta adresi girin.",
  "auth/user-disabled": "Bu hesap devre dışı bırakılmış.",
  "auth/too-many-requests": "Çok fazla deneme yapıldı. Biraz bekleyip tekrar deneyin.",
  "auth/network-request-failed": "İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edin.",
  // Firestore
  "permission-denied": "Bu işlem için yetkiniz yok. Oturumunuz kapanmış olabilir.",
  unavailable: "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.",
  "not-found": "Kayıt bulunamadı. Silinmiş olabilir.",
};

/** Turns any thrown value into a Turkish message that can be shown to the user. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MESSAGES[error.code] ?? `Beklenmeyen bir hata oluştu (${error.code}).`;
  }
  // Our own validation errors already carry Turkish messages.
  if (error instanceof Error && error.message) return error.message;
  return "Beklenmeyen bir hata oluştu.";
}

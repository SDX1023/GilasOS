const ADMIN_STORAGE_KEY = "gilasos_admin_auth";

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
}

export function setAdmin(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    localStorage.setItem(ADMIN_STORAGE_KEY, "true");
  } else {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }
}

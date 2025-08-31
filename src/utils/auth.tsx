// src/utils/auth.ts
export type Auth = { studentId: number; name: string };

const STORAGE_KEY = "auth";
const NEXT_PAGE_KEY = "nextPage";

export function getAuth(): Auth | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            !parsed ||
            typeof parsed.studentId !== "number" ||
            !Number.isFinite(parsed.studentId) ||
            typeof parsed.name !== "string"
        ) {
            return null;
        }
        return parsed as Auth;
    } catch {
        return null;
    }
}

export function setAuth(auth: Auth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearAuth() {
    localStorage.removeItem(STORAGE_KEY);
}

/** 앱에서 사용하는 page 이름만 허용 */
const ALLOWED_PAGES = new Set([
    "intro", "courses", "register_wait", "register", "signup", "ranking", "login"
]);

export function normalizePage(input?: string | null): string {
    const p = (input || "").trim();
    return ALLOWED_PAGES.has(p) ? p : "intro";
}

/** 로그인 페이지로 (앱 상태 기반) */
export function redirectToLoginInApp() {
    try {
        const cur = localStorage.getItem("page") || "intro";
        sessionStorage.setItem(NEXT_PAGE_KEY, cur);
    } catch {}
    localStorage.setItem("page", "login");

    // 루트로 보내면서 상태 초기화
    try {
        if (window.location.pathname !== "/") {
            window.location.replace("/");
        } else {
            window.location.reload();
        }
    } catch {
        window.location.href = "/";
    }
}

/** 로그인 후 돌아갈 page 회수 */
export function consumeNextPage(): string | null {
    try {
        const p = sessionStorage.getItem(NEXT_PAGE_KEY);
        if (p) {
            sessionStorage.removeItem(NEXT_PAGE_KEY);
            return normalizePage(p);
        }
    } catch {}
    return null;
}

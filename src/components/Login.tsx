import React, { useEffect, useState } from "react";
import { getAuth, setAuth, consumeNextPage, normalizePage } from "../utils/auth";

const API_BASE = "http://3.39.123.47/api/apply";

const Login: React.FC = () => {
    const [studentId, setStudentId] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string>("");

    // 이미 로그인 상태면 nextPage 또는 intro로 바로 보냄
    useEffect(() => {
        const a = getAuth();
        if (a) {
            const nextPage = consumeNextPage() || "intro";
            localStorage.setItem("page", normalizePage(nextPage));
            if (window.location.pathname !== "/") {
                window.location.replace("/");
            } else {
                window.location.reload();
            }
        }
    }, []);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        if (!studentId || !name.trim()) {
            setErr("학번과 이름을 모두 입력해주세요.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId: Number(studentId), name: name.trim() }),
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || "로그인 실패");
            }
            const json = await res.json().catch(() => ({}));
            const payload = json?.data ?? json;
            if (!payload || typeof payload.studentId !== "number" || typeof payload.name !== "string") {
                throw new Error("로그인 응답이 올바르지 않습니다.");
            }
            setAuth({ studentId: payload.studentId, name: payload.name });

            // 로그인 성공 → nextPage로 이동(없으면 intro)
            const nextPage = consumeNextPage() || "intro";
            localStorage.setItem("page", normalizePage(nextPage));

            if (window.location.pathname !== "/") {
                window.location.replace("/");
            } else {
                window.location.reload();
            }
        } catch (e: any) {
            setErr(e?.message || "로그인 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 420, margin: "80px auto", padding: 24, border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" }}>
            <h2 style={{ marginBottom: 16, fontWeight: 800 }}>로그인</h2>
            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                    <span>학번</span>
                    <input
                        type="number"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="예: 20201234"
                        style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                        required
                    />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                    <span>이름</span>
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="이름을 입력하세요"
                        style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                        required
                    />
                </label>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: "10px 12px",
                        background: "#2563eb",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        fontWeight: 800,
                        cursor: "pointer",
                    }}
                >
                    {loading ? "로그인 중..." : "로그인"}
                </button>
                {err && <div style={{ color: "#ef4444", marginTop: 6 }}>{err}</div>}
            </form>
        </div>
    );
};

export default Login;

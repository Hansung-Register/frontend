// src/components/RegisterWait.tsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/RegisterWait.css";
import NaverClock from "./NaverClock";
import { getAuth, redirectToLoginInApp } from "../utils/auth";

interface RegisterWaitProps {
    onGoClick: () => void;
}

const COUNTDOWN_START = 15; // 15초
const API_BASE = "http://3.39.123.47/api/apply";

const RegisterWait: React.FC<RegisterWaitProps> = ({ onGoClick }) => {
    // 🔒 인증 가드
    const [authChecked, setAuthChecked] = useState(false);
    const [studentId, setStudentId] = useState<number | null>(null);

    useEffect(() => {
        const a = getAuth();
        if (!a) {
            // 앱 방식으로 로그인 화면으로만 보냄
            redirectToLoginInApp();
            return; // 렌더 중단
        }
        setStudentId(a.studentId);
        setAuthChecked(true);
    }, []);

    // ✅ 대기화면 진입 시, 수강신청 잠금 해제(재신청 가능)
    useEffect(() => {
        if (!authChecked) return;
        try {
            localStorage.removeItem("registerLocked");
            localStorage.removeItem("registerSelectedSnapshot");
            // 필요하면 아래 두 줄도 해제해서 카운트다운도 새로 시작 가능
            // localStorage.removeItem("registerWaitEnter");
            // localStorage.removeItem("registerWaitReady");
        } catch {}
    }, [authChecked]);

    // ===== 로그인된 사용자만 아래 로직 실행 =====
    const [entered] = useState<number>(() => {
        const saved = parseInt(localStorage.getItem("registerWaitEnter") || "0", 10);
        if (saved > 0) return saved;
        const now = Date.now();
        localStorage.setItem("registerWaitEnter", String(now));
        return now;
    });

    const [isReadyFromStorage] = useState<boolean>(() => localStorage.getItem("registerWaitReady") === "true");

    const [secondsLeft, setSecondsLeft] = useState<number>(() => {
        const elapsed = Math.floor((Date.now() - entered) / 1000);
        return Math.max(COUNTDOWN_START - elapsed, 0);
    });

    const redAlpha = secondsLeft <= 10 ? Math.min(1, Math.max(0, 0.1 + 0.9 * ((10 - secondsLeft) / 10))) : 0;

    const prevBodyBgRef = useRef<string | null>(null);
    useEffect(() => {
        if (!authChecked) return;
        if (prevBodyBgRef.current === null) {
            prevBodyBgRef.current = document.body.style.backgroundColor || "";
        }
        document.body.style.backgroundColor = redAlpha > 0 ? `rgba(255, 0, 0, ${redAlpha})` : (prevBodyBgRef.current || "");
        return () => {
            if (prevBodyBgRef.current !== null) {
                document.body.style.backgroundColor = prevBodyBgRef.current;
            }
        };
    }, [authChecked, redAlpha]);

    useEffect(() => {
        if (!authChecked) return;
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1)), 1000);
        return () => clearInterval(timer);
    }, [authChecked, secondsLeft]);

    useEffect(() => {
        if (!authChecked) return;
        if (secondsLeft === 0 && localStorage.getItem("registerWaitReady") !== "true") {
            localStorage.setItem("registerWaitReady", "true");
            if (typeof studentId === "number") {
                fetch(`${API_BASE}/start?studentId=${encodeURIComponent(String(studentId))}`, { method: "POST" })
                    .catch(() => {});
            }
        }
    }, [authChecked, secondsLeft, studentId]);

    // 뒤로 가기 무력화
    useEffect(() => {
        if (!authChecked) return;
        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
        };
        window.addEventListener("popstate", handlePopState);
        window.history.pushState(null, "", window.location.href);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [authChecked]);

    const handleGoClick = () => {
        localStorage.removeItem("registerWaitReady");
        onGoClick();
    };

    if (!authChecked) {
        // 리다이렉트 중에는 아무것도 렌더하지 않음
        return null;
    }

    return (
        <div className="register-wait-container">
            <div className="register-wait-left">
                <div className="countdown-timer" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {isReadyFromStorage ? (
                        <button
                            style={{ fontSize: "1.5rem", color: "#fff", padding: "1rem 2rem", background: "#2563eb", border: "none", borderRadius: 8 }}
                            onClick={handleGoClick}
                        >
                            수강신청 GO
                        </button>
                    ) : secondsLeft > 0 ? (
                        <span style={{ fontSize: "1.5rem", color: "#000" }}>대기 중... ({secondsLeft}초)</span>
                    ) : (
                        <span style={{ fontSize: "1.1rem", color: "#1976d2" }}>
              대기 종료! 새로고침(F5)하면 <b>수강신청 GO~</b> 버튼이 활성화됩니다.
            </span>
                    )}
                </div>
            </div>
            <div className="register-wait-right">
                <NaverClock secondsLeft={secondsLeft} />
            </div>
        </div>
    );
};

export default RegisterWait;

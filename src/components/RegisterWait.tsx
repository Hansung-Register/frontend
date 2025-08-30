import React, { useEffect, useState } from "react";
import "../styles/RegisterWait.css";
import NaverClock from "./NaverClock";

interface RegisterWaitProps {
    onGoClick: () => void;
}

const COUNTDOWN_START = 15; // 15초

const RegisterWait: React.FC<RegisterWaitProps> = ({ onGoClick }) => {
    // 입장 시각: 없으면 지금 시각을 저장 (새로고침해도 유지)
    const [entered] = useState<number>(() => {
        const saved = parseInt(localStorage.getItem("registerWaitEnter") || "0", 10);
        if (saved > 0) return saved;
        const now = Date.now();
        localStorage.setItem("registerWaitEnter", String(now));
        return now;
    });

    // 버튼 노출 여부는 "오직" 저장된 플래그로만 결정 (런타임에 setState로 바꾸지 않음)
    const [isReadyFromStorage] = useState<boolean>(
        () => localStorage.getItem("registerWaitReady") === "true"
    );

    // 남은 시간
    const [secondsLeft, setSecondsLeft] = useState<number>(() => {
        const elapsed = Math.floor((Date.now() - entered) / 1000);
        return Math.max(COUNTDOWN_START - elapsed, 0);
    });

    // 카운트다운 타이머
    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    // 카운트다운이 0이 되는 "그 순간"에만: 플래그 세팅 + API 호출
    // 단, isReadyFromStorage는 일부러 바꾸지 않아 새로고침해야 버튼이 뜸
    useEffect(() => {
        if (secondsLeft === 0 && localStorage.getItem("registerWaitReady") !== "true") {
            localStorage.setItem("registerWaitReady", "true");
            console.log("[수강신청 시작 API 호출] POST /api/apply/start");
            fetch("/api/apply/start", { method: "POST" })
                .then((res) => {
                    if (!res.ok) throw new Error("API 실패");
                    return res.text();
                })
                .then((data) => console.log("[수강신청 시작 API 응답]", data))
                .catch((e) => console.error("[수강신청 시작 API 오류]", e));
        }
    }, [secondsLeft]);

    // 뒤로 가기만 무력화
    useEffect(() => {
        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
        };
        window.addEventListener("popstate", handlePopState);
        window.history.pushState(null, "", window.location.href);
        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const handleGoClick = () => {
        // 한 번 사용 후 플래그 제거 (원하면 유지해도 됨)
        localStorage.removeItem("registerWaitReady");
        onGoClick();
    };

    return (
        <div className="register-wait-container">
            <div className="register-wait-left">
                <div className="countdown-timer" style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {isReadyFromStorage ? (
                        <button
                            style={{ fontSize: "1.5rem", color: "#4caf50", padding: "1rem 2rem" }}
                            onClick={handleGoClick}
                        >
                            수강신청 GO
                        </button>
                    ) : secondsLeft > 0 ? (
                        <span style={{ fontSize: "1.5rem", color: "#888" }}>대기 중... ({secondsLeft}초)</span>
                    ) : (
                        // 여기서는 버튼을 절대 노출하지 않음. 새로고침해야 버튼이 뜨도록 안내만.
                        <span style={{ fontSize: "1.1rem", color: "#1976d2" }}>
              대기 종료! 새로고침(F5)하면 <b>수강신청 GO</b> 버튼이 활성화됩니다.
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

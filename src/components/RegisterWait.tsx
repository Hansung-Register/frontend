import React, { useEffect, useRef, useState } from "react";
import "../styles/RegisterWait.css";
import NaverClock from "./NaverClock";
import bgm from "../assets/mbc-fm.mp3";

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

    // 배경색(10초~0초: 점점 빨강) 계산 (body에만 적용)
    const redAlpha = secondsLeft <= 10 ? Math.min(1, Math.max(0, 0.1 + 0.9 * ((10 - secondsLeft) / 10))) : 0;

    // 전체 화면(body) 배경색 적용 및 원복
    const prevBodyBgRef = useRef<string | null>(null);
    useEffect(() => {
        if (prevBodyBgRef.current === null) {
            prevBodyBgRef.current = document.body.style.backgroundColor || "";
        }
        if (redAlpha > 0) {
            document.body.style.backgroundColor = `rgba(255, 0, 0, ${redAlpha})`;
        } else {
            document.body.style.backgroundColor = prevBodyBgRef.current || "";
        }
        return () => {
            if (prevBodyBgRef.current !== null) {
                document.body.style.backgroundColor = prevBodyBgRef.current;
            }
        };
    }, [redAlpha]);

    // 오디오 관리
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const audioStartedRef = useRef<boolean>(false);

    // 오디오 인스턴스 준비 및 정리
    useEffect(() => {
        const audio = new Audio(bgm);
        audio.preload = "auto";
        audioRef.current = audio;
        return () => {
            try {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                }
            } catch (e) {
                // no-op
            } finally {
                audioRef.current = null;
                audioStartedRef.current = false;
            }
        };
    }, []);

    // 카운트다운 타이머
    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    // 7초 남았을 때부터 재생 시도, 0초가 되면 정지
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const tryPlay = () => {
            if (!audioRef.current || audioStartedRef.current) return;
            audioRef.current
                .play()
                .then(() => {
                    audioStartedRef.current = true; // 성공시에만 시작 처리
                })
                .catch((err) => {
                    console.warn("[오디오 재생 실패] 사용자 상호작용 필요할 수 있음:", err);
                });
        };

        // 임계(<=8초 && >0)에서 자동 재생 시도
        if (secondsLeft > 0 && secondsLeft <= 8 && !audioStartedRef.current) {
            tryPlay();

            // 사용자 상호작용으로도 재생 가능하도록 일시 리스너 부착
            const onUserInteract = () => {
                tryPlay();
                if (audioStartedRef.current) {
                    removeListeners();
                }
            };
            const removeListeners = () => {
                window.removeEventListener("pointerdown", onUserInteract);
                window.removeEventListener("keydown", onUserInteract);
                window.removeEventListener("touchstart", onUserInteract, { capture: true } as any);
            };

            window.addEventListener("pointerdown", onUserInteract, { passive: true });
            window.addEventListener("keydown", onUserInteract, { passive: true });
            window.addEventListener("touchstart", onUserInteract, { passive: true, capture: true } as any);

            return () => {
                removeListeners();
            };
        }

        // 0초에 정지
        if (secondsLeft === 0) {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch (e) {
                // no-op
            }
        }
    }, [secondsLeft]);

    // 카운트다운 0초: 플래그 세팅 + API 호출
    useEffect(() => {
        if (secondsLeft === 0 && localStorage.getItem("registerWaitReady") !== "true") {
            localStorage.setItem("registerWaitReady", "true");
            console.log('[수강신청 시작 API 호출] POST /api/apply/start');
            fetch('http://3.39.123.47/api/apply/start', { method: 'POST' })
                .then((res) => {
                    if (!res.ok) throw new Error("API 실패");
                    return res.text();
                })
                .then((data) => console.log("[수강신청 시작 API 응답]", data))
                .catch((e) => console.error("[수강신청 시작 API 오류]", e));
        }
    }, [secondsLeft]);

    // 뒤로 가기 무력화
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
        localStorage.removeItem("registerWaitReady");
        onGoClick();
    };

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

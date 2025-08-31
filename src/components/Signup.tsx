import React, { useEffect, useState } from "react";
import "../styles/Signup.css";
import { getAuth, redirectToLoginInApp } from "../utils/auth";

type MyRank = {
    count: number;
    record: number;
    rank: number;
    studentId: number;
    name: string;
};

interface SignupProps {
    onBackClick: () => void;
    onSignupSuccess?: () => void; // = "순위표로 이동" 버튼 클릭 시 사용
}

const API_BASE = "http://3.39.123.47/api/rank";

const Signup: React.FC<SignupProps> = ({ onBackClick, onSignupSuccess }) => {
    const [me, setMe] = useState<MyRank | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // Signup.tsx - useEffect 내부 fetchMy()만 교체
    useEffect(() => {
        const auth = getAuth();
        if (!auth) {
            redirectToLoginInApp();
            return;
        }

        const fetchMy = async () => {
            setLoading(true);
            setErr("");
            try {
                const res = await fetch(`${API_BASE}/my?studentId=${auth.studentId}`, {
                    credentials: "include",
                });

                // 1) 백엔드가 "없음"을 404/204로 주는 경우: 친절 메시지로 처리
                if (res.status === 404 || res.status === 204) {
                    setMe(null);         // 아래 렌더에서 "결과가 없습니다." 표시됨
                    setLoading(false);
                    return;
                }

                // 2) 그 외 비정상: 스프링 기본 에러 JSON(500 등)도 친절 메시지로
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    try {
                        const errJson = JSON.parse(txt);
                        // 스프링 기본 에러 형식: {timestamp, status, error, path, ...}
                        if (errJson?.status >= 500 && String(errJson?.path || "").includes("/api/rank/my")) {
                            setMe(null);     // 결과 없음으로 간주
                            setLoading(false);
                            return;
                        }
                        setErr(errJson?.message || errJson?.error || "내 순위를 불러오지 못했습니다.");
                    } catch {
                        setErr("내 순위가 아직 없거나 서버 오류가 발생했습니다.");
                    }
                    return;
                }

                // 3) 정상 응답 파싱
                const json = await res.json().catch(() => ({} as any));
                const data = json?.data ?? json;
                if (
                    !data ||
                    typeof data.count !== "number" ||
                    typeof data.record !== "number" ||
                    typeof data.rank !== "number"
                ) {
                    // 포맷이 기대와 다르면 결과 없음으로 처리
                    setMe(null);
                    setLoading(false);
                    return;
                }

                setMe({
                    count: data.count,
                    record: data.record,
                    rank: data.rank,
                    studentId: data.studentId,
                    name: data.name,
                });
            } catch (e: any) {
                setErr(e?.message || "내 순위를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchMy();
    }, []);


    const goRanking = () => {
        if (onSignupSuccess) {
            onSignupSuccess();
        } else {
            // 안전장치: App이 콜백 안 주는 경우
            localStorage.setItem("page", "ranking");
            window.location.reload();
        }
    };

    return (
        <div className="signup-container">
            <h2>내 결과</h2>

            {loading ? (
                <div className="signup-message">불러오는 중...</div>
            ) : err ? (
                <div className="signup-message" style={{ color: "#ef4444" }}>{err}</div>
            ) : me ? (
                <>
                    {/* 결과 카드 */}
                    <div className="signup-result-info-card" style={{ marginBottom: 16 }}>
                        <div className="signup-result-title">내 수강신청 결과</div>

                        <div className="signup-result-row">
                            <span className="signup-result-label">이름</span>
                            <span className="signup-result-value">{me.name}</span>
                        </div>
                        <div className="signup-result-row">
                            <span className="signup-result-label">학번</span>
                            <span className="signup-result-value">{me.studentId}</span>
                        </div>
                        <div className="signup-result-row">
                            <span className="signup-result-label">기록</span>
                            <span className="signup-result-value">{me.record}</span>
                        </div>
                        <div className="signup-result-row">
                            <span className="signup-result-label">신청 과목 수</span>
                            <span className="signup-result-value">{me.count}개</span>
                        </div>

                        <div className="signup-result-row" style={{ alignItems: "center" }}>
                            <span className="signup-result-label">순위</span>
                            <span className="signup-result-value">
                <span
                    style={{
                        display: "inline-block",
                        background: "linear-gradient(90deg,#ffeb3b 60%,#ffd600 100%)",
                        color: "#222",
                        fontWeight: 900,
                        fontSize: "1.3rem",
                        borderRadius: "8px",
                        padding: "2px 18px",
                    }}
                >
                  {me.rank}위
                </span>
              </span>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                        <button className="signup-back-btn" onClick={onBackClick}>
                            뒤로가기
                        </button>
                        <button
                            className="signup-back-btn"
                            onClick={goRanking}
                            style={{ background: "#2563eb", color: "#fff", border: "none" }}
                        >
                            순위표 보기
                        </button>
                    </div>
                </>
            ) : (
                <div className="signup-message">결과가 없습니다.</div>
            )}
        </div>
    );
};

export default Signup;

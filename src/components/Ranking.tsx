import React, { useEffect, useState } from "react";
import { getAuth } from "../utils/auth";

interface RankingItem {
    count: number;
    record: number;
    rank: number;
    studentId: number;
    name: string;
}

const medalColors = ["#ffd700", "#c0c0c0", "#cd7f32"]; // 1,2,3등

const Ranking: React.FC = () => {
    const [ranking, setRanking] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const auth = getAuth();
    const myId = auth?.studentId;

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError("");
            try {
                const res = await fetch("http://3.39.123.47/api/rank/all", {
                    credentials: "include",
                });
                if (!res.ok) {
                    const txt = await res.text().catch(() => "");
                    throw new Error(txt || "순위 정보를 불러오지 못했습니다.");
                }
                const json = await res.json().catch(() => ({} as any));
                const data: RankingItem[] = Array.isArray(json?.data ?? json)
                    ? (json?.data ?? json)
                    : [];
                setRanking(data);
            } catch (e: any) {
                setError(e?.message || "순위 정보를 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    return (
        <div style={{ padding: "40px", textAlign: "center" }}>
            <h2
                style={{
                    marginBottom: 32,
                    fontWeight: 800,
                    fontSize: "2.2rem",
                    letterSpacing: 1,
                }}
            >
                전체 순위표
            </h2>

            {loading ? (
                <div style={{ fontSize: "1.2rem", color: "#888" }}>불러오는 중...</div>
            ) : error ? (
                <div style={{ color: "red" }}>{error}</div>
            ) : (
                <div style={{ display: "flex", justifyContent: "center" }}>
                    <table
                        style={{
                            borderCollapse: "separate",
                            borderSpacing: 0,
                            minWidth: 680,
                            background: "#fff",
                            borderRadius: 16,
                            boxShadow: "0 2px 16px #eee",
                            overflow: "hidden",
                        }}
                    >
                        <thead style={{ background: "#f5f5f5" }}>
                        <tr>
                            <th style={{ padding: "12px 24px", fontWeight: 700, fontSize: "1.1rem" }}>순위</th>
                            <th style={{ padding: "12px 24px", fontWeight: 700, fontSize: "1.1rem" }}>이름</th>
                            <th style={{ padding: "12px 24px", fontWeight: 700, fontSize: "1.1rem" }}>학번</th>
                            <th style={{ padding: "12px 24px", fontWeight: 700, fontSize: "1.1rem" }}>기록</th>
                            <th style={{ padding: "12px 24px", fontWeight: 700, fontSize: "1.1rem" }}>신청 과목 수</th>
                        </tr>
                        </thead>
                        <tbody>
                        {ranking.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: 32, color: "#aaa" }}>
                                    순위 데이터가 없습니다.
                                </td>
                            </tr>
                        )}
                        {ranking.map((item, idx) => {
                            const isTop3 = item.rank >= 1 && item.rank <= 3;
                            const myRow = myId && item.studentId === myId;

                            return (
                                <tr
                                    key={`${item.rank}-${item.studentId}`}
                                    style={{
                                        background: isTop3
                                            ? medalColors[item.rank - 1] + "22"
                                            : myRow
                                                ? "#e0f2fe"
                                                : idx % 2 === 0
                                                    ? "#fafbfc"
                                                    : "#fff",
                                        fontWeight: isTop3 ? 700 : myRow ? 700 : 400,
                                        fontSize: isTop3 ? "1.1rem" : "1rem",
                                        color: isTop3 ? medalColors[item.rank - 1] : "#222",
                                        borderBottom: "1px solid #eee",
                                        transition: "background 0.2s",
                                    }}
                                >
                                    <td style={{ padding: "10px 0", fontWeight: 900 }}>
                                        {isTop3 ? (
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    width: 32,
                                                    height: 32,
                                                    lineHeight: "32px",
                                                    borderRadius: "50%",
                                                    background: medalColors[item.rank - 1],
                                                    color: "#fff",
                                                    fontWeight: 900,
                                                    fontSize: "1.1rem",
                                                    boxShadow: "0 2px 8px #eee",
                                                    marginRight: 4,
                                                }}
                                            >
                          {item.rank}
                        </span>
                                        ) : (
                                            item.rank
                                        )}
                                    </td>
                                    <td style={{ padding: "10px 0" }}>{item.name}</td>
                                    <td style={{ padding: "10px 0" }}>{item.studentId}</td>
                                    <td style={{ padding: "10px 0" }}>{item.record}</td>
                                    <td style={{ padding: "10px 0" }}>{item.count}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* 내 순위 강조 카드(선택) */}
            {auth && !loading && !error && (
                <div
                    style={{
                        marginTop: 24,
                        color: "#334155",
                        fontSize: ".9rem",
                    }}
                >
                    로그인: {auth.name} ({auth.studentId})
                </div>
            )}
        </div>
    );
};

export default Ranking;

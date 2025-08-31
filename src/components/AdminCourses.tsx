// src/components/AdminCourses.tsx
import React, { useEffect, useState } from "react";
import Modal from "./Modal";

interface AdminCourse {
    id?: number | string;
    name: string;
    remain: number;
    basket: number;
    status?: string;
    time?: number; // 관리자 응답의 Long time
}

const AdminCourses: React.FC = () => {
    const [courses, setCourses] = useState<AdminCourse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const [name, setName] = useState("");
    const [remain, setRemain] = useState<number | "">("");
    const [basket, setBasket] = useState<number | "">("");
    const [time, setTime] = useState<number | "">(""); // 선택 입력(Long)

    // 편집 상태
    const [editId, setEditId] = useState<number | string | null>(null);
    const [editName, setEditName] = useState<string>("");
    const [editRemain, setEditRemain] = useState<number | "">("");
    const [editBasket, setEditBasket] = useState<number | "">("");
    const [editTime, setEditTime] = useState<number | "">("");

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMsg, setModalMsg] = useState<string>("");

    const fetchCourses = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://3.39.123.47/api/courses/admin/all", { credentials: "include" });
            if (!res.ok) throw new Error("목록 조회 실패");
            const json = await res.json();
            const list: any[] = Array.isArray(json?.data) ? json.data : [];
            setCourses(list.map((it) => ({
                id: it?.id ?? it?.courseId ?? it?.code,
                name: String(it?.name ?? ""),
                remain: Number.isFinite(it?.remain) ? Number(it.remain) : 0,
                basket: Number.isFinite(it?.basket) ? Number(it.basket) : 0,
                status: it?.status ? String(it.status) : undefined,
                time: Number.isFinite(it?.time) ? Number(it.time) : undefined,
            })));
        } catch (e: any) {
            setError(e?.message || "과목 목록을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    const beginEdit = (c: AdminCourse) => {
        setEditId(c.id ?? null);
        setEditName(c.name ?? "");
        setEditRemain(typeof c.remain === 'number' ? c.remain : "");
        setEditBasket(typeof c.basket === 'number' ? c.basket : "");
        setEditTime(typeof c.time === 'number' ? c.time : "");
    };

    const cancelEdit = () => {
        setEditId(null);
        setEditName("");
        setEditRemain("");
        setEditBasket("");
        setEditTime("");
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editId == null) return;
        try {
            const payload: any = {};
            if (editName.trim()) payload.name = editName.trim();
            if (editRemain !== '' && typeof editRemain === 'number') payload.remain = editRemain;
            if (editBasket !== '' && typeof editBasket === 'number') payload.basket = editBasket;
            if (editTime !== '' && typeof editTime === 'number') payload.time = editTime;
            const res = await fetch(`http://3.39.123.47/api/courses/update/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(txt || '과목 수정 실패');
            }
            setModalMsg('과목 수정 성공');
            setModalOpen(true);
            cancelEdit();
            await fetchCourses();
        } catch (e: any) {
            setModalMsg(e?.message || '과목 수정 실패');
            setModalOpen(true);
        }
    };

    const formatTime = (t?: number) => {
        if (typeof t === 'number' && isFinite(t)) {
            return `${t}초`;
        }
        return '-';
    };

    return (
        <div style={{ padding: "96px 20px 28px", maxWidth: 1120, margin: "0 auto" }}>
            <h2 style={{ marginBottom: 16 }}>관리자: 과목 관리</h2>

            {editId !== null && (
                <form onSubmit={handleUpdate} style={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 140px 1fr 140px 120px 100px', gap: 8, alignItems: 'center',
                    background: '#fff7ed', padding: 12, borderRadius: 12, border: '1px solid #fed7aa', marginBottom: 12
                }}>
                    <div style={{ gridColumn: '1 / -1', fontWeight: 800, color: '#9a3412' }}>수정 중 (ID: {String(editId)})</div>
                    <input value={editName} onChange={(e)=>setEditName(e.target.value)} placeholder="과목명" style={{ padding: '10px 12px', border: '1px solid #fbbf24', borderRadius: 8 }}/>
                    <input type="number" min={1} value={editRemain} onChange={(e)=>setEditRemain(e.target.value === '' ? '' : Number(e.target.value))} placeholder="잔여석" style={{ padding: '10px 12px', border: '1px solid #fbbf24', borderRadius: 8 }}/>
                    <input type="number" min={1} value={editBasket} onChange={(e)=>setEditBasket(e.target.value === '' ? '' : Number(e.target.value))} placeholder="장바구니" style={{ padding: '10px 12px', border: '1px solid #fbbf24', borderRadius: 8 }}/>
                    <input type="number" value={editTime} onChange={(e)=>setEditTime(e.target.value === '' ? '' : Number(e.target.value))} placeholder="time(초, 선택)" style={{ padding: '10px 12px', border: '1px solid #fbbf24', borderRadius: 8 }}/>
                    <button type="submit" style={{ padding: '10px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800 }}>수정 적용</button>
                    <button type="button" onClick={cancelEdit} style={{ padding: '10px 12px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: 10, fontWeight: 800 }}>취소</button>
                </form>
            )}

            {/* 등록 폼 (등록 버튼/로직 없음, 엔터 제출 방지) */}
            <form
                onSubmit={(e) => e.preventDefault()}
                style={{
                    display: "grid", gridTemplateColumns: "1fr 140px 140px 1fr 140px", gap: 8, alignItems: "center",
                    background: "#f8fafc", padding: 12, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20
                }}
            >
                <input
                    placeholder="과목명"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                />
                <input
                    placeholder="잔여석"
                    type="number"
                    min={1}
                    value={remain}
                    onChange={(e) => setRemain(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                />
                <input
                    placeholder="장바구니"
                    type="number"
                    min={1}
                    value={basket}
                    onChange={(e) => setBasket(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                />
                <input
                    placeholder="마감시간(초, 선택) 예: 3"
                    type="number"
                    value={time}
                    onChange={(e) => setTime(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{ padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
                />
                {/* 등록 버튼 없음 */}
            </form>

            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 120px 120px 220px 110px 90px 90px", gap: 8,
                    padding: "10px 12px", background: "#f1f5f9", fontWeight: 700, color: "#334155"
                }}>
                    <div>과목명</div>
                    <div style={{ textAlign: "right" }}>잔여석</div>
                    <div style={{ textAlign: "right" }}>장바구니</div>
                    <div style={{ textAlign: "center" }}>남은 시간(초)</div>
                    <div style={{ textAlign: "right" }}>ID</div>
                    <div style={{ textAlign: "center" }}>수정</div>
                    <div style={{ textAlign: "center" }}>삭제</div>
                </div>
                {loading ? (
                    <div style={{ padding: 16, textAlign: "center", color: "#64748b" }}>불러오는 중…</div>
                ) : error ? (
                    <div style={{ padding: 16, color: "#ef4444" }}>{error}</div>
                ) : courses.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center", color: "#64748b" }}>등록된 과목이 없습니다.</div>
                ) : (
                    courses.map((c) => (
                        <div key={String(c.id) + c.name}
                             style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 220px 110px 90px 90px", gap: 8, padding: "10px 12px", borderTop: "1px solid #eef2f7", alignItems: "center" }}>
                            <div>{c.name}</div>
                            <div style={{ textAlign: "right" }}>{c.remain}</div>
                            <div style={{ textAlign: "right" }}>{c.basket}</div>
                            <div style={{ textAlign: "center", color: "#475569" }}>{formatTime(c.time)}</div>
                            <div style={{ textAlign: "right", color: "#64748b" }}>{c.id ?? '-'}</div>
                            <div style={{ textAlign: "center" }}>
                                <button onClick={() => beginEdit(c)} style={{ padding: '6px 10px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>수정</button>
                            </div>
                            {/* 삭제 버튼 제거: 빈 셀로 레이아웃 유지 */}
                            <div style={{ textAlign: "center" }} />
                        </div>
                    ))
                )}
            </div>

            <Modal open={modalOpen} message={modalMsg} onClose={() => setModalOpen(false)} />
        </div>
    );
};

export default AdminCourses;

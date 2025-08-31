// src/components/Register.tsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import "../styles/Register.css";
import Modal from "./Modal";
import { getAuth, redirectToLoginInApp } from "../utils/auth";

type DayKo = "월" | "화" | "수" | "목" | "금";

type Slot = { day: DayKo; startHour: number; endHour: number; title?: string; };

type Course = {
    id: string; code: string; name: string; division: string; iseu: string; credit: number;
    dayNight: string; grade: string; instructor: string; room: string; remark?: string;
    remain: number; basket: number; status: string; slots: Slot[]; color?: string;
};

const START_HOUR = 8;
const END_HOUR = 21;
const ROW_PX = 48;
const API_BASE = "http://3.39.123.47";

const dayOrder: DayKo[] = ["월", "화", "수", "목", "금"];
const palette = ["#68b3f8","#ffb54a","#8ed08e","#f58fb1","#b79df2","#f2c84b","#6fd6c9","#ffa09e","#a6c85f","#7db2ff"];

const SLOTS_BY_NAME: Record<string, Slot[]> = {
    "운영체제":[{day:"월",startHour:9,endHour:11},{day:"수",startHour:9,endHour:11}],
    "컴퓨터네트워크":[{day:"화",startHour:13,endHour:15},{day:"목",startHour:13,endHour:15}],
    "자료구조":[{day:"월",startHour:11,endHour:13}],
    "알고리즘":[{day:"화",startHour:9.5,endHour:11}],
    "컴퓨터구조":[{day:"수",startHour:13,endHour:15}],
    "데이터베이스":[{day:"금",startHour:9,endHour:11}],
};
const DEFAULT_SLOTS: Slot[] = [{ day: "금", startHour: 14, endHour: 16 }];

const DUMMY = {
    divisions: ["A","B","D","7"],
    iseu: ["전필","전선"],
    credits: [3],
    dayNight: ["주간","야간"],
    grades: ["1학년","2학년","3학년","4학년"],
    instructors: ["홍길동","이몽룡","성춘향","임꺽정"],
    rooms: ["본관 101","공학관 302","IT관 B201","신관 504"],
    remarks: ["비고 없음","과제 많음","퀴즈 있음","팀프로젝트"],
    remain: 100, basket: 0, status: "OPEN",
};

const pad6 = (n: number) => String(n).padStart(6, "0");
const codeFromIndex = (idx: number) => `V${pad6(idx + 1)}`;
const slotSig = (slots?: Slot[]) => (Array.isArray(slots) ? slots : []).map(s => `${s.day}-${s.startHour}-${s.endHour}`).sort().join("|");
const getCourseKey = (c: Course) => `${c.code}-${c.division}-${slotSig(c.slots)}`;
const hourLabel = (h: number) => `${h < 12 ? "오전" : "오후"} ${((h + 11) % 12) + 1}시`;

// 🔒 완료 스냅샷 저장 키
const LS_REGISTER_LOCK = "registerLocked";
const LS_REGISTER_SNAPSHOT = "registerSelectedSnapshot";

const Register: React.FC = () => {
    // 🔒 인증 가드
    const [authChecked, setAuthChecked] = useState(false);
    const [studentId, setStudentId] = useState<number | null>(null);
    const [name, setName] = useState<string>("");

    useEffect(() => {
        const a = getAuth();
        if (!a) {
            redirectToLoginInApp();
            return;
        }
        setStudentId(a.studentId);
        setName(a.name);
        setAuthChecked(true);
    }, []);

    const [courses, setCourses] = useState<Course[]>([]);
    const [selected, setSelected] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // ✅ 완료 여부(버튼 숨김 여부)
    const [locked, setLocked] = useState<boolean>(() => localStorage.getItem(LS_REGISTER_LOCK) === "true");

    // ✅ 완료 모달 지연 표시용 타이머 ref (언마운트 시 정리)
    const completeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        return () => {
            if (completeTimerRef.current) {
                clearTimeout(completeTimerRef.current);
                completeTimerRef.current = null;
            }
        };
    }, []);

    // ✅ 완료 상태라면 스냅샷에서 시간표 복원
    useEffect(() => {
        if (!authChecked) return;
        if (!locked) return;
        try {
            const raw = localStorage.getItem(LS_REGISTER_SNAPSHOT);
            const snap = raw ? JSON.parse(raw) : [];
            if (Array.isArray(snap)) {
                setSelected(snap);
            }
        } catch {}
    }, [authChecked, locked]);

    useEffect(() => {
        if (!authChecked) return;
        setLoading(true);
        setError(null);

        fetch(`${API_BASE}/api/courses/all`)
            .then(async (res) => {
                const ct = res.headers.get("content-type");
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0,200)}`);
                }
                if (!ct || !ct.includes("application/json")) {
                    const text = await res.text();
                    throw new Error("API에서 JSON이 아닌 응답이 왔습니다: " + text.slice(0,200));
                }
                return res.json();
            })
            .then((json) => {
                const raw: any[] = Array.isArray(json?.data) ? json.data : [];
                const sliced = raw.slice(0, 10);
                const normalized: Course[] = sliced.map((item, idx) => {
                    const n: string = String(item?.name ?? `과목${idx + 1}`);
                    const code = codeFromIndex(idx);
                    const slots: Slot[] = SLOTS_BY_NAME[n] ?? DEFAULT_SLOTS;

                    return {
                        id: String(item?.id ?? code),
                        code,
                        name: n,
                        division: DUMMY.divisions[idx % DUMMY.divisions.length],
                        iseu: DUMMY.iseu[idx % DUMMY.iseu.length],
                        credit: DUMMY.credits[idx % DUMMY.credits.length],
                        dayNight: DUMMY.dayNight[idx % DUMMY.dayNight.length],
                        grade: DUMMY.grades[idx % DUMMY.grades.length],
                        instructor: DUMMY.instructors[idx % DUMMY.instructors.length],
                        room: DUMMY.rooms[idx % DUMMY.rooms.length],
                        remark: DUMMY.remarks[idx % DUMMY.remarks.length],
                        remain: Number.isFinite(item?.remain) ? Number(item.remain) : DUMMY.remain,
                        basket: Number.isFinite(item?.basket) ? Number(item.basket) : DUMMY.basket,
                        status: String(item?.status ?? DUMMY.status),
                        slots,
                    };
                });
                setCourses(normalized);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [authChecked]);

    const isSelected = (course: Course) => Array.isArray(selected) && selected.some((s) => getCourseKey(s) === getCourseKey(course));

    // ✅ 최종 완료 스냅샷 함수
    const finalizeWithSnapshot = (list: Course[]) => {
        try {
            localStorage.setItem(LS_REGISTER_LOCK, "true");
            localStorage.setItem(LS_REGISTER_SNAPSHOT, JSON.stringify(list));
        } catch {}
        setLocked(true);
        if (completeTimerRef.current) clearTimeout(completeTimerRef.current);
        completeTimerRef.current = setTimeout(() => {
            setShowCompleteModal(true);
        }, 2000);
    };

    const handleApply = async (course: Course) => {
        if (locked) {
            window.alert("이미 수강신청을 완료했습니다.");
            return;
        }
        if (!authChecked || typeof studentId !== "number" || !name) {
            redirectToLoginInApp();
            return;
        }
        const ok = window.confirm("수강신청 하시겠습니까?");
        if (!ok) return;

        if (isSelected(course)) {
            window.alert("이미 신청된 과목입니다.");
            return;
        }

        try {
            const url = `${API_BASE}/api/apply/register/${encodeURIComponent(
                course.id
            )}?studentId=${encodeURIComponent(String(studentId))}&name=${encodeURIComponent(name)}`;

            const res = await fetch(url, { method: "POST" });
            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                window.alert(`수강신청 실패: ${msg || res.statusText}`);
                if (res.status === 401 || res.status === 403) redirectToLoginInApp();
                return;
            }

            const json = await res.json().catch(() => null);
            const data = json?.data ?? json;

            // 이번 요청으로 실제 등록되었다면 먼저 selected 반영
            let nextSelected = selected;
            if (data?.isRegistered === true) {
                const courseWithColor: Course = {
                    ...course,
                    color: course.color || palette[selected.length % palette.length],
                };
                nextSelected = [...selected, courseWithColor];
                setSelected(nextSelected);
                // ✅ 성공 알림창 제거 (요청사항)
                // window.alert("수강신청 되었습니다.");
            } else if (data?.isRegistered === false) {
                window.alert("해당 분반의 정원이 마감되었습니다.");
            }

            // 모든 시도가 끝났다면(완료) 스냅샷 저장 + 버튼 숨김
            if (data?.isAllTried === true) {
                finalizeWithSnapshot(nextSelected);
            }
        } catch (e: any) {
            window.alert("수강신청 중 오류 발생: " + (e?.message || e));
        }
    };

    // 시간표 계산 (기존 구현 유지)
    const timetableByDay: Record<DayKo, Slot[]> = useMemo(() => {
        const map: Record<DayKo, Slot[]> = { 월: [], 화: [], 수: [], 목: [], 금: [] };
        for (const course of selected) {
            for (const s of course.slots) {
                if (dayOrder.includes(s.day)) {
                    map[s.day].push({ ...s, title: course.name });
                }
            }
        }
        dayOrder.forEach((d) => map[d].sort((a, b) => a.startHour - b.startHour));
        return map;
    }, [selected]);

    if (!authChecked) {
        // 리다이렉트 동안 렌더 안 함
        return null;
    }

    return (
        <div className="register-page">
            <div className="top-notice">
                ※공지: 수강신청은 <b>크롬브라우저</b>에 최적화되어있습니다. IE의 캐시기능때문에 종종 오류가 발생하고있습니다.
            </div>

            <div className="register-main">
                {/* 좌측 과목 리스트 */}
                <div className="left-panel">
                    <div className="panel-title">
                        <span>★ 개설강좌</span>
                        <div className="panel-controls">
                            <select className="term-select"><option>[V034] 거지자동등록1</option></select>
                            <select className="filter-select"><option>전체(학년)</option></select>
                            <select className="dept-select"><option>[0000] 수강신청 장바구니</option></select>
                        </div>
                    </div>

                    <div className="course-list">
                        <div style={{
                            display:"grid",
                            gridTemplateColumns:"1fr 80px 100px 80px 76px",
                            gap:8, alignItems:"center",
                            padding:"8px 12px", background:"#fbfdff",
                            borderBottom:"1px solid #eef3f8", color:"#4b6791", fontWeight:700
                        }}>
                            <div>과목명</div>
                            <div style={{textAlign:"right"}}>분반</div>
                            <div style={{textAlign:"right"}}>이수</div>
                            <div style={{textAlign:"center"}}>학점</div>
                            <div style={{textAlign:"right"}}>신청</div>
                        </div>

                        {loading ? (
                            <div style={{ padding: 20, textAlign: "center", color: "#888" }}>과목 목록을 불러오는 중...</div>
                        ) : error ? (
                            <div style={{ padding: 20, textAlign: "center", color: "red" }}>{error}</div>
                        ) : (
                            courses.map((c) => {
                                const selectedFlag = isSelected(c);
                                const nameWithCode = `[${c.code}] ${c.name}`;
                                return (
                                    <div key={getCourseKey(c)}>
                                        <div className="course-row" style={{ gridTemplateColumns:"1fr 80px 100px 80px 76px", alignItems:"center" }}>
                                            <div className="course-code" style={{ marginBottom: 0 }}>{nameWithCode}</div>
                                            <div style={{ textAlign: "right" }}>{c.division}</div>
                                            <div style={{ textAlign: "right" }}>{c.iseu}</div>
                                            <div style={{ textAlign: "center" }}>{c.credit}</div>

                                            {/* ✅ 완료되면 버튼 숨김(자리는 유지) */}
                                            {locked ? (
                                                <div />
                                            ) : (
                                                <button
                                                    className={`apply-btn ${selectedFlag ? "disabled" : ""}`}
                                                    onClick={() => handleApply(c)}
                                                    disabled={selectedFlag}
                                                    title="신청 시 오른쪽 시간표에 반영됩니다."
                                                >
                                                    {selectedFlag ? "신청됨" : "신청"}
                                                </button>
                                            )}
                                        </div>

                                        <div className="course-sub" style={{ padding: "0 12px 10px 12px" }}>
                                            <span>분반 {c.division}</span>
                                            <span>이수 {c.iseu}</span>
                                            <span>학점 {c.credit}</span>
                                            <span>주야 {c.dayNight}</span>
                                            <span>학년 {c.grade}</span>
                                            <span>담당교수 {c.instructor}</span>
                                            <span>비고 {c.remark || "없음"}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 우측 시간표 */}
                <div className="right-panel">
                    <div className="panel-title">
                        <span>★ 2025-2 수강신청 신청내역</span>
                        <div className="search-bar">
                            <input placeholder="과목코드" />
                            <input placeholder="분반" />
                        </div>
                    </div>

                    <div className="timetable">
                        <div className="tt-header-row">
                            <div className="time-col-header" />
                            {dayOrder.map((d) => (<div key={d} className="day-col-header">{d}</div>))}
                        </div>

                        <div className="tt-body">
                            <div className="time-col">
                                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
                                    const hour = START_HOUR + i;
                                    return <div key={hour} className="time-cell">{hourLabel(hour)}</div>;
                                })}
                            </div>

                            <div className="days-wrap">
                                {dayOrder.map((day) => (
                                    <div key={day} className="day-col" style={{ height: (END_HOUR - START_HOUR) * ROW_PX }}>
                                        {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (<div key={i} className="bg-hour-line" />))}
                                        {timetableByDay[day].map((s, idx) => {
                                            const top = (s.startHour - START_HOUR) * ROW_PX;
                                            const height = (s.endHour - s.startHour) * ROW_PX;

                                            const parentCourse = selected.find((cc) =>
                                                cc.slots.some(
                                                    (sl) => sl.day === s.day && sl.startHour === s.startHour && sl.endHour === s.endHour
                                                )
                                            );
                                            const color = parentCourse?.color || "#4a90e2";

                                            const timeText =
                                                `${Math.floor(s.startHour)}:${(s.startHour % 1 ? 30 : 0).toString().padStart(2, "0")}~` +
                                                `${Math.floor(s.endHour)}:${(s.endHour % 1 ? 30 : 0).toString().padStart(2, "0")}`;

                                            return (
                                                <div
                                                    key={`${day}-${s.startHour}-${s.endHour}-${idx}`}
                                                    className="lecture-block"
                                                    style={{ top, height, background: color, color: "#fff" }}
                                                    title={`${s.title} ${timeText}`}
                                                >
                                                    <div className="block-title">{s.title}</div>
                                                    <div className="block-time">{timeText}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                open={showCompleteModal}
                message={"전체 수강신청이 완료되었습니다.\n회원등록 창으로 이동합니다."}
                onClose={() => {
                    setShowCompleteModal(false);
                    localStorage.setItem('page', 'signup');
                    window.location.reload();
                }}
            />
        </div>
    );
};

export default Register;

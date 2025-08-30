import React, { useEffect, useMemo, useState } from "react";
import "../styles/Register.css";
import Modal from "./Modal";

type DayKo = "월" | "화" | "수" | "목" | "금";

type Slot = {
    day: DayKo;
    startHour: number; // 9 또는 9.5(=30분) 지원
    endHour: number;
    title?: string;
};

type Course = {
    id: string;          // 프런트에서 생성
    code: string;        // V000001 ~ V000006
    name: string;        // API name 사용
    division: string;    // 분반 (임의)
    iseu: string;        // 이수 (임의)
    credit: number;      // 학점 (임의)
    dayNight: string;    // 주야 (임의)
    grade: string;       // 학년 (임의)
    instructor: string;  // 담당교수 (임의)
    room: string;        // 강의실 (임의)
    remark?: string;     // 비고 (임의)
    remain: number;      // 잔여 (API 있으면 사용, 없으면 임의)
    basket: number;      // 장바구니 (API 있으면 사용, 없으면 임의)
    status: string;      // 상태 (API 있으면 사용, 없으면 임의)
    slots: Slot[];       // 시간표 슬롯 (프런트 매핑)
    color?: string;
};

const START_HOUR = 8;
const END_HOUR = 21;
// CSS의 --row-height(48px)와 동일
const ROW_PX = 48;

const dayOrder: DayKo[] = ["월", "화", "수", "목", "금"];
const palette = [
    "#68b3f8", "#ffb54a", "#8ed08e", "#f58fb1", "#b79df2",
    "#f2c84b", "#6fd6c9", "#ffa09e", "#a6c85f", "#7db2ff",
];

/* ====================== 프런트 고정값(임의 데이터 소스) ====================== */
// 과목명 → 시간표 슬롯(6개 과목 전부 매핑되어 '신청' 즉시 시간표 반영 보장)
const SLOTS_BY_NAME: Record<string, Slot[]> = {
    "운영체제":       [{ day: "월", startHour: 9,   endHour: 11 }, { day: "수", startHour: 9,  endHour: 11 }],
    "컴퓨터네트워크": [{ day: "화", startHour: 13,  endHour: 15 }, { day: "목", startHour: 13, endHour: 15 }],
    "자료구조":       [{ day: "월", startHour: 11,  endHour: 13 }],
    "알고리즘":       [{ day: "화", startHour: 9.5, endHour: 11 }], // 9:30~11:00
    "컴퓨터구조":     [{ day: "수", startHour: 13,  endHour: 15 }],
    "데이터베이스":   [{ day: "금", startHour: 9,   endHour: 11 }],
};
// 매핑에 없는 과목의 기본 시간(혹시 모를 확장 대비)
const DEFAULT_SLOTS: Slot[] = [{ day: "금", startHour: 14, endHour: 16 }];

// 아래 임의 필드들은 표시 전용
const DUMMY = {
    divisions: ["A", "B", "D", "7"],
    iseu: ["전필", "전선"],
    credits: [3],
    dayNight: ["주간", "야간"],
    grades: ["1학년", "2학년", "3학년", "4학년"],
    instructors: ["홍길동", "이몽룡", "성춘향", "임꺽정"],
    rooms: ["본관 101", "공학관 302", "IT관 B201", "신관 504"],
    remarks: ["비고 없음", "과제 많음", "퀴즈 있음", "팀프로젝트"],
    // 잔여/장바구니/상태 기본값 (API 없을 때)
    remain: 100,
    basket: 0,
    status: "OPEN",
};

/* ====================== 유틸리티 ====================== */
const pad6 = (n: number) => String(n).padStart(6, "0");
const codeFromIndex = (idx: number) => `V${pad6(idx + 1)}`;

const slotSig = (slots?: Slot[]) =>
    (Array.isArray(slots) ? slots : [])
        .map((s) => `${s.day}-${s.startHour}-${s.endHour}`)
        .sort()
        .join("|");

const getCourseKey = (c: Course) => `${c.code}-${c.division}-${slotSig(c.slots)}`;

function hourLabel(h: number) {
    const period = h < 12 ? "오전" : "오후";
    const n = ((h + 11) % 12) + 1;
    return `${period} ${n}시`;
}

/* ====================== 컴포넌트 ====================== */
const Register: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selected, setSelected] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    // ✅ API에선 name만 신뢰, 나머지는 전부 프런트에서 생성/고정
    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch("/api/courses/all", { credentials: "include" })
            .then(async (res) => {
                const contentType = res.headers.get("content-type");
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
                }
                if (!contentType || !contentType.includes("application/json")) {
                    const text = await res.text();
                    throw new Error("API에서 JSON이 아닌 응답이 왔습니다: " + text.slice(0, 200));
                }
                return res.json();
            })
            .then((json) => {
                const raw: any[] = Array.isArray(json?.data) ? json.data : [];

                // 정확히 6개만 코드 V000001~V000006 부여 (넘치면 잘라내고, 모자라면 있는 만큼)
                const sliced = raw.slice(0, 6);

                const normalized: Course[] = sliced.map((item, idx) => {
                    const name: string = String(item?.name ?? `과목${idx + 1}`);
                    const code = codeFromIndex(idx);
                    const slots: Slot[] = SLOTS_BY_NAME[name] ?? DEFAULT_SLOTS;

                    // 임의 필드들 순환 부여
                    const division = DUMMY.divisions[idx % DUMMY.divisions.length];
                    const iseu = DUMMY.iseu[idx % DUMMY.iseu.length];
                    const credit = DUMMY.credits[idx % DUMMY.credits.length];
                    const dayNight = DUMMY.dayNight[idx % DUMMY.dayNight.length];
                    const grade = DUMMY.grades[idx % DUMMY.grades.length];
                    const instructor = DUMMY.instructors[idx % DUMMY.instructors.length];
                    const room = DUMMY.rooms[idx % DUMMY.rooms.length];
                    const remark = DUMMY.remarks[idx % DUMMY.remarks.length];

                    // 잔여/장바구니/상태는 API 우선, 없으면 임의
                    const remain = Number.isFinite(item?.remain) ? Number(item.remain) : DUMMY.remain;
                    const basket = Number.isFinite(item?.basket) ? Number(item.basket) : DUMMY.basket;
                    const status = String(item?.status ?? DUMMY.status);

                    return {
                        id: String(item?.id ?? code), // API에서 받은 id를 우선 사용
                        code,
                        name,
                        division,
                        iseu,
                        credit,
                        dayNight,
                        grade,
                        instructor,
                        room,
                        remark,
                        remain,
                        basket,
                        status,
                        slots, // ✅ 시간표 슬롯 확정 (프런트 매핑)
                    };
                });

                setCourses(normalized);
            })
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, []);

    const isSelected = (course: Course) =>
        Array.isArray(selected) && selected.some((s) => getCourseKey(s) === getCourseKey(course));

    const handleApply = async (course: Course) => {
        const ok = window.confirm("수강신청 하시겠습니까?");
        if (!ok) return;

        if (isSelected(course)) {
            window.alert("이미 신청된 과목입니다.");
            return;
        }

        try {
            console.log("[수강신청 API 호출] /api/apply/register/" + course.id, course);
            const res = await fetch(`/api/apply/register/${course.id}`, {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                const msg = await res.text();
                window.alert(`수강신청 실패: ${msg}`);
                return;
            }
            // ✅ 새로운 응답 구조 반영
            const json = await res.json().catch(() => null);
            const data = json?.data;
            if (data) {
                if (data.isAllTried === true) {
                    setShowCompleteModal(true);
                    return;
                }
                if (data.isRegistered === false) {
                    window.alert("해당 분반의 정원이 마감되었습니다.");
                    return;
                }
            }
            // 성공 시 기존 로직
            const courseWithColor: Course = {
                ...course,
                color: course.color || palette[selected.length % palette.length],
            };
            setSelected((prev) => [...prev, courseWithColor]);
            window.alert("수강신청 되었습니다.");
        } catch (e: any) {
            window.alert("수강신청 중 오류 발생: " + (e?.message || e));
        }
    };

    // 오른쪽 시간표: 선택된 과목만 표시
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

    const totalHeight = (END_HOUR - START_HOUR) * ROW_PX;

    return (
        <div className="register-page">
            {/* 상단 공지 */}
            <div className="top-notice">
                ※공지: 수강신청은 <b>크롬브라우저</b>에 최적화되어있습니다. IE의 캐시기능때문에 종종 오류가 발생하고있습니다.
            </div>

            <div className="register-main">
                {/* ===== 좌측 패널 ===== */}
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
                        {/* 헤더: [과목코드]과목명 / 잔여 / 장바구니 / 상태 / 신청 */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 80px 100px 80px 76px",
                            gap: 8,
                            alignItems: "center",
                            padding: "8px 12px",
                            background: "#fbfdff",
                            borderBottom: "1px solid #eef3f8",
                            color: "#4b6791",
                            fontWeight: 700
                        }}>
                            <div>과목명</div>
                            <div style={{ textAlign: "right" }}>분반</div>
                            <div style={{ textAlign: "right" }}>이수</div>
                            <div style={{ textAlign: "center" }}>학점</div>
                            <div style={{ textAlign: "right" }}>신청</div>
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
                                        {/* 1행: 상단 요약 라인 (요청한 순서) */}
                                        <div
                                            className="course-row"
                                            style={{
                                                gridTemplateColumns: "1fr 80px 100px 80px 76px",
                                                alignItems: "center",
                                            }}
                                        >
                                            <div className="course-code" style={{ marginBottom: 0 }}>{nameWithCode}</div>
                                            <div style={{ textAlign: "right" }}>{c.division}</div>
                                            <div style={{ textAlign: "right" }}>{c.iseu}</div>
                                            <div style={{ textAlign: "center" }}>{c.credit}</div>
                                            <button
                                                className={`apply-btn ${selectedFlag ? "disabled" : ""}`}
                                                onClick={() => handleApply(c)}
                                                disabled={selectedFlag}
                                                title="신청 시 오른쪽 시간표에 반영됩니다."
                                            >
                                                {selectedFlag ? "신청됨" : "신청"}
                                            </button>
                                        </div>

                                        {/* 2행: 하단 상세(요청한 순서) — 분반, 이수, 학점, 주야, 학년, 담당교수, 비고 */}
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

                {/* ===== 우측 시간표 ===== */}
                <div className="right-panel">
                    <div className="panel-title">
                        <span>★ 2025-2 수강신청 신청내역</span>
                        <div className="search-bar">
                            <input placeholder="과목코드" />
                            <input placeholder="분반" />
                        </div>
                    </div>

                    <div className="timetable">
                        {/* 요일 헤더 */}
                        <div className="tt-header-row">
                            <div className="time-col-header" />
                            {dayOrder.map((d) => (
                                <div key={d} className="day-col-header">{d}</div>
                            ))}
                        </div>

                        {/* 본문 */}
                        <div className="tt-body">
                            {/* 시간 라벨 */}
                            <div className="time-col">
                                {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
                                    const hour = START_HOUR + i;
                                    return (
                                        <div key={hour} className="time-cell">
                                            {hourLabel(hour)}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 요일 캔버스 */}
                            <div className="days-wrap">
                                {dayOrder.map((day) => (
                                    <div key={day} className="day-col" style={{ height: (END_HOUR - START_HOUR) * ROW_PX }}>
                                        {/* 배경 시간선 */}
                                        {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                                            <div key={i} className="bg-hour-line" />
                                        ))}

                                        {/* 강의 블록(선택된 과목만 표시) */}
                                        {timetableByDay[day].map((s, idx) => {
                                            const top = (s.startHour - START_HOUR) * ROW_PX;
                                            const height = (s.endHour - s.startHour) * ROW_PX;

                                            // 색상 추적: 해당 슬롯을 가진 과목의 color 사용
                                            const parentCourse = selected.find((cc) =>
                                                cc.slots.some(
                                                    (sl) =>
                                                        sl.day === s.day &&
                                                        sl.startHour === s.startHour &&
                                                        sl.endHour === s.endHour
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

                        {/* <div className="empty-hint">좌측에서 과목을 신청하면 시간표에 표시됩니다.</div> */}
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

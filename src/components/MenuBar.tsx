import React, { useState } from "react";
import "../styles/MenuBar.css";
import Modal from "./Modal";

interface MenuBarProps {
    page: 'intro' | 'courses' | 'register_wait' | 'register' | 'signup' | 'ranking';
    setPage: (page: 'intro' | 'courses' | 'register_wait' | 'register' | 'signup' | 'ranking') => void;
}

const menuList = [
    { key: 'intro', label: '방법 소개' },
    { key: 'courses', label: '과목 리스트 조회' },
    { key: 'register_wait', label: '대기화면' },
    { key: 'register', label: '수강신청' },
    { key: 'signup', label: '내 결과' },
    { key: 'ranking', label: '순위표' },
] as const;

const MenuBar: React.FC<MenuBarProps> = ({ page, setPage }) => {
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const handleReset = async () => {
        if (resetLoading) return;
        setResetLoading(true);

        // localStorage에서 로그인 정보(studentId) 읽기 - key: "auth"
        let studentId: string | null = null;
        try {
            const raw = localStorage.getItem("auth");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.studentId != null) {
                    studentId = String(parsed.studentId);
                }
            }
        } catch {
            // 파싱 실패해도 무시
        }

        try {
            // studentId가 있을 때만 백엔드 로그아웃 호출
            if (studentId !== null) {
                const url = new URL("http://3.39.123.47/api/apply/logout");
                url.searchParams.set("studentId", studentId);

                const res = await fetch(url.toString(), {
                    method: "POST",
                    credentials: "include",
                });

                if (!res.ok) {
                    const msg = await res.text().catch(() => "로그아웃에 실패했습니다.");
                    window.alert(msg || "로그아웃에 실패했습니다.");
                }
            }
        } catch {
            // 네트워크 오류여도 UI측 로그아웃은 진행
            window.alert("로그아웃 요청 중 오류가 발생했습니다.");
        } finally {
            // ✅ 항상 스토리지 정리 + 로그인 페이지로 전환
            try {
                localStorage.removeItem("auth");               // 사용자 정보
                localStorage.removeItem("registerWaitReady");   // GO 버튼 활성화 플래그
                localStorage.removeItem("registerWaitEnter");   // 대기 시작 시각
                localStorage.removeItem("page");                // 마지막 페이지
                sessionStorage.clear();
            } catch {
                /* noop */
            }

            setPage("signup");           // 내부 라우팅으로 로그인(또는 회원/로그인 화면) 이동
            setShowResetModal(true);     // 안내 모달
            setResetLoading(false);
        }
    };

    return (
        <nav className="menu-bar">
            {menuList.map((item) => (
                <button
                    key={item.key}
                    className={"menu-btn" + (page === item.key ? " active" : "")}
                    onClick={() => page === 'register_wait' ? undefined : setPage(item.key)}
                    disabled={page === 'register_wait'}
                >
                    {item.label}
                </button>
            ))}

            {/* 초기화 → 로그아웃 */}
            <button
                className="menu-reset-btn"
                onClick={handleReset}
                aria-label="로그아웃"
                title="로그아웃"
                disabled={resetLoading}
            >
                {resetLoading ? "로그아웃 중…" : "로그아웃"}
            </button>

            <Modal
                open={showResetModal}
                message={"로그아웃 되었습니다."}
                onClose={() => setShowResetModal(false)}
            />
        </nav>
    );
};

export default MenuBar;

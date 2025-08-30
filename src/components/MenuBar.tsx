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
  { key: 'signup', label: '회원 등록' },
  { key: 'ranking', label: '순위표' },
] as const;

const MenuBar: React.FC<MenuBarProps> = ({ page, setPage }) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleReset = async () => {
    if (resetLoading) return;
    setResetLoading(true);
    try {
      const res = await fetch('/api/apply/reset', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setShowResetModal(true);
      } else {
        const msg = await res.text().catch(() => '초기화에 실패했습니다.');
        window.alert(msg || '초기화에 실패했습니다.');
      }
    } catch (e) {
      window.alert('초기화 요청 중 오류가 발생했습니다.');
    } finally {
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
      <button
        className="menu-reset-btn"
        onClick={handleReset}
        aria-label="초기화"
        title="초기화"
        disabled={resetLoading}
      >
        {resetLoading ? '초기화 중…' : '초기화'}
      </button>

      <Modal
        open={showResetModal}
        message={'초기화가 완료되었습니다.'}
        onClose={() => setShowResetModal(false)}
      />
    </nav>
  );
};

export default MenuBar;

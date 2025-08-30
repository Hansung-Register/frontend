import React, { useEffect, useRef, useState } from "react";
import "../styles/Intro.css";
import ScrollSection from "./ScrollSection";

interface IntroProps {
  onCoursesClick?: () => void;
}

const Intro: React.FC<IntroProps> = ({ onCoursesClick }) => {
  const sections = [
    {
      title: "한성대 모의 수강신청",
      description: "수강신청 게임에 참여해보세요!",
      images: ["/cute.gif"],
    },
    {
      title: "과목 리스트 조회",
      description: "장바구니 인원과 잔여인원을 확인하여 전략을 수립해보세요!",
      images: ["/listsPage.png"],
    },
    {
      title: "대기 화면",
      description: "대기 화면에서 수강신청 시작을 기다립니다. 여기서 다른 페이지로 이동할 수 없어요!",
      images: ["/waitPage_countdown.png"],
    },
      {
        title: "대기 화면",
        description: "카운트다운이 종료되고 새로고침을 해야 버튼이 나와요!(현실반영)",
        images: ["/waitPage_countDownEnd.png", "/waitPage_GO.png"],
      },
      {
        title: "수강신청",
        description: "수강신청 페이지에서 원하는 과목을 장바구니에 담고, 수강신청을 시도해보세요!",
        images: ["/register.png"],
      },
      {
        title: "수강신청",
        description: "수강신청 버튼을 누르면 다음과 같은 알림창이 나와요!(현실반영)",
        images: ["/register_alert1.png", "/register_alert2.png"],
      },
      {
        title: "수강신청",
        description: "기록을 확인하고 결과를 등록하세요!",
        images: ["/signup.png"],
      },

  ] as const;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 수동 스크롤(휠/터치) 방지 — 버튼으로만 이동
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: Event) => {
      e.preventDefault();
    };
    el.addEventListener("wheel", prevent, { passive: false });
    el.addEventListener("touchmove", prevent, { passive: false });
    return () => {
      el.removeEventListener("wheel", prevent as any);
      el.removeEventListener("touchmove", prevent as any);
    };
  }, []);

  const setSectionRef = (index: number) => (el: HTMLDivElement | null) => {
    sectionRefs.current[index] = el;
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < sections.length) {
      const next = sectionRefs.current[nextIndex];
      if (next) {
        next.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentIndex(nextIndex);
      }
    } else {
      onCoursesClick && onCoursesClick();
    }
  };

  const handlePrev = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      const prev = sectionRefs.current[prevIndex];
      if (prev) {
        prev.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentIndex(prevIndex);
      }
    }
  };

  return (
    <div className="intro-scroll-root" ref={containerRef}>
      <div className="intro-scroll-container">
        {sections.map((s, i) => (
          <ScrollSection
            key={i}
            title={s.title}
            description={s.description}
            images={s.images as any}
            setContainerRef={setSectionRef(i)}
          />
        ))}
      </div>
      <div
        style={{
          position: "fixed",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          display: "flex",
          gap: 10,
          zIndex: 2,
        }}
      >
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          style={{
            padding: "12px 22px",
            minWidth: 120,
            background: currentIndex === 0 ? "#e5e7eb" : "#e2e8f0",
            color: "#0f172a",
            border: "none",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "1rem",
            cursor: currentIndex === 0 ? "not-allowed" : "pointer",
            opacity: currentIndex === 0 ? 0.75 : 1,
            boxShadow: "0 4px 12px rgba(2,6,23,0.12)",
          }}
        >
          이전
        </button>
        <button
          onClick={handleNext}
          style={{
            padding: "12px 22px",
            minWidth: 120,
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontWeight: 800,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 6px 18px rgba(37,99,235,0.35)",
          }}
        >
          {currentIndex < sections.length - 1 ? "다음" : "시작하기"}
        </button>
      </div>
    </div>
  );
};

export default Intro;

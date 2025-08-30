import React from "react";

interface ScrollHintProps {
  isLastSection?: boolean;
  onStart?: () => void;
  onNext?: () => void;
}

const ScrollHint: React.FC<ScrollHintProps> = ({ isLastSection, onStart, onNext }) => {
  return (
    <div style={{ marginTop: 24, textAlign: "center" }}>
      {!isLastSection ? (
        <button
          onClick={onNext}
          style={{
            padding: "10px 18px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          다음
        </button>
      ) : (
        <button
          onClick={onStart}
          style={{
            padding: "10px 18px",
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          시작하기
        </button>
      )}
    </div>
  );
};

export default ScrollHint;

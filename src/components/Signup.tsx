import React, {useState, useEffect} from "react";
// useNavigate import 제거
import '../styles/Signup.css';
import Modal from "./Modal";

interface SignupProps {
  onBackClick: () => void;
  onSignupSuccess?: () => void;
}

const Signup: React.FC<SignupProps> = ({ onBackClick, onSignupSuccess }) => {
  // useNavigate 제거
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultInfo, setResultInfo] = useState<string>("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModalData, setResultModalData] = useState<any>(null);

  useEffect(() => {
    // 회원가입 페이지 진입 시 수강신청 결과 조회
    fetch("/api/apply/result/my", { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        if (data && typeof data === 'object') {
          // data.data 내부에 record, count가 있는 구조 대응
          const record = data.data && (typeof data.data.record === 'number' || typeof data.data.record === 'string')
            ? String(data.data.record)
            : "-";
          const count = data.data && typeof data.data.count === 'number'
            ? data.data.count
            : "-";
          setResultInfo(
            `수강신청 기록: ${record}\n신청 과목 수: ${count}개`
          );
        } else {
          setResultInfo("수강신청 결과를 불러올 수 없습니다.");
        }
      })
      .catch(() => setResultInfo("수강신청 결과를 불러올 수 없습니다."));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      // studentId는 숫자로 변환
      const payload = { studentId: Number(studentId), name };
      const response = await fetch('/api/apply/register/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        setShowResultModal(true);
        setResultModalData(data?.data || null);
        setStudentId('');
        setName('');
        setResultInfo(""); // 등록 성공 시 결과 정보 초기화
        // onSignupSuccess는 모달 닫을 때 호출로 이동
      } else {
        const data = await response.json();
        setMessage(data.message || '등록에 실패했습니다.');
      }
    } catch (error) {
      setMessage('서버와의 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 뒤로가기 시 /api/apply/reset 호출
  const handleBackClick = async () => {
    try {
      await fetch('/api/apply/reset', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // 실패해도 무시하고 뒤로가기
    }
    onBackClick();
  };

  return (
    <div className="signup-container">
      <h2>결과 등록</h2>
      {/* 수강신청 결과 표시 */}
      <div className="signup-result-info-card">
        <div className="signup-result-title">수강신청 결과</div>
        <div className="signup-result-row">
          <span className="signup-result-label">기록</span>
          <span className="signup-result-value">{resultInfo.split("\n")[0].replace("수강신청 기록: ", "")}</span>
        </div>
        <div className="signup-result-row">
          <span className="signup-result-label">신청 과목 수</span>
          <span className="signup-result-value">{resultInfo.split("\n")[1]?.replace("신청 과목 수: ", "")}</span>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentId">학번</label>
          <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={e => setStudentId(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? '등록 중...' : '등록'}
        </button>
      </form>
      <button className="signup-back-btn" onClick={handleBackClick} style={{marginTop: '16px'}}>뒤로가기</button>
      {message && <div className="signup-message">{message}</div>}
      <Modal
        open={showResultModal}
        message={resultModalData ? (
          <div style={{textAlign: 'center', lineHeight: 1.7}}>
            <div style={{fontWeight: 700, fontSize: '1.2rem', color: '#4caf50', marginBottom: 8}}>개인 기록</div>
            <div><span style={{color:'#888'}}>이름</span>: <b>{resultModalData.name}</b></div>
            <div><span style={{color:'#888'}}>학번</span>: <b>{resultModalData.studentId}</b></div>
            <div style={{margin: '12px 0'}}>
              <span style={{color:'#888'}}>순위</span>:
              <span style={{
                display: 'inline-block',
                background: 'linear-gradient(90deg,#ffeb3b 60%,#ffd600 100%)',
                color: '#222',
                fontWeight: 900,
                fontSize: '1.3rem',
                borderRadius: '8px',
                padding: '2px 18px',
                marginLeft: 8
              }}>{resultModalData.rank}위</span>
            </div>
            <div><span style={{color:'#888'}}>기록</span>: <b>{resultModalData.record}</b></div>
            <div><span style={{color:'#888'}}>신청 과목 수</span>: <b>{resultModalData.count}</b>개</div>
          </div>
        ) : "등록이 완료되었습니다!"}
        onClose={() => {
          setShowResultModal(false);
          setResultModalData(null);
          setMessage("");
          if (onSignupSuccess) onSignupSuccess();
          // navigate("/ranking") 제거
        }}
      />
    </div>
  );
};

export default Signup;

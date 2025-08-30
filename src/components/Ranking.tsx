import React, { useEffect, useState } from "react";

interface RankingItem {
  id?: number;
  count: number;
  record: number;
  rank: number;
  studentId: number;
  name: string;
}

const medalColors = [
  '#ffd700', // 1등: 금
  '#c0c0c0', // 2등: 은
  '#cd7f32'  // 3등: 동
];

const Ranking: React.FC = () => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/apply/result/all", { credentials: "include" })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        // data.data가 배열
        setRanking(Array.isArray(data.data) ? data.data.slice(0, 20) : []);
        setLoading(false);
      })
      .catch(() => {
        setError("순위 정보를 불러오지 못했습니다.");
        setLoading(false);
      });
  }, []);

  return (
    <div style={{padding: '40px', textAlign: 'center'}}>
      <h2 style={{marginBottom: 32, fontWeight: 800, fontSize: '2.2rem', letterSpacing: 1}}>전체 순위표</h2>
      {loading ? (
        <div style={{fontSize: '1.2rem', color: '#888'}}>불러오는 중...</div>
      ) : error ? (
        <div style={{color: 'red'}}>{error}</div>
      ) : (
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <table style={{borderCollapse: 'separate', borderSpacing: 0, minWidth: 500, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #eee', overflow: 'hidden'}}>
            <thead style={{background: '#f5f5f5'}}>
              <tr>
                <th style={{padding: '12px 24px', fontWeight: 700, fontSize: '1.1rem'}}>순위</th>
                <th style={{padding: '12px 24px', fontWeight: 700, fontSize: '1.1rem'}}>이름</th>
                <th style={{padding: '12px 24px', fontWeight: 700, fontSize: '1.1rem'}}>학번</th>
                <th style={{padding: '12px 24px', fontWeight: 700, fontSize: '1.1rem'}}>기록</th>
                <th style={{padding: '12px 24px', fontWeight: 700, fontSize: '1.1rem'}}>신청 과목 수</th>
              </tr>
            </thead>
            <tbody>
              {ranking.length === 0 && (
                <tr><td colSpan={5} style={{padding: 32, color: '#aaa'}}>순위 데이터가 없습니다.</td></tr>
              )}
              {ranking.map((item, idx) => (
                <tr key={item.rank} style={{
                  background: idx < 3 ? medalColors[idx] + '22' : idx % 2 === 0 ? '#fafbfc' : '#fff',
                  fontWeight: idx < 3 ? 700 : 400,
                  fontSize: idx < 3 ? '1.1rem' : '1rem',
                  color: idx < 3 ? medalColors[idx] : '#222',
                  borderBottom: '1px solid #eee',
                  transition: 'background 0.2s'
                }}>
                  <td style={{padding: '10px 0', fontWeight: 900, fontSize: idx < 3 ? '1.3rem' : '1rem'}}>
                    {idx < 3 ? (
                      <span style={{
                        display: 'inline-block',
                        width: 32, height: 32, lineHeight: '32px',
                        borderRadius: '50%',
                        background: medalColors[idx],
                        color: '#fff',
                        fontWeight: 900,
                        fontSize: '1.1rem',
                        boxShadow: '0 2px 8px #eee',
                        marginRight: 4
                      }}>{idx + 1}</span>
                    ) : idx + 1}
                  </td>
                  <td style={{padding: '10px 0'}}>{item.name}</td>
                  <td style={{padding: '10px 0'}}>{item.studentId}</td>
                  <td style={{padding: '10px 0'}}>{item.record}</td>
                  <td style={{padding: '10px 0'}}>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Ranking;

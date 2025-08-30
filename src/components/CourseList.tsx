import React, { useEffect, useState } from "react";
import '../styles/CourseList.css';
import type { Course } from '../types/Course';

interface CourseListProps {
  onNextClick: () => void;
  onBackClick?: () => void;
}

const CourseList: React.FC<CourseListProps> = ({ onNextClick, onBackClick }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://3.39.123.47/api/courses/all');
        if (response.ok) {
          const data = await response.json();
          setCourses(Array.isArray(data?.data) ? data.data : []);
        } else {
          setError('과목 목록을 불러오지 못했습니다.');
        }
      } catch (err) {
        setError('서버와의 연결에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <div className="course-list-container">
      <div className="course-banner">무슨 과목부터 신청할지 전략을 수립하세요!</div>
      <h2>전체 과목 목록</h2>
      {loading ? (
        <p>불러오는 중...</p>
      ) : error ? (
        <p className="course-list-error">{error}</p>
      ) : courses.length === 0 ? (
        <p>과목이 없습니다.</p>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <div className="course-card" key={course.name}>
              <div className="course-card-head">
                <div className="course-title" title={course.name}>{course.name}</div>
              </div>
              <div className="course-card-meta">
                <span className="chip chip-remain">잔여석 {course.remain}</span>
                <span className="chip chip-basket">장바구니 {course.basket}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="course-actions">
        <button className="course-back-btn" onClick={onBackClick}>뒤로가기</button>
        <button className="course-next-btn" onClick={onNextClick}>다음</button>
      </div>
    </div>
  );
};

export default CourseList;

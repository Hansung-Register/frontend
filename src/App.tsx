import { useState } from "react";
import Intro from './components/Intro';
import Signup from './components/Signup';
import CourseList from './components/CourseList';
import RegisterWait from './components/RegisterWait';
import Register from './components/Register';
import Ranking from './components/Ranking';
import MenuBar from './components/MenuBar';
import AdminCourses from './components/AdminCourses';
import './App.css';

function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
  const [page, setPageRaw] = useState<'intro' | 'courses' | 'register_wait' | 'register' | 'signup' | 'ranking'>(() => {
    return (localStorage.getItem('page') as any) || 'intro';
  });

  // setPage: localStorage 동기화 포함
  const setPage = (p: typeof page) => {
    setPageRaw(p);
    localStorage.setItem('page', p);
    if (p === 'register_wait') {
      // 항상 진입 시마다 registerWaitEnter를 새로 저장
      localStorage.setItem('registerWaitEnter', Date.now().toString());
    }
  };

  if (isAdminRoute) {
    return <AdminCourses />;
  }

  return (
    <>
      <MenuBar page={page} setPage={setPage} />
      {page === 'intro' && <Intro onCoursesClick={() => setPage('courses')} />}
      {page === 'courses' && <CourseList onNextClick={() => setPage('register_wait')} onBackClick={() => setPage('intro')} />}
      {page === 'register_wait' && <RegisterWait onGoClick={() => setPage('register')} />}
      {page === 'register' && <Register />}
      {page === 'signup' && <Signup onBackClick={() => setPage('intro')} onSignupSuccess={() => setPage('ranking')} />}
      {page === 'ranking' && <Ranking />}
    </>
  );
}

export default App;

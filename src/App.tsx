import { useState } from "react";
import Intro from './components/Intro';
import Signup from './components/Signup';
import CourseList from './components/CourseList';
import RegisterWait from './components/RegisterWait';
import Register from './components/Register';
import Ranking from './components/Ranking';
import MenuBar from './components/MenuBar';
import AdminCourses from './components/AdminCourses';
import Login from './components/Login';              // ✅ 추가
import { normalizePage } from "./utils/auth";        // ✅ (초기 page 정규화)
import './App.css';

// ✅ App에서 허용하는 페이지 타입에 'login'을 포함
type Page =
    | 'intro'
    | 'courses'
    | 'register_wait'
    | 'register'
    | 'signup'
    | 'ranking'
    | 'login';

function App() {
    const isAdminRoute =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    // ✅ 초기값을 정규화: 로컬스토리지에 엉뚱한 값이 있어도 안전하게 보정
    const [page, setPageRaw] = useState<Page>(() => {
        const saved = localStorage.getItem('page') || 'intro';
        const norm = normalizePage(saved) as Page;
        // normalizePage는 login 포함을 알고 있음
        if (norm !== saved) localStorage.setItem('page', norm);
        return norm;
    });

    // setPage: localStorage 동기화 포함
    const setPage = (p: typeof page) => {
        setPageRaw(p);
        localStorage.setItem('page', p);
        if (p === 'register_wait') {
            localStorage.setItem('registerWaitEnter', Date.now().toString());
            localStorage.removeItem('registerWaitReady'); // ✅ 추가: GO 버튼 플래그 초기화
        }
    };

    if (isAdminRoute) {
        return <AdminCourses />;
    }

    // ✅ 로그인 페이지일 때는 로그인 화면만 렌더 (메뉴바 숨김)
    if (page === 'login') {
        return <Login />;
    }

    return (
        <>
            <MenuBar page={page as Exclude<Page, 'login'>} setPage={setPage as any} />
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

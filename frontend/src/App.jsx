import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, RefreshCw, Circle, CircleCheck, Sun, Plus, LogOut } from 'lucide-react';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';

function App() {
  // 인증 상태 관리
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [authForm, setAuthForm] = useState({ username: '', password: '', passwordConfirm: '' });
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username') || '');

  // Todo 상태 관리
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [isDailyInput, setIsDailyInput] = useState(false);
  const [isImportantInput, setIsImportantInput] = useState(false);

  // 헤더 설정 (토큰 포함)
  const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  // 로그인 & 회원가입 폼 제출 핸들러
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authView === 'signup') {
        if (authForm.password !== authForm.passwordConfirm) {
          return alert('비밀번호가 일치하지 않습니다.');
        }
        await axios.post(`${API_URL}/signup`, { username: authForm.username, password: authForm.password });
        alert('회원가입이 완료되었습니다. 로그인해주세요!');
        setAuthView('login');
        setAuthForm({ username: '', password: '', passwordConfirm: '' });
      } else {
        const response = await axios.post(`${API_URL}/login`, { username: authForm.username, password: authForm.password });
        const { token, username } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        setToken(token);
        setCurrentUser(username);
      }
    } catch (error) {
      alert(error.response?.data?.message || '오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    setCurrentUser('');
    setTodos([]);
  };

  useEffect(() => {
    if (token) fetchTodos();
  }, [token]);

  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${API_URL}/todos`, getAuthHeaders());
      setTodos(response.data);
    } catch (error) {
      if (error.response?.status === 401) handleLogout();
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const response = await axios.post(`${API_URL}/todos`, { 
        title, isDaily: isDailyInput, isImportant: isImportantInput
      }, getAuthHeaders());
      setTodos([...todos, response.data]);
      setTitle('');
      setIsDailyInput(false);
      setIsImportantInput(false);
    } catch (error) {
      console.error('데이터 추가 에러:', error);
    }
  };

  const toggleComplete = async (todo) => {
    try {
      const response = await axios.put(`${API_URL}/todos/${todo._id}`, { completed: !todo.completed }, getAuthHeaders());
      setTodos(todos.map(t => t._id === todo._id ? response.data : t));
    } catch (error) {
      console.error('상태 업데이트 에러:', error);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/todos/${id}`, getAuthHeaders());
      setTodos(todos.filter(todo => todo._id !== id));
    } catch (error) {
      console.error('데이터 삭제 에러:', error);
    }
  };

  // ---------------- [인증 화면 UI] ----------------
  if (!token) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center font-sans text-gray-800">
        <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-sm text-center">
          <h1 className="text-3xl font-bold text-[#A66253] mb-2">오늘의할일</h1>
          <p className="text-gray-500 mb-8">{authView === 'login' ? '로그인하여 내 할 일을 관리하세요.' : '새로운 계정을 만들어보세요.'}</p>

          <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 text-left">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">아이디</label>
              <input
                type="text"
                className="w-full bg-[#F5F4F0] text-gray-700 px-4 py-3 rounded-2xl outline-none"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">비밀번호</label>
              <input
                type="password"
                className="w-full bg-[#F5F4F0] text-gray-700 px-4 py-3 rounded-2xl outline-none"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                required
              />
            </div>
            {authView === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">비밀번호 확인</label>
                <input
                  type="password"
                  className="w-full bg-[#F5F4F0] text-gray-700 px-4 py-3 rounded-2xl outline-none"
                  value={authForm.passwordConfirm}
                  onChange={(e) => setAuthForm({...authForm, passwordConfirm: e.target.value})}
                  required
                />
              </div>
            )}
            <button type="submit" className="w-full bg-[#CD8976] text-white py-4 rounded-2xl font-bold hover:bg-[#b57462] transition mt-2">
              {authView === 'login' ? '로그인' : '회원가입'}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-500">
            {authView === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              className="ml-2 font-bold text-[#A66253] hover:underline"
              onClick={() => {
                setAuthView(authView === 'login' ? 'signup' : 'login');
                setAuthForm({ username: '', password: '', passwordConfirm: '' });
              }}
            >
              {authView === 'login' ? '회원가입하기' : '로그인하기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- [메인 Todo UI] ----------------
  const todayDate = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const dailyTodos = todos.filter(t => t.isDaily);
  const normalTodos = todos.filter(t => !t.isDaily).sort((a, b) => (a.isImportant && !b.isImportant ? -1 : (!a.isImportant && b.isImportant ? 1 : 0)));

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex justify-center font-sans text-gray-800">
      <div className="w-full max-w-2xl bg-white min-h-screen px-8 py-10 shadow-sm">
        
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-bold text-[#A66253]">오늘의할일</h1>
          <div className="flex gap-6 text-sm font-semibold text-gray-500">
            <span className="text-[#A66253] border-b-2 border-[#A66253] pb-1 cursor-pointer">할 일</span>
          </div>
          <div className="flex gap-4 text-gray-600 relative items-center">
            <Calendar size={20} className="text-gray-600" />
            <input type="date" className="absolute left-0 w-5 opacity-0 cursor-pointer" title="날짜 선택" />
            
            {/* 로그아웃 버튼 */}
            <button onClick={handleLogout} className="text-gray-400 hover:text-[#A66253] transition" title="로그아웃">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <div className="mb-8">
          <p className="text-sm font-medium text-[#A66253] mb-2">{todayDate}</p>
          <h2 className="text-3xl font-bold leading-snug">
            안녕하세요 {currentUser}님,<br />오늘의 계획은 무엇인가요?
          </h2>
        </div>

        <form onSubmit={addTodo} className="mb-12 relative">
          <input
            type="text"
            className="w-full bg-[#F5F4F0] text-gray-700 px-6 py-5 rounded-3xl outline-none placeholder-gray-400"
            placeholder="새로운 할 일을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="absolute right-3 top-3 bg-[#CD8976] text-white p-2 rounded-full hover:bg-[#b57462] transition">
            <Plus size={24} />
          </button>
          
          <div className="mt-4 ml-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" id="isDaily" className="accent-[#CD8976] cursor-pointer"
                checked={isDailyInput} onChange={(e) => { setIsDailyInput(e.target.checked); if(e.target.checked) setIsImportantInput(false); }}
              />
              <label htmlFor="isDaily" className="text-sm text-gray-500 cursor-pointer">이 할 일을 '매일 반복'으로 지정하기</label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" id="isImportant" className="accent-[#CD8976] cursor-pointer"
                checked={isImportantInput} onChange={(e) => { setIsImportantInput(e.target.checked); if(e.target.checked) setIsDailyInput(false); }}
              />
              <label htmlFor="isImportant" className="text-sm text-gray-500 cursor-pointer">꼭 해야할 일 지정하기 (목록 상단에 고정)</label>
            </div>
          </div>
        </form>

        {dailyTodos.length > 0 && (
          <div className="bg-[#FEFCE8] p-6 rounded-3xl mb-8">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#6D6541]"><RefreshCw size={16} /> 매일 반복되는 할 일</div>
              <span className="bg-[#FBEBA5] text-xs font-bold px-3 py-1 rounded-full text-[#8C7A35]">DAILY</span>
            </div>
            <div className="space-y-3">
              {dailyTodos.map(todo => (
                <div key={todo._id} className="bg-white flex items-center justify-between p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleComplete(todo)}>
                    {todo.completed ? <CircleCheck className="text-[#CD8976]" /> : <Circle className="text-gray-300" />}
                    <span className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{todo.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-300 font-bold tracking-wider">EVERYDAY</span>
                    <button onClick={() => deleteTodo(todo._id)} className="text-gray-300 hover:text-red-400 font-bold text-xs">X</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[#8C7A35] mt-4 opacity-80 pl-1">※ 매일 할일은 매일 진행상황이 초기화 됩니다.</p>
          </div>
        )}

        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-500">진행 중</h3>
          <span className="bg-[#C5EAE6] text-[#2F8980] text-xs font-bold px-3 py-1 rounded-full">{normalTodos.filter(t => !t.completed).length} TASKS</span>
        </div>

        <div className="space-y-4 mb-16">
          {normalTodos.map(todo => (
            <div key={todo._id} className="bg-white border border-gray-100 flex items-center justify-between p-5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleComplete(todo)}>
                {todo.completed ? <CircleCheck className="text-[#CD8976]" size={28} /> : <Circle className="text-[#CD8976]" size={28} />}
                <span className={`text-lg ${todo.completed ? 'line-through text-gray-400' : (todo.isImportant ? 'font-bold text-gray-900' : 'text-gray-800')}`}>{todo.title}</span>
              </div>
              <button onClick={() => deleteTodo(todo._id)} className="text-gray-300 hover:text-red-400 font-bold">X</button>
            </div>
          ))}
        </div>

        {todos.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-10 pb-20 border-t border-gray-100 text-gray-400 text-sm">
            <div className="bg-[#FBEBA5] p-3 rounded-full mb-4"><Sun className="text-[#8C7A35]" size={28} /></div>
            <p>오늘 할 일이 없어요.</p><p>새로운 할 일을 추가해 보세요!</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;

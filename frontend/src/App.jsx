import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api/todos' : 'http://localhost:5000/api/todos';

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');

  // R (Read): 컴포넌트 마운트 시 데이터 페칭 파이프라인
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get(API_URL);
      setTodos(response.data);
    } catch (error) {
      console.error('데이터 페칭 에러:', error);
    }
  };

  // C (Create): 새로운 데이터 전송 파이프라인
  const addTodo = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const response = await axios.post(API_URL, { title });
      setTodos([...todos, response.data]);
      setTitle('');
    } catch (error) {
      console.error('데이터 추가 에러:', error);
    }
  };

  // U (Update): 상태 업데이트 요청 파이프라인
  const toggleComplete = async (id, currentStatus) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, { completed: !currentStatus });
      setTodos(todos.map(todo => todo._id === id ? response.data : todo));
    } catch (error) {
      console.error('상태 업데이트 에러:', error);
    }
  };

  // D (Delete): 데이터 삭제 요청 파이프라인
  const deleteTodo = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
    } catch (error) {
      console.error('데이터 삭제 에러:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Todo List</h1>
        
        <form onSubmit={addTodo} className="flex mb-4">
          <input
            type="text"
            className="flex-1 border border-gray-300 px-3 py-2 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="새로운 할 일 입력..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600">
            추가
          </button>
        </form>

        <ul>
          {todos.map(todo => (
            <li key={todo._id} className="flex items-center justify-between border-b py-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-3 h-5 w-5 cursor-pointer"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo._id, todo.completed)}
                />
                <span className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {todo.title}
                </span>
              </div>
              <button
                onClick={() => deleteTodo(todo._id)}
                className="text-red-500 hover:text-red-700 font-bold"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.log(err));

// 1. 회원(User) 스키마 추가
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// 2. 할 일(Todo) 스키마에 작성자(userId) 필드 추가
const todoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  isDaily: { type: Boolean, default: false },
  isImportant: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // 작성자 연결
});
const Todo = mongoose.model('Todo', todoSchema);

// JWT 인증 미들웨어 (이 사용자가 로그인한 사용자가 맞는지 확인)
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: '로그인이 필요합니다.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
};

// --- [인증 API 라우터] ---
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ message: '이미 존재하는 아이디입니다.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: '회원가입 성공' });
  } catch (error) {
    res.status(500).json({ message: '서버 에러' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: '아이디 또는 비밀번호가 틀렸습니다.' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: '서버 에러' });
  }
});

// --- [Todo API 라우터 (인증 필수)] ---
app.get('/api/todos', authenticate, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId }); // 본인 것만 가져오기
  res.json(todos);
});

app.post('/api/todos', authenticate, async (req, res) => {
  const newTodo = new Todo({ 
    title: req.body.title,
    isDaily: req.body.isDaily,
    isImportant: req.body.isImportant,
    userId: req.userId // 본인 소유로 저장
  });
  await newTodo.save();
  res.json(newTodo);
});

app.put('/api/todos/:id', authenticate, async (req, res) => {
  const todo = await Todo.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId }, // 본인 것만 수정 가능
    { completed: req.body.completed },
    { new: true }
  );
  res.json(todo);
});

app.delete('/api/todos/:id', authenticate, async (req, res) => {
  await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId }); // 본인 것만 삭제 가능
  res.json({ message: '삭제 완료' });
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`서버 실행 중: http://localhost:${PORT}`));
}

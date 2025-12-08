import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import CreatePost from './components/CreatePost';
import Login from './components/Login';
import Logout from './components/Logout';
import Navbar from './components/Navbar';
import EditPost from './components/EditPost';
import Mypage from './components/Mypage';
import { useState } from 'react';
import Notifications from './components/Notifications';

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem("isAuth"));

  return (
    <Router>
      <Navbar isAuth={isAuth} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/createpost" element={<CreatePost isAuth={isAuth} />} />
        <Route path="/edit/:id" element={<EditPost isAuth={isAuth} />} />
        
        <Route path="/mypage" element={<Mypage isAuth={isAuth} />} />
        
        <Route path="/profile/:id" element={<Mypage isAuth={isAuth} />} />
        <Route path="/notifications" element={<Notifications isAuth={isAuth} />} />
        
        <Route path="/login" element={<Login setIsAuth={setIsAuth} />} />
        <Route path="/logout" element={<Logout setIsAuth={setIsAuth} />} />
      </Routes>
    </Router>
  );
}

export default App;

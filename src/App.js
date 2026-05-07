import { useState } from "react";
import Login from "./pages/login";
import Home from "./pages/Home";
import BookDetail from "./pages/BookDetail";
import AdminDashboard from "./pages/AdminDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import "./index.css";

export default function App() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const [page, setPage]               = useState(savedUser ? getInitialPage(savedUser.role) : "login");
  const [selectedBook, setSelectedBook] = useState(null);
  const [user, setUser]               = useState(savedUser);

  function getInitialPage(role) {
    if (role === "Admin")  return "admin";
    if (role === "Owner")  return "owner";
    return "home";
  }

  const navigate = (p, data = null) => {
    setSelectedBook(data);
    setPage(p);
  };

  const handleLogin = (role) => {
    const u = JSON.parse(localStorage.getItem("user") || "null");
    setUser(u);
    if (role === "admin") navigate("admin");
    else if (role === "owner") navigate("owner");
    else navigate("home");
  };

  if (page === "login")  return <Login onLogin={handleLogin} />;
  if (page === "home")   return <Home navigate={navigate} user={user} />;
  if (page === "detail") return <BookDetail book={selectedBook} navigate={navigate} user={user} />;
  if (page === "admin")  return <AdminDashboard navigate={navigate} />;
  if (page === "owner")  return <OwnerDashboard navigate={navigate} />;
}
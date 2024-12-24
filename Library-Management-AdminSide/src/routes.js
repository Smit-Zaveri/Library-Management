import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import BookBorrow from "./pages/BookBorrow";
import Penalty from "./pages/Penalty";
import EntryLogs from "./pages/EntryLogs";
import BookList from "./pages/ListBook";
import StudentList from "./pages/StudentList";
import Form from "./components/BookForm";
import StudentForm from "./components/StudentForm";
import BookUpload from "./components/BookAddCsv";
import StudentUpload from "./components/StudentAddCsv";
import CollectionForm from "./components/CollectionForm";
import Login from "./pages/Login";
import Glob from "./pages/Glob";

export const routes = (user) => [
  { path: "/dashboard", element: user ? <Dashboard /> : <Login /> },
  { path: "/", element: <Glob /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/book-borrow", element: user ? <BookBorrow /> : <Login /> },
  { path: "/penalty", element: user ? <Penalty /> : <Login /> },
  { path: "/entry-logs", element: user ? <EntryLogs /> : <Login /> },
  { path: "/books", element: user ? <BookList /> : <Login /> },
  { path: "/students", element: user ? <StudentList /> : <Login /> },
  { path: "/add-book", element: user ? <Form /> : <Login /> },
  { path: "/edit-book/:id", element: user ? <Form /> : <Login /> },
  { path: "/add-student", element: user ? <StudentForm /> : <Login /> },
  { path: "/edit-student/:id", element: user ? <StudentForm /> : <Login /> },
  { path: "/add-book-csv", element: user ? <BookUpload /> : <Login /> },
  { path: "/add-student-csv", element: user ? <StudentUpload /> : <Login /> },
  // { path: "/author-form", element: user ? <AuthorForm /> : <Login /> },
  { path: "/author-form", element: user ? <CollectionForm collectionName="authors" /> : <Login /> },
  { path: "/categories", element: user ? <CollectionForm collectionName="categories" /> : <Login /> },
  { path: "/types", element: user ? <CollectionForm collectionName="types" /> : <Login /> },
];

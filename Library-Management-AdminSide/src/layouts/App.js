import React, { useCallback, useEffect, useState } from "react";
import {
  AppBar,
  Box,
  CircularProgress,
  CssBaseline,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { onAuthStateChanged } from "firebase/auth";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import DrawerContent from "./DrawerContent";
import { routes } from "../routes";
import { auth } from "../services/firebase";
import Brightness6Icon from "@mui/icons-material/Brightness6";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BookIcon from "@mui/icons-material/Book";
import PersonIcon from "@mui/icons-material/Person";
import SchoolIcon from "@mui/icons-material/School";
import CategoryIcon from "@mui/icons-material/Category";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ErrorIcon from "@mui/icons-material/Error";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const drawerWidth = 260;

const App = ({ darkMode, toggleTheme }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }, []);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      const publicRoutes = ["/", "/reset-password"];
      if (!currentUser && !publicRoutes.includes(location.pathname)) {
        // navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate, location.pathname]);

  const navItems = [
    { label: "Dashboard", path: "/", icon: <DashboardIcon /> },
    { label: "Book List", path: "/books", icon: <BookIcon /> },
    { label: "Student List", path: "/students", icon: <SchoolIcon /> },
    { label: "Author", path: "/author-form", icon: <PersonIcon /> },
    { label: "Types", path: "/types", icon: <CategoryIcon /> },
    { label: "Category", path: "/categories", icon: <LibraryBooksIcon /> },
    { label: "Book Issue", path: "/book-borrow", icon: <PendingActionsIcon /> },
    { label: "Penalty", path: "/penalty", icon: <ErrorIcon /> },
    { label: "EntryLogs", path: "/entry-logs", icon: <AccessTimeIcon /> },
  ];

  const handleDrawerToggle = useCallback(() => setMobileOpen((prev) => !prev), []);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: theme.palette.background.default,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          background: darkMode
            ? "linear-gradient(45deg, #333, #555)"
            : "linear-gradient(45deg, #1976d2, #42a5f5)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <Toolbar>
          {isMobile && user && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, fontWeight: "bold", letterSpacing: 1 }}
          >
            Dashboard
          </Typography>
          <Tooltip title="Toggle Dark/Light Mode">
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{ mr: 2 }}
            >
              <Brightness6Icon />
            </IconButton>
          </Tooltip>
          {user && (
            <Tooltip title="Logout">
              <IconButton
                color="inherit"
                onClick={handleLogout}
              >
                <ExitToAppIcon />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer for desktop */}
      {user && !isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              background: darkMode
                ? "linear-gradient(45deg, #222, #333)"
                : "linear-gradient(45deg, #f4f4f4, #e0e0e0)",
            },
          }}
        >
          <DrawerContent navItems={navItems} isMobile={isMobile} />
        </Drawer>
      )}

      {/* Drawer for mobile */}
      {user && isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              background: darkMode
                ? "linear-gradient(45deg, #222, #333)"
                : "linear-gradient(45deg, #f4f4f4, #e0e0e0)",
            },
          }}
        >
          <DrawerContent
            navItems={navItems}
            isMobile={isMobile}
            setMobileOpen={setMobileOpen}
          />
        </Drawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: theme.palette.background.default,
          minHeight: "100vh",
        }}
      >
        <Toolbar />
        <Routes>
          {routes(user).map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </Box>
    </Box>
  );
};

export default App;

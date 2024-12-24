import React, { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Toolbar,
  Typography,
  useTheme,
  Badge,
  IconButton,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import { Route, Routes, useNavigate, Navigate } from "react-router-dom";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import AlarmAddIcon from "@mui/icons-material/AlarmAdd";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import MenuIcon from "@mui/icons-material/Menu";
import ImageListItem from "@mui/material/ImageListItem";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";

import HomePage from "./HomePage";
import Login from "./Login";
import Cart from "./Cart";
import ReturnBook from "./ReturnBook";
import BorrowBooks from "./borrowBooks";
import {
  db,
  updateDoc,
  doc,
} from "./firebase";

const App = ({ darkMode, toggleTheme }) => {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const theme = useTheme();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else if (window.location.pathname !== "/Login") {
      navigate("/");
    }

    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartCount(storedCart.length);
  }, [navigate]);

  const handleLogout = async () => {
    try {
      // Retrieve entryLogId from localStorage
      const logId = localStorage.getItem("entryLogId");
  
      if (logId) {
        // Update outTime for the corresponding log entry in Firestore
        const logDoc = doc(db, "entry-log", logId);
        const timestamp = new Date();
        await updateDoc(logDoc, { outTime: timestamp });
  
        // Remove the entryLogId from localStorage after updating outTime
        localStorage.removeItem("entryLogId");
      }
  
      // Clear user data and navigate to login
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
    } catch (error) {
      console.error("Error updating outTime during logout: ", error);
    }
  };
  

  const handleLogin = () => navigate("/Login");
  const handleCart = () => navigate("/Cart");
  const handleReturn = () => navigate("/ReturnBook");
  const handleCartUpdate = () => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartCount(storedCart.length);
  };

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);

  const drawerList = (
    <List sx={{paddingTop: 7}}>
      <ListItem button onClick={toggleTheme}>
        <ListItemIcon>
          <Brightness4Icon />
        </ListItemIcon>
        <ListItemText primary="Toggle Theme" />
      </ListItem>
      <ListItem button onClick={handleCart}>
        <ListItemIcon>
          <ShoppingCartIcon />
        </ListItemIcon>
        <ListItemText primary={`Cart (${cartCount})`} />
      </ListItem>
      <ListItem button onClick={handleReturn}>
        <ListItemIcon>
          <AlarmAddIcon />
        </ListItemIcon>
        <ListItemText primary="Return Book" />
      </ListItem>
      {user ? (
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      ) : (
        <ListItem button onClick={handleLogin}>
          <ListItemIcon>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Login" />
        </ListItem>
      )}
    </List>
  );


  return (
    <Box sx={{ display: "flex", background: theme.palette.background.default }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton onClick={() => navigate("/")}>
            <ImageListItem>
              <img
                srcSet="jain.png?w=40&h=40 2x"
                alt="logo"
                loading="lazy"
                style={{ height: "40px", width: "auto", marginRight: "10px" }}
              />
            </ImageListItem>
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            University Library
          </Typography>
          {isMobile ? (
            <>
              <IconButton color="inherit" onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
              <Drawer open={drawerOpen} onClose={handleDrawerToggle}>
                {drawerList}
              </Drawer>
            </>
          ) : (
            <>
              <IconButton color="inherit" onClick={toggleTheme}>
                <Brightness4Icon />
              </IconButton>
              <IconButton color="inherit" onClick={handleCart}>
                <Badge badgeContent={cartCount} color="secondary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
              <IconButton color="inherit" onClick={handleReturn}>
                <AlarmAddIcon />
              </IconButton>
              {user ? (
                <IconButton color="inherit" onClick={handleLogout}>
                  <ExitToAppIcon />
                </IconButton>
              ) : (
                <IconButton color="inherit" onClick={handleLogin}>
                  <ExitToAppIcon />
                </IconButton>
              )}
            </>
          )}
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: "100%",
          mt: 8,
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage handleCartUpdate={handleCartUpdate} />} />
          <Route path="/Cart" element={user ? <Cart handleCartUpdate={handleCartUpdate} /> : <Login />} />
          <Route path="/ReturnBook" element={user ? <ReturnBook /> : <Login />} />
          <Route path="/borrowBooks" element={user ? <BorrowBooks /> : <Login />} />
          <Route path="/Login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default App;

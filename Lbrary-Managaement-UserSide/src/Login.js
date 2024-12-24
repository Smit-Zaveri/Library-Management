import React, { useState, useRef, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  db,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "./firebase";

const Login = ({ setUser }) => {
  const [usn, setUsn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [entryLogId, setEntryLogId] = useState(null); // To track log document ID
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const logoutTimerRef = useRef(null); // Timer for auto logout

  useEffect(() => {
    // Retrieve entryLogId from localStorage on component mount
    const storedLogId = localStorage.getItem("entryLogId");
    if (storedLogId) {
      setEntryLogId(storedLogId);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const logEntry = async (user, action) => {
    try {
      const timestamp = new Date();
      if (action === "login") {
        // Log in-time
        const logRef = await addDoc(collection(db, "entry-log"), {
          usn: user.usn,
          name: user.name,
          inTime: timestamp,
          outTime: null, // Out-time will be added on logout
        });
        const logId = logRef.id;
        setEntryLogId(logId); // Save log ID in state
        localStorage.setItem("entryLogId", logId); // Save log ID in localStorage
      } else if (action === "logout" && entryLogId) {
        // Update out-time for the same document
        const logDoc = doc(db, "entry-log", entryLogId);
        await updateDoc(logDoc, {
          outTime: timestamp,
        });
        setEntryLogId(null); // Clear log ID in state
        localStorage.removeItem("entryLogId"); // Remove log ID from localStorage
      }
    } catch (err) {
      console.error("Error logging entry/exit: ", err);
    }
  };

  const autoLogout = useRef(() => {
    setError("You have been logged out due to inactivity.");
    setSuccess("");
    setUser(null);
    localStorage.removeItem("user");
    logEntry({ usn }, "logout");
    localStorage.removeItem("entryLogId"); // Clear log ID on auto logout
    navigate("/login");
  });

  useEffect(() => {
    const handleActivity = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      logoutTimerRef.current = setTimeout(() => autoLogout.current(), 600000); // 10 minutes
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      clearTimeout(logoutTimerRef.current);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const studentRef = collection(db, "students");
      const q = query(studentRef, where("usn", "==", usn));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const user = querySnapshot.docs[0].data();
        setSuccess("USN found! Redirecting...");
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        logEntry(user, "login"); // Log in-time
        navigate("/");
      } else {
        setError("USN not found. Please check and try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleUsnChange = (e) => {
    setUsn(e.target.value.toUpperCase());
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "83.5vh",
        textAlign: "center",
        backgroundColor: "background.default",
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", p: 2, boxShadow: 3 }}>
        <Box
          sx={{
            width: "100%",
            overflow: "hidden",
            whiteSpace: "nowrap",
            animation: "scroll-left 10s linear infinite",
          }}
        >
          This Project is Currently in Development Phase
        </Box>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">
            Student Login
          </Typography>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              inputRef={inputRef}
              label="USN"
              variant="outlined"
              fullWidth
              margin="normal"
              value={usn}
              onChange={handleUsnChange}
              onKeyDown={handleKeyDown}
              sx={{ mt: 3 }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 3, py: 1.5 }}
              disabled={loading || !usn}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
            </Button>
          </form>
          <Typography
            variant="h8"
            gutterBottom
            align="center"
            style={{ textAlign: "center" }}
          >
            Enter Usn 23MCAR0037 for login
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;

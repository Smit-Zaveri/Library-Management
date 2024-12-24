import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
  useTheme,
  Grid,
} from "@mui/material";
import React, { useState } from "react";
import { auth } from "../services/firebase";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      setError("Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "83.5vh",
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          p: 3,
          boxShadow: 4,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <CardContent>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Welcome Back!
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            Please sign in to your account
          </Typography>

          {/* Display error message if exists */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                sx={{ input: { fontSize: "1rem" } }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                sx={{ input: { fontSize: "1rem" } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleLogin}
                sx={{
                  mt: 2,
                  py: 1.5,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
              </Button>
            </Grid>
          </Grid>

          <Typography variant="body2" align="center" sx={{ mt: 2, color: "textSecondary" }}>
            Forgot your password?{" "}
            <a href="/reset-password" style={{ textDecoration: "none", color: theme.palette.primary.main }}>
              Reset it here
            </a>
          </Typography>

          <Typography variant="body2" align="center" sx={{ mt: 1, color: "textSecondary" }}>
            Login credentials: <strong>test-user@demo.com</strong> | <strong>test123@</strong>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;

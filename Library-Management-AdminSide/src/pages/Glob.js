import React from 'react';
import { Button, Container, Typography, Grid } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Glob = () => {
  const navigate = useNavigate(); // For navigating to different routes

  const handleGoToApp = () => {
    navigate('/dashboard');
  };

  const handleGoToDifferentPage = () => {
    window.location.href = "https://library-management-user-side.vercel.app"; // Redirect to a different URL
  };

  return (
    <Container
      maxWidth="xs"
      sx={{
        height: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "0 20px",
      }}
    >
      <Typography
        variant="h3"
        sx={{
          marginBottom: "30px",
          fontWeight: 'bold',
          fontFamily: "'Roboto', sans-serif",
          color: "#1976d2", // Primary color
        }}
      >
        Library Management System
      </Typography>

      {/* Grid Container with responsive button layout */}
      <Grid container spacing={2} justifyContent="center" sx={{ width: '100%' }}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGoToApp}
            fullWidth
            sx={{
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: "600",
              borderRadius: "8px",
              transition: "background-color 0.3s",
              "&:hover": {
                backgroundColor: "#1565c0", // Darker shade for hover effect
              },
            }}
          >
            Admin Dashboard
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleGoToDifferentPage}
            fullWidth
            sx={{
              padding: "12px 24px",
              fontSize: "18px",
              fontWeight: "600",
              borderRadius: "8px",
              transition: "background-color 0.3s",
              "&:hover": {
                backgroundColor: "#ff4081", // Bright accent color for hover
              },
            }}
          >
            User Dashboard
          </Button>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Glob;

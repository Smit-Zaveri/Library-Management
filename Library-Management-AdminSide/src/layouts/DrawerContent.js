import React from "react";
import { Box, Divider, List, ListItem, ListItemIcon, ListItemText, Toolbar, useTheme } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

const drawerWidth = 245;

const DrawerContent = ({ navItems, isMobile, setMobileOpen }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box sx={{ width: drawerWidth }}>
      <Toolbar />
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.label}
            onClick={() => {
              navigate(item.path);
              if (isMobile) setMobileOpen(false); // Close the drawer on mobile when an item is clicked
            }}
            sx={{
              backgroundColor: location.pathname === item.path ? theme.palette.action.selected : "transparent",
              borderRadius: "0 10px 10px 0",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                borderRadius: "0 10px 10px 0", // Rounded corners for hover effect
                transition: "background-color 0.3s ease, transform 0.2s ease", // Smooth transition for hover and selection
                transform: "scale(1.02)", // Slight zoom effect on hover
              },
              paddingY: 1.5, // Vertical padding for a more spacious look
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.primary.main : "inherit" }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.label}
              sx={{
                fontWeight: location.pathname === item.path ? "bold" : "normal", // Bold text for selected item
                color: location.pathname === item.path ? theme.palette.primary.main : "inherit", // Color change for active item
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DrawerContent;



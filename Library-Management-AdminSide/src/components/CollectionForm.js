import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  TextField,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContentText,
  DialogContent,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { firestore } from "../services/firebase";

const CollectionForm = ({ collectionName }) => {
  const [name, setName] = useState("");
  const [collections, setCollections] = useState([]);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await firestore.collection(collectionName).get();
      const collectionList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCollections(collectionList);
      setError("");
    } catch (error) {
      setError("Error fetching collections. Please try again.");
      console.error("Error fetching collections:", error);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      setError("Please fill in all fields.");
      return;
    }

    const collectionData = { name };

    setLoading(true);
    try {
      if (editingId) {
        await firestore.collection(collectionName).doc(editingId).update(collectionData);
        setSnackbarMessage("Collection updated successfully.");
      } else {
        await firestore.collection(collectionName).add(collectionData);
        setSnackbarMessage("Collection added successfully.");
      }
      resetForm();
      fetchCollections();
    } catch (error) {
      setError("Error adding/updating collection. Please try again.");
      console.error("Error adding/updating collection:", error);
    } finally {
      setLoading(false);
      setSnackbarOpen(true);
    }
  };

  const handleEditCollection = (collection) => {
    setEditingId(collection.id);
    setName(collection.name);
    setError("");
  };

  const confirmDeleteCollection = (collectionId) => {
    setDeleteTargetId(collectionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCollection = async () => {
    setDeleteDialogOpen(false);
    if (deleteTargetId) {
      setLoading(true);
      try {
        await firestore.collection(collectionName).doc(deleteTargetId).delete();
        setSnackbarMessage("Collection deleted successfully.");
        fetchCollections();
      } catch (error) {
        setError("Error deleting collection. Please try again.");
        console.error("Error deleting collection:", error);
      } finally {
        setLoading(false);
        setSnackbarOpen(true);
      }
    }
  };

  const resetForm = () => {
    setName("");
    setEditingId(null);
    setError("");
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        {editingId
          ? `Edit ${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}`
          : `Create New ${collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}`}
      </Typography>

      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!error}
          helperText={error}
        />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" type="submit" disabled={loading}>
            {loading ? "Loading..." : editingId ? "Update Collection" : "Submit"}
          </Button>
          {editingId && (
            <Button variant="outlined" color="secondary" onClick={resetForm} sx={{ ml: 2 }}>
              Cancel Edit
            </Button>
          )}
        </Box>
      </form>

      <Typography variant="h6" sx={{ mt: 4 }}>
        {collectionName.charAt(0).toUpperCase() + collectionName.slice(1)}:
      </Typography>
      <List>
        {collections.map((collection, index) => (
          <React.Fragment key={collection.id}>
            <ListItem
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                bgcolor: "background.paper",
                borderRadius: 1,
                mb: 1,
                boxShadow: 1,
              }}
            >
              <IconButton edge="start" sx={{ color: "gray" }}>
                <DragIndicatorIcon />
              </IconButton>
              <ListItemText primary={`${collection.name}`} sx={{ ml: 2 }} />
              <Box sx={{ ml: "auto" }}>
                <IconButton onClick={() => handleEditCollection(collection)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => confirmDeleteCollection(collection.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
      <DialogTitle>Confirm Bulk Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleDeleteCollection} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CollectionForm;

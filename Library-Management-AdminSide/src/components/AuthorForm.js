import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Paper,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { firestore } from "../services/firebase";
import { useLocation } from "react-router-dom";

const AuthorForm = () => {
  const [name, setName] = useState("");
  const [authors, setAuthors] = useState([]);
  const [error, setError] = useState(null);
  const [editingAuthorId, setEditingAuthorId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [pagination, setPagination] = useState({ page: 0, rowsPerPage: 5 });

  const location = useLocation();

  useEffect(() => {
    if (location.state?.name) {
      setName(location.state.name);
    }
  }, [location.state]);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const snapshot = await firestore.collection("authors").get();
      const authorList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAuthors(authorList);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Author name cannot be empty.");
      return;
    }

    try {
      const authorData = { name };

      if (editingAuthorId) {
        await firestore.collection("authors").doc(editingAuthorId).update(authorData);
        setSnackbar({ open: true, message: "Author updated successfully." });
      } else {
        await firestore.collection("authors").add(authorData);
        setSnackbar({ open: true, message: "Author added successfully." });
      }

      resetForm();
      fetchAuthors();
    } catch (error) {
      console.error("Error adding/updating author:", error);
    }
  };

  const handleDeleteAuthor = (authorId) => {
    setConfirmDeleteId(authorId);
  };

  const confirmDelete = async () => {
    try {
      await firestore.collection("authors").doc(confirmDeleteId).delete();
      setSnackbar({ open: true, message: "Author deleted successfully." });
      setConfirmDeleteId(null);
      fetchAuthors();
    } catch (error) {
      console.error("Error deleting author:", error);
    }
  };

  const handleEditAuthor = (author) => {
    setEditingAuthorId(author.id);
    setName(author.name);
  };

  const resetForm = () => {
    setName("");
    setEditingAuthorId(null);
    setError(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: "" });
  };

  const handleChangePage = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination({ page: 0, rowsPerPage: parseInt(event.target.value, 10) });
  };

  const paginatedAuthors = authors.slice(
    pagination.page * pagination.rowsPerPage,
    pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" align="center" gutterBottom>
        {editingAuthorId ? "Edit Author" : "Add Author"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Author Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!error}
          helperText={error}
          sx={{ "& .MuiInputBase-root": { borderRadius: 2 } }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ px: 4, py: 1.5 }}
          >
            {editingAuthorId ? "Update Author" : "Add Author"}
          </Button>
          {editingAuthorId && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={resetForm}
              sx={{ px: 4, py: 1.5 }}
            >
              Cancel Edit
            </Button>
          )}
        </Box>
      </form>

      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3, mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAuthors.map((author) => (
              <TableRow key={author.id}>
                <TableCell>{author.name}</TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleEditAuthor(author)}
                    sx={{ mr: 1, borderRadius: 2 }}
                  >
                    <EditIcon />
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteAuthor(author.id)}
                    sx={{ borderRadius: 2 }}
                  >
                    <DeleteIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={authors.length}
        rowsPerPage={pagination.rowsPerPage}
        page={pagination.page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this author?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDelete} color="primary">
            Confirm
          </Button>
          <Button onClick={() => setConfirmDeleteId(null)} color="secondary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default AuthorForm;

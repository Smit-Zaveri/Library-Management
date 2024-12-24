import { Edit } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { firestore } from "../services/firebase";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";

const BookList = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDialogMulti, setOpenDialogMulti] = useState(false);

  // Fetch books from Firestore once
  const fetchBooks = useCallback(async () => {
    try {
      const snapshot = await firestore.collection("books").get();
      const booksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBooks(booksData);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Filter books based on search input
  const filteredBooks = useMemo(() => {
    const searchTerm = searchInput.toLowerCase();
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.categories.toLowerCase().includes(searchTerm) ||
        (book.tags &&
          book.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
    );
  }, [searchInput, books]);

  const handleSearchChange = (e) => setSearchInput(e.target.value);
  const handlePageChange = (_, newPage) => setPage(newPage);
  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Handle book actions
  const handleAddNewBook = () => navigate("/add-book");
  const handleUploadBooks = () => navigate("/add-book-csv");
  const handleEditBook = (id) => navigate(`/edit-book/${id}`);
  
  const handleDeleteDialogOpen = (id) => {
    setSelectedBookId(id);
    setOpenDialog(true);
  };

  const handleDeleteDialogClose = () => setOpenDialog(false);
  const handleDeleteDialogCloseMulti = () => setOpenDialogMulti(false);

  const handleDeleteBook = async () => {
    if (!selectedBookId) return;
    try {
      await firestore.collection("books").doc(selectedBookId).delete();
      setBooks((prevBooks) => prevBooks.filter((book) => book.id !== selectedBookId));
    } catch (error) {
      console.error("Error deleting book:", error);
    } finally {
      handleDeleteDialogClose();
    }
  };

  const handleBulkDelete = async () => {
    const batch = firestore.batch();
    selectedBooks.forEach((id) => {
      const bookRef = firestore.collection("books").doc(id);
      batch.delete(bookRef);
    });
    try {
      await batch.commit();
      setBooks((prevBooks) => prevBooks.filter((book) => !selectedBooks.includes(book.id)));
      setSelectedBooks([]);
    } catch (error) {
      console.error("Error during bulk delete:", error);
    } finally {
      handleDeleteDialogCloseMulti();
    }
  };

  const handleExportBooks = () => {
    const csvData = filteredBooks.map((data) => ({
      ISBN: data.ISBN || "",
      publisher: data.publisher || "",
      url: data.url || "",
      title: data.title || "",
      categories: data.categories || "",
      tags: data.tags ? data.tags.join(", ") : "",
      author: data.author || "",
      type: data.type || "",
      code: data.code || "",
      bookavailable: data.bookavailable !== undefined ? data.bookavailable : false,
      Book_shelf: data.Book_shelf || "",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "books_export.csv";
    link.click();
  };

  const handleSelectBook = (id) => {
    setSelectedBooks((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((bookId) => bookId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAllBooks = () => {
    const currentBooks = filteredBooks
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
      .map((book) => book.id);

    const allSelected = currentBooks.every((id) => selectedBooks.includes(id));

    setSelectedBooks(
      allSelected
        ? selectedBooks.filter((id) => !currentBooks.includes(id))
        : [...new Set([...selectedBooks, ...currentBooks])]
    );
  };

  const isAllSelected = filteredBooks
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    .every((book) => selectedBooks.includes(book.id));

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4, padding: 2 }}>
      <Typography variant="h4" gutterBottom sx={{  marginBottom: 3 }}>
        Book List
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          label="Search Books"
          variant="outlined"
          value={searchInput}
          onChange={handleSearchChange}
          fullWidth
          sx={{ maxWidth: 400, backgroundColor: theme.palette.background.paper, borderRadius: "8px" }}
        />
        <Box>
          <Button variant="contained" color="primary" onClick={handleAddNewBook} sx={{ marginRight: 1, borderRadius: "8px" }} startIcon={<Edit />}>Add New Book</Button>
          <Button variant="outlined" color="secondary" onClick={handleUploadBooks} sx={{ marginRight: 1, borderRadius: "8px" }}>Upload via CSV</Button>
          <Button variant="outlined" color="success" onClick={handleExportBooks} sx={{ marginRight: 1, borderRadius: "8px" }}>Export Books</Button>
          {selectedBooks.length > 0 && (
            <Button variant="outlined" color="error" onClick={() => setOpenDialogMulti(true)} sx={{ borderRadius: "8px" }}>
              Delete Selected
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: "8px", marginTop: 2 }}>
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox onChange={handleSelectAllBooks} checked={isAllSelected} />
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: "bold" }}>Title</TableCell>
              <TableCell align="left" sx={{ fontWeight: "bold" }}>Author</TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBooks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((book) => (
              <TableRow key={book.id} sx={{ "&:hover": { backgroundColor: theme.palette.action.selected } }}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selectedBooks.includes(book.id)} onChange={() => handleSelectBook(book.id)} />
                </TableCell>
                <TableCell align="left">{book.title}</TableCell>
                <TableCell align="left">{book.author}</TableCell>
                <TableCell align="center">
                  <Button size="small" variant="outlined" color="primary" onClick={() => handleEditBook(book.id)} sx={{ marginRight: 1, borderRadius: "8px" }}>Edit</Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDeleteDialogOpen(book.id)} sx={{ borderRadius: "8px" }}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredBooks.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 20, { label: "All", value: -1 }]}
        sx={{ marginTop: 2 }}
      />

      {/* Delete Confirmation Dialogs */}
      <Dialog open={openDialog} onClose={handleDeleteDialogClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this book? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="secondary">Cancel</Button>
          <Button onClick={handleDeleteBook} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDialogMulti} onClose={handleDeleteDialogCloseMulti}>
        <DialogTitle>Confirm Bulk Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete the selected books? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogCloseMulti} color="secondary">Cancel</Button>
          <Button onClick={handleBulkDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookList;

import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { firestore, Timestamp } from "../services/firebase";

const PenaltyPage = () => {
  const [books, setBooks] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch books and calculate penalty
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const snapshot = await firestore.collection("book-borrow").get();
        const booksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate penalty for each book based on the return date and whether the penalty was paid today
        const updatedBooks = booksData.map((book) => {
          const returnDate = book.returnDate.toDate();
          const today = new Date();
          const diffTime = today - returnDate;
          const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

          // If the penalty was paid today, don't calculate penalty
          if (book.penaltyPaidToday) {
            book.penalty = 0; // No penalty if paid today
          } else {
            // If book is overdue, apply penalty
            if (diffDays > 0) {
              book.penalty = diffDays * 10; // 10 rupees per day
            } else {
              book.penalty = 0; // No penalty if not overdue
            }
          }
          return book;
        });

        // Filter books that have a penalty
        const booksWithPenalty = updatedBooks.filter((book) => book.penalty > 0);

        setBooks(booksWithPenalty);
        setFilteredBooks(booksWithPenalty);
      } catch (error) {
        console.error("Error fetching book data:", error);
      }
    };

    fetchBooks();
  }, []);

  // Handle search input change
  useEffect(() => {
    const searchTerm = searchInput.toLowerCase();
    const results = books.filter((book) => {
      return Object.keys(book).some((key) => {
        const value = book[key];
        return (
          value !== undefined &&
          value !== null &&
          value.toString().toLowerCase().includes(searchTerm)
        );
      });
    });
    setFilteredBooks(results);
  }, [searchInput, books]);

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date =
      timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      timeZoneName: "short",
    });
  };

  const clearPenalty = async (bookId) => {
    try {
      // Update the penalty in the database to zero and mark as penalty paid today
      await firestore.collection("book-borrow").doc(bookId).update({
        penalty: 0,
        penaltyPaidToday: true, // Mark as paid today
      });

      // Update the UI to reflect the cleared penalty
      setBooks(books.map((book) =>
        book.id === bookId ? { ...book, penalty: 0, penaltyPaidToday: true } : book
      ));
      alert("Penalty cleared successfully!");
    } catch (error) {
      console.error("Error clearing penalty:", error);
      alert("Failed to clear the penalty.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Books with Penalty
      </Typography>

      <Box mb={2}>
        <TextField
          label="Search"
          variant="outlined"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by any field..."
          fullWidth
        />
      </Box>

      <TableContainer sx={{ border: "1px solid #ddd", borderRadius: "8px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="left">Title</TableCell>
              <TableCell align="left">Branch</TableCell>
              <TableCell align="left">Department</TableCell>
              <TableCell align="left">Email</TableCell>
              <TableCell align="left">USN</TableCell>
              <TableCell align="left">Penalty (₹)</TableCell>
              <TableCell align="left">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBooks
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((book) => (
                <TableRow key={book.id}>
                  <TableCell align="left">{book.bookTitle}</TableCell>
                  <TableCell align="left">{book.branch}</TableCell>
                  <TableCell align="left">{book.department}</TableCell>
                  <TableCell align="left">{book.email}</TableCell>
                  <TableCell align="left">{book.usn}</TableCell>
                  <TableCell align="left">₹{book.penalty}</TableCell>
                  <TableCell align="left">
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => clearPenalty(book.id)}
                    >
                      Clear Penalty
                    </Button>
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
        rowsPerPageOptions={[5, 10, 20]}
        sx={{ marginTop: 2 }}
      />
    </Container>
  );
};

export default PenaltyPage;

import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TablePagination,
  Snackbar,
  Alert,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { db, collection, addDoc, Timestamp, query, where, getDocs, updateDoc } from "./firebase";

const Cart = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();

  // Handle deletion of a book from the cart
  const handleDelete = (ISBN) => {
    const updatedCart = cartItems.filter((item) => item.ISBN !== ISBN);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setSnackbarMessage("Book removed from cart!");
    setOpenSnackbar(true);
    window.location.reload();
  };

  // Handle page change in pagination
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle Checkout
  const handleCheckout = async () => {
    if (cartItems.length > 0) {
      try {
        for (const book of cartItems) {
          const student = JSON.parse(localStorage.getItem("user"));
  
          // Add to book-issues database
          await addDoc(collection(db, "book-issues"), {
            name: student.name,
            email: student.email,
            usn: student.usn,
            branch: student.branch,
            department: student.department,
            bookTitle: book.title,
            ISBN: book.ISBN,
            inTime: Timestamp.now(),
            userStatus: "Reading",
          });
  
          // Query the books collection using ISBN to find the book
          const bookQuery = query(collection(db, "books"), where("ISBN", "==", book.ISBN));
          const bookQuerySnapshot = await getDocs(bookQuery);
  
          if (!bookQuerySnapshot.empty) {
            // Fetch the first matching book from the snapshot
            const bookDoc = bookQuerySnapshot.docs[0];
            const currentBook = bookDoc.data();
  
            const currentBookAvailable = Number(currentBook.bookavailable); // Convert to number if it's a string
  
            if (currentBookAvailable > 0) {
              const newAvailableCount = currentBookAvailable - 1;
  
              // Update the book availability in the books collection
              await updateDoc(bookDoc.ref, {
                bookavailable: newAvailableCount,
              });
            } else {
              setSnackbarMessage(`Sorry, ${book.title} is currently unavailable.`);
              setOpenSnackbar(true);
            }
          } else {
            setSnackbarMessage(`Book ${book.title} not found in the collection.`);
            setOpenSnackbar(true);
          }
        }
  
        // Clear cart after checkout
        localStorage.removeItem("cart");
        navigate("/");
      } catch (error) {
        setSnackbarMessage("Error during checkout. Please try again.");
        setOpenSnackbar(true);
        console.error("Checkout Error:", error);
      }
    } else {
      setSnackbarMessage("Your cart is empty. Please add books to your cart before checking out.");
      setOpenSnackbar(true);
    }
  };

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Your Cart
      </Typography>

      {cartItems.length === 0 ? (
        <Typography color="textSecondary">Your cart is empty. Add books to your cart!</Typography>
      ) : (
        <TableContainer sx={{ border: "1px solid #ddd", borderRadius: "8px", boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left"><strong>Book Title</strong></TableCell>
                <TableCell align="left"><strong>Author</strong></TableCell>
                <TableCell align="left"><strong>Publisher</strong></TableCell>
                <TableCell align="left"><strong>ISBN</strong></TableCell>
                <TableCell align="left"><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cartItems
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item, index) => (
                  <TableRow key={index} sx={{  }}>
                    <TableCell align="left">{item.title}</TableCell>
                    <TableCell align="left">{item.author}</TableCell>
                    <TableCell align="left">{item.publisher}</TableCell>
                    <TableCell align="left">{item.ISBN}</TableCell>
                    <TableCell align="left">
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(item.ISBN)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={cartItems.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 20]}
        sx={{ marginTop: 2 }}
      />

      <Box textAlign="right" mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCheckout}
          disabled={cartItems.length === 0}
          sx={{ marginRight: 2 }}
        >
          Checkout
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => navigate("/borrowBooks")}
        >
          Book Issued
        </Button>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Cart;
 
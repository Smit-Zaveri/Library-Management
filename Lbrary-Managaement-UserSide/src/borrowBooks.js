import React, { useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { db, collection, addDoc, getDocs, query, where, updateDoc, doc, Timestamp } from "./firebase"; // Firebase functions
import Webcam from "react-webcam";

const BorrowBooks = () => {
  const cartItems = JSON.parse(localStorage.getItem("cart")) || [];
  const [photoTaken, setPhotoTaken] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState(null); // Store the captured photo
  const [loading, setLoading] = useState(false); // Loading state
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const webcamRef = useRef(null);
  const navigate = useNavigate();

  // Handle the "Final Step" button click
  const handleFinalStep = () => {
    setCameraOpen(true);
  };

  // Capture photo using the webcam
  const handleClickPhoto = async () => {
    if (webcamRef.current) {
      const capturedPhoto = webcamRef.current.getScreenshot();
      setPhoto(capturedPhoto);
      setPhotoTaken(true);
      setLoading(true); // Show loading spinner

      const student = JSON.parse(localStorage.getItem("user"));
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + 10); // Set return date to 10 days from today

      try {
        for (const book of cartItems) {
          // Check if the user has already borrowed this book
          const borrowedBooksQuery = query(
            collection(db, "book-borrow"),
            where("email", "==", student.email),
            where("ISBN", "==", book.ISBN),
            where("userStatus", "==", "Borrowed")
          );
          const borrowedBooksSnapshot = await getDocs(borrowedBooksQuery);

          if (!borrowedBooksSnapshot.empty) {
            // User has already borrowed this book
            setSnackbarMessage(`You have already borrowed the book: ${book.title}.`);
            setOpenSnackbar(true);
            setLoading(false); // Hide loading spinner
            return; // Exit function and don't proceed with borrowing
          }

          // Check if the book is available
          const booksQuery = query(
            collection(db, "books"),
            where("ISBN", "==", book.ISBN)
          );
          const booksSnapshot = await getDocs(booksQuery);

          if (!booksSnapshot.empty) {
            const bookDoc = booksSnapshot.docs[0];
            const currentBook = bookDoc.data();

            if (currentBook.bookavailable <= 0) {
              // Book is not available
              setSnackbarMessage(`The book "${book.title}" is currently unavailable.`);
              setOpenSnackbar(true);
              setLoading(false);
              return; // Exit function if the book is not available
            }

            // Add borrow details to the "book-borrow" collection
            await addDoc(collection(db, "book-borrow"), {
              name: student.name,
              email: student.email,
              usn: student.usn,
              branch: student.branch,
              department: student.department,
              bookTitle: book.title,
              ISBN: book.ISBN,
              borrowDate: Timestamp.now(),
              returnDate: Timestamp.fromDate(returnDate), // Save return date
              photo: capturedPhoto, // Save the photo data (base64 format)
              userStatus: "Borrowed",
              penalty: 0, // Initialize penalty to 0
            });

            // Update the book availability in the "books" collection
            const newAvailableCount = Math.max(0, Number(currentBook.bookavailable) - 1);

            await updateDoc(doc(db, "books", bookDoc.id), {
              bookavailable: newAvailableCount,
            });
          }
        }

        // Clear the cart after completing the process
        localStorage.removeItem("cart");

        // Show success message
        setSnackbarMessage("Books borrowed successfully!");
        setOpenSnackbar(true);

        // Redirect user to the home page
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } catch (err) {
        console.error("Error processing borrow data: ", err);
        setSnackbarMessage("Error while borrowing the books. Please try again.");
        setOpenSnackbar(true);
      } finally {
        setLoading(false); // Hide loading spinner
      }
    }
  };

  // Handle closing the snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Function to view borrowed books
  const viewBorrowedBooks = async () => {
    const student = JSON.parse(localStorage.getItem("user"));
    const borrowedBooksQuery = query(
      collection(db, "book-borrow"),
      where("email", "==", student.email),
      where("userStatus", "==", "Borrowed")
    );

    const borrowedBooksSnapshot = await getDocs(borrowedBooksQuery);

    if (!borrowedBooksSnapshot.empty) {
      const borrowedBooks = borrowedBooksSnapshot.docs.map((doc) => doc.data());
      // You can display these borrowed books to the user in another UI section or in a new page
      setSnackbarMessage("Your borrowed books are displayed.");
      setOpenSnackbar(true);
    } else {
      setSnackbarMessage("You haven't borrowed any books yet.");
      setOpenSnackbar(true);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Borrow Books
      </Typography>

      {cartItems.length === 0 ? (
        <Typography color="textSecondary" sx={{ marginBottom: 2 }}>
          Your cart is empty. Please add books to your cart.
        </Typography>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Books in Your Cart:
          </Typography>
          <TableContainer component={Paper} sx={{ marginBottom: 4, borderRadius: 2, boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="left">
                    <strong>Book Title</strong>
                  </TableCell>
                  <TableCell align="left">
                    <strong>Author</strong>
                  </TableCell>
                  <TableCell align="left">
                    <strong>Publisher</strong>
                  </TableCell>
                  <TableCell align="left">
                    <strong>ISBN</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell align="left">{item.title}</TableCell>
                    <TableCell align="left">{item.author}</TableCell>
                    <TableCell align="left">{item.publisher}</TableCell>
                    <TableCell align="left">{item.ISBN}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {!cameraOpen ? (
        <Box sx={{ marginTop: 4 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleFinalStep}
            disabled={cartItems.length === 0}
            sx={{ width: "100%", padding: "12px" }}
          >
            Proceed to Final Step
          </Button>
        </Box>
      ) : (
        <>
          <Typography variant="h6" gutterBottom>
            Capture a photo of the borrowed books
          </Typography>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width="100%" // Make the webcam occupy full width
            videoConstraints={{
              facingMode: "environment",
            }}
            style={{
              marginTop: 10,
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <Box sx={{ marginTop: 2, display: "flex", justifyContent: "center" }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleClickPhoto}
              sx={{ padding: "10px 20px" }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} color="secondary" /> : "Capture Photo"}
            </Button>
          </Box>
        </>
      )}

      <Box sx={{ marginTop: 4 }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={viewBorrowedBooks}
          sx={{ width: "100%", padding: "12px" }}
        >
          View Borrowed Books
        </Button>
      </Box>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={loading ? "warning" : "success"} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BorrowBooks;

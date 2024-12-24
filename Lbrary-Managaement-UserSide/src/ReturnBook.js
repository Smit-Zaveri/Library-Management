import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Checkbox,
  TableContainer,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

const ReturnBook = () => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [returnType, setReturnType] = useState("");
  const [alert, setAlert] = useState(null); 
  const navigate = useNavigate();

  // Calculate penalty if the book is returned late
  const checkPenaltyForBorrowing = useCallback(async (bookId, returnDate) => {
    const currentDate = new Date();
    const returnDateObj = returnDate instanceof Timestamp ? returnDate.toDate() : new Date(returnDate);
    const timeDifference = currentDate - returnDateObj;
    const daysLate = Math.floor(timeDifference / (1000 * 3600 * 24));
    let penalty = 0;

    if (daysLate > 0) {
      const lateDays = Math.min(daysLate, 10);
      penalty = lateDays * 10; // Rs 10 per day
      const bookRef = doc(db, "book-borrow", bookId);
      await updateDoc(bookRef, { penalty });
    }

    return penalty;
  }, []); // No dependencies required here

  // Fetch issued books from the database
  const fetchIssuedBooks = useCallback(async () => {
    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const collectionName = returnType === "Reading" ? "book-issues" : "book-borrow";
    const q = query(
      collection(db, collectionName),
      where("email", "==", user.email),
      where("userStatus", "==", returnType === "Reading" ? "Reading" : "Borrowed")
    );
    const querySnapshot = await getDocs(q);
    const books = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate penalties for borrowing books
    for (const book of books) {
      const returnDate = book.returnDate;
      if (returnType === "Borrowing" && returnDate) {
        const penalty = await checkPenaltyForBorrowing(book.id, returnDate);
        book.penalty = penalty;
      }
    }

    setIssuedBooks(books);
    setLoading(false);
  }, [returnType, checkPenaltyForBorrowing]); // Added checkPenaltyForBorrowing as a dependency

  // Fetch books when the component mounts or returnType changes
  useEffect(() => {
    fetchIssuedBooks();
  }, [fetchIssuedBooks, returnType]); // Re-fetch when returnType changes

  // Handle checkbox selection for books to be returned
  const handleCheckboxChange = (event, bookId) => {
    setSelectedBooks((prevSelected) =>
      event.target.checked
        ? [...prevSelected, bookId]
        : prevSelected.filter((id) => id !== bookId)
    );
  };

  // Handle return action for selected books
  const handleReturnClick = async () => {
    if (selectedBooks.length === 0) {
      showAlert("Please select at least one book to return.", "error");
      return;
    }

    const bookWithPenalty = selectedBooks.some((bookId) => {
      const book = issuedBooks.find((book) => book.id === bookId);
      return book && book.penalty > 0;
    });

    if (bookWithPenalty) {
      const penaltyPaidToday = await checkPenaltyPaymentToday(selectedBooks);
      if (!penaltyPaidToday) {
        showAlert("You cannot return books with a penalty until the penalty is cleared.", "error");
        return;
      }
    }

    await captureAndReturnBooks();

    // Show success message and redirect after delay
    showAlert("Books returned successfully!", "success");
    setTimeout(() => {
      navigate("/"); // Navigate after success
    }, 2000); // 2000ms = 2 seconds
  };

  // Capture and update the return process in the database
  const captureAndReturnBooks = useCallback(async () => {
    const collectionName = returnType === "Reading" ? "book-issues" : "book-borrow";
    try {
      for (const bookId of selectedBooks) {
        const bookIssueRef = doc(db, collectionName, bookId);
        const bookIssueDoc = await getDoc(bookIssueRef);
        const returnDate = bookIssueDoc.data().returnDate;

        if (returnType === "Borrowing" && returnDate) {
          await checkPenaltyForBorrowing(bookId, returnDate);
        }

        await updateDoc(bookIssueRef, {
          outTime: Timestamp.now(),
          userStatus: "Book-Returned",
        });

        const ISBN = bookIssueDoc.data().ISBN;
        const bookQuery = query(collection(db, "books"), where("ISBN", "==", ISBN));
        const bookQuerySnapshot = await getDocs(bookQuery);

        if (!bookQuerySnapshot.empty) {
          const bookDoc = bookQuerySnapshot.docs[0];
          const currentBook = bookDoc.data();
          const newAvailableCount = Number(currentBook.bookavailable) + 1;

          await updateDoc(bookDoc.ref, {
            bookavailable: newAvailableCount,
          });
        }
      }

      setIssuedBooks(issuedBooks.filter((book) => !selectedBooks.includes(book.id)));
      setSelectedBooks([]); // Reset selected books
    } catch (err) {
      console.error("Error returning books:", err);
      showAlert("Failed to return books.", "error");
    }
  }, [returnType, selectedBooks, issuedBooks, checkPenaltyForBorrowing]); // Added checkPenaltyForBorrowing as a dependency

  // Check if the penalty has been paid today
  const checkPenaltyPaymentToday = async (selectedBooks) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    for (const bookId of selectedBooks) {
      const bookRef = doc(db, "book-borrow", bookId);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        const penaltyPaidTimestamp = bookDoc.data().penaltyPaidTimestamp;
        if (penaltyPaidTimestamp) {
          const penaltyPaidDate = penaltyPaidTimestamp.toDate();
          if (penaltyPaidDate >= startOfDay && penaltyPaidDate <= endOfDay) {
            continue;
          } else {
            showAlert("The penalty for this book has not been paid today.", "error");
            return false;
          }
        } else {
          showAlert("No penalty payment record found for this book.", "error");
          return false;
        }
      }
    }

    return true;
  };

  // Show alert messages
  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000); // Hide alert after 3 seconds
  };

  // Format the timestamp into a readable date string
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
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

  // Show a loading spinner while data is being fetched
  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ padding: "2rem", borderRadius: "8px" }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center", marginBottom: "1rem" }}>
        Return Issued Books
      </Typography>

      <FormControl sx={{ marginBottom: 3, width: "200px", alignSelf: "center" }}>
        <InputLabel id="return-type-label">Return Type</InputLabel>
        <Select
          labelId="return-type-label"
          value={returnType}
          onChange={(e) => setReturnType(e.target.value)}
          sx={{ borderRadius: "8px" }}
        >
          <MenuItem value="Borrowing">Borrowing</MenuItem>
          <MenuItem value="Reading">Reading</MenuItem>
        </Select>
      </FormControl>

      {alert && (
        <Box
          sx={{
            position: "fixed",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: alert.type === "success" ? "green" : "red",
            color: "#fff",
            padding: "1rem",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          {alert.message}
        </Box>
      )}

      {issuedBooks.length > 0 ? (
        <>
          <TableContainer sx={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", marginBottom: "1rem" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Book Title</strong></TableCell>
                  <TableCell><strong>ISBN</strong></TableCell>
                  <TableCell><strong>Borrowed Date</strong></TableCell>
                  <TableCell><strong>Return Date</strong></TableCell>
                  <TableCell><strong>Penalty</strong></TableCell>
                  <TableCell><strong>Select</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {issuedBooks.map((book) => {
                  const penalty = book.penalty ? `₹${book.penalty}` : "No Penalty";
                  return (
                    <TableRow key={book.id}>
                      <TableCell>{book.bookTitle}</TableCell>
                      <TableCell>{book.ISBN}</TableCell>
                      <TableCell>{formatDate(book.borrowDate)}</TableCell>
                      <TableCell>{formatDate(book.returnDate)}</TableCell>
                      <TableCell>{penalty}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedBooks.includes(book.id)}
                          onChange={(e) => handleCheckboxChange(e, book.id)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ marginTop: 2, textAlign: "right" }}>
            <Button variant="contained" color="primary" onClick={handleReturnClick}>
              Return Selected Books
            </Button>
          </Box>
        </>
      ) : (
        <Typography sx={{ textAlign: "center", marginTop: "2rem" }}>No books available for return.</Typography>
      )}
    </Box>
  );
};

export default ReturnBook;

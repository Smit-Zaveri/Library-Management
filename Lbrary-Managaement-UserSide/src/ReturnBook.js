import React, { useEffect, useState } from "react";
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
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useNavigate } from "react-router-dom";

const ReturnBook = () => {
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [returnType, setReturnType] = useState("Reading");
  const navigate = useNavigate();

  useEffect(() => {
    fetchIssuedBooks();
  }, [returnType]);

  const fetchIssuedBooks = async () => {
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

    for (const book of books) {
      const returnDate = book.returnDate;
      if (returnType === "Borrowing" && returnDate) {
        const penalty = await checkPenaltyForBorrowing(book.id, returnDate);
        book.penalty = penalty;
      }
    }

    setIssuedBooks(books);
    setLoading(false);
  };

  const checkPenaltyForBorrowing = async (bookId, returnDate) => {
    const currentDate = new Date();
    const returnDateObj = returnDate instanceof Timestamp ? returnDate.toDate() : new Date(returnDate);
    const timeDifference = currentDate - returnDateObj;
    const daysLate = Math.floor(timeDifference / (1000 * 3600 * 24));
    let penalty = 0;

    if (daysLate > 0) {
      const lateDays = daysLate <= 10 ? daysLate : 10;
      penalty = lateDays * 10;  // Rs 10 per day
      const bookRef = doc(db, "book-borrow", bookId);
      await updateDoc(bookRef, { penalty });
    }

    return penalty;
  };

  const handleCheckboxChange = (event, bookId) => {
    if (event.target.checked) {
      setSelectedBooks([...selectedBooks, bookId]);
    } else {
      setSelectedBooks(selectedBooks.filter((id) => id !== bookId));
    }
  };

  const handleReturnClick = async () => {
    if (selectedBooks.length === 0) {
      alert("Please select at least one book to return.");
      return;
    }

    const bookWithPenalty = selectedBooks.some((bookId) => {
      const book = issuedBooks.find((book) => book.id === bookId);
      return book && book.penalty > 0;
    });

    if (bookWithPenalty) {
      const penaltyPaidToday = await checkPenaltyPaymentToday(selectedBooks);
      if (!penaltyPaidToday) {
        alert("You cannot return books with a penalty until the penalty is cleared.");
        return;
      }
    }

    captureAndReturnBooks();
    navigate("/");
  };

  const captureAndReturnBooks = async () => {
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
      setSelectedBooks([]);
      alert("Books returned successfully!");
    } catch (err) {
      console.error("Error returning books:", err);
      alert("Failed to return books.");
    }
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

  const checkPenaltyPaymentToday = async (selectedBooks) => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    for (const bookId of selectedBooks) {
      const bookRef = doc(db, "book-borrow", bookId);
      const bookDoc = await getDoc(bookRef);

      if (bookDoc.exists()) {
        const penaltyPaidTodayField = bookDoc.data().penaltyPaidToday;

        if (penaltyPaidTodayField) {
          await updateDoc(bookRef, { penalty: 0 });
          continue;
        } else {
          const penaltyPaidTimestamp = bookDoc.data().penaltyPaidTimestamp;
          if (penaltyPaidTimestamp) {
            const penaltyPaidDate = penaltyPaidTimestamp.toDate();

            if (penaltyPaidDate >= startOfDay && penaltyPaidDate <= endOfDay) {
              continue;
            } else {
              alert("The penalty for this book has not been paid today.");
              return false;
            }
          } else {
            alert("No penalty payment record found for this book.");
            return false;
          }
        }
      }
    }

    return true;
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ padding: "2rem",  borderRadius: "8px" }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: "center", marginBottom: "1rem" }}>
        Return Issued Books
      </Typography>

      <FormControl sx={{ marginBottom: 3, width: "200px", alignSelf: "center" }}>
        <InputLabel id="return-type-label">Return Type</InputLabel>
        <Select
          labelId="return-type-label"
          value={returnType}
          onChange={(e) => setReturnType(e.target.value)}
          sx={{  borderRadius: "8px" }}
        >
          <MenuItem value="Reading">Reading</MenuItem>
          <MenuItem value="Borrowing">Borrowing</MenuItem>
        </Select>
      </FormControl>

      {issuedBooks.length > 0 ? (
        <>
          <TableContainer sx={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", marginBottom: "1rem" }}>
            <Table>
              <TableHead sx={{}}>
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
                {issuedBooks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((book) => {
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
            <Button
              variant="contained"
              color="primary"
              onClick={handleReturnClick}
              sx={{
                
                padding: "0.5rem 2rem",
              }}
            >
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

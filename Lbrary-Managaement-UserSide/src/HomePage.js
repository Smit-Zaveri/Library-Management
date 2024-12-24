import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  MenuItem,
  Typography,
  Box,
  Container,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Snackbar,
  Alert,
  IconButton,
  Grid,
  Pagination,
} from "@mui/material";
import { db, collection, getDocs, query, where } from "./firebase";
import BookCard from "./BookCard";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import { debounce } from "lodash";

const App = ({ handleCartUpdate }) => {
  const [bookType, setBookType] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookTypes, setBookTypes] = useState([]);
  const [searched, setSearched] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 9;
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  useEffect(() => {
    const fetchBookTypes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "books"));
        const types = new Set(
          querySnapshot.docs.map((doc) => doc.data().type).filter(Boolean)
        );
        setBookTypes([...types]);
      } catch (error) {
        console.error("Error fetching book types: ", error);
      }
    };
    fetchBookTypes();
  }, []);

  useEffect(() => {
    const fetchMostBorrowedBooks = async () => {
      setLoading(true);
      try {
        const borrowQuerySnapshot = await getDocs(collection(db, "book-borrow"));
        const borrowCounts = {};
        
        // Count the number of times each book has been borrowed
        borrowQuerySnapshot.forEach((doc) => {
          const data = doc.data();
          const bookISBN = data.ISBN;
          if (borrowCounts[bookISBN]) {
            borrowCounts[bookISBN] += 1;
          } else {
            borrowCounts[bookISBN] = 1;
          }
        });
  
        const mostBorrowed = [];
        
        // Loop through each ISBN and fetch book details
        for (const isbn in borrowCounts) {
          const bookQuerySnapshot = await getDocs(
            query(collection(db, "books"), where("ISBN", "==", isbn))
          );
          
          bookQuerySnapshot.forEach((bookDoc) => {
            const bookData = bookDoc.data();
  
            // Check if the book is available in stock (bookavailable >= 8)
            if (bookData.bookavailable > 0) {
              mostBorrowed.push({
                ...bookData,
                borrowCount: borrowCounts[isbn],
              });
            }
          });
        }
  
        // Sort books based on borrow count and limit to top 6
        mostBorrowed.sort((a, b) => b.borrowCount - a.borrowCount);
        setMostBorrowedBooks(mostBorrowed.slice(0, 4));
      } catch (error) {
        console.error("Error fetching most borrowed books: ", error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchMostBorrowedBooks();
  }, []);
  

  const handleSearch = useCallback(
    debounce(async () => {
      if (!bookType && !searchText.trim()) {
        setFilteredBooks([]);
        return;
      }

      setLoading(true);
      setSearched(true);
      try {
        const querySnapshot = await getDocs(collection(db, "books"));
        const results = querySnapshot.docs
          .map((doc) => doc.data())
          .filter((book) => {
            const matchesType = bookType ? book.type === bookType : true;
            const matchesSearch =
              !searchText.trim() ||
              [
                book.title,
                book.author,
                book.publisher,
                book.ISBN,
                ...(book.tags || []),
              ]
                .filter(Boolean)
                .some((field) =>
                  field.toLowerCase().includes(searchText.toLowerCase())
                );
            return matchesType && matchesSearch;
          });

        setFilteredBooks(results);
      } catch (error) {
        console.error("Error fetching books: ", error);
      } finally {
        setLoading(false);
      }
    }, 500),
    [bookType, searchText]
  );

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  const handleBookTypeChange = (event) => {
    setBookType(event.target.value);
  };

  useEffect(() => {
    handleSearch();
  }, [bookType, searchText]);

  const handleClearSearch = () => {
    setSearchText("");
    setBookType("");
    setFilteredBooks([]);
    setSearched(false);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const getPaginatedBooks = () => {
    const startIndex = (currentPage - 1) * booksPerPage;
    return filteredBooks.slice(startIndex, startIndex + booksPerPage);
  };

  return (
    <Container style={{ marginTop: "0rem" }} maxWidth="xl">
      <Box textAlign="center" mb={0} mt={0}>
        <Typography variant="h4" gutterBottom color="primary">
          Library Search
        </Typography>
      </Box>

      {/* Search and Filter Section */}
      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        alignItems="center"
        justifyContent="center"
        paddingX="20px"
        marginBottom="1rem"
        gap={isMobile ? 2 : 3}
      >
        <TextField
          label="Search Books, Authors, Publishers or ISBN"
          variant="outlined"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyPress}
          fullWidth
          InputProps={{
            endAdornment: (
              <>
                <IconButton onClick={handleSearch} style={{ padding: 10 }}>
                  <SearchIcon />
                </IconButton>
                <IconButton onClick={handleClearSearch} style={{ padding: 10 }}>
                  <ClearIcon />
                </IconButton>
              </>
            ),
          }}
          style={{
            maxWidth: "30rem",
            marginBottom: "1rem",
          }}
        />
        <TextField
          select
          label="Select Type"
          value={bookType}
          onChange={handleBookTypeChange}
          variant="outlined"
          fullWidth
          style={{
            maxWidth: "30rem",
            marginBottom: "1rem",
          }}
        >
          {bookTypes.length > 0 ? (
            bookTypes.map((type, index) => (
              <MenuItem key={index} value={type}>
                {type}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>Loading...</MenuItem>
          )}
        </TextField>
      </Box>

      {/* Books Display Section */}
      <Box mt={1}>
        {loading ? (
          <Box display="flex" justifyContent="center" mb={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} justifyContent="center">
              {getPaginatedBooks().map((book, index) => (
                <Grid item xs={12} sm={6} md={4} lg={4} key={index}>
                  <BookCard
                    book={book}
                    handleCartUpdate={handleCartUpdate}
                    setSnackbarMessage={setSnackbarMessage}
                    setOpenSnackbar={setOpenSnackbar}
                  />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            <Box display="flex" justifyContent="center" mt={1}>
              <Pagination
                count={Math.ceil(filteredBooks.length / booksPerPage)}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        )}

        {/* Most Borrowed Books Section (Horizontal Scroll with Snap) */}
        {!searched && !filteredBooks.length && (
          <>
            <Box textAlign="center" mb={3} mt={2}>
              <Typography variant="h4" gutterBottom color="primary">
                Recommended Books
              </Typography>
            </Box>
            <Box
              display="flex"
              justifyContent="center"
              overflow="auto"
              sx={{
                scrollSnapType: "x mandatory",
                gap: "1rem",
                paddingX: "1rem",
                width: "100%",
                paddingLeft: isMobile ? "400px" : "250px",
                paddingRight: "10px",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                scrollbarWidth: "none",
              }}
            >
              {mostBorrowedBooks.map((book, index) => (
                <Box
                  key={index}
                  sx={{
                    flexShrink: 0,
                    scrollSnapAlign: "center",
                  }}
                >
                  <BookCard
                    book={book}
                    handleCartUpdate={handleCartUpdate}
                    setSnackbarMessage={setSnackbarMessage}
                    setOpenSnackbar={setOpenSnackbar}
                  />
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Snackbar for Cart Updates */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default App;

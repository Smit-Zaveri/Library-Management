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
  Dialog,
  DialogTitle,
  Grid,
  Collapse,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { firestore, Timestamp } from "../services/firebase";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register necessary chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,  // Register PointElement for line charts
  LineElement,
  Title,
  Tooltip,
  Legend
);


const BookBorrow = () => {
  const [bookBorrow, SetbookBorrow] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredBooksBorrow, setFilteredBooksBorrow] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);

  // For chart data related to borrow date
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Books Borrowed by Date",
        data: [],
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderWidth: 2,
        fill: true,
      },
    ],
  });

  // For additional bar chart data (e.g., borrowed by department)
  const [departmentChartData, setDepartmentChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Books Borrowed by Department",
        data: [],
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const snapshot = await firestore.collection("book-borrow").get();
        const booksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort books by borrowDate (latest first)
        const sortedBooks = booksData.sort((a, b) => {
          return b.borrowDate.toDate() - a.borrowDate.toDate(); // Sorting in descending order
        });

        SetbookBorrow(sortedBooks);
        setFilteredBooksBorrow(sortedBooks);

        // Prepare chart data based on borrow date
        const borrowDateCount = {};
        const departmentCount = {};

        booksData.forEach((book) => {
          const borrowDate = book.borrowDate.toDate().toISOString().split('T')[0]; // Extracting the date (YYYY-MM-DD)
          borrowDateCount[borrowDate] = (borrowDateCount[borrowDate] || 0) + 1;

          const department = book.department || "Unknown";
          departmentCount[department] = (departmentCount[department] || 0) + 1;
        });

        // Set data for the line chart (borrow dates)
        setChartData((prevData) => ({
          ...prevData,
          labels: Object.keys(borrowDateCount),
          datasets: [
            {
              ...prevData.datasets[0],
              data: Object.values(borrowDateCount),
            },
          ],
        }));

        // Set data for the bar chart (department count)
        setDepartmentChartData((prevData) => ({
          ...prevData,
          labels: Object.keys(departmentCount),
          datasets: [
            {
              ...prevData.datasets[0],
              data: Object.values(departmentCount),
            },
          ],
        }));
      } catch (error) {
        console.error("Error fetching bookBorrow:", error);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    const searchTerm = searchInput.toLowerCase();
    const results = bookBorrow.filter((book) => {
      return Object.keys(book).some((key) => {
        const value = book[key];
        return (
          value !== undefined &&
          value !== null &&
          value.toString().toLowerCase().includes(searchTerm)
        );
      });
    });
    setFilteredBooksBorrow(results);
  }, [searchInput, bookBorrow]);

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
      timestamp instanceof Timestamp
        ? timestamp.toDate()
        : new Date(timestamp);
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

  const handleOpenDialog = (image) => {
    setSelectedImage(image);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedImage("");
  };

  const handleRowClick = (id) => {
    setExpandedRow(expandedRow === id ? null : id); // Toggle row expansion
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Book Borrowed
      </Typography>

      <Box mb={2}>
        <TextField
          label="Search"
          variant="outlined"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search by any field..."
          fullWidth
          InputProps={{
            sx: {
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              '&:hover': {
                boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
              },
            },
          }}
          sx={{
            maxWidth: 400,
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor: "#aaa",
              },
              "&:hover fieldset": {
                borderColor: "#2196f3",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#1976d2",
              },
            },
          }}
        />
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6}>
          {/* <Typography variant="h5" gutterBottom>
            Books Borrowed by Date (Bar Chart)
          </Typography> */}
          <Line data={chartData} options={{ responsive: true, animation: {
            onProgress: function(animation) {
                const progress = { value: 0 };
                progress.value = animation.currentStep / animation.numSteps;
            }
        } }} />

        </Grid>
        <Grid item xs={12} sm={6}>
          {/* <Typography variant="h5" gutterBottom>
            Books Borrowed (Line Chart)
          </Typography> */}
          <Bar data={departmentChartData} options={{ responsive: true }} />
        </Grid>
      </Grid>

      <TableContainer sx={{ border: "1px solid #ddd", borderRadius: "8px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="left">Title</TableCell>
              <TableCell align="left">Branch</TableCell>
              <TableCell align="left">Department</TableCell>
              <TableCell align="left">Email</TableCell>
              <TableCell align="left">USN</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBooksBorrow
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((book) => {
                const isExpanded = expandedRow === book.id;
                return (
                  <>
                    <TableRow
                      key={book.id}
                      onClick={() => handleRowClick(book.id)}
                      sx={{
                        cursor: "pointer",
                      }}
                    >
                      <TableCell align="left">{book.bookTitle}</TableCell>
                      <TableCell align="left">{book.branch}</TableCell>
                      <TableCell align="left">{book.department}</TableCell>
                      <TableCell align="left">{book.email}</TableCell>
                      <TableCell align="left">{book.usn}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={10} sx={{ padding: 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ padding: 2 }}>
                            <Typography variant="h6">Additional Details</Typography>
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell align="left">Borrower Details:</TableCell>
                                  <TableCell align="left">{book.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell align="left">Borrow Date:</TableCell>
                                  <TableCell align="left">{formatDate(book.borrowDate)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell align="left">Return Date:</TableCell>
                                  <TableCell align="left">{formatDate(book.returnDate)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell align="left">User Status:</TableCell>
                                  <TableCell align="left">{book.userStatus}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell align="left">Photo:</TableCell>
                                  <TableCell align="left">
                                    {book.photo ? (
                                      <Button
                                        variant="contained"
                                        onClick={() => handleOpenDialog(book.photo)}
                                      >
                                        View
                                      </Button>
                                    ) : (
                                      "No Photo"
                                    )}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredBooksBorrow.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 20]}
        sx={{ marginTop: 2 }}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Return Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <img
              src={selectedImage}
              alt="Return"
              style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default BookBorrow;

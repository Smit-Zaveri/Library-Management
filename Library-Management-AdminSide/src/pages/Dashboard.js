import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Container,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import GroupIcon from "@mui/icons-material/Group";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const Dashboard = () => {
  const [totalBooks, setTotalBooks] = useState(0); // State for total books
  const [totalBooksIssuedToday, setTotalBooksIssuedToday] = useState({
    issued: 0, // Books issued today
    borrowed: 0, // Books borrowed today
  });
  const [totalVisitorsToday, setTotalVisitorsToday] = useState(0); // Visitors today
  const [users, setUsers] = useState([]); // Users for "User of the Week"
  const [page, setPage] = useState(0); // Current page
  const [rowsPerPage, setRowsPerPage] = useState(5); // Rows per page
  const [userNames, setUserNames] = useState({}); // Store user names by email
  const [totalUsers, setTotalUsers] = useState(0); // Total number of users

  const db = getFirestore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]; // Get today's date (YYYY-MM-DD)

        // Fetch books collection
        const bookCollection = collection(db, "books");
        const bookSnapshot = await getDocs(bookCollection);
        setTotalBooks(bookSnapshot.size);

        // Fetch book-issues collection
        const issueCollection = collection(db, "book-issues");
        const issueSnapshot = await getDocs(issueCollection);
        let booksIssuedToday = 0;
        let booksBorrowedToday = 0;

        // Count books issued and borrowed today
        issueSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          const inTime = data.inTime?.toDate(); // Convert Firestore timestamp to JavaScript Date

          if (inTime && inTime.toISOString().split("T")[0] === today) {
            if (data.userStatus === "Reading") {
              booksIssuedToday += 1; // Increment issued books count
            }
            if (data.userStatus === "Borrowed") {
              booksBorrowedToday += 1; // Increment borrowed books count
            }
          }
        });

        setTotalBooksIssuedToday({
          issued: booksIssuedToday,
          borrowed: booksBorrowedToday,
        });

        // Fetch entry-log collection (Visitors today)
        const entryLogCollection = collection(db, "entry-log");
        const entryLogSnapshot = await getDocs(entryLogCollection);
        const visitorsToday = entryLogSnapshot.docs.filter((doc) => {
          const data = doc.data();
          const inTime = data.inTime?.toDate(); // Convert Firestore timestamp to JavaScript Date
          return inTime && inTime.toISOString().split("T")[0] === today;
        }).length;
        setTotalVisitorsToday(visitorsToday);

        const currentDate = new Date();
        const startOfWeek = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay())
        ); // Get the start of the current week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0); // Set time to 00:00:00 for comparison

        // Fetch book-borrow collection
        const bookBorrowCollection = collection(db, "book-borrow");
        const borrowSnapshot = await getDocs(bookBorrowCollection);

        // Initialize a user activity map
        let userActivity = {};

        // Process book-issue data (track issued books)
        issueSnapshot.forEach((doc) => {
          const data = doc.data();
          const inTime = data.inTime?.toDate(); // Convert Firestore timestamp to JavaScript Date
          const userId = data.email;

          if (inTime && inTime >= startOfWeek) {
            // Check if the issued book is within the current week
            userActivity[userId] = userActivity[userId] || {
              issued: 0,
              borrowed: 0,
            };
            userActivity[userId].issued += 1; // Increment issued book count
          }
        });

        // Process book-borrow data (track borrowed books)
        borrowSnapshot.forEach((doc) => {
          const data = doc.data();
          const inTime = data.inTime?.toDate(); // Convert Firestore timestamp to JavaScript Date
          const userId = data.email;

          if (inTime && inTime >= startOfWeek) {
            // Check if the borrowed book is within the current week
            userActivity[userId] = userActivity[userId] || {
              issued: 0,
              borrowed: 0,
            };
            userActivity[userId].borrowed += 1; // Increment borrowed book count
          }
        });

        // Convert the userActivity map to an array of users with their counts
        const usersWithActivity = Object.keys(userActivity).map((userId) => ({
          userId,
          ...userActivity[userId],
        }));

        // Sort the users based on the total books issued + borrowed
        usersWithActivity.sort(
          (a, b) => b.issued + b.borrowed - (a.issued + a.borrowed)
        );

        // Get top 5 users
        const topUsers = usersWithActivity.slice(0, 5);

        setUsers(topUsers);
        setTotalUsers(usersWithActivity.length);

        // Fetch student names from the students collection
        const studentCollection = collection(db, "students");
        const studentSnapshot = await getDocs(studentCollection);

        const nameMap = {};
        studentSnapshot.docs.forEach((doc) => {
          const student = doc.data();
          nameMap[student.email] = student.name; // Map email to student name
        });

        setUserNames(nameMap); // Set the user names in state
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [db]);

  // Handle pagination
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ padding: { xs: 2, sm: 4 } }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ textAlign: "center", fontWeight: "bold" }}
      >
        📚 Dashboard
      </Typography>
      <Grid container spacing={4}>
        {/* Total Books */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={4}
            sx={{
              padding: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "16px",
              background: "linear-gradient(45deg, #2196F3, #21CBF3)",
              color: "#fff",
              height: "100%",
            }}
          >
            <MenuBookIcon sx={{ fontSize: 50 }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle1" color="inherit">
                Total Books
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalBooks}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Books Issued and Borrowed Today */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={4}
            sx={{
              padding: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "16px",
              background: "linear-gradient(45deg, #4CAF50, #81C784)",
              color: "#fff",
              height: "100%",
            }}
          >
            <GroupIcon sx={{ fontSize: 50 }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle1" color="inherit">
                Books Issued / Borrowed Today
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalBooksIssuedToday.issued + totalBooksIssuedToday.borrowed}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Visitors Today */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={4}
            sx={{
              padding: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "16px",
              background: "linear-gradient(45deg, #9C27B0, #E1BEE7)",
              color: "#fff",
              height: "100%",
            }}
          >
            <PlaylistAddCheckIcon sx={{ fontSize: 50 }} />
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="subtitle1" color="inherit">
                Visitors Today
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {totalVisitorsToday}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* User of the Week Table */}
      <Container maxWidth="lg" sx={{ marginTop: 5 }}>
        <Typography variant="h5" sx={{ fontWeight: "bold", marginBottom: 2 }}>
          🌟 User's of the Week
        </Typography>
        <TableContainer
          component={Paper}
          elevation={3}
          sx={{ borderRadius: "12px" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Name
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Email
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Books Borrowed
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold" }}>
                  Books Issued
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? (
                users
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user, index) => (
                    <TableRow key={index}>
                      <TableCell align="center">
                        {userNames[user.userId] || user.userId}
                      </TableCell>
                      <TableCell align="center">{user.userId}</TableCell>
                      <TableCell align="center">{user.borrowed}</TableCell>
                      <TableCell align="center">{user.issued}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell align="center" colSpan={4}>
                    <Typography variant="body2" color="textSecondary">
                      No data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[5, 10, 20]}
            count={totalUsers} // Use the totalUsers state for the count
            sx={{ marginTop: 2 }}
          />
        </TableContainer>
      </Container>
    </Box>
  );
};

export default Dashboard;

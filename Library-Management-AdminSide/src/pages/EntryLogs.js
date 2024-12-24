import {
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { firestore } from "../services/firebase";

const EntryLogs = () => {
  const [entryLogs, setEntryLogs] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredEntryLogs, setFilteredEntryLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const snapshot = await firestore.collection("entry-log").get();
        const logsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort the logs by 'inTime' field in descending order (recent log first)
        const sortedLogs = logsData.sort((a, b) => {
          const dateA = a.inTime?.toDate();
          const dateB = b.inTime?.toDate();
          return dateB - dateA; // Sort descending (most recent first)
        });

        setEntryLogs(sortedLogs);
        setFilteredEntryLogs(sortedLogs);
      } catch (error) {
        console.error("Error fetching entry logs:", error);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const searchTerm = searchInput.toLowerCase();
    const results = entryLogs.filter((log) =>
      log.name.toLowerCase().includes(searchTerm)
    );
    setFilteredEntryLogs(results);
  }, [searchInput, entryLogs]);

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

  // Function to parse and format the custom date string
  const parseDate = (date) => {
    if (date && date.toDate) {
      return date.toDate(); // Firestore Timestamp, convert it
    }
    if (typeof date === "string") {
      return new Date(date); // If it's a string, create a Date object
    }
    return new Date();
  };

  const formatDate = (timestamp) => {
    const date = parseDate(timestamp);
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

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Entry Logs
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          label="Search by Name"
          variant="outlined"
          value={searchInput}
          onChange={handleSearchChange}
          fullWidth
          sx={{ maxWidth: 300 }}
        />
      </Box>
      <TableContainer sx={{ border: "1px solid #ddd", borderRadius: "8px" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="left">Name</TableCell>
              <TableCell align="left">USN</TableCell>
              <TableCell align="left">In Time</TableCell>
              <TableCell align="left">Out Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEntryLogs
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((log) => {
                return (
                  <TableRow key={log.id}>
                    <TableCell align="left">{log.name}</TableCell>
                    <TableCell align="left">{log.usn}</TableCell>
                    <TableCell align="left">{formatDate(log.inTime)}</TableCell>
                    <TableCell align="left">{formatDate(log.outTime)}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredEntryLogs.length}
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

export default EntryLogs;

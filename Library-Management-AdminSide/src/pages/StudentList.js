import {
  Box,
  Button,
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
  Checkbox,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import { firestore } from "../services/firebase";
import { useNavigate } from "react-router-dom";

const StudentList = () => {
  const theme = useTheme();
  const [students, setStudents] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filterStudents, setFilterStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snapshot = await firestore.collection("students").get();
        const studentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(studentData);
        setFilterStudents(studentData);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const searchTerm = searchInput.toLowerCase();
    const results = students.filter(
      (student) =>
        student.email?.toLowerCase().includes(searchTerm) ||
        student.name?.toLowerCase().includes(searchTerm) ||
        student.usn?.includes(searchTerm)
    );
    setFilterStudents(results);
  }, [searchInput, students]);

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

  const handleAddNewStudent = () => {
    navigate("/add-student");
  };

  const handleUploadStudents = () => {
    navigate("/add-student-csv");
  };

  const handleEditStudent = (id) => {
    navigate(`/edit-student/${id}`);
  };

  const handleDeleteDialogOpen = () => {
    setOpenDialog(true);
  };

  const handleDeleteDialogClose = () => {
    setOpenDialog(false);
  };

  const handleDeleteStudents = async () => {
    try {
      const batch = firestore.batch();
      selectedStudents.forEach((id) => {
        const docRef = firestore.collection("students").doc(id);
        batch.delete(docRef);
      });
      await batch.commit();
      setStudents((prev) =>
        prev.filter((student) => !selectedStudents.includes(student.id))
      );
      setFilterStudents((prev) =>
        prev.filter((student) => !selectedStudents.includes(student.id))
      );
      setSelectedStudents([]);
    } catch (error) {
      console.error("Error deleting students:", error);
    } finally {
      handleDeleteDialogClose();
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filterStudents.map((student) => student.id);
      setSelectedStudents(allIds);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleExport = () => {
    const csvData = filterStudents.map((student) => ({
      Name: student.name?.trim(),
      Email: student.email?.trim(),
      Password: student.password?.trim(),
      USN: student.usn?.trim(),
      Batch: student.batch?.trim(),
      Department: student.department?.trim(),
      Branch: student.branch?.trim(),
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "students.csv");
    link.click();
  };

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4, padding: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", marginBottom: 3 }}>
        Students List
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          label="Search Students"
          variant="outlined"
          value={searchInput}
          onChange={handleSearchChange}
          fullWidth
          sx={{
            maxWidth: 400,
            backgroundColor: theme.palette.background.paper,
            borderRadius: "8px",
          }}
        />
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddNewStudent}
            sx={{ marginRight: 1, borderRadius: "8px" }}
          >
            Add Students
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleUploadStudents}
            sx={{ marginRight: 1, borderRadius: "8px" }}
          >
            Upload via CSV
          </Button>
          <Button
            variant="outlined"
            color="info"
            onClick={handleExport}
            sx={{ marginRight: 1, borderRadius: "8px" }}
          >
            Export CSV
          </Button>
          {selectedStudents.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleDeleteDialogOpen}
              sx={{ borderRadius: "8px"}}
            >
              Delete Selected
            </Button>
          )}
        </Box>
      </Box>
      <TableContainer
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: "8px",
          marginTop: 2,
        }}
      >
        <Table>
          <TableHead sx={{ backgroundColor: theme.palette.action.hover }}>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  onChange={handleSelectAll}
                  checked={selectedStudents.length === filterStudents.length}
                  indeterminate={
                    selectedStudents.length > 0 &&
                    selectedStudents.length < filterStudents.length
                  }
                />
              </TableCell>
              <TableCell align="left" >
                Name
              </TableCell>
              <TableCell align="left" >
                Email
              </TableCell>
              <TableCell align="left" >
                USN
              </TableCell>
              <TableCell align="left" >
                Department
              </TableCell>
              <TableCell align="left" >
                Branch
              </TableCell>
              <TableCell align="center" >
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filterStudents
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((student) => (
                <TableRow
                  key={student.id}
                  sx={{
                    "&:hover": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleToggleSelect(student.id)}
                    />
                  </TableCell>
                  <TableCell align="left">{student.name}</TableCell>
                  <TableCell align="left">{student.email}</TableCell>
                  <TableCell align="left">{student.usn}</TableCell>
                  <TableCell align="left">{student.department}</TableCell>
                  <TableCell align="left">{student.branch}</TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => handleEditStudent(student.id)}
                      sx={{ marginRight: 1, borderRadius: "8px" }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={filterStudents.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 20]}
        sx={{ marginTop: 2 }}
      />

      <Dialog
        open={openDialog}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle id="delete-dialog-title" >Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the selected students? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="secondary" >
            Cancel
          </Button>
          <Button onClick={handleDeleteStudents} color="error" >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentList;

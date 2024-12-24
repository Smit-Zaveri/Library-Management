import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Snackbar,
  TextField,
  Typography,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate, useParams } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/firestore";
import React, { useEffect, useState } from "react";
import { firestore } from "../services/firebase"; // Replace with your Firebase configuration
import AddIcon from '@mui/icons-material/Add'; // Add icon for actions

const BookForm = () => {
  const { id } = useParams(); // Retrieve book ID from URL if updating
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");
  const [publisher, setPublisher] = useState("");
  const [tags, setTags] = useState("");
  const [code, setCode] = useState("");
  const [ISBN, setIsbn] = useState("");
  const [bookavailable, setBookavailable] = useState("");
  const [Book_shelf, setBook_shelf] = useState("");
  const [category, setCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [authorOptions, setAuthorOptions] = useState([]);  
  const [publisherOptions, setPublisherOptions] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [typeList, setTypeList] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openDialog, setOpenDialog] = useState(false); // for confirmation dialog
  const [newAuthor, setNewAuthor] = useState(""); // store new artist name
  const [newCategory, setNewCategory] = useState(""); // Store the new category name
  const [newType, setNewType] = useState(""); // For new type

  // Fetch options and book details on component mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const authorsSnapshot = await firestore.collection("authors").get();       
        const publishersSnapshot = await firestore.collection("publishers").get();
        const categoriesSnapshot = await firestore.collection("categories").get();
        const typesSnapshot = await firestore.collection("types").get();

        setAuthorOptions(authorsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setPublisherOptions(publishersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setCategoryList(categoriesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setTypeList(typesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching options:", err);
      }
    };

    const fetchBookDetails = async () => {
      if (id) {
        try {
          const doc = await firestore.collection("books").doc(id).get();
          if (doc.exists) {
            const data = doc.data();
            setTitle(data.title || "");
            setAuthor(data.author || "");
            setUrl(data.url || "");
            setPublisher(data.publisher || "");
            setTags(data.tags?.join(", ") || "");
            setCode(data.code || "");
            setIsbn(data.ISBN || "");
            setBookavailable(data.bookavailable || "");
            setBook_shelf(data.Book_shelf || "");
            setCategory(data.categories || "");
            setSelectedType(data.type || "");
          }
        } catch (err) {
          console.error("Error fetching book details:", err);
        }
      }
    };

    fetchOptions();
    fetchBookDetails();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!title || !category) {
      setError("Please fill in all required fields.");
      setOpenSnackbar(true);
      return;
    }

    try {
      const tagsArray = tags.split(",").map((tag) => tag.trim().toLowerCase());
      const bookData = {
        title,
        author,
        url,
        publisher,
        tags: tagsArray,
        code,
        ISBN,
        bookavailable,
        Book_shelf,
        categories: category,
        type: selectedType,
        updatedAt: firebase.firestore.Timestamp.now(),
      };

      if (id) {
        // Update book
        await firestore.collection("books").doc(id).update(bookData);
        setSuccessMessage("Book updated successfully!");
      } else {
        // Add new book
        bookData.createdAt = firebase.firestore.Timestamp.now();
        await firestore.collection("books").add(bookData);
        setSuccessMessage("Book added successfully!");
      }

      setOpenSnackbar(true);
      navigate("/books"); // Redirect to books list after submission
    } catch (err) {
      console.error("Error submitting form:", err);
      setError("Failed to submit the form.");
      setOpenSnackbar(true);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
    setError("");
    setSuccessMessage("");
  };

  const handleAutherInputBlur = () => {
    if (author && !authorOptions.some((option) => option.name === author)) {
      setNewAuthor(author);
      setOpenDialog(true); // Open confirmation dialog
    }
  };

  const handleCategoryInputBlur = () => {
    if (category && !categoryList.some((option) => option.name === category)) {
      setNewCategory(category); // Store the category name
      setOpenDialog(true); // Open confirmation dialog
    }
  };

  const handleTypeInputBlur = () => {
    if (selectedType && !typeList.some((option) => option.name === selectedType)) {
      setNewType(selectedType); // Store the type name
      setOpenDialog(true); // Open confirmation dialog
    }
  };

  const handleConfirmNewAuther = () => {
    setOpenDialog(false);
    navigate(`/author-form`, { state: { name: newAuthor } }); // Redirect to Author Form
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 900, mx: "auto", p: 2 }}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {id ? "Edit Book" : "Add New Book"}
          </Typography>
          
          <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
            <Alert onClose={handleCloseSnackbar} severity={error ? "error" : "success"} sx={{ width: "100%" }}>
              {error || successMessage}
            </Alert>
          </Snackbar>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Title"
                variant="outlined"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={authorOptions.map((option) => option.name)}
                value={author}
                onInputChange={(e, value) => setAuthor(value)}
                onBlur={handleAutherInputBlur}
                renderInput={(params) => (
                  <TextField {...params} label="Author" variant="outlined" fullWidth value={author} onChange={(e) => setAuthor(e.target.value)} required />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={publisherOptions.map((option) => option.name)}
                value={publisher}
                onInputChange={(e, value) => setPublisher(value)}
                renderInput={(params) => <TextField {...params} label="Publisher" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="ISBN"
                variant="outlined"
                fullWidth
                value={ISBN}
                onChange={(e) => setIsbn(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tags (comma-separated)"
                variant="outlined"
                fullWidth
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Code"
                variant="outlined"
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Book Shelf"
                variant="outlined"
                fullWidth
                value={Book_shelf}
                onChange={(e) => setBook_shelf(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Available Books"
                variant="outlined"
                fullWidth
                value={bookavailable}
                onChange={(e) => setBookavailable(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={categoryList.map((option) => option.name)}
                value={category}
                onInputChange={(e, value) => setCategory(value)}
                onBlur={handleCategoryInputBlur}
                renderInput={(params) => <TextField {...params} label="Category" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                freeSolo
                options={typeList.map((option) => option.name)}
                value={selectedType}
                onInputChange={(e, value) => setSelectedType(value)}
                onBlur={handleTypeInputBlur}
                renderInput={(params) => <TextField {...params} label="Type" variant="outlined" />}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Image URL"
                variant="outlined"
                fullWidth
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, textAlign: "right" }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              startIcon={<AddIcon />}
              sx={{ fontSize: 16 }}
            >
              {id ? "Update Book" : "Add Book"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Do you want to add a new entry for {newAuthor || newCategory || newType}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">Cancel</Button>
          <Button onClick={handleConfirmNewAuther} color="primary">Yes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BookForm;

import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  CardMedia,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  CheckCircle as CheckCircleIcon,
  RemoveShoppingCart as RemoveShoppingCartIcon,
} from "@mui/icons-material";

const BookCard = ({
  book,
  handleCartUpdate,
  setSnackbarMessage,
  setOpenSnackbar,
}) => {
  // Add Book To cart
  const handleAddToCart = (book) => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const isBookInCart = existingCart.some((item) => item.ISBN === book.ISBN);
    if (isBookInCart) {
      setSnackbarMessage(`${book.title} is already in your cart.`);
      setOpenSnackbar(true);
      return;
    } else {
      existingCart.push(book);
      localStorage.setItem("cart", JSON.stringify(existingCart));
      setSnackbarMessage(`${book.title} added to cart!`);
      setOpenSnackbar(true);
    }
    handleCartUpdate();
  };

  // Remove Book from cart
  const handleRemoveFromCart = (book) => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    const updatedCart = existingCart.filter((item) => item.ISBN !== book.ISBN);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    setSnackbarMessage(`${book.title} removed from cart.`);
    setOpenSnackbar(true);
    handleCartUpdate();
  };

  // Check if book is already in cart
  const isBookInCart = (book) => {
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    return existingCart.some((item) => item.ISBN === book.ISBN);
  };

  // Disable Add to Cart button if the book is out of stock
  const isOutOfStock = book.bookavailable <= 0; // Check availability count

  return (
    <Card
      variant="outlined"
      style={{
        marginBottom: "1.5rem",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        overflow: "hidden",
        height: "auto",
        border: "2px solid gray",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "1rem",
          width: "100%",
        }}
      >
        <CardMedia
          component="img"
          alt={book.title}
          image={book.url || "https://via.placeholder.com/200"}
          style={{
            height: "200px",
            width: "150px",
            objectFit: "contain",
            borderRadius: "8px",
            marginRight: "1rem",
          }}
        />
        <CardContent style={{ padding: "0.5rem" }}>
          <Typography
            variant="h6"
            color="primary"
            gutterBottom
            style={{
              fontFamily: "Oswald",
              fontWeight: "bold",
              fontStyle: "italic",
              fontSize: "1.2rem",
              marginBottom: "0.5rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "180px",
            }}
          >
            {book.title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Author:</strong> {book.author || "N/A"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Publisher:</strong> {book.publisher || "N/A"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Type:</strong> {book.type || "N/A"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>ISBN:</strong> {book.ISBN || "N/A"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <strong>Available:</strong> {book.bookavailable || "0"}
          </Typography>
        </CardContent>
      </div>

      {isBookInCart(book) ? (
        <Box display="flex" justifyContent="space-between" flexDirection="row">
          <Typography
            variant="body2"
            color="success.main"
            style={{
              marginBottom: "10px",
              textAlign: "center",
              fontSize: "1rem",
              display: "flex",
              alignItems: "center",
              paddingRight: "20px",
            }}
          >
            <CheckCircleIcon style={{ marginRight: "5px", fontSize: "20px" }} />
            Added to Cart
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => handleRemoveFromCart(book)}
            style={{
              fontSize: "14px",
              height: "auto",
              marginBottom: "10px",
              padding: "0.7rem",
              borderRadius: "8px",
              fontWeight: "bold",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <RemoveShoppingCartIcon />
          </Button>
        </Box>
      ) : (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleAddToCart(book)}
          disabled={isOutOfStock} // Disable button if out of stock
          style={{
            width: "95%",
            fontSize: "14px",
            height: "auto",
            marginBottom: "10px",
            padding: "0.7rem",
            borderRadius: "8px",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <ShoppingCartIcon style={{ marginRight: "8px" }} />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      )}
    </Card>
  );
};

export default BookCard;

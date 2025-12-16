import app from "./app";

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`catalog-svc running on http://localhost:${PORT}`);
});

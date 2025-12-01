import { app } from "./app";

const PORT = process.env.PORT || 4002;

app.listen(PORT, () =>
  console.log(`reservation-svc running at http://localhost:${PORT}`)
);

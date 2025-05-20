import { CircularProgress, Box } from "@mui/material";

function Loading() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress size={60} thickness={5} />
    </Box>
  );
}

export default Loading;

'use client';

import { Alert, AlertColor, Slide, SlideProps, Snackbar } from '@mui/material';
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hideToast } from '@/store/slices/toastSlice';

const SlideTransition = React.forwardRef(function Transition(
  props: SlideProps,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="right" ref={ref} {...props} />;
});

export default function Toast() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((state) => state.toast.open);
  const message = useAppSelector((state) => state.toast.message);
  const severity = useAppSelector((state) => state.toast.severity);

  const handleClose = () => {
    dispatch(hideToast());
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      TransitionComponent={SlideTransition}
    >
      <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}


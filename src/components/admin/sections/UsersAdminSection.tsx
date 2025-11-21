'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import { useAdminUsers } from '@/hooks/admin';
import { formatJoinedDate } from '@/utils/timeUtils';
import Link from 'next/link';

export function UsersAdminSection() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const { users, pagination, isLoading, error, setOptions, promote, demote, remove, refetch } = useAdminUsers({
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    setOptions(opts => ({
      ...opts,
      page,
      query: query.trim() || undefined,
      role: roleFilter === 'all' ? undefined : roleFilter,
    }));
  }, [page, query, roleFilter, setOptions]);

  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.max(1, Math.ceil(pagination.total / pagination.limit));
  }, [pagination]);

  const handleDelete = async () => {
    if (!confirmDeleteUserId) return;
    await remove(confirmDeleteUserId);
    setConfirmDeleteUserId(null);
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <SupervisorAccountIcon color="primary" />
          <Typography variant="h5" fontWeight={600}>
            User Management
          </Typography>
          {pagination && (
            <Chip
              label={`${pagination.total.toLocaleString()} users`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
        <Button variant="outlined" onClick={() => refetch()} disabled={isLoading}>
          Refresh
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or email"
            value={query}
            onChange={event => {
              setQuery(event.target.value);
              setPage(1);
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.disabled' }} />,
            }}
          />
          <Select
            size="small"
            value={roleFilter}
            onChange={event => {
              setRoleFilter(event.target.value as 'all' | 'admin' | 'user');
              setPage(1);
            }}
            sx={{ minWidth: { xs: '100%', md: 160 } }}
          >
            <MenuItem value="all">All roles</MenuItem>
            <MenuItem value="admin">Admins</MenuItem>
            <MenuItem value="user">Standard users</MenuItem>
          </Select>
        </Stack>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ border: (theme: Theme) => `1px dashed ${theme.palette.error.main}`, borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(user => (
                <TableRow key={user._id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={user.photoUrl} alt={user.name} />
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          <Link href={`/profile/${user._id}`} style={{ textDecoration: 'none' }}>
                            {user.name || 'Unknown user'}
                          </Link>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {user._id}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      variant="outlined"
                      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{formatJoinedDate(user.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {user.role !== 'admin' ? (
                        <Tooltip title="Promote to admin">
                          <IconButton color="primary" onClick={() => promote(user._id)}>
                            <AdminPanelSettingsIcon />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Remove admin privileges">
                          <IconButton color="warning" onClick={() => demote(user._id)}>
                            <PersonOffIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete user">
                        <IconButton color="error" onClick={() => setConfirmDeleteUserId(user._id)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {users.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No users match your filters.
              </Typography>
            </Box>
          )}
        </TableContainer>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_e, value) => setPage(value)} color="primary" />
        </Box>
      )}

      <Dialog open={Boolean(confirmDeleteUserId)} onClose={() => setConfirmDeleteUserId(null)}>
        <DialogTitle>Delete user?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action will permanently delete the user and anonymize their content. Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteUserId(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}



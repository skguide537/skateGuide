import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout, setUser } from '@/store/slices/authSlice';
import type { User } from '@/store/slices/authSlice';

export function useUser() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  const handleSetUser = (newUser: User | null) => {
    dispatch(setUser(newUser));
  };

  const handleLogout = async () => {
    await dispatch(logout());
  };

  return {
    user,
    setUser: handleSetUser,
    logout: handleLogout,
    isLoading,
  };
}


import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '@/context/UserContext';

// Mock fetch to prevent actual API calls
global.fetch = jest.fn();

describe('UserContext - Critical State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock auth check to return no user initially (401 response)
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Not authenticated' })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Context Provider (Critical)', () => {
    it('should provide user context to children', async () => {
      const TestComponent = () => {
        const { user } = useUser();
        return <div>User: {user?.name || 'No user'}</div>;
      };

      await act(async () => {
        render(
          <UserProvider>
            <TestComponent />
          </UserProvider>
        );
      });

      // Wait for the async operations to complete
      await waitFor(() => {
        expect(screen.getByText('User: No user')).toBeInTheDocument();
      });
    });

    it('should allow setting user', async () => {
      const TestComponent = () => {
        const { user, setUser } = useUser();
        return (
          <div>
            <span>User: {user?.name || 'No user'}</span>
            <button onClick={() => setUser({ _id: '123', name: 'Test User', email: 'test@example.com' })}>
              Set User
            </button>
          </div>
        );
      };

      await act(async () => {
        render(
          <UserProvider>
            <TestComponent />
          </UserProvider>
        );
      });

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByText('User: No user')).toBeInTheDocument();
      });
      
      await act(async () => {
        fireEvent.click(screen.getByText('Set User'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('User: Test User')).toBeInTheDocument();
      });
    });
  });

  describe('User State Management (Critical)', () => {
    it('should maintain user state across component updates', async () => {
      const TestComponent = () => {
        const { user, setUser } = useUser();
        const [count, setCount] = React.useState(0);
        
        return (
          <div>
            <span>User: {user?.name || 'No user'}</span>
            <span>Count: {count}</span>
            <button onClick={() => setCount(count + 1)}>Increment</button>
            <button onClick={() => setUser({ _id: '123', name: 'Test User', email: 'test@example.com' })}>
              Set User
            </button>
          </div>
        );
      };

      await act(async () => {
        render(
          <UserProvider>
            <TestComponent />
          </UserProvider>
        );
      });

      // Set user first
      await act(async () => {
        fireEvent.click(screen.getByText('Set User'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('User: Test User')).toBeInTheDocument();
      });
      
      // Update count - user should persist
      await act(async () => {
        fireEvent.click(screen.getByText('Increment'));
      });
      
      await waitFor(() => {
        expect(screen.getByText('Count: 1')).toBeInTheDocument();
        expect(screen.getByText('User: Test User')).toBeInTheDocument();
      });
    });
  });

  describe('Context Initialization (Critical)', () => {
    it('should initialize with no user', async () => {
      const TestComponent = () => {
        const { user } = useUser();
        return <div>User: {user ? 'Logged in' : 'Not logged in'}</div>;
      };

      await act(async () => {
        render(
          <UserProvider>
            <TestComponent />
          </UserProvider>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('User: Not logged in')).toBeInTheDocument();
      });
    });
  });
});

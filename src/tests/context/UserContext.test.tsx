import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UserProvider, useUser } from '@/context/UserContext';

describe('UserContext - Critical State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Context Provider (Critical)', () => {
    it('should provide user context to children', () => {
      const TestComponent = () => {
        const { user } = useUser();
        return <div>User: {user?.name || 'No user'}</div>;
      };

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      expect(screen.getByText('User: No user')).toBeInTheDocument();
    });

    it('should allow setting user', () => {
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

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      expect(screen.getByText('User: No user')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Set User'));
      
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
    });
  });

  describe('User State Management (Critical)', () => {
    it('should maintain user state across component updates', () => {
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

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      // Set user first
      fireEvent.click(screen.getByText('Set User'));
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
      
      // Update count - user should persist
      fireEvent.click(screen.getByText('Increment'));
      expect(screen.getByText('Count: 1')).toBeInTheDocument();
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
    });
  });

  describe('Context Initialization (Critical)', () => {
    it('should initialize with no user', () => {
      const TestComponent = () => {
        const { user } = useUser();
        return <div>User: {user ? 'Logged in' : 'Not logged in'}</div>;
      };

      render(
        <UserProvider>
          <TestComponent />
        </UserProvider>
      );

      expect(screen.getByText('User: Not logged in')).toBeInTheDocument();
    });
  });
});

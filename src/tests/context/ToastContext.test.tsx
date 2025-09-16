import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '@/context/ToastContext';

describe('ToastContext - Critical User Feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Toast Display (Critical)', () => {
    it('should show toast messages', () => {
      const TestComponent = () => {
        const { showToast } = useToast();
        return (
          <button onClick={() => showToast('Test message', 'success')}>
            Show Toast
          </button>
        );
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Toast'));
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should show different toast types', () => {
      const TestComponent = () => {
        const { showToast } = useToast();
        return (
          <div>
            <button onClick={() => showToast('Success message', 'success')}>
              Show Success
            </button>
            <button onClick={() => showToast('Error message', 'error')}>
              Show Error
            </button>
            <button onClick={() => showToast('Info message', 'info')}>
              Show Info
            </button>
          </div>
        );
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      // Test success toast
      fireEvent.click(screen.getByText('Show Success'));
      expect(screen.getByText('Success message')).toBeInTheDocument();
      
      // Test error toast
      fireEvent.click(screen.getByText('Show Error'));
      expect(screen.getByText('Error message')).toBeInTheDocument();
      
      // Test info toast
      fireEvent.click(screen.getByText('Show Info'));
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });
  });

  describe('Toast Context Provider (Critical)', () => {
    it('should provide toast context to children', () => {
      const TestComponent = () => {
        const { showToast } = useToast();
        return (
          <div>
            <span>Toast function available: {typeof showToast === 'function' ? 'Yes' : 'No'}</span>
            <button onClick={() => showToast('Test', 'success')}>Test Toast</button>
          </div>
        );
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText('Toast function available: Yes')).toBeInTheDocument();
    });
  });

  describe('Toast Functionality (Critical)', () => {
    it('should allow multiple toasts', () => {
      const TestComponent = () => {
        const { showToast } = useToast();
        return (
          <button onClick={() => {
            showToast('First message', 'success');
            showToast('Second message', 'error');
          }}>
            Show Multiple Toasts
          </button>
        );
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Multiple Toasts'));
      
      // Material-UI only shows one toast at a time, so we check for the last one shown
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });

    it('should handle toast with different message types', () => {
      const TestComponent = () => {
        const { showToast } = useToast();
        return (
          <button onClick={() => showToast('Complex message with numbers: 123', 'warning')}>
            Show Complex Toast
          </button>
        );
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      fireEvent.click(screen.getByText('Show Complex Toast'));
      expect(screen.getByText('Complex message with numbers: 123')).toBeInTheDocument();
    });
  });

  describe('Toast Context Initialization (Critical)', () => {
    it('should initialize with working toast function', () => {
      const TestComponent = () => {
        const { showToast } = useToast();
        return (
          <div>
            <span>Toast available: {typeof showToast === 'function' ? 'Yes' : 'No'}</span>
            <button onClick={() => showToast('Initialization test', 'success')}>
              Test Initialization
            </button>
          </div>
        );
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText('Toast available: Yes')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Test Initialization'));
      expect(screen.getByText('Initialization test')).toBeInTheDocument();
    });
  });
});

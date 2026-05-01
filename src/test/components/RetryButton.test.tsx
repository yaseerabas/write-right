import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetryButton } from '@/components/RetryButton';

describe('RetryButton', () => {
  it('should render with default text', () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should render custom text when provided', () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry}>Custom Retry Text</RetryButton>);
    
    expect(screen.getByText('Custom Retry Text')).toBeInTheDocument();
  });

  it('should call onRetry when clicked', () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should show loading state when isRetrying is true', () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} isRetrying={true} />);
    
    expect(screen.getByText('Retrying...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when isRetrying is true', () => {
    const onRetry = vi.fn();
    render(<RetryButton onRetry={onRetry} isRetrying={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
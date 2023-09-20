import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the component', () => {
    render(<App />);
    expect(screen.getByText(/Upload Your File!/i)).toBeInTheDocument();
  });

  it('displays an error when no file is selected', () => {
    render(<App />);
    const uploadButton = screen.getByTestId('upload-button');
    fireEvent.click(uploadButton);
    expect(screen.getByText(/Please select a file/i)).toBeInTheDocument();
  });

  it('displays an error when the file size exceeds the limit', () => {
    render(<App />);
    const fileInput = screen.getByTestId('file-input');
    const file = new File(['file content'], 'large-file.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
    });
    fireEvent.change(fileInput);
    const uploadButton = screen.getByTestId('upload-button');
    fireEvent.click(uploadButton);
    expect(screen.getByText(/File size exceeds the 2MB limit/i)).toBeInTheDocument();
  });

});

import React, { useState, useEffect } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  useEffect(() => {
    fetchFileList();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setIsFileUploaded(false);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setIsFileUploaded(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds the 2MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);


    axios.post('http://localhost:9000/api/upload', formData)
      .then((res) => {
        setIsFileUploaded(true);
        toast.success('File uploaded successfully!');
        setFile(null);
        fetchFileList();
        console.log(res)
      })
      .catch((error) => {
        console.error(error);
        toast.error('Error uploading the file');
      });
  };

  const handleDelete = (fileName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete ${fileName}?`);
    if (confirmDelete) {
      axios.delete(`http://localhost:9000/api/files/${fileName}`)
        .then((res) => {
          fetchFileList();
          toast.success('File deleted successfully!');
        })
        .catch((error) => {
          console.error(error);
          toast.error('Error deleting the file');
        });
    }
  };

  const fetchFileList = () => {
    axios.get('http://localhost:9000/api/files')
      .then((res) => {
        setFileList(res.data.files);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div className="container px-4 py-5 my-5">
      <h1 className="display-5 fw-bold text-body-emphasis" style={{ textAlign: 'center' }}>Upload Your File!</h1>
      <ToastContainer autoClose={2000} />
      <div
        className="drop-area"
        onDrop={handleFileDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('file-input').click()}
      >
        {!isFileUploaded && file ? `File Selected: ${file.name}` : 'Drag and drop your file here or click to select'}
      </div>
      <input
        type="file"
        id="file-input"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        data-testid="file-input"
      />
      {isFileUploaded}
      <div className="d-flex justify-content-center mt-3">
        <button
          className="upload-button"
          onClick={handleUpload}
          style={{ marginLeft: 'auto', marginRight: 'auto' }}
          data-testid="upload-button"
          disabled={!file || file.size > 2 * 1024 * 1024}
        >
          Upload
        </button>
      </div>
      <table className="table table-bordered table-striped mt-5">
        <thead className="table-dark">
          <tr>
            <th>File Name</th>
            <th>File Type</th>
            <th className="text-center">File Size (KB)</th> 
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fileList.map((file, index) => (
            <tr key={index}>
              <td>{file.fileName}</td>
              <td>{file.mimeType}</td>
              <td className="size-text-center align-middle">{parseInt(file.sizeInKB)} KB</td> 
              <td>
                <button
                  className="delete-button"
                  data-testid="delete-button"
                  onClick={() => handleDelete(file.fileName)}
                  style={{ marginLeft: 'auto', marginRight: 'auto' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;

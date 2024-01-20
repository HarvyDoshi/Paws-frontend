// IncidentForm.js

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import isValidPhoneNumber from "../utils/Functions/phoneNumberValidator";
import isValidEmail from "../utils/Functions/emailValidator";

function IncidentForm() {
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    user_phone: "",
    animal_type: "",
    description: "",
    condition: "",
    image: null, // Change to null for correct file handling
    latitude: "",
    longitude: "",
    landmark: "near here", // @rishicds add proper landmark
    status: "not resolved", // @rishicds add proper status
  });

  const [errors, setErrors] = useState({
    user_name: "",
    user_email: "",
    user_phone: "",
    animal_type: "",
    description: "",
    condition: "",
    image: "",
    latitude: "",
    longitude: "",
    landmark: "",
    status: "",
  });

  const handleChange = async (e) => {
    const { name, value, files } = e.target;

    if (name === "image" && files && files.length > 0) {
      // Handle image file separately

      // Upload the image to Cloudinary
      const cloudinaryUrl = await uploadImageToCloudinary(files[0]);

      // Update the formData with the Cloudinary URL
      setFormData((prevData) => ({
        ...prevData,
        image: cloudinaryUrl,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "", // Clear the error when the user starts typing
    }));
  };

  const handleNextPage = () => {
    if (validatePage(currentPage)) {
      // Check if animal_type is "Other" and otherAnimalType is not empty
      if (formData.animal_type === "Other" && formData.otherAnimalType.trim() !== "") {
        // Set animal_type to the value of otherAnimalType
        setFormData({
          ...formData,
          animal_type: formData.otherAnimalType.trim(),
        });
      }
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form:", formData);

    try {
      if (validateForm()) {
        // Send the form data with the Cloudinary URL to the backend
        const response = await fetch("https://aniresfr-backend.vercel.app/api/animals/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Success:", data);
          setCurrentPage(4); // Assuming 4 is the index for the success page
        } else {
          console.error("Error:", response.statusText);
        }
      } else {
        console.log("Form is not valid");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const validatePage = (page) => {
    const pageData = formData;
    const pageErrors = {};

    switch (page) {
      case 1:
        if (!pageData.image) {
          pageErrors.image = "Image is required.";
        }
        break;
      case 2:
        if (!pageData.animal_type) {
          pageErrors.animal_type = "Animal type is required.";
        }
        if (!pageData.description) {
          pageErrors.description = "Description is required.";
        }
        if (!pageData.condition) {
          pageErrors.condition = "Condition is required.";
        }
        break;
      case 3:
        if (!pageData.user_name) {
          pageErrors.user_name = "Name is required.";
        }
        if (!pageData.user_phone) {
          pageErrors.user_phone = "Phone number is required.";
        } else if (!isValidPhoneNumber(pageData.user_phone)) {
          pageErrors.user_phone = "Invalid phone number.";
        }
        if (!pageData.user_email) {
          pageErrors.user_email = "Email is required.";
        } else if (!isValidEmail(pageData.user_email)) {
          pageErrors.user_email = "Invalid email address.";
        }
        break;
      default:
        break;
    }

    setErrors((prevErrors) => ({ ...prevErrors, ...pageErrors }));
    return Object.values(pageErrors).every((error) => error === "");
  };

  const validateForm = () => {
    return Object.keys(formData).every((field) => {
      if (field === "userLocation") {
        return true; // No need to validate userLocation
      }
      return formData[field] !== "";
    });
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData((prevData) => ({
          ...prevData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
      });
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  // Function to upload image to Cloudinary
  const uploadImageToCloudinary = async (imageFile) => {
    const cloudinaryUploadUrl = "https://api.cloudinary.com/v1_1/dff97ky68/upload";
    const uploadPreset = "mnxkqfco";

    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(cloudinaryUploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image to Cloudinary: ${response.statusText}`);
      }

      const result = await response.json();
      return result.secure_url; // Assuming Cloudinary API returns an object with a 'secure_url' property
    } catch (error) {
      console.error("Error uploading image to Cloudinary:", error);
      throw error; // Propagate the error
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <div>
            <h2>Page 1: Image and Location</h2>
            <label>
              Image:
              <input
                type="file"
                accept="image/*"
                name="image"
                onChange={handleChange}
              />
              <div className="error">{errors.image}</div>
            </label>
            <br />
            <p>
              User's Location: Latitude {formData.latitude}, Longitude{" "}
              {formData.longitude}
            </p>
            <br />
            <button type="button" onClick={handleNextPage}>
              Next
            </button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2>Page 2: Animal Details</h2>
            <label>
              Animal Type:
              <select
                name="animal_type"
                value={formData.animal_type}
                onChange={handleChange}
              >
                <option value="">Select Animal Type</option>
                <option value="Cat">Cat</option>
                <option value="Dog">Dog</option>
                <option value="Cattle">Cattle</option>
                <option value="Other">Other</option>
              </select>
              <div className="error">{errors.animal_type}</div>
            </label>
            <br />
            {formData.animal_type === "Other" && (
              <label>
                Please specify:
                <input
                  type="text"
                  name="otherAnimalType"
                  onChange={handleChange}
                />
              </label>
            )}
            <br />
            <label>
              Description:
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
              ></textarea>
              <div className="error">{errors.description}</div>
            </label>
            <br />
            <label>
              Condition:
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
              >
                <option value="">Select Condition</option>
                <option value="Critical">Critical</option>
                <option value="Urgent">Urgent</option>
                <option value="Normal">Normal</option>
              </select>
              <div className="error">{errors.condition}</div>
            </label>
            <br />
            <button type="button" onClick={handleNextPage}>
              Next
            </button>
          </div>
        );
      case 3:
        return (
          <div>
            <h2>Page 3: Contact Information</h2>
            <label>
              Name:
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
              />
              <div className="error">{errors.user_name}</div>
            </label>
            <br />
            <label>
              Phone Number:
              <input
                type="text"
                name="user_phone"
                value={formData.user_phone}
                onChange={handleChange}
              />
              <div className="error">{errors.user_phone}</div>
            </label>
            <br />
            <label>
              Email:
              <input
                type="text"
                name="user_email"
                value={formData.user_email}
                onChange={handleChange}
              />
              <div className="error">{errors.user_email}</div>
            </label>
            <br />
            <button
              type="button"
              onClick={(e) => {
                if (validatePage(currentPage)) {
                  handleNextPage();
                  handleSubmit(e);
                }
              }}
            >
              Next
            </button>
          </div>
        );
      case 4:
        return (
          <div>
            <h2>Success Page</h2>
            <p>Thank you for submitting the form!</p>
            <Link to="/">
              <button>Back to Home</button>
            </Link>
            <p>View Your Reports</p>
            <Link to="/view-reports">
              <button>View Reports</button>
            </Link>
          </div>
        );
      default:
        return null;
    }
  };

  return <div>{renderPage()}</div>;
}

export default IncidentForm;

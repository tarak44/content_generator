import { useState, useEffect } from "react";
import axios from "axios";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [file, setFile] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
    const storedPic = localStorage.getItem("profilePicUrl");
    if (storedPic) {
      setProfilePicUrl(storedPic);
    }
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://127.0.0.1:8000/user/update",
        { email, bio },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      localStorage.setItem("userEmail", email);
      if (res.data.profile_pic_url) {
        localStorage.setItem("profilePicUrl", res.data.profile_pic_url);
        setProfilePicUrl(res.data.profile_pic_url);
      }
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    }
  };

  const handleUploadPicture = async () => {
    if (!file) {
      alert("Please select a file!");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post("http://127.0.0.1:8000/user/upload-profile-pic", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const url = res.data.profile_pic_url;
      setProfilePicUrl(url);
      localStorage.setItem("profilePicUrl", url);
      alert("Profile picture uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Error uploading profile picture.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex justify-center items-start pt-16 text-white">
      <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Profile Settings</h2>

        {profilePicUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={`http://127.0.0.1:8000${profilePicUrl}`}
              alt="Profile"
              className="w-32 h-32 rounded-full border-4 border-gray-600 object-cover"
            />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <button
            onClick={handleUpdateProfile}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Update Profile
          </button>

          <div className="border-t border-gray-700 pt-4">
            <label className="block text-sm text-gray-300 mb-2">
              Upload Profile Picture
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-gray-300"
            />
            <button
              onClick={handleUploadPicture}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
            >
              Upload Picture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

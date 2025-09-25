import { useState, useEffect } from "react";
import axios from "axios";

export default function Profile() {
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [file, setFile] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (storedEmail) setEmail(storedEmail);
    const storedPic = localStorage.getItem("profilePicUrl");
    if (storedPic) setProfilePicUrl(storedPic);
  }, []);

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        "http://127.0.0.1:8000/user/update",
        { email, bio },
        { headers: { Authorization: `Bearer ${token}` } }
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
    if (!file) return alert("Please select a file!");
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        "http://127.0.0.1:8000/user/upload-profile-pic",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

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
    <div className="min-h-screen flex justify-center items-start pt-16 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      <div className="bg-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-8 w-full max-w-md border border-white/20">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">Profile Settings</h2>

        {profilePicUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={`http://127.0.0.1:8000${profilePicUrl}`}
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-500 shadow-lg hover:scale-105 transition-transform"
            />
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm text-gray-200 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/20 text-white border border-white/30 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-200 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full p-3 rounded-xl bg-white/20 text-white border border-white/30 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition resize-none"
              rows={4}
            />
          </div>

          <button
            onClick={handleUpdateProfile}
            className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 shadow-lg transition-all"
          >
            Update Profile
          </button>

          <div className="border-t border-white/30 pt-4 space-y-3">
            <label className="block text-sm text-gray-200">Upload Profile Picture</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-white file:bg-blue-600 file:border-none file:rounded-full file:px-4 file:py-2 file:text-white file:cursor-pointer hover:file:bg-blue-500 transition"
            />
            <button
              onClick={handleUploadPicture}
              className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-teal-500 hover:from-teal-500 hover:to-green-500 shadow-lg transition-all"
            >
              Upload Picture
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

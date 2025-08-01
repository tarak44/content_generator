import { useEffect, useState } from "react";
import { Download, BarChart2, Upload, Brain, Plug } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found — user is not authenticated");
        setLoading(false);
        return;
      }

      const response = await axios.get("http://127.0.0.1:8000/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/auth";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://127.0.0.1:8000/analytics/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `analytics_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Error exporting ${format}`, error);
    }
  };

  const handleUploadDocs = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You need to log in first!");
        return;
      }

      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".pdf,.docx,.txt";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          "http://127.0.0.1:8000/docs/upload",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        alert(response.data.message || "File uploaded successfully!");
      };

      input.click();
    } catch (error) {
      console.error("Error uploading document", error);
      alert("Failed to upload document.");
    }
  };

  const handleCmsExport = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://127.0.0.1:8000/integrate/cms/export",
        null,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert(response.data.message || "Exported to CMS successfully!");
    } catch (error) {
      console.error("CMS export failed", error);
      alert("Failed to export to CMS.");
    }
  };

  const handleEmailIntegration = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://127.0.0.1:8000/integrate/sendgrid",
        {
          to_email: "recipient@example.com",
          subject: "Integration Test",
          content: "This is a test email from dashboard integration.",
          api_key: "YOUR_SENDGRID_API_KEY"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      alert(response.data.message || "Email platform connected successfully!");
    } catch (error) {
      console.error("Email integration failed", error);
      alert("Failed to connect email platform.");
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <BarChart2 /> Dashboard Analytics
      </h1>

      <motion.div
        className="flex flex-col gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-gray-400">Contents Generated</p>
          <p className="text-xl font-semibold">{analytics.contents_generated}</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-gray-400">Avg. Response Time</p>
          <p className="text-xl font-semibold">{analytics.avg_response_time} ms</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-gray-400">Prompt Effectiveness</p>
          <p className="text-xl font-semibold">{analytics.prompt_effectiveness} %</p>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-gray-400">User Engagement</p>
          <p className="text-xl font-semibold">{analytics.engagement_score}</p>
        </div>
      </motion.div>

      <div className="flex gap-4">
        <button
          onClick={() => handleExport("csv")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center"
        >
          <Download className="mr-2" /> Export CSV
        </button>
        <button
          onClick={() => handleExport("pdf")}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center"
        >
          <Download className="mr-2" /> Export PDF
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain /> Personalization & Fine-tuning
        </h2>

        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-gray-400">User Memory</p>
            <p className="text-xl font-semibold">
              {analytics.user_memory_enabled ? "Enabled" : "Disabled"}
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-gray-400">Embeddings Retrieval</p>
            <p className="text-xl font-semibold">
              {analytics.embeddings_active ? "Active" : "Inactive"}
            </p>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow flex flex-col gap-2">
            <p className="text-gray-400">Upload Company Docs</p>
            <button
              onClick={handleUploadDocs}
              className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 rounded flex items-center justify-center"
            >
              <Upload className="mr-2" /> Upload Docs
            </button>
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Plug /> Third-Party Integrations
        </h2>

        <motion.div
          className="flex flex-col gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gray-800 p-4 rounded-lg shadow flex flex-col gap-2">
            <p className="text-gray-400">CMS Export</p>
            <p className="text-xl font-semibold">WordPress, Webflow</p>
            <button
              onClick={handleCmsExport}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded"
            >
              Export to CMS
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow flex flex-col gap-2">
            <p className="text-gray-400">Email Marketing</p>
            <p className="text-xl font-semibold">Mailchimp, SendGrid</p>
            <button
              onClick={handleEmailIntegration}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded"
            >
              Connect Email Platform
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg shadow flex flex-col gap-2">
            <p className="text-gray-400">Enterprise API Access</p>
            <p className="text-xl font-semibold">Enabled</p>
            <button
              onClick={() => window.open("https://your-api-docs-url.com", "_blank")}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded"
            >
              View API Docs
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

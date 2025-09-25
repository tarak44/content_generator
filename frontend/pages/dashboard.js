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
        setLoading(false);
        return;
      }

      const response = await axios.get("http://127.0.0.1:8000/analytics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics", error);
      if (error.response?.status === 401) {
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
        headers: { Authorization: `Bearer ${token}` },
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
    const token = localStorage.getItem("token");
    if (!token) return alert("You need to log in first!");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx,.txt";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await axios.post("http://127.0.0.1:8000/docs/upload", formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        alert(response.data.message || "File uploaded successfully!");
      } catch (error) {
        console.error(error);
        alert("Failed to upload document.");
      }
    };
    input.click();
  };

  const handleCmsExport = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/integrate/cms/export",
        null,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "Exported to CMS successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to export to CMS.");
    }
  };

  const handleEmailIntegration = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/integrate/sendgrid",
        {
          to_email: "recipient@example.com",
          subject: "Integration Test",
          content: "This is a test email from dashboard integration.",
          api_key: "YOUR_SENDGRID_API_KEY",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(response.data.message || "Email platform connected successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to connect email platform.");
    }
  };

  if (loading || !analytics) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-300 animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
        <BarChart2 /> Dashboard Analytics
      </h1>

      {/* Analytics Cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {[
          { label: "Contents Generated", value: analytics.contents_generated },
          { label: "Avg. Response Time", value: `${analytics.avg_response_time} ms` },
          { label: "Prompt Effectiveness", value: `${analytics.prompt_effectiveness}%` },
          { label: "User Engagement", value: analytics.engagement_score },
        ].map((item) => (
          <motion.div
            key={item.label}
            className="bg-gray-800/60 backdrop-blur-lg p-5 rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer"
            variants={cardVariants}
          >
            <p className="text-gray-400">{item.label}</p>
            <p className="text-2xl font-bold text-white mt-2">{item.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-4">
        {["csv", "pdf"].map((format) => (
          <button
            key={format}
            onClick={() => handleExport(format)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl transition"
          >
            <Download /> Export {format.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Personalization & Fine-tuning */}
      <Section title="Personalization & Fine-tuning" icon={<Brain />}>
        <Card label="User Memory" value={analytics.user_memory_enabled ? "Enabled" : "Disabled"} />
        <Card label="Embeddings Retrieval" value={analytics.embeddings_active ? "Active" : "Inactive"} />
        <Card
          label="Upload Company Docs"
          value=""
          button={{ text: "Upload Docs", onClick: handleUploadDocs, color: "green" }}
        />
      </Section>

      {/* Third-Party Integrations */}
      <Section title="Third-Party Integrations" icon={<Plug />}>
        <Card label="CMS Export" value="WordPress, Webflow" button={{ text: "Export to CMS", onClick: handleCmsExport, color: "blue" }} />
        <Card label="Email Marketing" value="Mailchimp, SendGrid" button={{ text: "Connect Email Platform", onClick: handleEmailIntegration, color: "blue" }} />
        <Card
          label="Enterprise API Access"
          value="Enabled"
          button={{ text: "View API Docs", onClick: () => window.open("https://your-api-docs-url.com", "_blank"), color: "blue" }}
        />
      </Section>
    </div>
  );
}

// Reusable Section Component
const Section = ({ title, icon, children }) => (
  <div className="space-y-4">
    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">{icon} {title}</h2>
    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      {children}
    </motion.div>
  </div>
);

// Reusable Card Component
const Card = ({ label, value, button }) => (
  <motion.div className="bg-gray-800/60 backdrop-blur-lg p-5 rounded-xl shadow-lg hover:scale-105 transition-transform cursor-pointer flex flex-col justify-between" whileHover={{ scale: 1.05 }}>
    <p className="text-gray-400">{label}</p>
    <p className="text-xl font-semibold text-white mt-2">{value}</p>
    {button && (
      <button
        onClick={button.onClick}
        className={`mt-3 px-4 py-2 rounded-xl text-white ${button.color === "green" ? "bg-green-600 hover:bg-green-500" : "bg-blue-600 hover:bg-blue-500"} transition`}
      >
        {button.text}
      </button>
    )}
  </motion.div>
);

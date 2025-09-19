const Video = require("./models/videomodel");

const uploadVideo = async (req, res) => {
  try {
    const video = new Video({
      title: req.body.title,
      description: req.body.description,
      path: req.file.path,
      uploadedBy: req.user._id
    });
    await video.save();
    res.json({ message: "Video uploaded successfully", video });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = { uploadVideo };
